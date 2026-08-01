import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config


def get_connection():
    return psycopg2.connect(
        Config.DATABASE_URL,
        cursor_factory=RealDictCursor
    )
    



def get_connection():
    return psycopg2.connect(
        Config.DATABASE_URL,
        cursor_factory=RealDictCursor
    )


def get_all_surahs():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM surahs
        ORDER BY surah_number
    """)

    surahs = cur.fetchall()

    cur.close()
    conn.close()

    return surahs    