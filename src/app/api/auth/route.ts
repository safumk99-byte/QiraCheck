import { NextResponse } from "next/server";
import { authConfigured, createSession, isAuthenticated, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { timingSafeEqual } from "node:crypto";

const attempts = new Map<string,{count:number;resetAt:number}>();
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
function key(request:Request){return (request.headers.get("x-forwarded-for")??"unknown").split(",")[0].trim().slice(0,80)}
export async function GET(request:Request){return NextResponse.json({authenticated:isAuthenticated(request),configured:authConfigured()},{headers:{"Cache-Control":"no-store"}})}
export async function POST(request:Request){
 if(!authConfigured())return NextResponse.json({error:"Login is not configured. Set APP_USERNAME, APP_PASSWORD (12+ characters), and SESSION_SECRET (32+ characters).",configured:false},{status:503});
 const k=key(request),now=Date.now(),a=attempts.get(k);
 if(a&&a.resetAt>now&&a.count>=8)return NextResponse.json({error:"Too many login attempts. Try again in 10 minutes."},{status:429});
 try{
  const body=await request.json() as {username?:unknown;password?:unknown};
  if(typeof body.username!=="string"||typeof body.password!=="string"||body.username.length>120||body.password.length>500)return NextResponse.json({error:"Username and password are required."},{status:400});
  if(!equal(body.username,process.env.APP_USERNAME!)||!equal(body.password,process.env.APP_PASSWORD!)){attempts.set(k,{count:(a&&a.resetAt>now?a.count:0)+1,resetAt:a&&a.resetAt>now?a.resetAt:now+600000});return NextResponse.json({error:"Invalid username or password."},{status:401})}
  attempts.delete(k);const token=createSession(body.username);if(!token)return NextResponse.json({error:"Session configuration is invalid."},{status:503});
  const response=NextResponse.json({authenticated:true});setSessionCookie(response,token);return response;
 }catch{return NextResponse.json({error:"Invalid JSON body."},{status:400})}
}
export async function DELETE(){const response=NextResponse.json({authenticated:false});clearSessionCookie(response);return response}
