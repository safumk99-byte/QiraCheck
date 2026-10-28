CREATE TABLE IF NOT EXISTS recitation_attempts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  surah varchar(120) NOT NULL,
  ayah_number integer NOT NULL,
  expected_text text NOT NULL,
  transcript text NOT NULL,
  accuracy integer NOT NULL,
  mistakes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE recitation_attempts ADD CONSTRAINT recitation_attempts_ayah_number_check CHECK (ayah_number BETWEEN 1 AND 286);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE recitation_attempts ADD CONSTRAINT recitation_attempts_accuracy_check CHECK (accuracy BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS recitation_attempts_created_at_idx ON recitation_attempts (created_at DESC);
