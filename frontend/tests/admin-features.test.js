import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceMetrics, localDate, scheduleBounds, summarizeAttendance, validateSchedule } from '../api/attendance.js';
import { guardianPhone, normalizePhone, whatsappUrl, balanceMessage, promotionMessage } from '../src/utils/whatsapp.js';

test('attendance dates use the class timezone across UTC midnight', () => {
  const instant = new Date('2026-10-13T16:30:00Z');
  assert.equal(localDate(instant, 'Asia/Makassar'), '2026-10-14');
  assert.equal(localDate(instant, 'Asia/Jakarta'), '2026-10-13');
});

test('custom sessions validate times, days, overlaps and zones', () => {
  const schedule = [{ hari: 3, mulai: '16:00', selesai: '17:00' }, { hari: 1, mulai: '15:00', selesai: '16:00' }];
  assert.deepEqual(validateSchedule(schedule, 'Asia/Makassar').map(s => s.hari), [1, 3]);
  for (const bad of [
    [{ hari: 7, mulai: '16:00', selesai: '17:00' }],
    [{ hari: 1, mulai: '17:00', selesai: '16:00' }],
    [{ hari: 1, mulai: '24:00', selesai: '25:00' }],
    [{ hari: 1, mulai: '16:00', selesai: '17:00' }, { hari: 1, mulai: '16:30', selesai: '18:00' }],
  ]) assert.throws(() => validateSchedule(bad, 'Asia/Makassar'));
  assert.throws(() => validateSchedule(schedule, 'Europe/London'));
});

test('teacher daily schedule spans first and last sessions of assigned classes', () => {
  const bounds = scheduleBounds([
    { zona_waktu: 'Asia/Makassar', jadwal: [{ hari: 3, mulai: '16:00', selesai: '17:00' }] },
    { zona_waktu: 'Asia/Makassar', jadwal: [{ hari: 3, mulai: '17:00', selesai: '18:00' }] },
  ], '2026-10-14');
  assert.equal(bounds.jadwal_mulai, '2026-10-14T08:00:00.000Z');
  assert.equal(bounds.jadwal_selesai, '2026-10-14T10:00:00.000Z');
  assert.deepEqual(scheduleBounds([], '2026-10-14'), { jadwal_mulai: null, jadwal_selesai: null });
});

const teacherAttendance = {
  guru_id: 'g1', guru: { nama_lengkap: 'Guru A' }, status: 'hadir',
  waktu_datang: '2026-10-14T08:05:00Z', waktu_pulang: '2026-10-14T08:50:00Z',
  jadwal_mulai: '2026-10-14T08:00:00Z', jadwal_selesai: '2026-10-14T09:00:00Z',
};

test('arrival/departure produce late minutes, early departure and actual duration', () => {
  const result = attendanceMetrics(teacherAttendance);
  assert.equal(result.terlambat_menit, 5);
  assert.equal(result.pulang_cepat_menit, 10);
  assert.equal(result.durasi_menit, 45);
  const onTime = attendanceMetrics({ ...teacherAttendance, waktu_datang: '2026-10-14T07:55:00Z', waktu_pulang: '2026-10-14T09:05:00Z' });
  assert.equal(onTime.terlambat_menit, 0);
  assert.equal(onTime.pulang_cepat_menit, 0);
  assert.equal(onTime.durasi_menit, 70);
});

test('legacy arrival works; missing schedule and departure remain unknown', () => {
  const legacy = attendanceMetrics({ status: 'hadir', waktu_scan: '2026-10-14T08:00:00Z' });
  assert.equal(legacy.waktu_datang, '2026-10-14T08:00:00Z');
  assert.equal(legacy.terlambat_menit, null);
  assert.equal(legacy.durasi_menit, null);
  assert.equal(attendanceMetrics({ status: 'izin', waktu_scan: '2026-10-14T08:00:00Z' }).waktu_datang, null);
});

test('recap counts a teacher once per record and excludes pending permissions', () => {
  const result = summarizeAttendance([
    teacherAttendance,
    { ...teacherAttendance, waktu_pulang: null },
    { guru_id: 'g1', status: 'izin', keterangan: '(MENUNGGU PERSETUJUAN) Izin' },
  ], 'guru')[0];
  assert.equal(result.hadir, 2);
  assert.equal(result.total, 2);
  assert.equal(result.pending, 1);
  assert.equal(result.durasi_menit, 45);
  assert.equal(result.belum_pulang, 1);
  assert.equal(result.pulang_cepat, 1);
});

test('guardian WhatsApp uses valid stored phone with fallback and encoded balance', () => {
  assert.equal(normalizePhone('+62 812-3456-7890'), '6281234567890');
  assert.equal(normalizePhone('081234567890'), '6281234567890');
  assert.equal(normalizePhone('81234567890'), '6281234567890');
  assert.equal(normalizePhone('abc'), null);
  const santri = { nama_lengkap: 'Santri & A', nomor_induk: 'S01', saldo: '125000', no_hp_wali: 'bad', no_hp_ayah: '081234567890' };
  assert.equal(guardianPhone(santri), '6281234567890');
  const url = new URL(whatsappUrl(santri, balanceMessage(santri)));
  assert.equal(url.pathname, '/6281234567890');
  assert.match(url.searchParams.get('text'), /Rp 125\.000/);
  assert.match(url.searchParams.get('text'), /Santri & A/);
  assert.equal(whatsappUrl({}, 'Pesan'), null);
});

test('promotion message names the actual new level and promotion date', () => {
  const message = promotionMessage({ santri: { nama_lengkap: 'A' }, kelas_dari: { nama_kelas: 'Jilid 1' }, kelas_ke: { nama_kelas: 'Jilid 2' }, tanggal_naik: '2026-10-14' });
  assert.match(message, /dari Jilid 1 ke Jilid 2/);
  assert.match(message, /14\/10\/2026/);
});
