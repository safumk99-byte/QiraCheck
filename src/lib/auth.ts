import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
export const SESSION_COOKIE="quran_session";
const SESSION_TTL_SECONDS=60*60*12;
function secret(){const value=process.env.SESSION_SECRET;return value&&value.length>=32?value:null}
function sign(value:string,key:string){return createHmac("sha256",key).update(value).digest("base64url")}
export function authConfigured(){return Boolean(process.env.APP_USERNAME&&process.env.APP_PASSWORD&&process.env.APP_PASSWORD.length>=12&&!process.env.APP_PASSWORD.startsWith("replace-")&&process.env.SESSION_SECRET&&!process.env.SESSION_SECRET.startsWith("replace-")&&secret())}
export function createSession(username:string){const key=secret();if(!key)return null;const expires=Math.floor(Date.now()/1000)+SESSION_TTL_SECONDS;const payload=`${username}:${expires}`;return `${Buffer.from(payload).toString("base64url")}.${sign(payload,key)}`}
export function verifySession(token:string|undefined){const key=secret();if(!key||!token)return false;const [encoded,sig,...extra]=token.split(".");if(!encoded||!sig||extra.length)return false;try{const payload=Buffer.from(encoded,"base64url").toString("utf8"),expected=Buffer.from(sign(payload,key)),supplied=Buffer.from(sig);if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return false;const separator=payload.lastIndexOf(":");if(separator<1)return false;return payload.slice(0,separator)===process.env.APP_USERNAME&&Number(payload.slice(separator+1))>Math.floor(Date.now()/1000)}catch{return false}}
export function getCookie(request:Request,name:string){for(const part of (request.headers.get("cookie")??"").split(";")){const index=part.indexOf("=");if(index<0)continue;if(part.slice(0,index).trim()===name){try{return decodeURIComponent(part.slice(index+1).trim())}catch{return undefined}}}return undefined}
export function isAuthenticated(request:Request){return verifySession(getCookie(request,SESSION_COOKIE))}
export function unauthorizedResponse(){return NextResponse.json({error:"Login required."},{status:401})}
export function setSessionCookie(response:NextResponse,token:string){response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:SESSION_TTL_SECONDS})}
export function clearSessionCookie(response:NextResponse){response.cookies.set(SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0})}
