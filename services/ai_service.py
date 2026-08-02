from services.whisper_service import transcribe_audio


def analyze_recitation(audio_path, surah_id):

    print("AI Analysis Started")

    transcript = transcribe_audio(audio_path)

    print("Transcript:")
    print(transcript)

    return {
        "success": True,
        "transcript": transcript
    }