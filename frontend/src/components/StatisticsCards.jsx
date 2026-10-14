export default function StatisticsCards({ items, loading }) {
  return <div className="summary-grid mb-6">{items.map(item => <div className="card summary-card" key={item.label}>
    <span className="stat-title">{item.label}</span>
    <strong style={{ color: item.color || 'var(--color-primary-container)' }}>{loading ? '…' : item.value}</strong>
    {item.description && <span className="stat-subtext">{item.description}</span>}
  </div>)}</div>;
}
