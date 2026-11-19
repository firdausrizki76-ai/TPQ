-- ============================================
-- TABEL KALENDER PENDIDIKAN
-- Menyimpan hari libur nasional, agenda TPQ, 
-- cuti bersama, dan kegiatan pendidikan
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS kalender_pendidikan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal         DATE NOT NULL,
  judul           VARCHAR(200) NOT NULL,
  deskripsi       TEXT,
  jenis           VARCHAR(30) NOT NULL DEFAULT 'agenda'
                  CHECK (jenis IN ('libur_nasional','cuti_bersama','agenda','kegiatan','hari_khusus')),
  warna           VARCHAR(10) DEFAULT '#064e3b',
  is_libur        BOOLEAN DEFAULT FALSE,
  sumber          VARCHAR(30) DEFAULT 'manual'
                  CHECK (sumber IN ('api','manual')),
  tahun_ajaran    VARCHAR(20),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kalender_tanggal ON kalender_pendidikan(tanggal);
CREATE INDEX IF NOT EXISTS idx_kalender_jenis ON kalender_pendidikan(jenis);
CREATE INDEX IF NOT EXISTS idx_kalender_tahun_ajaran ON kalender_pendidikan(tahun_ajaran);

-- Trigger auto-update updated_at
DROP TRIGGER IF EXISTS trg_kalender_updated_at ON kalender_pendidikan;
CREATE TRIGGER trg_kalender_updated_at
  BEFORE UPDATE ON kalender_pendidikan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE kalender_pendidikan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role Full Access Kalender" ON kalender_pendidikan FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Read Kalender" ON kalender_pendidikan FOR SELECT TO anon USING (true);
