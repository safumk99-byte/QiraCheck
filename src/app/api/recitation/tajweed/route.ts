import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

/**
 * Secure proxy for a separately hosted Quran Muaalem app server.
 * The upstream /correct-recitation contract accepts multipart "file" and
 * "error_ratio" fields and returns a Quran span plus phoneme/tajweed errors.
 * This is intentionally separate from the existing transcript-only ASR route.
 */
export async function POST(request: Request) {
  if (!isAuthenticated(request)) return unauthorizedResponse();

  const serviceUrl = process.env.QURAN_TAJWEED_SERVICE_URL?.trim();
  const serviceToken = process.env.QURAN_TAJWEED_SERVICE_TOKEN?.trim();
  if (!serviceUrl) {
    return NextResponse.json(
      { error: "ഓഡിയോ തജ്‌വീദ് പരിശോധനാ സേവനം ഇതുവരെ ക്രമീകരിച്ചിട്ടില്ല. നിലവിലെ transcript പരിശോധന തജ്‌വീദ് വിലയിരുത്തലല്ല." },
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
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "ആദ്യം റെക്കോർഡിംഗ് ചെയ്യുക." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "ഓഡിയോ ഫയൽ 12 MB-ൽ താഴെയായിരിക്കണം." }, { status: 413 });
  }
  if (!audio.type.startsWith("audio/") && audio.type !== "application/octet-stream") {
    return NextResponse.json({ error: "Unsupported audio format." }, { status: 415 });
  }

  const outbound = new FormData();
  outbound.append("file", audio, audio.name || "recitation.webm");
  outbound.append("error_ratio", "0.1");

  try {
    const upstream = await fetch(`${serviceUrl.replace(/\/$/, "")}/correct-recitation`, {
      method: "POST",
      body: outbound,
      headers: { Authorization: `Bearer ${serviceToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(110000),
    });
    const payload = await upstream.json().catch(() => null) as {
      start?: unknown; end?: unknown; uthmani_text?: unknown;
      predicted_phonemes?: unknown; reference_phonemes?: unknown; errors?: unknown;
      detail?: unknown; error?: unknown;
    } | null;

    if (!upstream.ok) {
      const message = typeof payload?.error === "string" ? payload.error :
        typeof payload?.detail === "string" ? payload.detail : "തജ്‌വീദ് പരിശോധന പരാജയപ്പെട്ടു.";
      return NextResponse.json({ error: message }, { status: upstream.status >= 500 ? 502 : upstream.status });
    }
    if (!payload || !Array.isArray(payload.errors) || typeof payload.uthmani_text !== "string") {
      return NextResponse.json({ error: "Tajweed service returned an unsupported response format." }, { status: 502 });
    }

    const errors = payload.errors.slice(0, 100).map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const e = item as Record<string, unknown>;
      const rules = Array.isArray(e.ref_tajweed_rules) ? e.ref_tajweed_rules : [];
      const ruleNames = rules.map((rule: unknown) => {
        if (!rule || typeof rule !== "object") return "";
        const name = (rule as Record<string, unknown>).name;
        if (name && typeof name === "object") {
          const n = name as Record<string, unknown>;
          return typeof n.en === "string" ? n.en : typeof n.ar === "string" ? n.ar : "";
        }
        return "";
      }).filter(Boolean);
      return {
        type: typeof e.error_type === "string" ? e.error_type : "recitation",
        speechErrorType: typeof e.speech_error_type === "string" ? e.speech_error_type : "",
        expected: typeof e.expected_ph === "string" ? e.expected_ph : "",
        detected: typeof e.preditected_ph === "string" ? e.preditected_ph : "",
        rule: ruleNames.join(", ") || "ഉച്ചാരണ/തജ്‌വീദ് വ്യത്യാസം",
        position: Array.isArray(e.uthmani_pos) ? e.uthmani_pos.slice(0, 2) : [],
      };
    }).filter(Boolean);

    return NextResponse.json({
      verseText: payload.uthmani_text.slice(0, 1000),
      errors,
      errorCount: errors.length,
      predictedPhonemes: typeof payload.predicted_phonemes === "string" ? payload.predicted_phonemes.slice(0, 2000) : "",
      referencePhonemes: typeof payload.reference_phonemes === "string" ? payload.reference_phonemes.slice(0, 2000) : "",
      location: { start: payload.start ?? null, end: payload.end ?? null },
      model: "Quran Muaalem",
      notice: "AI സഹായക വിലയിരുത്തലാണ്; യോഗ്യനായ ഖുർആൻ അധ്യാപകന്റെ പരിശോധനയ്ക്ക് പകരമല്ല.",
    }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error && error.name === "TimeoutError"
        ? "തജ്‌വീദ് പരിശോധനയ്ക്ക് സമയപരിധി കഴിഞ്ഞു. ചെറിയ റെക്കോർഡിംഗ് ഉപയോഗിക്കുക."
        : "തജ്‌വീദ് പരിശോധനാ സേവനവുമായി ബന്ധപ്പെടാനായില്ല.",
    }, { status: 503 });
  }
}
