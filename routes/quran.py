from flask import Blueprint, render_template
from database import get_all_surahs

quran_bp = Blueprint("quran", __name__)


@quran_bp.route("/surahs")
def surahs():

    surahs = get_all_surahs()

    return render_template(
        "quran/surahs.html",
        surahs=surahs
    )