from faster_whisper import WhisperModel

print("Loading Whisper model...")

model = WhisperModel(
    "tiny",
    device="cpu",
    compute_type="int8"
)

print("Whisper model loaded.")

def transcribe_audio(audio_path):

    segments, info = model.transcribe(
        audio_path,
        language="ar",
        beam_size=5
    )

    transcript = ""

    for segment in segments:
        transcript += segment.text + " "

    return transcript.strip()