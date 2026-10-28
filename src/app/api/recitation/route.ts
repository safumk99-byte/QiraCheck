import { db } from "@/db";
import { recitationAttempts } from "@/db/schema";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { quranAyahs } from "@/lib/quran";
import { analyzeRecitation } from "@/lib/recitation";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

const QURAN_API = "https://api.quran.com/api/v4";
const requestCounts = new Map<string,{count:number;resetAt:number}>();
export const dynamic = "force-dynamic";
type Body = { ayahId?: unknown; transcript?: unknown };

function limited(request:Request) {
 const now=Date.now(),key=(request.headers.get("x-forwarded-for")??"unknown").split(",")[0].slice(0,80);
 for(const [k,v] of requestCounts) if(v.resetAt<=now)requestCounts.delete(k);
 const old=requestCounts.get(key);
 if(!old||old.resetAt<=now){requestCounts.set(key,{count:1,resetAt:now+60000});return false}
 old.count++;return old.count>30;
}
export async function GET(request:Request){
 if(!isAuthenticated(request))return unauthorizedResponse();
 try{
  const attempts=await db.select().from(recitationAttempts).orderBy(desc(recitationAttempts.createdAt)).limit(10);
  return NextResponse.json({attempts},{headers:{"Cache-Control":"no-store, private"}});
 }catch{return NextResponse.json({error:"Could not load recitation history."},{status:503})}
}
export async function POST(request:Request){
 if(!isAuthenticated(request))return unauthorizedResponse();
 if(limited(request))return NextResponse.json({error:"Too many analysis requests. Wait one minute and try again."},{status:429});
 const length=Number(request.headers.get("content-length")??0);
 if(length>16000)return NextResponse.json({error:"Request body is too large."},{status:413});
 let body:Body;
 try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400})}
 const key=typeof body?.ayahId==="string"?body.ayahId.trim():"";
 const transcript=typeof body?.transcript==="string"?body.transcript.trim():"";
 const match=/^(\d{1,3}):(\d{1,3})$/.exec(key);
 if(!match||transcript.length<2||transcript.length>5000)return NextResponse.json({error:"A valid ayah and transcript are required."},{status:400});
 const chapter=Number(match[1]),ayah=Number(match[2]);
 if(chapter<1||chapter>114||ayah<1||ayah>286)return NextResponse.json({error:"Invalid ayah reference."},{status:400});
 let expected:string|undefined;
 try{
  const r=await fetch(`${QURAN_API}/verses/by_key/${key}?fields=text_uthmani`,{headers:{Accept:"application/json"},next:{revalidate:86400},signal:AbortSignal.timeout(8000)});
  if(r.status===404)return NextResponse.json({error:"That ayah does not exist."},{status:400});
  if(r.ok){const d=await r.json();expected=d.verse?.text_uthmani}
 }catch{}
 if(!expected&&chapter===1)expected=quranAyahs.find(a=>a.ayahNumber===ayah)?.arabic;
 if(!expected)return NextResponse.json({error:"Verified Qur’an reference text is unavailable. Try again."},{status:503});
 const analysis=analyzeRecitation(expected,transcript),surah=chapter===1?"Al-Fātiḥah":`Surah ${chapter}`;
 try{
  const [attempt]=await db.insert(recitationAttempts).values({surah,ayahNumber:ayah,expectedText:expected,transcript,accuracy:analysis.accuracy,mistakes:analysis.mistakes}).returning();
  return NextResponse.json({result:{...analysis,attempt}},{headers:{"Cache-Control":"no-store, private"}});
 }catch{return NextResponse.json({error:"Could not save this recitation attempt. Check DATABASE_URL and run migrations."},{status:503})}
}
