import { NextResponse } from "next/server";

const QURAN_API = "https://api.quran.com/api/v4";
const REVALIDATE_SECONDS = 86400;

export async function GET(request: Request) {
  const chapterParam = new URL(request.url).searchParams.get("chapter");
  try {
    if (!chapterParam) {
      const response = await fetch(`${QURAN_API}/chapters?language=en`, { headers: { Accept: "application/json" }, next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return NextResponse.json({ error: "Could not load surah list." }, { status: 502 });
      const data = await response.json();
      return NextResponse.json({ chapters: data.chapters ?? [] });
    }
    const chapterNumber = Number(chapterParam);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 114) return NextResponse.json({ error: "Chapter must be between 1 and 114." }, { status: 400 });
    const response = await fetch(`${QURAN_API}/verses/by_chapter/${chapterNumber}?language=en&fields=text_uthmani,text_imlaei_simple,text_uthmani_tajweed&per_page=300`, { headers: { Accept: "application/json" }, next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return NextResponse.json({ error: "Could not load ayah text." }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ verses: data.verses ?? [] });
  } catch {
    return NextResponse.json({ error: "Qur’an text service is temporarily unavailable." }, { status: 502 });
  }
}
