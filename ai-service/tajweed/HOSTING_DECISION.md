# Tajweed hosting decision log

Date checked: 2026-10-29

## What the official sources currently say

- Quran Muaalem provides a Gradio UI and an HTTP app API. Its reference deployment runs a model engine on port 8000 and an app API on port 8001. See the upstream README: https://github.com/obadx/quran-muaalem/blob/main/README_EN.md
- Hugging Face Spaces CPU Basic has no hourly compute fee, but a personal account needs PRO to create a Gradio/Docker Space on regular CPU. Free personal accounts can create up to two Gradio ZeroGPU Spaces if eligible. See https://huggingface.co/docs/hub/spaces-overview and https://huggingface.co/docs/hub/spaces-zerogpu
- ZeroGPU is a dynamic per-request GPU system with a small daily quota for free users; after quota limits, usage is not a dependable always-on backend. See https://huggingface.co/docs/hub/spaces-zerogpu
- Dedicated GPU hardware and inference endpoints are billed. Do not enable billing or use them without explicit approval.

## Assessment for QiraCheck

**A free ZeroGPU proof-of-concept may be possible, but it is not yet a verified production API host.** Quran Muaalem's upstream Gradio UI constructs a model at process startup and selects CUDA/CPU based on availability; this pattern must be adapted carefully for ZeroGPU's per-request GPU lifecycle. The QiraCheck backend expects a stable authenticated HTTP endpoint at `/correct-recitation`, whereas a Gradio Space exposes a Gradio API contract that must be integrated and tested separately.

Before choosing this path, verify:
1. The QML 1.0 license conditions are compatible with the intended use.
2. A minimal ZeroGPU app can load the model and process a real sample under the free quota.
3. The Space exposes a supported API that can be safely called from QiraCheck without requiring end users to sign into Hugging Face.
4. Request quotas, sleeping/cold starts, queue time, upload size, and error handling are acceptable.
5. No paid plan, paid hardware, credits, or billing card is required for the tested path.

## Safe current state

- Keep the current Quran ASR service unchanged.
- Do not set QiraCheck's `QURAN_TAJWEED_SERVICE_URL` to the ASR URL.
- Do not turn on a paid service.
- Do not label transcript comparison as Tajweed assessment.
- Do not expose or store private student recitations unnecessarily.

## Next technical milestone

Build and test an isolated ZeroGPU proof-of-concept on a separate experimental branch/Space. Only after it passes the above checks should it be adapted behind QiraCheck's authenticated `/api/recitation/tajweed` proxy. If ZeroGPU quotas or its API contract make this unsuitable, the remaining compliant option is to wait for a community GPU grant or use local/self-hosted inference on hardware the user controls.
