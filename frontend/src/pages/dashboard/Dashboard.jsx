import { useState, useEffect } from 'react';
import { Users, UserCheck, TrendingUp, Loader2 } from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';
import AttendanceTrend from '../../components/AttendanceTrend';
import ClassDistribution from '../../components/ClassDistribution';
import { dateInputValue } from '../../utils/date';

const StatCard = ({ title, value, subtext, icon: Icon, trend, loading, extraInfo }) => (
  <div className="card stat-card">
    <div className="stat-card-header flex justify-between items-center mb-4">
      <div className="stat-title">{title}</div>
      <div className="stat-icon-wrapper">
        <Icon size={20} className="stat-icon" />
      </div>
    </div>
    <div className="stat-value">{loading ? <Loader2 size={24} className="animate-spin" /> : value}</div>
    <div className="stat-footer flex items-center gap-2 mt-2">
      {trend && <TrendingUp size={14} className="trend-icon" />}
      <span className="stat-subtext">{subtext}</span>
    </div>
    {extraInfo && !loading && (
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {extraInfo.map((info, i) => (
          <span key={i} style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: info.bg || '#f1f5f9',
            color: info.color || '#64748b',
            fontWeight: '600'
          }}>
            {info.label}: {info.value}
          </span>
        ))}
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [bulan, setBulan] = useState(() => dateInputValue().slice(0, 7));
  const [stats, setStats] = useState(null);
  const [aktivitas, setAktivitas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    Promise.all([dashboardAPI.getStats({ bulan }), dashboardAPI.getAktivitas()])
      .then(([data, activities]) => { if (current) { setStats(data); setAktivitas(activities || []); } })
      .catch(e => { if (current) setError(e.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [bulan]);

  return (
    <div className="dashboard-page flex-col gap-6">
      <div className="page-header mb-6">
        <h1 className="page-title">Dashboard Utama</h1>
        <p className="page-subtitle">Ringkasan aktivitas dan data TPQ hari ini.</p>
      </div>

      <div className="stats-grid grid-3-cols mb-6">
        <StatCard 
          title="Total Santri" 
          value={stats?.totalSantriAktif ?? stats?.totalSantri ?? '—'} 
          subtext="Santri aktif terdaftar" 
          icon={Users} 
          trend={true}
          loading={loading}
          extraInfo={stats ? [
            { label: 'Laki-laki', value: stats.santriLakiLaki || 0, bg: '#eff6ff', color: '#1d4ed8' },
            { label: 'Perempuan', value: stats.santriPerempuan || 0, bg: '#fdf2f8', color: '#be185d' },
            { label: 'Keluar', value: stats.totalSantriKeluar || 0, bg: '#fef2f2', color: '#991b1b' },
            { label: 'Khotam', value: stats.totalSantriKhotam || 0, bg: '#f0fdf4', color: '#166534' }
          ] : null}
        />
        <StatCard 
          title="Hadir Hari Ini (Santri)" 
          value={stats ? `${stats.hadirHariIni} / ${stats.totalSantriAktif ?? stats.totalSantri}` : '—'} 
          subtext={stats ? `Tingkat kehadiran ${(stats.totalSantriAktif ?? stats.totalSantri) > 0 ? Math.round((stats.hadirHariIni / (stats.totalSantriAktif ?? stats.totalSantri)) * 100) : 0}%` : '—'} 
          icon={UserCheck}
          loading={loading}
        />
        <StatCard 
          title="Guru" 
          value={stats ? `${stats.hadirGuruHariIni} / ${stats.totalGuruAktif ?? stats.totalGuru}` : '—'} 
          subtext={stats ? `Hadir hari ini ${(stats.totalGuruAktif ?? stats.totalGuru) > 0 ? Math.round((stats.hadirGuruHariIni / (stats.totalGuruAktif ?? stats.totalGuru)) * 100) : 0}%` : '—'} 
          icon={UserCheck}
          loading={loading}
          extraInfo={stats ? [
            { label: 'Aktif', value: stats.totalGuruAktif || 0, bg: '#f0fdf4', color: '#166534' },
            { label: 'Nonaktif', value: stats.totalGuruNonaktif || 0, bg: '#fef2f2', color: '#991b1b' }
          ] : null}
        />
      </div>

      {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
      <div className="charts-grid grid-2-cols mb-6">
        <div className="card chart-card featured">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="card-title">Tren Kehadiran Santri</h3>
            <label className="text-sm">Bulan <input type="month" className="input-field" style={{ width: '195px' }} value={bulan} onChange={e => { if (e.target.value && e.target.value !== bulan) { setLoading(true); setError(''); setBulan(e.target.value); } }} /></label>
          </div>
          {loading ? <p className="py-8">Memuat grafik…</p> : <AttendanceTrend rows={stats?.kehadiranTrendDetail} />}
        </div>
        <div className="card chart-card">
          <h3 className="card-title">Distribusi Santri per Kelas</h3>
          {loading ? <p className="py-8">Memuat grafik…</p> : <ClassDistribution rows={stats?.distribusiKelas} />}
        </div>
      </div>

      <div className="card table-card">
        <h3 className="card-title mb-4">Aktivitas Terbaru</h3>
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Santri</th>
                <th>Kelas</th>
                <th>Aktivitas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {aktivitas.length > 0 ? aktivitas.map((a, i) => (
                <tr key={i}>
                  <td>{a.waktu_scan ? new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>{a.santri?.nama_lengkap || '-'}</td>
                  <td>{a.santri?.kelas?.nama_kelas || '-'}</td>
                  <td>Absensi Kehadiran</td>
                  <td><span className={`badge ${a.status === 'hadir' ? 'badge-success' : ''}`}>{a.status || '-'}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center" style={{ color: 'var(--color-outline)', padding: '40px 16px' }}>
                    {loading ? 'Memuat data...' : 'Belum ada aktivitas hari ini'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
