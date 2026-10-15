import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { createSantriWorkbook, formatSantriAddress } from '../src/utils/santriExport.js';

test('XLS export is a real Excel workbook and preserves long IDs, leading zeros and Unicode', () => {
  const student = {
    nomor_induk: '000123', nama_lengkap: 'Nūr, "Aisyah"', jenis_kelamin: 'P',
    nik: '0012345678901234', no_kk: '0012345678901235', no_hp_wali: '081234567890',
    alamat: 'Jl. Mawar, No. 1\nBlok "A"', rt: '001', rw: '002',
    nama_ayah: '=1+1', nama_ibu: 'Ibu Nūr', password: 'never-export-this-password',
    access_token: 'never-export-this-token', anak_ke: 0, tanggal_lahir: '2018-01-02',
  };
  const file = XLSX.write(createSantriWorkbook([student]), { type: 'buffer', bookType: 'biff8' });
  assert.equal(file.subarray(0, 8).toString('hex'), 'd0cf11e0a1b11ae1');
  const reopened = XLSX.read(file, { type: 'buffer' });
  const sheet = reopened.Sheets['Data Santri'];
  const [row] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  assert.equal(row.NIS, student.nomor_induk);
  assert.equal(row['Nama Lengkap'], student.nama_lengkap);
  assert.equal(row['NIK Santri'], student.nik);
  assert.equal(row['Nomor KK'], student.no_kk);
  assert.equal(row['No. HP Wali'], student.no_hp_wali);
  assert.equal(row['Jenis Kelamin'], 'Perempuan');
  assert.equal(row.Alamat, student.alamat);
  assert.equal(row.RT, '001');
  assert.equal(row['Anak Ke'], '0');
  assert.equal(row['Tanggal Lahir'], '2018-01-02');
  assert.equal(row['Nama Ayah'], '=1+1');
  const cells = Object.entries(sheet).filter(([name]) => !name.startsWith('!')).map(([, cell]) => cell);
  assert.equal(cells.some(cell => cell.f), false);
  assert.equal(JSON.stringify(row).includes(student.password), false);
  assert.equal(JSON.stringify(row).includes(student.access_token), false);
});

test('complete export includes family, enrollment, class, contact and document data in supplied order', () => {
  const students = [
    { kelas_id: 'k1', nomor_induk: 'S002', nama_lengkap: 'Zahra', nama_panggilan: 'Ara', desa: 'Desa A', kecamatan: 'Kecamatan B', kabupaten: 'Kabupaten C', nik_ayah: '0001234567890123', pekerjaan_ayah: 'Guru', pendidikan_ayah: 'S1', no_hp_ayah: '081100000000', nik_ibu: '0001234567890124', pekerjaan_ibu: 'Wiraswasta', pendidikan_ibu: 'SMA', no_hp_ibu: '082200000000', nama_wali: 'Wali A', pekerjaan_wali: 'Pegawai', hubungan_keluarga: 'Paman', tahun_ajaran: '2026/2027', status: 'lulus', tanggal_daftar: '2025-01-01', tanggal_lulus: '2026-10-15', tanggal_keluar: '2026-10-15', foto_url: 'https://example.com/foto', kk_url: 'https://example.com/kk', akte_url: 'https://example.com/akte' },
    { kelas_id: 'k1', nomor_induk: 'S001', nama_lengkap: 'Ahmad', wali: { nama_lengkap: 'Guru Khusus' } },
  ];
  const workbook = createSantriWorkbook(students, [{ id: 'k1', nama_kelas: 'Jilid 1', kode_kelas: 'J1', wali_kelas: { nama_lengkap: 'Guru Kelas' } }]);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Data Santri'], { defval: '' });
  assert.deepEqual(rows.map(row => row.NIS), ['S002', 'S001']);
  assert.deepEqual(rows.map(row => row.No), [1, 2]);
  assert.equal(Object.keys(rows[0]).length, 46);
  assert.equal(rows[0].Kelas, 'Jilid 1');
  assert.equal(rows[0]['Kode Kelas'], 'J1');
  assert.equal(rows[0]['Wali Kelas'], 'Guru Kelas');
  assert.equal(rows[1]['Wali Kelas'], 'Guru Khusus');
  assert.equal(rows[0]['Pendidikan Ayah'], 'S1');
  assert.equal(rows[0]['No. HP Ibu'], '082200000000');
  assert.equal(rows[0]['Hubungan Keluarga'], 'Paman');
  assert.equal(rows[0]['Tanggal Lulus'], '2026-10-15');
  assert.equal(rows[0]['Tautan Kartu Keluarga'], students[0].kk_url);
  assert.equal(rows[0]['Tautan Akta Kelahiran'], students[0].akte_url);
  assert.equal(rows[1]['No. HP Ibu'], '');
});

test('student addresses include available area fields and handle empty addresses', () => {
  assert.equal(formatSantriAddress({ alamat: ' Jl. Mawar ', rt: '001', rw: '002', desa: 'Desa A', kecamatan: 'B', kabupaten: 'C' }), 'Jl. Mawar, RT 001 / RW 002, Desa A, Kec. B, C');
  assert.equal(formatSantriAddress({ desa: 'Desa A', rw: '003' }), 'RW 003, Desa A');
  assert.equal(formatSantriAddress({ alamat: ' ', desa: null }), '');
});
