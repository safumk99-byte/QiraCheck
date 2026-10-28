# Isolated Tajweed inference service

This directory is reserved for a **separate** Quran Muaalem inference deployment. It must not be merged into the existing `ai-service/` ASR container: the current service is a small CPU-oriented transcript service, while Quran Muaalem has a substantially larger model and its own inference pipeline.

## Current status

- The existing `ai-service/main.py` remains ASR-only and unchanged.
- No Tajweed inference host is currently configured or validated.
- Do not set `QURAN_TAJWEED_SERVICE_URL` to the ASR service; it does not implement `/correct-recitation`.
- Until a compatible inference service is deployed and tested, the web application's Tajweed-analysis endpoint must report that the feature is not configured rather than fabricate results.

## Upstream interface

The upstream Quran Muaalem application documents `POST /correct-recitation` with multipart field `file` and optional `error_ratio`. The app and model engine are separate processes in the upstream deployment design (app port 8001, engine port 8000). Confirm the exact response schema against the pinned upstream version before adapting it.

- Upstream project: https://github.com/obadx/quran-muaalem
- API documentation: https://obadx.github.io/quran-muaalem/en/

## Hosting feasibility checked (2026-10-29)

Hugging Face's current Spaces documentation says CPU Basic has no hourly compute charge, but creating/running a Gradio or Docker Space on compute requires a PRO subscription for a personal account (or Team/Enterprise for organizations); free personal accounts have a limited ZeroGPU exception. GPU upgrades are usage-billed unless a grant is approved. Therefore this does **not** currently meet the user's strict no-paid-plan/no-billing-card requirement as a dependable API host.

Official references:
- https://huggingface.co/docs/hub/spaces-overview
- https://huggingface.co/docs/hub/spaces-gpus
- https://huggingface.co/docs/huggingface_hub/main/en/guides/manage-spaces

A temporary free notebook is not a reliable always-on API and may expose private recitation audio if configured carelessly. No new host has been deployed. Do not create a paid service, enable billing, or request paid GPU hardware without explicit approval.

## Required deployment contract

A production adapter must:

1. Expose HTTPS only.
2. Require a high-entropy bearer token; never commit the token.
3. Accept only audio uploads, enforce a strict size limit, and use bounded request timeouts.
4. Forward to the Quran Muaalem app's `/correct-recitation` endpoint and return its real result without inventing a score.
5. Return a non-sensitive `/health` status that distinguishes process-up from model-ready.
6. Avoid storing recordings; delete temporary files even when inference fails.
7. Pin dependencies/model revision and validate output fields with tests.
8. Be tested with expert-reviewed recordings before any UI presents the output as instructional feedback.

## Web application environment

Once the service exists and has passed tests, configure these server-side variables in the web app:

- `QURAN_TAJWEED_SERVICE_URL`: base URL of the authenticated Tajweed app service.
- `QURAN_TAJWEED_SERVICE_TOKEN`: matching bearer token.

Never expose either variable to browser-side code.
