import * as XLSX from 'xlsx';

export function formatSantriAddress(santri) {
  const value = field => String(santri[field] ?? '').trim();
  const rtRw = [value('rt') && `RT ${value('rt')}`, value('rw') && `RW ${value('rw')}`].filter(Boolean).join(' / ');
  return [value('alamat'), rtRw, value('desa'), value('kecamatan') && `Kec. ${value('kecamatan')}`, value('kabupaten')]
    .filter(Boolean).join(', ');
}

const columns = [
  ['NIS', 'nomor_induk'], ['Nama Lengkap', 'nama_lengkap'], ['Nama Panggilan', 'nama_panggilan'],
  ['Jenis Kelamin', s => ({ L: 'Laki-laki', P: 'Perempuan' })[s.jenis_kelamin] || s.jenis_kelamin],
  ['Tempat Lahir', 'tempat_lahir'], ['Tanggal Lahir', 'tanggal_lahir'],
  ['Anak Ke', 'anak_ke'], ['Jumlah Saudara', 'jumlah_saudara'], ['NIK Santri', 'nik'],
  ['Hobi', 'hobi'], ['Cita-Cita', 'cita_cita'],
  ['Alamat', 'alamat'], ['RT', 'rt'], ['RW', 'rw'], ['Desa / Kelurahan', 'desa'],
  ['Kecamatan', 'kecamatan'], ['Kabupaten / Kota', 'kabupaten'], ['Nomor KK', 'no_kk'],
  ['Nama Ayah', 'nama_ayah'], ['NIK Ayah', 'nik_ayah'], ['Pekerjaan Ayah', 'pekerjaan_ayah'],
  ['Pendidikan Ayah', 'pendidikan_ayah'], ['No. HP Ayah', 'no_hp_ayah'],
  ['Nama Ibu', 'nama_ibu'], ['NIK Ibu', 'nik_ibu'], ['Pekerjaan Ibu', 'pekerjaan_ibu'],
  ['Pendidikan Ibu', 'pendidikan_ibu'], ['No. HP Ibu', 'no_hp_ibu'],
  ['Nama Wali', 'nama_wali'], ['Pekerjaan Wali', 'pekerjaan_wali'],
  ['Hubungan Keluarga', 'hubungan_keluarga'], ['No. HP Wali', 'no_hp_wali'],
  ['Kelas', s => s.kelas?.nama_kelas], ['Kode Kelas', s => s.kelas?.kode_kelas],
  ['Wali Kelas', s => s.wali?.nama_lengkap || s.kelas?.wali_kelas?.nama_lengkap],
  ['Status', 'status'], ['Tahun Ajaran', 'tahun_ajaran'],
  ['Tanggal Masuk', 'tanggal_daftar'], ['Tanggal Lulus', 'tanggal_lulus'], ['Tanggal Keluar', 'tanggal_keluar'],
  ['Tautan Foto', 'foto_url'], ['Tautan Kartu Keluarga', 'kk_url'], ['Tautan Akta Kelahiran', 'akte_url'],
  ['Tanggal Data Dibuat', 'created_at'], ['Terakhir Diperbarui', 'updated_at'],
];

export function createSantriWorkbook(santriList, kelasList = []) {
  const classes = new Map(kelasList.map(k => [k.id, k]));
  const rows = santriList.map((santri, index) => {
    const s = { ...santri, kelas: classes.get(santri.kelas_id) || santri.kelas };
    // Explicit text cells preserve leading zeros and long identification numbers.
    // The allowlist contains administrative data, never account credentials.
    return [index + 1, ...columns.map(([, field]) => String((typeof field === 'function' ? field(s) : s[field]) ?? ''))];
  });
  const headers = ['No', ...columns.map(([label]) => label)];
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map(label => ({ wch: label === 'No' ? 5 : label.startsWith('Tautan') ? 50 : label === 'Alamat' ? 45 : Math.max(18, label.length + 2) }));
  sheet['!autofilter'] = { ref: sheet['!ref'] };
  const workbook = XLSX.utils.book_new();
  workbook.Props = { Title: 'Data Lengkap Santri TPQ', Subject: 'Administrasi Santri' };
  XLSX.utils.book_append_sheet(workbook, sheet, 'Data Santri');
  return workbook;
}
