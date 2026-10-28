# Local Quran ASR service

This optional service runs a Quran-specific Arabic speech-to-text model locally. It returns a draft transcript only; it does not grade tajweed, makhraj, or pronunciation.

## Start

Use Python 3.11. From the repository root:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r ai-service/requirements.txt
uvicorn main:app --app-dir ai-service --host 127.0.0.1 --port 8791
```

The first transcription downloads the model weights from Hugging Face. This is a free, self-hosted path; no paid API key is used. Keep the service bound to loopback and do not expose port 8791 publicly.

Set `QURAN_ASR_SERVICE_URL=http://127.0.0.1:8791` in the Next.js environment. Browser-recorded audio is limited to 12 MB and forwarded to this service for transcription; the temporary audio file is deleted after processing.

Check `GET /health` to see service health and whether the model has been loaded. The model is loaded lazily on the first transcription.
