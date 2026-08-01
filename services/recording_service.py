import os
from uuid import uuid4

from database import get_connection


def save_audio_file(audio_file):

    filename = f"{uuid4().hex}.webm"

    upload_folder = os.path.join("uploads", "recordings")
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, filename)

    audio_file.save(file_path)

    return filename


def save_recitation(user_id, surah_id, start_ayah, end_ayah, audio_file, duration):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO recitations
        (user_id, surah_id, start_ayah, end_ayah, audio_file, duration)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        user_id,
        surah_id,
        start_ayah,
        end_ayah,
        audio_file,
        duration
    ))

    conn.commit()

    cur.close()
    conn.close()