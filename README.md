# AI Qur’an Recitation Corrector — current implementation

This is a Next.js + PostgreSQL practice app. It loads Qur’an reference text, supports browser speech recognition and an optional self-hosted local Arabic ASR service, compares a transcript with the selected verse, and stores recent attempts.

## Important capability boundary

The current analyzer is **text matching**, not a validated audio pronunciation or Tajweed model. The percentage is a word-level text-match score only. It must not be represented as a recitation certification or as a makhraj/Tajweed score. Browser speech recognition can mis-transcribe a correct recitation. A real audio assessment requires a separately evaluated Arabic/Qur’anic ASR and pronunciation/Tajweed pipeline plus expert-reviewed test recordings.

## Requirements

- Node.js 20.9+ (Node 22 LTS recommended)
- PostgreSQL 14+
- Internet access for Quran.com API v4, unless you later add a reviewed local reference dataset

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your PostgreSQL database.
3. Set `APP_USERNAME` and a strong `APP_PASSWORD` (at least 12 characters).
4. Generate a random `SESSION_SECRET` of at least 32 characters. Example:
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
5. Install packages: `npm install`
6. Apply the initial schema: `npm run db:migrate`. The checked-in SQL migration is also available at `migrations/0001_initial_recitation_attempts.sql` and can be applied manually.
7. Run locally: `npm run dev`
8. Validate: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

Do not commit `.env.local`. The app deliberately disables protected history/analysis endpoints until authentication settings are configured.

## Optional local audio transcription (no paid API)

A Quran-specific local ASR service using `Abdou/quran-asr-small` + `sherpa-onnx` is included in `ai-service/`. Follow `ai-service/README.md`, install its Python requirements, then set `QURAN_ASR_SERVICE_URL=http://127.0.0.1:8791` in `.env.local`. The first model load downloads about 36 MB of quantized model weights plus token data. The browser recording is limited to 12 MB. Audio is forwarded to the configured service and is not stored by the app. Keep the ASR service bound to loopback; do not expose it directly to the public internet.

**Important:** this Quran-specific ASR integration produces a draft transcript only. Its reported benchmark performance is not a guarantee for your users and it does not independently evaluate makhraj, pronunciation, or Tajweed. Review the transcript before text comparison. Never present the text match score as an audio/pronunciation/Tajweed score.

## Database

`drizzle.config.ts` reads `DATABASE_URL` from the environment. `src/db/index.ts` configures a bounded PostgreSQL pool and query/connection timeouts. For managed/serverless hosting, tune `DB_POOL_MAX` to the provider's connection limits.

## Authentication and security notes

- A single operator login is configured through environment variables; this is not a multi-user student-account system.
- Recitation history and analysis APIs require a signed, HTTP-only, SameSite=Strict session cookie.
- Login attempts are throttled per server process. For multi-instance/production deployment, add a shared rate limiter or WAF because an in-memory limiter does not coordinate across instances.
- Use HTTPS in production and a strong unique session secret.
- The Qur’an text listing endpoint is public; recitation history and attempts are protected.

## Test coverage

The Vitest suite covers Arabic normalization and the text-alignment cases (exact, missing, wrong, extra, and empty reference). API/database end-to-end tests still need to be run against a configured test database before production release.

## Known next steps for a full AI product

1. Add per-student accounts, teacher/admin roles, and per-user data isolation.
2. Add an expert-reviewed Qur’an reference corpus/cache and verify all verse keys.
3. Evaluate the included Quran-specific ASR against expert-reviewed recordings from different ages, accents, recitation speeds, and recording devices.
4. Implement a separately evaluated audio pronunciation/Tajweed model; never infer Tajweed correctness from transcript text alone.
5. Add integration and browser E2E tests, observability, backups, and production deployment checks.
