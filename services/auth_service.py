from database import get_connection


def create_user(full_name, email, password):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO users (full_name, email, password)
        VALUES (%s, %s, %s)
    """, (full_name, email, password))

    conn.commit()

    cur.close()
    conn.close()
    
def get_user_by_email(email):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM users WHERE email=%s",
        (email,)
    )

    user = cur.fetchone()

    cur.close()
    conn.close()

    return user    