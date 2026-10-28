import os

import gradio as gr
import librosa
import spaces
from quran_transcript import Aya, quran_phonetizer, MoshafAttributes
from quran_muaalem.inference import Muaalem
from quran_muaalem.explain_gradio import explain_for_gradio

MODEL_ID = os.getenv("QURAN_MUAALEM_MODEL", "obadx/muaalem-model-v3_2")
SAMPLE_RATE = 16000
NOTICE = (
    "AI learning aid only. Results can be wrong and do not replace a qualified "
    "Quran teacher or oral correction (mushafahah). Do not use this result alone "
    "to certify a student's recitation."
)

# Model construction is lazy so importing this Space does not allocate GPU memory.
# The first actual request may take a while to download/load the model.
_model = None


def _get_model():
    global _model
    if _model is None:
        _model = Muaalem(model_name_or_path=MODEL_ID, device="cuda")
    return _model


@spaces.GPU(duration=120)
def analyze(audio_path, surah, ayah, first_word, word_count):
    if not audio_path:
        raise gr.Error("Upload or record an audio sample first.")
    if not (1 <= int(surah) <= 114 and int(ayah) >= 1):
        raise gr.Error("Select a valid surah and ayah.")
    if int(first_word) < 0 or int(word_count) < 1:
        raise gr.Error("Word index must be zero or greater and word count must be positive.")

    try:
        reference = Aya(int(surah), int(ayah)).get_by_imlaey_words(
            int(first_word), int(word_count)
        ).uthmani
        phonetic_reference = quran_phonetizer(
            reference,
            MoshafAttributes(rewaya="hafs", madd_monfasel_len=4, madd_mottasel_len=4,
                             madd_mottasel_waqf=4, madd_aared_len=4),
            remove_spaces=True,
        )
        waveform, _ = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
        if waveform.size == 0:
            raise gr.Error("The uploaded audio contains no readable samples.")
        output = _get_model()(
            [waveform], [phonetic_reference], sampling_rate=SAMPLE_RATE
        )[0]
        return explain_for_gradio(
            output.phonemes.text,
            phonetic_reference.phonemes,
            output.sifat,
            phonetic_reference.sifat,
            lang="arabic",
        )
    except gr.Error:
        raise
    except Exception as exc:
        # Avoid sending filesystem paths or internal exception details to visitors.
        raise gr.Error(
            "The model could not process this sample. Check the selected Quran "
            "range and audio format, then try again."
        ) from exc


with gr.Blocks(title="QiraCheck Tajweed Proof of Concept") as demo:
    gr.Markdown("# QiraCheck — Tajweed AI proof of concept")
    gr.Markdown(NOTICE)
    gr.Markdown(
        "Experimental only: this Space is not connected to QiraCheck production, "
        "does not save results, and may be unavailable when free GPU quota is exhausted."
    )
    with gr.Row():
        with gr.Column():
            audio = gr.Audio(sources=["upload", "microphone"], type="filepath", label="Recitation audio")
            surah = gr.Number(value=1, minimum=1, maximum=114, precision=0, label="Surah number")
            ayah = gr.Number(value=1, minimum=1, precision=0, label="Ayah number")
            first_word = gr.Number(value=0, minimum=0, precision=0, label="First word index (0-based)")
            word_count = gr.Number(value=4, minimum=1, precision=0, label="Number of words")
            submit = gr.Button("Analyze sample", variant="primary")
        result = gr.HTML(label="Analysis")
    submit.click(analyze, inputs=[audio, surah, ayah, first_word, word_count], outputs=result)

if __name__ == "__main__":
    demo.launch()
