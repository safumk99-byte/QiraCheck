import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
export async function POST(request:Request){
 if(!isAuthenticated(request))return unauthorizedResponse();
 const serviceUrl=process.env.QURAN_ASR_SERVICE_URL?.trim();
 if(!serviceUrl)return NextResponse.json({error:"Local Arabic ASR service is not configured. Start ai-service and set QURAN_ASR_SERVICE_URL."},{status:503});
 if(Number(request.headers.get("content-length")??0)>MAX_AUDIO_BYTES+65536)return NextResponse.json({error:"Audio is too large. Maximum size is 12 MB."},{status:413});
 let form:FormData;try{form=await request.formData()}catch{return NextResponse.json({error:"A valid multipart audio upload is required."},{status:400})}
 const audio=form.get("audio");
 if(!(audio instanceof File)||audio.size===0)return NextResponse.json({error:"Record an audio clip first."},{status:400});
 if(audio.size>MAX_AUDIO_BYTES)return NextResponse.json({error:"Audio is too large. Maximum size is 12 MB."},{status:413});
 if(!audio.type.startsWith("audio/")&&audio.type!=="application/octet-stream")return NextResponse.json({error:"Unsupported audio format."},{status:415});
 const outbound=new FormData();outbound.append("audio",audio,audio.name||"recitation.webm");
 try{
  const upstream=await fetch(`${serviceUrl.replace(/\/$/,"")}/transcribe`,{method:"POST",body:outbound,cache:"no-store",signal:AbortSignal.timeout(110000)});
  const payload=await upstream.json().catch(()=>null) as {text?:unknown;error?:unknown;detail?:unknown;model?:unknown}|null;
  if(!upstream.ok){const message=typeof payload?.error==="string"?payload.error:typeof payload?.detail==="string"?payload.detail:"Local speech recognition failed.";return NextResponse.json({error:message},{status:upstream.status>=500?502:upstream.status})}
  if(typeof payload?.text!=="string"||!payload.text.trim())return NextResponse.json({error:"No Arabic speech was recognized. Try a clearer or longer clip."},{status:422});
  if(payload.text.length>5000)return NextResponse.json({error:"Recognized transcript is too long."},{status:422});
  return NextResponse.json({transcript:payload.text.trim(),model:typeof payload.model==="string"?payload.model:"local-asr",notice:"ഇത് കരട് ടെക്സ്റ്റാണ്; തജ്‌വീദ്/മഖ്‌റജ് വിലയിരുത്തൽ അല്ല."},{headers:{"Cache-Control":"no-store, private"}});
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.name==="TimeoutError"?"Audio recognition timed out. Try a shorter clip.":"Could not reach the local Arabic ASR service."},{status:503})}
}
