import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import xml.etree.ElementTree as ET
from database import get_connection


def import_quran():
    print("Import started")

    tree = ET.parse("data/quran-uthmani.xml")
    root = tree.getroot()

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("DELETE FROM ayahs")
        cur.execute("DELETE FROM surahs")

        total_surahs = 0
        total_ayahs = 0
        
        print("XML loaded successfully")   
        for sura in root.findall("sura"):
            print(f"Importing Surah {sura.attrib['index']}")

            surah_number = int(sura.attrib["index"])
            arabic_name = sura.attrib["name"]
            ayah_count = len(sura.findall("aya"))

            cur.execute("""
                INSERT INTO surahs
                (surah_number, arabic_name, english_name, ayah_count)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (
                surah_number,
                arabic_name,
                "",
                ayah_count
            ))

            surah_id = cur.fetchone()["id"]
            total_surahs += 1
            print(f"Imported Surah {surah_number}")
            

            for aya in sura.findall("aya"):
                

                ayah_number = int(aya.attrib["index"])
                
                uthmani_text = aya.attrib["text"]

                cur.execute("""
                    INSERT INTO ayahs
                    (surah_id, ayah_number, uthmani_text)
                    VALUES (%s, %s, %s)
                """, (
                    surah_id,
                    ayah_number,
                    uthmani_text
                ))

                total_ayahs += 1
                

        conn.commit()

        print(f"Imported {total_surahs} Surahs")
        print(f"Imported {total_ayahs} Ayahs")
        print("Qur'an import completed successfully.")

    except Exception as e:

        conn.rollback()
        print("Import failed.")
        print(e)

    finally:

        cur.close()
        conn.close()


if __name__ == "__main__":
    import_quran()