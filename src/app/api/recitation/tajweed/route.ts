import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_REFERENCE_CHARS = 2000;

/**
 * Secure proxy for the separately hosted Quran Muaalem/Tajweed evaluator.
 * Contract: multipart fields audio, chapter, ayah, reference_text.
 * The evaluator must return JSON with summary and findings; no ASR transcript
 * match score is presented as a Tajweed score.
 */
export async function POST(request: Request) {
  if (!isAuthenticated(request)) return unauthorizedResponse();

  const serviceUrl = process.env.QURAN_TAJWEED_SERVICE_URL?.trim();
  const serviceToken = process.env.QURAN_TAJWEED_SERVICE_TOKEN?.trim();
  if (!serviceUrl) {
    return NextResponse.json(
      { error: "ഓഡിയോ തജ്‌വീദ് പരിശോധനാ സേവനം ഇതുവരെ ക്രമീകരിച്ചിട്ടില്ല. നിലവിലെ transcript score തജ്‌വീദ് പരിശോധനയല്ല." },
      { status: 503 },
    );
  }
  if (!serviceToken || serviceToken.length < 32) {
    return NextResponse.json({ error: "Tajweed service authentication is not configured." }, { status: 503 });
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: "A valid multipart audio upload is required." }, { status: 400 });
  }

  const audio = incoming.get("audio");
  const chapter = Number(incoming.get("chapter"));
  const ayah = Number(incoming.get("ayah"));
  const referenceText = incoming.get("reference_text");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "ആദ്യം റെക്കോർഡിംഗ് ചെയ്യുക." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "ഓഡിയോ ഫയൽ 12 MB-ൽ താഴെയായിരിക്കണം." }, { status: 413 });
  }
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114 ||
      !Number.isInteger(ayah) || ayah < 1) {
    return NextResponse.json({ error: "സൂറത്തും ആയത്തും ശരിയായി തിരഞ്ഞെടുക്കുക." }, { status: 400 });
  }
  if (typeof referenceText !== "string" || !referenceText.trim() || referenceText.length > MAX_REFERENCE_CHARS) {
    return NextResponse.json({ error: "തിരഞ്ഞെടുത്ത ആയത്തിന്റെ ഖുർആൻ ടെക്സ്റ്റ് ലഭ്യമല്ല." }, { status: 400 });
  }
  if (!audio.type.startsWith("audio/") && audio.type !== "application/octet-stream") {
    return NextResponse.json({ error: "Unsupported audio format." }, { status: 415 });
  }

  const outbound = new FormData();
  outbound.append("audio", audio, audio.name || "recitation.webm");
  outbound.append("chapter", String(chapter));
  outbound.append("ayah", String(ayah));
  outbound.append("reference_text", referenceText);

  try {
    const upstream = await fetch(`${serviceUrl.replace(/\/$/, "")}/analyze-tajweed`, {
      method: "POST",
      body: outbound,
      headers: { Authorization: `Bearer ${serviceToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(110000),
    });
    const payload = await upstream.json().catch(() => null) as {
      summary?: unknown; findings?: unknown; error?: unknown; detail?: unknown;
    } | null;

    if (!upstream.ok) {
      const message = typeof payload?.error === "string" ? payload.error :
        typeof payload?.detail === "string" ? payload.detail : "തജ്‌വീദ് പരിശോധന പരാജയപ്പെട്ടു.";
      return NextResponse.json({ error: message }, { status: upstream.status >= 500 ? 502 : upstream.status });
    }
    if (!payload || typeof payload.summary !== "string" || !Array.isArray(payload.findings)) {
      return NextResponse.json({ error: "Tajweed service returned an unsupported response format." }, { status: 502 });
    }
    return NextResponse.json({
      summary: payload.summary.slice(0, 1000),
      findings: payload.findings.slice(0, 100).map((item: unknown) => {
        if (!item || typeof item !== "object") return null;
        const f = item as Record<string, unknown>;
        return {
          rule: typeof f.rule === "string" ? f.rule.slice(0, 80) : "Tajweed rule",
          location: typeof f.location === "string" ? f.location.slice(0, 160) : "",
          feedback: typeof f.feedback === "string" ? f.feedback.slice(0, 500) : "",
          severity: f.severity === "high" || f.severity === "medium" ? f.severity : "low",
        };
      }).filter(Boolean),
      model: "Quran Muaalem-compatible service",
      notice: "AI സഹായക വിലയിരുത്തലാണ്; യോഗ്യനായ അധ്യാപകന്റെ പരിശോധനയ്ക്ക് പകരമല്ല.",
    }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error && error.name === "TimeoutError"
        ? "തജ്‌വീദ് പരിശോധനയ്ക്ക് സമയപരിധി കഴിഞ്ഞു. ചെറിയ റെക്കോർഡിംഗ് ഉപയോഗിക്കുക."
        : "തജ്‌വീദ് പരിശോധനാ സേവനവുമായി ബന്ധപ്പെടാനായില്ല.",
    }, { status: 503 });
  }
}
