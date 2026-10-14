import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, X, Save, Users, CreditCard, Calendar, Wallet, Loader2, Send, Printer, History, Trash2 } from 'lucide-react';
import { tabunganAPI, santriAPI, laporanAPI } from '../../services/api';
import '../dashboard/Dashboard.css';
import WhatsAppLink from '../../components/WhatsAppLink';
import { balanceMessage } from '../../utils/whatsapp';

const TabunganPage = () => {
  const [santriData, setSantriData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [guruSummary, setGuruSummary] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [rekapAdmin, setRekapAdmin] = useState([]);
  const [rekapGuru, setRekapGuru] = useState([]);
  const [activeTab, setActiveTab] = useState('santri'); // 'santri', 'rekap_guru', 'rekap_admin'
  const [searchTerm, setSearchTerm] = useState('');
  const [saldoSort, setSaldoSort] = useState('saldo_desc');
  const [guruSort, setGuruSort] = useState('setoran_desc');
  const [riwayatFilter, setRiwayatFilter] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });
  const [formData, setFormData] = useState({ santri_id: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' });
  const [allMutations, setAllMutations] = useState([]);
  const [loadingMutations, setLoadingMutations] = useState(false);
  const [mutasiFilter, setMutasiFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    santri_id: '',
    jenis: ''
  });
  
  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');
  const isAdmin = user.role === 'admin';
  const isGuru = user.role === 'guru';

  useEffect(() => { loadData(); }, []);

  const loadAllMutations = async (filter = null) => {
    const f = filter || mutasiFilter;
    setLoadingMutations(true);
    try {
      const startDate = `${f.year}-${f.month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(f.year, f.month, 0).getDate();
      const endDate = `${f.year}-${f.month.toString().padStart(2, '0')}-${lastDay}`;
      const res = await laporanAPI.getTabungan({ dari: startDate, sampai: endDate });
      setAllMutations(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingMutations(false);
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'mutasi_semua') {
      loadAllMutations();
    }
  }, [activeTab, mutasiFilter.month, mutasiFilter.year]);

  const loadData = async () => {
    setLoading(true);
    try { 
      const params = isGuru ? { guru_id: user.id } : {};
      const [data, summary, adminRekap, guruRekap] = await Promise.all([
        tabunganAPI.getAll(params),
        isAdmin ? tabunganAPI.getSummaryGuru() : Promise.resolve([]),
        isAdmin ? tabunganAPI.getRekapAdmin() : Promise.resolve([]),
        tabunganAPI.getRekapGuru() // Always fetch rekap guru so gurus can see their own balance
      ]);
      setSantriData(data || []); 
      setGuruSummary(summary || []);
      setRekapAdmin(adminRekap || []);
      setRekapGuru(guruRekap || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (type, santri = null) => {
    setActiveModal(type);
    if (santri) { setSelectedSantri(santri); setFormData(prev => ({ ...prev, santri_id: santri.id })); }
    else { setSelectedSantri(null); setFormData({ santri_id: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' }); }
  };

  const openRiwayat = async (santri, filter = null) => {
    const f = filter || riwayatFilter;
    setSelectedSantri(santri);
    setActiveModal('riwayat');
    setLoadingRiwayat(true);
    try {
      const data = await tabunganAPI.getRiwayat(santri.id, f);
      setRiwayat(data || []);
    } catch (e) { console.error(e); }
    setLoadingRiwayat(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilter = { ...riwayatFilter, [name]: value };
    setRiwayatFilter(newFilter);
    if (selectedSantri) openRiwayat(selectedSantri, newFilter);
  };

  const downloadMutasi = () => { window.print(); };

  const closeModal = () => { setActiveModal(null); setSelectedSantri(null); setRiwayat([]); };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'santri_id' && value) { const s = santriData.find(s => s.id === value); setSelectedSantri(s); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (activeModal === 'setor_admin_proses') {
        await tabunganAPI.setorKeAdmin({ guru_id: user.id, nominal: parseInt(formData.nominal), keterangan: formData.keterangan });
      } else {
        await tabunganAPI.transact({ 
          santri_id: formData.santri_id, 
          jenis: activeModal, 
          nominal: parseInt(formData.nominal), 
          tanggal: formData.tanggal, 
          keterangan: formData.keterangan,
          recorded_by: user.id
        });
      }
      await loadData(); closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDeleteRiwayat = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Hapus transaksi ini? Saldo santri akan otomatis menyesuaikan.')) return;
    setLoadingRiwayat(true);
    try {
      await tabunganAPI.delete(id);
      await loadData();
      if (selectedSantri) {
        const data = await tabunganAPI.getRiwayat(selectedSantri.id, riwayatFilter);
        setRiwayat(data || []);
      }
      if (activeTab === 'mutasi_semua') {
        await loadAllMutations();
      }
    } catch (e) { alert(e.message); }
    setLoadingRiwayat(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;
  const totalSaldo = santriData.reduce((s, d) => s + (d.saldo || 0), 0);

  const filteredData = santriData.filter(s => 
    (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.nomor_induk || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => saldoSort === 'nama' ? a.nama_lengkap.localeCompare(b.nama_lengkap) : (saldoSort === 'saldo_desc' ? Number(b.saldo) - Number(a.saldo) : Number(a.saldo) - Number(b.saldo)) || a.nama_lengkap.localeCompare(b.nama_lengkap));
  const sortedGuruRekap = [...rekapGuru].sort((a, b) => {
    const field = guruSort === 'koleksi_desc' ? 'total_koleksi' : guruSort === 'saldo_desc' ? 'saldo_di_guru' : 'total_setoran';
    return guruSort === 'nama' ? a.nama_guru.localeCompare(b.nama_guru) : Number(b[field]) - Number(a[field]) || a.nama_guru.localeCompare(b.nama_guru);
  });

  const myRekap = rekapGuru.find(r => r.guru_id === user.id) || { saldo_di_guru: 0 };

  const filteredMutations = allMutations.filter(m => {
    const matchSantri = !mutasiFilter.santri_id || m.santri_id === mutasiFilter.santri_id;
    const matchJenis = !mutasiFilter.jenis || m.jenis === mutasiFilter.jenis;
    return matchSantri && matchJenis;
  });

  const totalSetorMutasi = filteredMutations
    .filter(m => m.jenis === 'setor')
    .reduce((sum, m) => sum + m.nominal, 0);

  const totalTarikMutasi = filteredMutations
    .filter(m => m.jenis === 'tarik')
    .reduce((sum, m) => sum + m.nominal, 0);

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="page-title">Tabungan Santri</h1>
          <p className="page-subtitle">
            {isGuru ? `Kelola tabungan santri kelas Anda` : `Monitoring tabungan santri dan rekapan pengajar`}
          </p>
        </div>
        <div className="flex gap-2">
          {isGuru && (
            <button className="btn-primary" style={{ backgroundColor: 'var(--color-primary-container)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={() => {
              setFormData({ ...formData, nominal: myRekap.saldo_di_guru, keterangan: `Setoran tabungan santri ${new Date().toLocaleDateString('id-ID')}` });
              setActiveModal('setor_admin_proses');
            }}>
              <Send size={18} /> Setor ke Pusat ({formatRp(myRekap.saldo_di_guru)})
            </button>
          )}
          <button className="btn-primary" onClick={() => openModal('setor')}><ArrowDownCircle size={18} /> Tabung</button>
          {isAdmin && (
            <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={() => openModal('tarik')}><ArrowUpCircle size={18} /> Tarik</button>
          )}
        </div>
      </div>

      {/* Admin Financial Dashboard - New Feature */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }} className="no-print">
          
          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #059669, #064e3b)', color: 'white', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: 'none' }}>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, margin: '0 0 8px 0' }}>Total Tabungan Santri</p>
              <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 16px 0' }}>{formatRp(totalSaldo)}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>
                <Users size={14} /> {santriData.length} Santri Aktif
              </div>
            </div>
            <Wallet style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }} size={140} />
          </div>

          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', position: 'relative' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#ea580c', margin: '0 0 8px 0' }}>Uang di Tangan Guru</p>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#c2410c', margin: '0 0 16px 0' }}>
              {formatRp(rekapGuru.reduce((s, g) => s + (g.saldo_di_guru || 0), 0))}
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Total koleksi guru yang belum disetor</p>
            <div style={{ position: 'absolute', top: '24px', right: '24px', width: '48px', height: '48px', backgroundColor: '#fff7ed', color: '#f97316', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownCircle size={24} />
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #bfdbfe', position: 'relative' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', margin: '0 0 8px 0' }}>Uang di Kas Pusat</p>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#1d4ed8', margin: '0 0 16px 0' }}>
              {formatRp(totalSaldo - rekapGuru.reduce((s, g) => s + (g.saldo_di_guru || 0), 0))}
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Total dana yang sudah aman di pusat</p>
            <div style={{ position: 'absolute', top: '24px', right: '24px', width: '48px', height: '48px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} />
            </div>
          </div>

        </div>
      )}

      {/* Admin Tabs - Explicit Inline Styles */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }} className="no-print">
          {[
            { id: 'santri', label: 'Data Santri', icon: <Users size={16} /> },
            { id: 'mutasi_semua', label: 'Mutasi Semua Tabungan', icon: <History size={16} /> },
            { id: 'rekap_guru', label: 'Rekap Guru', icon: <Wallet size={16} /> },
            { id: 'rekap_admin', label: 'Rekap Pusat', icon: <CreditCard size={16} /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  borderRadius: '24px', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  border: isActive ? '1px solid #059669' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#ecfdf5' : 'white',
                  color: isActive ? '#059669' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {isAdmin && activeTab === 'mutasi_semua' && (
        <div className="card w-full printable-ledger" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          {/* Header & Print Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '16px' }} className="no-print">
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="#059669" /> Mutasi Semua Tabungan Santri
            </h3>
            <button className="btn-primary py-1.5 px-4 text-xs bg-white text-blue-600 border border-blue-200" onClick={downloadMutasi}>
              <Printer size={14} /> Cetak Ledger
            </button>
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: '#fdfdfd', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }} className="no-print">
            <span className="text-sm font-semibold text-gray-600">Filter:</span>
            <select className="input-field py-1.5 px-3 text-sm" style={{ width: '140px', backgroundColor: 'white' }} value={mutasiFilter.month} onChange={(e) => setMutasiFilter({...mutasiFilter, month: parseInt(e.target.value)})}>
              {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select className="input-field py-1.5 px-3 text-sm" style={{ width: '100px', backgroundColor: 'white' }} value={mutasiFilter.year} onChange={(e) => setMutasiFilter({...mutasiFilter, year: parseInt(e.target.value)})}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="input-field py-1.5 px-3 text-sm" style={{ width: '220px', backgroundColor: 'white' }} value={mutasiFilter.santri_id} onChange={(e) => setMutasiFilter({...mutasiFilter, santri_id: e.target.value})}>
              <option value="">-- Semua Santri --</option>
              {santriData.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.nomor_induk})</option>)}
            </select>
            <select className="input-field py-1.5 px-3 text-sm" style={{ width: '150px', backgroundColor: 'white' }} value={mutasiFilter.jenis} onChange={(e) => setMutasiFilter({...mutasiFilter, jenis: e.target.value})}>
              <option value="">-- Semua Tipe --</option>
              <option value="setor">Setor (Tabung)</option>
              <option value="tarik">Tarik</option>
            </select>
          </div>

          {/* Print Title (Only visible when printing) */}
          <div className="print-only" style={{ padding: '20px', textAlign: 'center', borderBottom: '2px solid #333', marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>LAPORAN MUTASI TABUNGAN SANTRI</h2>
            <p style={{ margin: 0, fontSize: '14px' }}>Periode: {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][mutasiFilter.month-1]} {mutasiFilter.year}</p>
            {mutasiFilter.santri_id && (
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', fontWeight: 'bold' }}>
                Santri: {santriData.find(s => s.id === mutasiFilter.santri_id)?.nama_lengkap}
              </p>
            )}
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#047857' }}>
              <ArrowDownCircle size={24} />
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>Total Tabung (Setor)</p>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{formatRp(totalSetorMutasi)}</h4>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c' }}>
              <ArrowUpCircle size={24} />
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>Total Tarik</p>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{formatRp(totalTarikMutasi)}</h4>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', color: '#1d4ed8' }} className="no-print">
              <History size={24} />
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>Jumlah Transaksi</p>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{filteredMutations.length}</h4>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ padding: '12px' }}>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Nama Santri</th>
                  <th>Kelas</th>
                  <th>Tipe</th>
                  <th>Nominal</th>
                  <th>Saldo Setelahnya</th>
                  <th>Keterangan</th>
                  {isAdmin && <th className="text-center no-print">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loadingMutations ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader2 size={32} className="animate-spin" color="#059669" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Belum ada data mutasi tabungan
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((m, idx) => (
                    <tr key={m.id}>
                      <td>{idx + 1}</td>
                      <td style={{ color: '#64748b' }}>{new Date(m.tanggal).toLocaleDateString('id-ID')}</td>
                      <td style={{ fontWeight: 'bold', color: '#1e293b' }}>{m.santri?.nama_lengkap || '-'}</td>
                      <td>
                        <span style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                          {m.santri?.kelas?.nama_kelas || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${m.jenis === 'setor' ? 'badge-success' : 'badge-warning'}`}>
                          {m.jenis.toUpperCase()}
                        </span>
                      </td>
                      <td className={`font-bold ${m.jenis === 'setor' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {m.jenis === 'setor' ? '+' : '-'}{formatRp(m.nominal)}
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#475569' }}>{formatRp(m.saldo_setelah)}</td>
                      <td style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>{m.keterangan || '-'}</td>
                      {isAdmin && (
                        <td className="text-center no-print">
                          <button 
                            onClick={() => handleDeleteRiwayat(m.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && activeTab === 'rekap_guru' && (
        <label className="flex items-center gap-3 mb-4 no-print">Urutkan guru
          <select className="input-field" style={{ maxWidth: '280px' }} value={guruSort} onChange={e => setGuruSort(e.target.value)}>
            <option value="setoran_desc">Setoran ke pusat terbanyak</option><option value="koleksi_desc">Koleksi tabungan terbanyak</option><option value="saldo_desc">Saldo di guru terbanyak</option><option value="nama">Nama A–Z</option>
          </select>
        </label>
      )}
      {isAdmin && activeTab === 'rekap_guru' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }} className="no-print">
          {sortedGuruRekap.map((g, idx) => (
            <div key={idx} className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', backgroundColor: 'white', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e293b' }}>{g.nama_guru}</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Saldo Belum Disetor</p>
                </div>
                <div style={{ backgroundColor: '#fffbeb', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Wallet size={18} /></div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '900', color: '#b45309' }}>{formatRp(g.saldo_di_guru)}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span>Koleksi: {formatRp(g.total_koleksi)}</span>
                  <span>Setor: {formatRp(g.total_setoran)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && activeTab === 'rekap_admin' && (
        <div className="card w-full no-print" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} color="#059669" /> Riwayat Setoran Guru ke Pusat</h3>
            <div style={{ backgroundColor: '#059669', padding: '8px 16px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
              Total Dana: {formatRp(rekapAdmin.reduce((s, r) => s + r.nominal, 0))}
            </div>
          </div>
          <div className="table-responsive" style={{ padding: '12px' }}>
            <table className="data-table w-full">
              <thead><tr><th>No</th><th>Tanggal</th><th>Nama Guru</th><th>Nominal</th><th>Keterangan</th><th>Status</th></tr></thead>
              <tbody>
                {rekapAdmin.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada data setoran</td></tr>
                : rekapAdmin.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i+1}</td>
                    <td style={{ color: '#64748b' }}>{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style={{ fontWeight: 'bold', color: '#334155' }}>{r.guru?.nama_lengkap}</td>
                    <td style={{ fontWeight: '900', color: '#059669' }}>{formatRp(r.nominal)}</td>
                    <td style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>{r.keterangan || '-'}</td>
                    <td><span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>DITERIMA</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'santri' && (
        <div className="card w-full no-print" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: '16px', flexWrap: 'wrap' }}>
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon" size={18} color="#94a3b8" />
              <input type="text" className="input-field" style={{ backgroundColor: 'white', borderRadius: '8px' }} placeholder="Cari nama santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <label className="flex items-center gap-2">Urutkan saldo
              <select className="input-field" style={{ maxWidth: '220px' }} value={saldoSort} onChange={e => setSaldoSort(e.target.value)}>
                <option value="saldo_desc">Saldo terbanyak</option><option value="saldo_asc">Saldo terkecil</option><option value="nama">Nama A–Z</option>
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#047857', fontWeight: 'bold', fontSize: '14px' }}>
              <Wallet size={18} />
              Total Tabungan: <span style={{ fontSize: '16px', fontWeight: '900', marginLeft: '4px' }}>{formatRp(totalSaldo)}</span>
            </div>
          </div>

          <div className="table-responsive" style={{ padding: '12px' }}>
            <table className="data-table w-full">
              <thead><tr><th>No</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Saldo</th><th style={{ textAlign: 'center' }}>Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="animate-spin" color="#059669" style={{ margin: '0 auto' }} /></td></tr>
                : filteredData.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada data tabungan</td></tr>
                : filteredData.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '12px' }}>{i+1}</td>
                    <td style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>{s.nomor_induk}</td>
                    <td style={{ fontWeight: 'bold', color: '#1e293b' }}>{s.nama_lengkap}</td>
                    <td><span style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{s.kelas?.nama_kelas || '-'}</span></td>
                    <td style={{ fontWeight: '900', color: '#047857' }}>{formatRp(s.saldo)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <WhatsAppLink santri={s} message={balanceMessage(s)} label="WA Saldo" refresh={async () => {
                          const latest = await tabunganAPI.getBalance(s.id);
                          setSantriData(data => data.map(row => row.id === s.id ? { ...row, ...latest } : row));
                          return { santri: latest, message: balanceMessage(latest) };
                        }} />
                        <button 
                          onClick={() => openRiwayat(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <History size={12} /> RIWAYAT
                        </button>
                        <button 
                          onClick={() => openModal('setor', s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <ArrowDownCircle size={12} /> TABUNG
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => openModal('tarik', s)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            <ArrowUpCircle size={12} /> TARIK
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Setor/Tarik/SetorAdmin */}
      {(activeModal === 'setor' || activeModal === 'tarik' || activeModal === 'setor_admin_proses') && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeModal === 'setor' ? 'bg-emerald-100 text-emerald-600' : activeModal === 'tarik' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {activeModal === 'setor' ? <ArrowDownCircle size={24} /> : activeModal === 'tarik' ? <ArrowUpCircle size={24} /> : <Send size={24} />}
              </div>
              <h2 className="modal-title">{activeModal === 'setor' ? 'Tabung Tabungan' : activeModal === 'tarik' ? 'Tarik Tabungan' : 'Setor ke Pusat'}</h2>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <form onSubmit={handleSubmit}><div className="modal-body"><div className="space-y-4">
            {activeModal !== 'setor_admin_proses' ? (
              <>
                <div className="form-group"><label className="form-label">Pilih Santri</label>
                  <select name="santri_id" className="input-field" value={formData.santri_id} onChange={handleInputChange} required disabled={!!selectedSantri}>
                    <option value="">-- Pilih --</option>
                    {santriData.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.kelas?.nama_kelas})</option>)}
                  </select>
                </div>
                {selectedSantri && (
                  <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2"><Wallet size={16} /> Saldo</span>
                    <span className="font-bold text-emerald-700">{formatRp(selectedSantri.saldo)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                <p className="text-sm text-blue-800 font-bold mb-1">Total Saldo di Pegangan Anda</p>
                <p className="text-3xl font-black text-blue-700">{formatRp(myRekap.saldo_di_guru)}</p>
              </div>
            )}
            <div className="form-group"><label className="form-label">Nominal (Rp)</label>
              <input type="number" name="nominal" className="input-field" value={formData.nominal} onChange={handleInputChange} required />
              {activeModal === 'tarik' && selectedSantri && parseInt(formData.nominal) > (selectedSantri.saldo||0) && <p className="text-xs text-red-500 mt-1">Saldo tidak mencukupi!</p>}
              {activeModal === 'setor_admin_proses' && parseInt(formData.nominal) > myRekap.saldo_di_guru && <p className="text-xs text-orange-600 mt-1">Nominal melebihi saldo rekapan Anda!</p>}
            </div>
            <div className="form-group"><label className="form-label">Tanggal</label><input type="date" name="tanggal" className="input-field" value={formData.tanggal} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Keterangan</label><textarea name="keterangan" className="input-field" rows="2" style={{ resize: 'none' }} value={formData.keterangan} onChange={handleInputChange}></textarea></div>
          </div></div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" style={{ backgroundColor: (activeModal === 'setor' || activeModal === 'setor_admin_proses') ? '#059669' : '#f59e0b' }} disabled={saving || (activeModal === 'tarik' && selectedSantri && parseInt(formData.nominal) > (selectedSantri.saldo||0))}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Konfirmasi {activeModal === 'setor_admin_proses' ? 'Setoran' : ''}
            </button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'riwayat' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '700px' }}>
          <div className="modal-header no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><CreditCard size={24} /></div>
              <div><h2 className="modal-title">Riwayat Tabungan</h2><p className="text-xs text-gray-500">{selectedSantri.nama_lengkap}</p></div>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <div className="modal-body p-0">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center gap-4 no-print flex-wrap">
              <div className="flex gap-2 items-center">
                <select name="month" className="input-field py-1 px-2 text-sm" style={{ width: '130px' }} value={riwayatFilter.month} onChange={handleFilterChange}>
                  {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select name="year" className="input-field py-1 px-2 text-sm" style={{ width: '100px' }} value={riwayatFilter.year} onChange={handleFilterChange}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className="btn-primary py-1.5 px-4 text-xs bg-white text-blue-600 border-blue-200" onClick={downloadMutasi}><Printer size={14} /> Cetak Mutasi</button>
            </div>
            <div className="p-4">
              {loadingRiwayat ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
              : riwayat.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada riwayat transaksi pada periode ini</p>
              : (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table w-full text-sm">
                    <thead><tr><th>Tanggal</th><th>Tipe</th><th>Nominal</th><th>Keterangan</th><th>Saldo</th>{isAdmin && <th className="text-center">Aksi</th>}</tr></thead>
                    <tbody>
                      {riwayat.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                          <td><span className={`badge ${r.jenis === 'setor' ? 'badge-success' : 'badge-warning'}`}>{r.jenis.toUpperCase()}</span></td>
                          <td className={`font-bold ${r.jenis === 'setor' ? 'text-emerald-600' : 'text-orange-600'}`}>{r.jenis === 'setor' ? '+' : '-'}{formatRp(r.nominal)}</td>
                          <td className="text-xs text-gray-500">{r.keterangan || '-'}</td>
                          <td className="font-bold">{formatRp(r.saldo_setelah)}</td>
                          {isAdmin && (
                            <td className="text-center">
                              <button 
                                onClick={() => handleDeleteRiwayat(r.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Hapus Transaksi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .modal-overlay, .modal-overlay *, .printable-ledger, .printable-ledger * { visibility: visible; }
          .modal-overlay, .printable-ledger { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TabunganPage;
