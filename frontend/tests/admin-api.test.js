import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';

test('admin API handles the teacher arrival/departure lifecycle and monthly dashboard', async t => {
  const teacherId = '00000000-0000-0000-0000-000000000001';
  const studentId = '00000000-0000-0000-0000-000000000002';
  const classId = '00000000-0000-0000-0000-000000000003';
  const rows = [];
  const tables = {
    guru: [{ id: teacherId, nama_lengkap: 'Guru Test', status: 'aktif' }],
    santri: [{ id: studentId, nama_lengkap: 'Santri Test', nomor_induk: 'S1', status: 'aktif', jenis_kelamin: 'L', kelas_id: classId, no_hp_wali: '081234567890' }],
    kelas: [{ id: classId, nama_kelas: 'Jilid 1', urutan: 1, wali_kelas_id: teacherId, zona_waktu: 'Asia/Makassar', jadwal: [{ hari: 3, mulai: '16:00', selesai: '17:00' }] }],
    absensi: rows,
    v_saldo_tabungan: [{ santri_id: studentId, saldo: 250000 }],
  };
  const mockDatabase = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const table = url.pathname.split('/').at(-1);
    const source = tables[table] || [];
    let result = source.filter(row => [...url.searchParams].every(([field, filter]) => {
      if (filter.startsWith('eq.')) return String(row[field]) === filter.slice(3);
      if (filter === 'is.null') return row[field] == null;
      if (filter.startsWith('gte.')) return String(row[field]) >= filter.slice(4);
      if (filter.startsWith('lte.')) return String(row[field]) <= filter.slice(4);
      return true;
    }));
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.method === 'POST') {
      const value = JSON.parse(body);
      if (source.some(r => r.tipe === value.tipe && r.tanggal === value.tanggal && (value.guru_id ? r.guru_id === value.guru_id : r.santri_id === value.santri_id))) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ code: '23505', message: 'Duplicate attendance' }));
      }
      const record = { id: `row-${source.length + 1}`, ...value };
      source.push(record); result = [record];
    } else if (req.method === 'PATCH') {
      const value = JSON.parse(body);
      result.forEach(row => Object.assign(row, value));
    }
    const limit = Number(url.searchParams.get('limit'));
    if (limit) result = result.slice(0, limit);
    result = result.map(row => table === 'absensi' ? { ...row, guru: tables.guru.find(g => g.id === row.guru_id), santri: tables.santri.find(s => s.id === row.santri_id) } : row);
    const single = req.headers.accept?.includes('vnd.pgrst.object');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(single ? result[0] || null : result));
  });
  mockDatabase.listen(0, '127.0.0.1');
  await once(mockDatabase, 'listening');
  // Override before import so tests can never use the real project database.
  process.env.SUPABASE_URL = `http://127.0.0.1:${mockDatabase.address().port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-key';
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); mockDatabase.closeAllConnections(); mockDatabase.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, ...await response.json() };
  };
  const attendance = { tipe: 'guru', guru_id: teacherId, tanggal: '2026-10-14', status: 'hadir' };
  assert.equal((await request('/absensi', 'POST', { ...attendance, jenis_absen: 'pulang' })).status, 400);
  const arrival = await request('/absensi', 'POST', { ...attendance, waktu_scan: '2026-10-14T08:05:00Z' });
  assert.equal(arrival.status, 200);
  assert.equal(arrival.data.terlambat_menit, 5);
  assert.equal(arrival.data.durasi_menit, null);
  assert.equal(rows.length, 1);
  // Changing the class schedule must not rewrite a teacher's recorded daily schedule.
  tables.kelas[0].jadwal = [{ hari: 3, mulai: '15:00', selesai: '18:00' }];
  const duplicateArrival = await request('/absensi', 'POST', { ...attendance, waktu_scan: '2026-10-14T08:15:00Z' });
  assert.equal(duplicateArrival.data.waktu_datang, '2026-10-14T08:05:00.000Z');
  assert.equal(rows.length, 1);
  assert.equal((await request('/absensi', 'POST', { ...attendance, jenis_absen: 'pulang', waktu_scan: '2026-10-14T08:00:00Z' })).status, 400);
  const departure = await request('/absensi', 'POST', { ...attendance, jenis_absen: 'pulang', waktu_scan: '2026-10-14T08:50:00Z' });
  assert.equal(departure.status, 200);
  assert.equal(departure.data.pulang_cepat_menit, 10);
  assert.equal(departure.data.durasi_menit, 45);
  const duplicateDeparture = await request('/absensi', 'POST', { ...attendance, jenis_absen: 'pulang', waktu_scan: '2026-10-14T09:00:00Z' });
  assert.equal(duplicateDeparture.data.waktu_pulang, '2026-10-14T08:50:00.000Z');
  const recap = await request('/absensi/rekap?tipe=guru&tanggal_mulai=2026-10-14&tanggal_selesai=2026-10-14');
  assert.equal(recap.data[0].hadir, 1);
  assert.equal(recap.data[0].durasi_menit, 45);
  assert.equal((await request('/absensi?role=guru&tanggal=2026-10-14')).data[0].terlambat_menit, 5);
  const competing = await Promise.all([
    request('/absensi', 'POST', { ...attendance, tanggal: '2026-10-21', waktu_scan: '2026-10-21T08:00:00Z' }),
    request('/absensi', 'POST', { ...attendance, tanggal: '2026-10-21', waktu_scan: '2026-10-21T08:00:00Z' }),
  ]);
  assert(competing.every(r => [200, 409].includes(r.status)));
  assert.equal(rows.filter(r => r.tanggal === '2026-10-21').length, 1);
  assert.equal((await request('/absensi', 'POST', { ...attendance, tanggal: '2026-02-30' })).status, 400);
  assert.equal((await request('/absensi', 'POST', { tipe: 'santri', santri_id: studentId, jenis_absen: 'pulang' })).status, 400);
  const invalidSchedule = await request(`/kelas/${classId}`, 'PUT', { jadwal: [{ hari: 3, mulai: '17:00', selesai: '16:00' }], zona_waktu: 'Asia/Makassar' });
  assert.equal(invalidSchedule.status, 400);
  assert.equal((await request('/dashboard/stats?bulan=2024-02')).data.kehadiranTrendDetail.length, 29);
  assert.equal((await request('/dashboard/stats?bulan=2026-13')).status, 400);
  const stats = await request('/dashboard/stats?bulan=2026-10');
  assert.equal(stats.data.santriLakiLaki, 1);
  assert.equal(stats.data.santriPerempuan, 0);
  assert.equal(Object.hasOwn(stats.data, 'tunggakan'), false);
  const balance = await request(`/tabungan/${studentId}/saldo`);
  assert.equal(balance.data.saldo, 250000);
  assert.equal(balance.data.no_hp_wali, '081234567890');
});
