Pembaruan panel admin

Status project `dalpgqloaglfztcpxfeg`: migrasi sudah diterapkan melalui MCP Supabase pada 14 Oktober 2026 dengan versi `20261014013809` dan nama `admin_panel_schedule_attendance`.

Verifikasi: enam kolom baru dan kedua index keunikan harian tersedia. Jumlah santri (170), guru (21), kelas (20), dan absensi (7.992) tetap sama setelah migrasi. Sebanyak 7.942 catatan hadir lama sudah memiliki waktu datang dari waktu scan. Jadwal kelas belum diisi; atur melalui menu Kelas sesuai jam belajar sebenarnya.

1. Jalankan `admin_panel_updates.sql` pada project Supabase aplikasi ini melalui SQL Editor atau MCP Supabase.
2. Jalankan ulang/deploy API dan frontend dengan perubahan ini.
3. Di menu Kelas, edit wali kelas, zona waktu (WIB/WITA/WIT), serta sesi hari dan jam. Default zona waktu kelas baru adalah WITA; sesuaikan dengan lokasi TPQ.

Absensi guru memakai satu catatan per hari: pilih Datang saat mulai, lalu Pulang saat selesai di halaman scanner. Scan berulang pada jenis absensi yang sama tidak mengganti waktu yang sudah tercatat. Guru harus berstatus aktif. Waktu datang/pulang dibandingkan jadwal kelas yang diampu sebagai wali kelas pada hari tersebut. Jika mengampu beberapa sesi, acuan datang adalah awal sesi pertama dan pulang adalah akhir sesi terakhir.

Jadwal disalin ke catatan saat datang agar perubahan jadwal tidak mengubah penilaian riwayat. Durasi mengajar adalah selisih waktu datang sampai pulang, termasuk jeda antarsesi. Catatan lama tanpa jadwal dan catatan tanpa pulang menampilkan keterangan belum lengkap. Tidak ada pengisian terlambat secara perkiraan.

Statistik absensi menghitung catatan hadir/izin/sakit/alfa yang disetujui. Santri/guru tanpa catatan tidak otomatis dianggap alfa. Tren dashboard menampilkan jumlah santri hadir unik per tanggal pada bulan terpilih; tanggal mendatang tidak digambar sebagai ketidakhadiran. Distribusi dan statistik jenis kelamin dashboard memakai santri aktif saat ini.

WA Saldo membaca ulang saldo sebelum membuka WhatsApp. WA Kenaikan tersedia di Riwayat Kenaikan Kelas untuk status lulus/lulus bersyarat. Nomor penerima dipilih dari HP wali, ayah, lalu ibu yang valid. Pesan dibuka untuk ditinjau dan dikirim secara manual di WhatsApp.

Migrasi menambahkan kolom tanpa menghapus data lama. Index keunikan harian dibuat jika tidak ditemukan duplikat lama; jika ada, SQL mengeluarkan NOTICE agar riwayat ditinjau terlebih dahulu. File ini tidak mengubah kebijakan akses yang sudah ada.
