import { useState } from 'react';

export default function AttendanceTrend({ rows = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const past = rows.filter(d => !d.mendatang);
  const max = Math.max(...rows.map(d => d.hadir), 1);
  const selected = rows.find(d => d.tanggal === selectedDate);
  const width = 720, height = 230, left = 36, top = 15, bottom = 195;
  const x = i => left + i * (width - left - 15) / Math.max(rows.length - 1, 1);
  const y = value => bottom - value / max * (bottom - top);
  const points = past.map((d, i) => `${x(i)},${y(d.hadir)}`).join(' ');
  return <>
    <div className="chart-summary"><strong>{past.reduce((n, d) => n + d.hadir, 0).toLocaleString('id-ID')} kehadiran</strong><span>Rata-rata {past.length ? Math.round(past.reduce((n, d) => n + d.hadir, 0) / past.length) : 0} santri/hari kalender</span></div>
    {rows.length ? <svg className="attendance-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafik jumlah santri hadir per hari. Pilih titik untuk melihat detail.">
      <defs><linearGradient id="attendance-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.02" /></linearGradient></defs>
      {[0, 0.5, 1].map(f => <g key={f}><line x1={left} x2={width - 15} y1={y(f * max)} y2={y(f * max)} stroke="#e2e8f0" strokeDasharray="4 4" /><text x="26" y={y(f * max) + 4} textAnchor="end" fontSize="14" fill="#64748b">{Math.round(f * max)}</text></g>)}
      {past.length > 0 && <><polygon points={`${left},${bottom} ${points} ${x(past.length - 1)},${bottom}`} fill="url(#attendance-fill)" /><polyline points={points} fill="none" stroke="#059669" strokeWidth="3" strokeLinejoin="round" /></>}
      {rows.map((d, i) => <g key={d.tanggal}>
        {!d.mendatang && <circle cx={x(i)} cy={y(d.hadir)} r={selectedDate === d.tanggal ? 6 : 4} fill="#059669" stroke="white" strokeWidth="2" tabIndex="0" role="button" aria-label={`${d.tanggal}: ${d.hadir} hadir`} onMouseEnter={() => setSelectedDate(d.tanggal)} onFocus={() => setSelectedDate(d.tanggal)} onClick={() => setSelectedDate(d.tanggal)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedDate(d.tanggal); }}><title>{d.tanggal}: {d.hadir} santri hadir</title></circle>}
        {(i % 5 === 0 || i === rows.length - 1) && <text x={x(i)} y={bottom + 22} textAnchor="middle" fontSize="15" fill="#64748b">{i + 1}</text>}
      </g>)}
    </svg> : <p className="text-center py-8">Belum ada data</p>}
    <p className="chart-detail" aria-live="polite">{selected ? `${new Date(`${selected.tanggal}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}: ${selected.hadir} santri hadir` : 'Arahkan atau pilih titik untuk melihat kehadiran harian.'}</p>
  </>;
}
