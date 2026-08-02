from flask import Blueprint, render_template, request, jsonify, current_app, session
from services.recording_service import save_recitation
from services.recording_service import save_audio_file
from services.ai_service import analyze_recitation
from database import get_all_surahs
from database import get_ayahs_by_surah
from database import get_connection
from utils.auth import login_required

quran_bp = Blueprint("quran", __name__)


@quran_bp.route("/surahs")
def surahs():

    surahs = get_all_surahs()

    return render_template(
        "quran/surahs.html",
        surahs=surahs
    )
    
@quran_bp.route("/surah/<int:surah_id>")
def surah_detail(surah_id):

    ayahs = get_ayahs_by_surah(surah_id)

    return render_template(
        "quran/surah_detail.html",
        ayahs=ayahs
    )
    
@quran_bp.route("/practice/<int:ayah_id>")
@login_required
def practice(ayah_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM ayahs
        WHERE id=%s
    """, (ayah_id,))

    ayah = cur.fetchone()

    cur.close()
    conn.close()

    return render_template(
        "quran/practice.html",
        ayah=ayah
    )
            
@quran_bp.route("/practice/surah/<int:surah_id>")
@login_required
def practice_surah(surah_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM surahs
        WHERE id=%s
    """, (surah_id,))
    surah = cur.fetchone()

    cur.execute("""
        SELECT *
        FROM ayahs
        WHERE surah_id=%s
        ORDER BY ayah_number
    """, (surah_id,))
    ayahs = cur.fetchall()

    cur.close()
    conn.close()

    return render_template(
        "quran/practice_surah.html",
        surah=surah,
        ayahs=ayahs
    )
    
@quran_bp.route("/upload-recording", methods=["POST"])
@login_required
def upload_recording():
    print("Upload route called")
    
    

    if "audio" not in request.files:
        return jsonify({
            "success": False,
            "message": "Audio file not found."
        }), 400

    audio = request.files["audio"]
    
    

    filename = save_audio_file(audio)
    
    surah_id = int(request.form["surah_id"])
    start_ayah = int(request.form["start_ayah"])
    end_ayah = int(request.form["end_ayah"])
    
    analysis = analyze_recitation(
            f"uploads/recordings/{filename}",
            surah_id
        )
    
   

    save_recitation(
        user_id=session["user_id"],
        surah_id=surah_id,
        start_ayah=start_ayah,
        end_ayah=end_ayah,
        audio_file=filename,
        duration=0
    )   
    

    return jsonify({
        "success": True,
        "message": "Audio uploaded successfully.",
        "filename": filename,
        "analysis": analysis
    })                