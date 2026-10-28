export type QuranChapter = {
  id:number; name_simple:string; name_complex:string; name_arabic:string;
  verses_count:number; revelation_place?:string;
  translated_name?:{name:string;language_name?:string};
};
export type QuranVerse = { id:number; verse_number:number; verse_key:string; text_uthmani:string; text_imlaei_simple?:string };
export type QuranAyah = {id:string;surah:string;ayahNumber:number;arabic:string;transliteration:string;meaningMl:string};
export const quranAyahs:QuranAyah[]=[
{id:"fatiha-1",surah:"Al-Fātiḥah",ayahNumber:1,arabic:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",transliteration:"Bismi llāhi r-raḥmāni r-raḥīm",meaningMl:"കരുണാനിധിയും കരുണാകരനുമായ അല്ലാഹുവിന്റെ നാമത്തിൽ"},
{id:"fatiha-2",surah:"Al-Fātiḥah",ayahNumber:2,arabic:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",transliteration:"Al-ḥamdu lillāhi rabbi l-ʿālamīn",meaningMl:"സകല സ്തുതിയും ലോകങ്ങളുടെ രക്ഷിതാവായ അല്ലാഹുവിന്നാണ്"},
{id:"fatiha-3",surah:"Al-Fātiḥah",ayahNumber:3,arabic:"الرَّحْمَٰنِ الرَّحِيمِ",transliteration:"Ar-raḥmāni r-raḥīm",meaningMl:"അവൻ പരമകാരുണികനും അനന്തദയാവാനുമാണ്"},
{id:"fatiha-4",surah:"Al-Fātiḥah",ayahNumber:4,arabic:"مَالِكِ يَوْمِ الدِّينِ",transliteration:"Māliki yawmi d-dīn",meaningMl:"വിധിദിനത്തിന്റെ അധിപൻ"},
{id:"fatiha-5",surah:"Al-Fātiḥah",ayahNumber:5,arabic:"إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",transliteration:"Iyyāka naʿbudu wa iyyāka nastaʿīn",meaningMl:"ഞങ്ങൾ നിന്നെയേ ആരാധിക്കുന്നു; നിന്നോടേയേ സഹായം തേടുന്നു"},
{id:"fatiha-6",surah:"Al-Fātiḥah",ayahNumber:6,arabic:"اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",transliteration:"Ihdinā ṣ-ṣirāṭa l-mustaqīm",meaningMl:"ഞങ്ങളെ നേരായ മാർഗത്തിലേക്ക് നടത്തണമേ"},
{id:"fatiha-7",surah:"Al-Fātiḥah",ayahNumber:7,arabic:"صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",transliteration:"Ṣirāṭa lladhīna anʿamta ʿalayhim ghayri l-maghḍūbi ʿalayhim wa la ḍ-ḍāllīn",meaningMl:"നീ അനുഗ്രഹം നൽകിയവരുടെ വഴി; ക്രോധം കിട്ടിയവരുടേതോ വഴിതെറ്റിയവരുടേതോ അല്ല"}
];
