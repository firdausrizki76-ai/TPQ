-- ============================================
-- SCHEMA LENGKAP — Sistem Administrasi TPQ
-- Jalankan di Supabase SQL Editor
-- ============================================

-- =====================
-- 1. TABEL KELAS (Master 18 Level Qiraati)
-- =====================
CREATE TABLE IF NOT EXISTS kelas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_kelas    VARCHAR(20) UNIQUE NOT NULL,
  nama_kelas    VARCHAR(50) NOT NULL,
  urutan        SMALLINT NOT NULL,
  deskripsi     TEXT,
  wali_kelas_id UUID,
  jadwal        JSONB NOT NULL DEFAULT '[]'::jsonb,
  zona_waktu    TEXT NOT NULL DEFAULT 'Asia/Makassar',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 2. TABEL GURU
-- =====================
CREATE TABLE IF NOT EXISTS guru (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip             VARCHAR(30) UNIQUE,
  nama_lengkap    VARCHAR(100) NOT NULL,
  jenis_kelamin   CHAR(1) CHECK (jenis_kelamin IN ('L','P')),
  tempat_lahir    VARCHAR(100),
  tanggal_lahir   DATE,
  nik             VARCHAR(20),
  no_kk           VARCHAR(20),
  alamat          TEXT,
  rt              VARCHAR(5),
  rw              VARCHAR(5),
  nama_ibu        VARCHAR(100),
  no_hp           VARCHAR(20),
  email           VARCHAR(100),
  jabatan         VARCHAR(50),
  foto_url        TEXT,
  status          VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
  tanggal_masuk   DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 3. TABEL SANTRI
-- =====================
CREATE TABLE IF NOT EXISTS santri (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_induk       VARCHAR(20) UNIQUE NOT NULL,
  nama_lengkap      VARCHAR(100) NOT NULL,
  nama_panggilan    VARCHAR(50),
  jenis_kelamin     CHAR(1) CHECK (jenis_kelamin IN ('L','P')),
  tempat_lahir      VARCHAR(100),
  tanggal_lahir     DATE,
  anak_ke           INT,
  jumlah_saudara    INT,
  nik               VARCHAR(20),
  alamat            TEXT,
  rt                VARCHAR(5),
  rw                VARCHAR(5),
  desa              VARCHAR(50),
  kecamatan         VARCHAR(50),
  kabupaten         VARCHAR(50),
  hobi              VARCHAR(100),
  cita_cita         VARCHAR(100),
  no_kk             VARCHAR(20),
  nama_ayah         VARCHAR(100),
  nik_ayah          VARCHAR(20),
  pekerjaan_ayah    VARCHAR(50),
  pendidikan_ayah   VARCHAR(50),
  no_hp_ayah        VARCHAR(20),
  nama_ibu          VARCHAR(100),
  nik_ibu           VARCHAR(20),
  pekerjaan_ibu     VARCHAR(50),
  pendidikan_ibu    VARCHAR(50),
  no_hp_ibu         VARCHAR(20),
  no_hp_wali        VARCHAR(20),
  nama_wali         VARCHAR(100),
  pekerjaan_wali    VARCHAR(50),
  hubungan_keluarga VARCHAR(50),
  status            VARCHAR(20) DEFAULT 'aktif'
                    CHECK (status IN ('aktif','nonaktif','lulus','pindah')),
  kelas_id          UUID REFERENCES kelas(id) ON DELETE SET NULL,
  wali_kelas_id     UUID REFERENCES guru(id) ON DELETE SET NULL,
  foto_url          TEXT,
  tanggal_daftar    DATE DEFAULT CURRENT_DATE,
  tanggal_lulus     DATE,
  tanggal_keluar    DATE,
  tahun_ajaran      VARCHAR(10),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 4. TABEL ABSENSI
-- =====================
CREATE TABLE IF NOT EXISTS absensi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu_scan      TIMESTAMPTZ DEFAULT NOW(),
  waktu_datang    TIMESTAMPTZ,
  waktu_pulang    TIMESTAMPTZ,
  jadwal_mulai    TIMESTAMPTZ,
  jadwal_selesai  TIMESTAMPTZ,
  tipe            VARCHAR(10) CHECK (tipe IN ('santri','guru')),
  santri_id       UUID REFERENCES santri(id) ON DELETE CASCADE,
  guru_id         UUID REFERENCES guru(id) ON DELETE CASCADE,
  status          VARCHAR(20) DEFAULT 'hadir'
                  CHECK (status IN ('hadir','sakit','izin','alfa')),
  keterangan      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_subject CHECK (
    (tipe='santri' AND santri_id IS NOT NULL AND guru_id IS NULL) OR
    (tipe='guru'   AND guru_id IS NOT NULL AND santri_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_santri ON absensi(santri_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_guru ON absensi(guru_id, tanggal);

-- =====================
-- 5. TABEL JENIS PEMBAYARAN
-- =====================
CREATE TABLE IF NOT EXISTS jenis_pembayaran (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            VARCHAR(100) NOT NULL,
  kategori        VARCHAR(30) CHECK (kategori IN ('bulanan','insidental','kegiatan')),
  nominal_default BIGINT,
  deskripsi       TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 6. TABEL PEMBAYARAN
-- =====================
CREATE TABLE IF NOT EXISTS pembayaran (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id           UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  jenis_pembayaran_id UUID REFERENCES jenis_pembayaran(id) ON DELETE SET NULL,
  bulan               SMALLINT CHECK (bulan BETWEEN 1 AND 12),
  tahun               SMALLINT,
  tahun_ajaran        VARCHAR(10),
  nominal             BIGINT NOT NULL,
  tanggal_bayar       DATE DEFAULT CURRENT_DATE,
  metode_bayar        VARCHAR(30) DEFAULT 'tunai'
                      CHECK (metode_bayar IN ('tunai','transfer','tabungan')),
  status              VARCHAR(20) DEFAULT 'lunas'
                      CHECK (status IN ('lunas','cicil','belum')),
  catatan             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pembayaran_santri ON pembayaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_periode ON pembayaran(tahun, bulan);

-- =====================
-- 7. TABEL TABUNGAN SANTRI
-- =====================
CREATE TABLE IF NOT EXISTS tabungan_santri (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id       UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis           VARCHAR(10) CHECK (jenis IN ('setor','tarik','pakai')),
  nominal         BIGINT NOT NULL,
  saldo_setelah   BIGINT NOT NULL DEFAULT 0,
  keterangan      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tabungan_santri ON tabungan_santri(santri_id);

-- =====================
-- 8. TABEL RIWAYAT KELAS (Kenaikan)
-- =====================
CREATE TABLE IF NOT EXISTS riwayat_kelas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id       UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  kelas_dari_id   UUID REFERENCES kelas(id),
  kelas_ke_id     UUID REFERENCES kelas(id) NOT NULL,
  tanggal_mulai   DATE,
  tanggal_selesai DATE,
  tanggal_naik    DATE DEFAULT CURRENT_DATE,
  status_tes      VARCHAR(20) DEFAULT 'lulus'
                  CHECK (status_tes IN ('lulus','remidi','lulus_bersyarat')),
  nilai_tes       SMALLINT,
  catatan         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 9. TABEL TARGET PENCAPAIAN
-- =====================
CREATE TABLE IF NOT EXISTS target_pencapaian (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id       UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  kelas_id        UUID REFERENCES kelas(id) ON DELETE CASCADE NOT NULL,
  target_hari     SMALLINT DEFAULT 60,
  aktual_hari     SMALLINT DEFAULT 0,
  tanggal_masuk   DATE DEFAULT CURRENT_DATE,
  tanggal_selesai DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 10. TABEL PENGATURAN
-- =====================
CREATE TABLE IF NOT EXISTS pengaturan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             VARCHAR(50) UNIQUE NOT NULL,
  value           TEXT NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- VIEW: SALDO TABUNGAN REAL-TIME
-- =====================
CREATE OR REPLACE VIEW v_saldo_tabungan AS
  SELECT
    santri_id,
    SUM(CASE WHEN jenis='setor' THEN nominal ELSE 0 END) AS total_setor,
    SUM(CASE WHEN jenis IN ('tarik','pakai') THEN nominal ELSE 0 END) AS total_keluar,
    SUM(CASE WHEN jenis='setor' THEN nominal ELSE -nominal END) AS saldo
  FROM tabungan_santri
  GROUP BY santri_id;

-- =====================
-- FUNCTION: Auto-update updated_at
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_santri_updated_at
  BEFORE UPDATE ON santri
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_guru_updated_at
  BEFORE UPDATE ON guru
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE kelas ADD CONSTRAINT fk_kelas_wali_kelas FOREIGN KEY (wali_kelas_id) REFERENCES guru(id) ON DELETE SET NULL;

