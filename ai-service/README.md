# Quran ASR service

This optional service runs a Quran-specific Arabic speech-to-text model. It returns draft transcript text only; it does not grade tajweed, makhraj, or pronunciation.

## Local run

Use Python 3.11 from the repository root:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r ai-service/requirements.txt
```

Create a strong random secret of at least 32 characters and set it as `ASR_SERVICE_TOKEN` in the environment running the ASR service. Set the exact same value as `QURAN_ASR_SERVICE_TOKEN` in the Next.js/Vercel environment. Do not commit either value or share it in chat.

Windows PowerShell example (replace the example with your own random secret):

```powershell
$env:ASR_SERVICE_TOKEN = "replace-with-a-random-secret-of-32-or-more-characters"
uvicorn main:app --app-dir ai-service --host 127.0.0.1 --port 8791
```

Set the Next.js environment variable `QURAN_ASR_SERVICE_URL=http://127.0.0.1:8791` for local use. The app sends the matching token in an Authorization Bearer header. `GET /health` is intentionally public and does not reveal the token; `POST /transcribe` rejects requests without a valid token.

## Hosting separately

The ASR service must run as a separate Python service; Vercel hosts the Next.js app and does not run this long-lived FastAPI service as part of the deployment. For a host that supports Docker, build from the repository root using `ai-service/Dockerfile`, then configure these secrets/environment variables on the ASR host:

- `ASR_SERVICE_TOKEN`: a unique random secret of at least 32 characters.
- Optional `ASR_NUM_THREADS`: defaults to 2.
- Optional `ASR_MODEL_REPO`: defaults to `Abdou/quran-asr-small`.

Set `QURAN_ASR_SERVICE_URL` to the ASR host's HTTPS base URL and `QURAN_ASR_SERVICE_TOKEN` to the exact same secret in Vercel, for the Production environment, then redeploy the Next.js app. Never expose an unauthenticated transcription endpoint; use HTTPS and the host's request/CPU limits. The first transcription downloads model weights and may take longer while the model loads. A free host may sleep, have memory limits, or restart, so availability and cold-start performance depend on that provider.

## Audio and model notes

The service accepts audio up to 12 MB, deletes its temporary audio file after processing, and lazily loads the model. This is a free self-hosted path; no paid speech API is used. A transcript is only a draft. Do not present the app's text-match percentage as a Tajweed or pronunciation score.
