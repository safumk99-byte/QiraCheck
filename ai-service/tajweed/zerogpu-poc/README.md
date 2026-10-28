---
title: QiraCheck Tajweed Proof of Concept
emoji: 📖
colorFrom: green
colorTo: yellow
sdk: gradio
sdk_version: 5.43.1
app_file: app.py
pinned: false
---

# QiraCheck Tajweed ZeroGPU proof of concept

**Experimental only.** This is an isolated proof of concept, not connected to QiraCheck production. The output is an AI learning aid and must not be used as a certification or replacement for a qualified Quran teacher.

## Hardware

This app requests dynamic GPU allocation through `spaces.GPU`. It may not be available to every account or Space, and free GPU quotas can be exhausted. Model download and startup may take several minutes. This is not a guaranteed always-on API.

## Deploy as a separate Hugging Face Space

1. Create a new Space manually in your own Hugging Face account.
2. Choose Gradio as the SDK and ZeroGPU hardware only if the UI explicitly offers it for your account.
3. Upload the files in this directory (`app.py`, `requirements.txt`, this README).
4. Do not enable paid hardware or billing. If ZeroGPU is not available without payment, stop and do not select a paid option.
5. Wait for the build and inspect the logs.
6. Test only a short recitation sample whose selected surah/ayah/word range matches the audio. Check results with a qualified teacher.

## Important limitations

- This Space is not an authenticated `/correct-recitation` API adapter. It is a UI proof of concept.
- Do not configure `QURAN_TAJWEED_SERVICE_URL` to point to this Space yet.
- Before production integration, add a dedicated authenticated API adapter, test the Gradio/API contract, rate-limit requests, enforce upload size limits, and verify no recordings are persisted.
- The upstream model has its own QML 1.0 license. Read it and confirm the intended use complies before deployment: https://github.com/obadx/quran-muaalem/blob/main/LICENSE
- The model can be wrong. It is not a religious ruling or a substitute for oral instruction.

Upstream: https://github.com/obadx/quran-muaalem
