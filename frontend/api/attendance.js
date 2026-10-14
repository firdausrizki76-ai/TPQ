export const TIME_ZONES = { 'Asia/Jakarta': 7, 'Asia/Makassar': 8, 'Asia/Jayapura': 9 };

export function localDate(now = new Date(), zone = 'Asia/Makassar') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validateSchedule(schedule, zone) {
  if (!Object.hasOwn(TIME_ZONES, zone)) throw new Error('Zona waktu tidak valid');
  if (!Array.isArray(schedule)) throw new Error('Jadwal harus berupa daftar sesi');
  for (const entry of schedule) {
    if (!Number.isInteger(entry.hari) || entry.hari < 0 || entry.hari > 6 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.mulai) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.selesai) || entry.selesai <= entry.mulai) {
      throw new Error('Isi hari dan jam yang valid. Jam selesai harus setelah jam mulai pada hari yang sama.');
    }
  }
  const sorted = [...schedule].sort((a, b) => a.hari - b.hari || a.mulai.localeCompare(b.mulai));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].hari === sorted[i - 1].hari && sorted[i].mulai < sorted[i - 1].selesai) {
      throw new Error('Jadwal pada hari yang sama tidak boleh bertabrakan');
    }
  }
  return sorted.map(({ hari, mulai, selesai }) => ({ hari, mulai, selesai }));
}

// One daily teacher record spans the first class start to the last class end.
export function scheduleBounds(classes, tanggal) {
  const day = new Date(`${tanggal}T12:00:00Z`).getUTCDay();
  const sessions = classes.flatMap(k => (k.jadwal || []).filter(j => j.hari === day).map(j => {
    const offset = TIME_ZONES[k.zona_waktu || 'Asia/Makassar'];
    return {
      start: new Date(`${tanggal}T${j.mulai}:00+${String(offset).padStart(2, '0')}:00`).toISOString(),
      end: new Date(`${tanggal}T${j.selesai}:00+${String(offset).padStart(2, '0')}:00`).toISOString(),
    };
  }));
  return sessions.length ? {
    jadwal_mulai: sessions.map(s => s.start).sort()[0],
    jadwal_selesai: sessions.map(s => s.end).sort().at(-1),
  } : { jadwal_mulai: null, jadwal_selesai: null };
}

export function attendanceMetrics(row) {
  const datang = row.status === 'hadir' ? row.waktu_datang || row.waktu_scan : null;
  const pulang = row.status === 'hadir' ? row.waktu_pulang : null;
  const difference = (later, earlier) => Math.max(0, Math.ceil((new Date(later) - new Date(earlier)) / 60000));
  return {
    ...row, waktu_datang: datang,
    terlambat_menit: datang && row.jadwal_mulai ? difference(datang, row.jadwal_mulai) : null,
    pulang_cepat_menit: pulang && row.jadwal_selesai ? difference(row.jadwal_selesai, pulang) : null,
    durasi_menit: datang && pulang ? Math.max(0, Math.floor((new Date(pulang) - new Date(datang)) / 60000)) : null,
  };
}

export function summarizeAttendance(rows, role, kelasId) {
  const map = new Map();
  for (const raw of rows) {
    const a = attendanceMetrics(raw);
    const person = role === 'santri' ? a.santri : a.guru;
    const id = role === 'santri' ? a.santri_id : a.guru_id;
    if (!id || (role === 'santri' && kelasId && person?.kelas_id !== kelasId)) continue;
    if (!map.has(id)) map.set(id, { id, nama: person?.nama_lengkap || '-', kelas: person?.kelas?.nama_kelas || '-', hadir: 0, izin: 0, sakit: 0, alfa: 0, pending: 0, total: 0, terlambat: 0, tepat_waktu: 0, pulang_cepat: 0, durasi_menit: 0, belum_pulang: 0 });
    const r = map.get(id);
    if (a.keterangan?.includes('(MENUNGGU PERSETUJUAN)')) { r.pending++; continue; }
    r[a.status]++;
    r.total++;
    if (a.terlambat_menit > 0) r.terlambat++;
    if (a.terlambat_menit === 0) r.tepat_waktu++;
    if (a.pulang_cepat_menit > 0) r.pulang_cepat++;
    r.durasi_menit += a.durasi_menit || 0;
    if (role === 'guru' && a.status === 'hadir' && !a.waktu_pulang) r.belum_pulang++;
  }
  return [...map.values()].sort((a, b) => a.nama.localeCompare(b.nama));
}
