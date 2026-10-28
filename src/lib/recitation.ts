import type { RecitationMistake } from "@/db/schema";

export type RecitationAnalysis = {
  normalizedExpected: string;
  normalizedTranscript: string;
  accuracy: number;
  mistakes: RecitationMistake[];
};

export function normalizeArabic(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/\u0640/g, "")
    .replace(/[\u0622\u0623\u0625\u0671]/g, "ا")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function alignWords(expectedWords: string[], heardWords: string[]): RecitationMistake[] {
  const rows = expectedWords.length + 1;
  const columns = heardWords.length + 1;
  const distance: number[][] = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let i = 0; i < rows; i += 1) distance[i][0] = i;
  for (let j = 0; j < columns; j += 1) distance[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const substitutionCost = expectedWords[i - 1] === heardWords[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + substitutionCost,
      );
    }
  }

  const mistakes: RecitationMistake[] = [];
  let i = expectedWords.length;
  let j = heardWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const substitutionCost = expectedWords[i - 1] === heardWords[j - 1] ? 0 : 1;
      if (distance[i][j] === distance[i - 1][j - 1] + substitutionCost) {
        if (substitutionCost > 0) {
          mistakes.push({ type: "wrong", expected: expectedWords[i - 1], heard: heardWords[j - 1], position: i });
        }
        i -= 1;
        j -= 1;
        continue;
      }
    }

    if (i > 0 && distance[i][j] === distance[i - 1][j] + 1) {
      mistakes.push({ type: "missing", expected: expectedWords[i - 1], position: i });
      i -= 1;
      continue;
    }

    if (j > 0) {
      mistakes.push({ type: "extra", heard: heardWords[j - 1], position: i + 1 });
      j -= 1;
      continue;
    }

    mistakes.push({ type: "missing", expected: expectedWords[i - 1], position: i });
    i -= 1;
  }

  return mistakes.reverse();
}

/** Text-level word alignment only; this does not evaluate makhraj or tajweed. */
export function analyzeRecitation(expectedText: string, transcript: string): RecitationAnalysis {
  const normalizedExpected = normalizeArabic(expectedText);
  const normalizedTranscript = normalizeArabic(transcript);
  const expectedWords = normalizedExpected ? normalizedExpected.split(" ") : [];
  const heardWords = normalizedTranscript ? normalizedTranscript.split(" ") : [];
  const mistakes = expectedWords.length === 0 ? [] : alignWords(expectedWords, heardWords);
  const wordCount = Math.max(expectedWords.length, heardWords.length, 1);
  const accuracy = expectedWords.length === 0 ? 0 : Math.max(0, Math.min(100, Math.round((1 - mistakes.length / wordCount) * 100)));
  return { normalizedExpected, normalizedTranscript, accuracy, mistakes };
}
