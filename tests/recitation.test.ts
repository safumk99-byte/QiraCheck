import { describe, expect, it } from "vitest";
import { analyzeRecitation, normalizeArabic } from "../src/lib/recitation";

describe("normalizeArabic",()=>{
 it("removes diacritics and normalizes common alef forms",()=>expect(normalizeArabic("إِنَّ اللَّهَ")).toBe("ان الله"));
 it("collapses whitespace and removes tatweel",()=>expect(normalizeArabic("الرَّحْمَٰنــ  الرَّحِيمِ")).toBe("الرحمن الرحيم"));
});
describe("analyzeRecitation",()=>{
 it("scores an exact transcript as a 100% text match",()=>{const r=analyzeRecitation("بسم الله الرحمن الرحيم","بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");expect(r.accuracy).toBe(100);expect(r.mistakes).toHaveLength(0)});
 it("detects a missing word",()=>expect(analyzeRecitation("بسم الله الرحمن الرحيم","بسم الله الرحيم").mistakes.some(m=>m.type==="missing"&&m.expected==="الرحمن")).toBe(true));
 it("detects a wrong word",()=>expect(analyzeRecitation("بسم الله","بسم الرحمن").mistakes.some(m=>m.type==="wrong")).toBe(true));
 it("detects an extra word",()=>expect(analyzeRecitation("بسم الله","بسم يا الله").mistakes.some(m=>m.type==="extra"&&m.heard==="يا")).toBe(true));
 it("does not score an empty reference as perfect",()=>expect(analyzeRecitation(" "," ").accuracy).toBe(0));
});
