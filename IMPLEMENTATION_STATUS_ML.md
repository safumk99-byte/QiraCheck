# AI Quran Recitation Corrector — നടപ്പാക്കൽ നില

## ഈ പതിപ്പിൽ ചേർത്ത മാറ്റങ്ങൾ

- Recitation history, analysis API എന്നിവയ്ക്ക് signed HTTP-only session login നിർബന്ധമാക്കി.
- `.env.local` വഴി login credentials, session secret, PostgreSQL URL ക്രമീകരിക്കുന്ന സംവിധാനം ചേർത്തു.
- Login-ന് per-process throttling; analysis endpoint-ന് rate limit ചേർത്തു.
- JSON body validation, request size limit, transcript length validation, invalid verse handling, external API timeout എന്നിവ ചേർത്തു.
- Database read/write failures-ന് controlled error responses ചേർത്തു.
- PostgreSQL connection pool limits/timeouts ക്രമീകരിച്ചു.
- Drizzle configuration environment variable-ൽ നിന്ന് URL വായിക്കുന്ന രീതിയാക്കി.
- Initial SQL migration, migration runner, `.env.example`, `.gitignore`, setup README ചേർത്തു.
- Arabic normalization, exact match, missing/wrong/extra word, empty-reference എന്നീ സാഹചര്യങ്ങൾക്ക് tests ചേർത്തു.
- Browser UI-യിൽ login/logout flow ചേർത്തു.

## പരിശോധനാ നില

- Arabic analyzer-ന്റെ പ്രധാന സാഹചര്യങ്ങൾ `ts-node` വഴി നേരിട്ട് പരിശോധിച്ചു: exact match, missing word, wrong word, extra word, empty reference — ഫലങ്ങൾ പ്രതീക്ഷിച്ചതുപോലെ ലഭിച്ചു.
- Migration runner-ന്റെ JavaScript syntax പരിശോധിച്ചു.
- `package.json` JSON parsing വിജയിച്ചു.
- TypeScript parser-ൽ syntax errors കണ്ടെത്തിയില്ല; എന്നാൽ dependencies ഇൻസ്റ്റാൾ ചെയ്യാനാകാത്തതിനാൽ പൂർണ `typecheck`, Next.js production build, Vitest suite എന്നിവ വിജയകരമായി പ്രവർത്തിപ്പിച്ച് സ്ഥിരീകരിക്കാൻ കഴിഞ്ഞിട്ടില്ല.

## നിർബന്ധമായ setup

1. `.env.example` പകർത്തി `.env.local` ഉണ്ടാക്കുക.
2. `DATABASE_URL` ശരിയായ PostgreSQL database-ിലേക്ക് സജ്ജമാക്കുക.
3. `APP_USERNAME`, കുറഞ്ഞത് 12 അക്ഷരമുള്ള ശക്തമായ `APP_PASSWORD`, കുറഞ്ഞത് 32 അക്ഷരമുള്ള random `SESSION_SECRET` സജ്ജമാക്കുക.
4. `npm install`
5. `npm run db:migrate`
6. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` പ്രവർത്തിപ്പിക്കുക.

## ഇപ്പോഴും പൂർത്തിയാക്കേണ്ട പ്രധാന കാര്യങ്ങൾ

- ഈ പതിപ്പ് single-operator login ആണ്; per-student accounts, teacher/admin roles, per-user history isolation ഇനിയും ചേർത്തിട്ടില്ല.
- നിലവിലെ scoring ടെക്സ്റ്റ് പൊരുത്തം മാത്രമാണ്; raw audio pronunciation assessment അല്ല.
- മഖ്റജ്, സിഫാത്ത്, മദ്ദ്, ഗുന്ന, ഇഖ്ഫാ/ഇദ്ഗാം, വഖ്ഫ് തുടങ്ങിയ തജ്‌വീദ് നിയമങ്ങൾ പരിശോധിക്കുന്ന validated AI model ഇനിയും സംയോജിപ്പിച്ചിട്ടില്ല.
- Full API integration tests, browser end-to-end tests, production deployment verification എന്നിവ ഇനിയും നടത്തണം.
- Multi-instance deployment-ൽ in-memory rate limiter-ന് പകരം shared rate limiter/WAF വേണം.

**නිගමനം:** ഇത് സുരക്ഷാ അടിസ്ഥാനവും setup/testing infrastructure-ഉം മെച്ചപ്പെടുത്തിയ hardening release ആണ്; certified Qur’an audio/Tajweed AI product ആയി ഇതിനെ ഇതുവരെ കണക്കാക്കരുത്.


## V2 — Local audio transcription integration

- Browser-ൽ audio റെക്കോർഡ് ചെയ്യാനും 12 MB-ൽ താഴെയുള്ള clip ലോക്കൽ ASR സേവനത്തിലേക്ക് അയക്കാനും UI ചേർത്തു.
- `POST /api/recitation/transcribe` session authentication, file size/type checks, timeout, controlled error response എന്നിവയോടെ ചേർത്തു.
- `ai-service/`-ൽ self-hosted Quran-specific `Abdou/quran-asr-small` + `sherpa-onnx`/FastAPI service ചേർത്തു; audio temporary file ആയി മാത്രം സൂക്ഷിച്ച് transcription കഴിഞ്ഞ് നീക്കുന്നു.
- `.env.example`, setup guide, capability-boundary രേഖകൾ അപ്ഡേറ്റ് ചെയ്തു.
- ഈ സേവനം ASR transcript മാത്രം നൽകുന്നു. മഖ്റജ്, ഉച്ചാരണം, തജ്‌വീദ് എന്നിവ വിലയിരുത്തുന്നില്ല.
- പൂർണ Next.js build/TypeScript/Vitest പരിശോധന ഇനിയും പ്രവർത്തിപ്പിച്ച് ഉറപ്പാക്കണം; Python ASR dependencies/model weights വേർതിരിച്ച് ഇൻസ്റ്റാൾ ചെയ്യണം.

- Model reference: https://huggingface.co/Abdou/quran-asr-small (MIT). The model card reports benchmark results, but actual app accuracy still requires local evaluation.
