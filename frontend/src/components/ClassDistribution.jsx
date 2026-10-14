const colors = ['#047857', '#059669', '#10b981', '#0d9488', '#0891b2', '#2563eb'];

export default function ClassDistribution({ rows = [] }) {
  const total = rows.reduce((n, r) => n + r.value, 0);
  const max = Math.max(...rows.map(r => r.value), 1);
  return <><div className="chart-summary"><strong>{total} santri aktif</strong><span>{rows.filter(r => r.value > 0).length} kelas terisi</span></div>
    <div className="distribution-list">{rows.map((r, i) => <div className="distribution-row" key={r.label}>
      <div className="distribution-label"><span>{r.label}</span><strong>{r.value} <small>({total ? Math.round(r.value / total * 100) : 0}%)</small></strong></div>
      <div className="distribution-track"><div style={{ width: `${r.value / max * 100}%`, background: colors[i % colors.length] }} role="img" aria-label={`${r.label}: ${r.value} santri`} /></div>
    </div>)}</div>
    {!rows.length && <p className="text-center py-8">Belum ada data kelas</p>}
  </>;
}
