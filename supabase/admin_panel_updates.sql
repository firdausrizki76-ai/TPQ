-- Jalankan sekali melalui Supabase SQL Editor atau MCP sebelum memakai fitur jadwal/absensi.
-- Perubahan bersifat tambahan; catatan absensi lama tetap dipertahankan.
BEGIN;
ALTER TABLE public.kelas ADD COLUMN IF NOT EXISTS jadwal JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.kelas ADD COLUMN IF NOT EXISTS zona_waktu TEXT NOT NULL DEFAULT 'Asia/Makassar';
ALTER TABLE public.absensi ADD COLUMN IF NOT EXISTS waktu_datang TIMESTAMPTZ;
ALTER TABLE public.absensi ADD COLUMN IF NOT EXISTS waktu_pulang TIMESTAMPTZ;
ALTER TABLE public.absensi ADD COLUMN IF NOT EXISTS jadwal_mulai TIMESTAMPTZ;
ALTER TABLE public.absensi ADD COLUMN IF NOT EXISTS jadwal_selesai TIMESTAMPTZ;
UPDATE public.absensi SET waktu_datang = waktu_scan WHERE status = 'hadir' AND waktu_datang IS NULL;
-- Index only if historic data is already unique. Do not delete duplicate history.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.absensi WHERE tipe='guru' GROUP BY guru_id,tanggal HAVING count(*)>1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS absensi_guru_harian_unique ON public.absensi(guru_id,tanggal) WHERE tipe='guru';
  ELSE
    RAISE NOTICE 'Duplikat absensi guru lama ditemukan; periksa sebelum membuat unique index.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.absensi WHERE tipe='santri' GROUP BY santri_id,tanggal HAVING count(*)>1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS absensi_santri_harian_unique ON public.absensi(santri_id,tanggal) WHERE tipe='santri';
  ELSE
    RAISE NOTICE 'Duplikat absensi santri lama ditemukan; periksa sebelum membuat unique index.';
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
