import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, 
  Plus, Search, Filter, Printer, Download, Trash2, Edit, 
  CheckCircle2, AlertCircle, RefreshCw, X, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Loader2, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { transaksiKeuanganAPI } from '../../services/api';
import * as XLSX from 'xlsx';
import '../dashboard/Dashboard.css';

const LaporanKeuanganPage = () => {
  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoKas: 0,
    totalTransaksi: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMode, setFilterMode] = useState('bulanan'); // 'bulanan' | 'harian'
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterDari, setFilterDari] = useState('');
  const [filterSampai, setFilterSampai] = useState('');
  const [filterTipe, setFilterTipe] = useState('semua');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'pemasukan',
    kategori: 'Infaq / Shodaqoh',
    nominal: '',
    keterangan: '',
    penanggung_jawab: '',
    metode: 'tunai'
  });

  const kategoriPemasukan = [
    'Infaq / Shodaqoh',
    'Donasi Donatur',
    'Biaya Pendaftaran Santri',
    'Bantuan Operasional (BOP)',
    'Penjualan Buku / Seragam',
    'Lain-lain'
  ];

  const kategoriPengeluaran = [
    'Honor / Gaji Guru & Ustadz',
    'ATK, Modul & Cetak',
    'Operasional Listrik, Air & Wi-Fi',
    'Konsumsi Santri & Guru',
    'Perawatan & Sarana Gedung',
    'Kegiatan & Acara TPQ',
    'Lain-lain'
  ];

  useEffect(() => {
    loadData();
  }, [filterMode, filterBulan, filterTahun, filterDari, filterSampai, filterTipe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTipe !== 'semua') params.tipe = filterTipe;
      
      if (filterMode === 'harian') {
        if (filterDari) params.dari = filterDari;
        if (filterSampai) params.sampai = filterSampai;
      } else {
        if (filterBulan) params.bulan = filterBulan;
        if (filterTahun) params.tahun = filterTahun;
      }

      const res = await transaksiKeuanganAPI.getAll(params);
      setDataList(res?.items || []);
      setSummary({
        totalPemasukan: res?.totalPemasukan || 0,
        totalPengeluaran: res?.totalPengeluaran || 0,
        saldoKas: res?.saldoKas || 0,
        totalTransaksi: res?.totalTransaksi || 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (tipeDefault = 'pemasukan') => {
    setEditingId(null);
    setForm({
      tanggal: new Date().toISOString().split('T')[0],
      tipe: tipeDefault,
      kategori: tipeDefault === 'pemasukan' ? kategoriPemasukan[0] : kategoriPengeluaran[0],
      nominal: '',
      keterangan: '',
      penanggung_jawab: '',
      metode: 'tunai'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setForm({
      tanggal: item.tanggal,
      tipe: item.tipe,
      kategori: item.kategori,
      nominal: item.nominal,
      keterangan: item.keterangan || '',
      penanggung_jawab: item.penanggung_jawab || '',
      metode: item.metode || 'tunai'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nominal || Number(form.nominal) <= 0) {
      alert('Masukkan nominal transaksi yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await transaksiKeuanganAPI.update(editingId, form);
      } else {
        await transaksiKeuanganAPI.create(form);
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      alert('Gagal menyimpan transaksi: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi keuangan ini?')) return;
    try {
      await transaksiKeuanganAPI.delete(id);
      loadData();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
  };

  const handleExportExcel = () => {
    const formatted = filteredData.map((d, idx) => ({
      'No': idx + 1,
      'Tanggal': d.tanggal,
      'Tipe': d.tipe === 'pemasukan' ? 'PEMASUKAN' : 'PENGELUARAN',
      'Kategori': d.kategori,
      'Keterangan': d.keterangan || '-',
      'Pemasukan (Rp)': d.tipe === 'pemasukan' ? d.nominal : 0,
      'Pengeluaran (Rp)': d.tipe === 'pengeluaran' ? d.nominal : 0,
      'Metode': d.metode || 'Tunai',
      'Penanggung Jawab': d.penanggung_jawab || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kas TPQ');
    XLSX.writeFile(wb, `Laporan_Kas_TPQ_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatRp = (n) => `Rp ${(Number(n) || 0).toLocaleString('id-ID')}`;

  const filteredData = dataList.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (d.keterangan && d.keterangan.toLowerCase().includes(s)) ||
      (d.kategori && d.kategori.toLowerCase().includes(s)) ||
      (d.penanggung_jawab && d.penanggung_jawab.toLowerCase().includes(s))
    );
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="flex-col gap-6 w-full">
      {/* Printable Area on Window Print */}
      <div id="laporan-kas-print" className="print-only" style={{ display: 'none', padding: '30px', fontFamily: 'serif', backgroundColor: 'white' }}>
        <div style={{ textAlign: 'center', borderBottom: '3px double #064e3b', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', margin: 0, color: '#064e3b' }}>TPQ ANFAK AL AZIZAH</h1>
          <h2 style={{ fontSize: '16px', margin: '4px 0', textDecoration: 'underline' }}>LAPORAN BUKU KAS & ARUS KEUANGAN</h2>
          <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>
            Periode: {filterMode === 'bulanan' ? `${monthNames[filterBulan - 1]} ${filterTahun}` : `${filterDari || 'Awal'} s/d ${filterSampai || 'Akhir'}`}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
          <div style={{ border: '1px solid #16a34a', padding: '10px', backgroundColor: '#f0fdf4' }}>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>TOTAL PEMASUKAN</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803d' }}>{formatRp(summary.totalPemasukan)}</div>
          </div>
          <div style={{ border: '1px solid #dc2626', padding: '10px', backgroundColor: '#fef2f2' }}>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>TOTAL PENGELUARAN</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b91c1c' }}>{formatRp(summary.totalPengeluaran)}</div>
          </div>
          <div style={{ border: '1px solid #d97706', padding: '10px', backgroundColor: '#fffbeb' }}>
            <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>SISA SALDO KAS</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309' }}>{formatRp(summary.saldoKas)}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ border: '1px solid #334155', padding: '8px' }}>No</th>
              <th style={{ border: '1px solid #334155', padding: '8px' }}>Tanggal</th>
              <th style={{ border: '1px solid #334155', padding: '8px' }}>Tipe</th>
              <th style={{ border: '1px solid #334155', padding: '8px' }}>Kategori</th>
              <th style={{ border: '1px solid #334155', padding: '8px' }}>Keterangan</th>
              <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'right' }}>Nominal</th>
              <th style={{ border: '1px solid #334155', padding: '8px' }}>PJ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((d, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #334155', padding: '6px 8px', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: '1px solid #334155', padding: '6px 8px' }}>{d.tanggal}</td>
                <td style={{ border: '1px solid #334155', padding: '6px 8px', fontWeight: 'bold', color: d.tipe === 'pemasukan' ? '#16a34a' : '#dc2626' }}>
                  {d.tipe.toUpperCase()}
                </td>
                <td style={{ border: '1px solid #334155', padding: '6px 8px' }}>{d.kategori}</td>
                <td style={{ border: '1px solid #334155', padding: '6px 8px' }}>{d.keterangan || '-'}</td>
                <td style={{ border: '1px solid #334155', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatRp(d.nominal)}
                </td>
                <td style={{ border: '1px solid #334155', padding: '6px 8px' }}>{d.penanggung_jawab || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Page Header */}
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="page-title">Laporan Kas & Keuangan</h1>
          <p className="page-subtitle">Kelola pencatatan arus kas operasional TPQ (Pemasukan & Pengeluaran)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            className="btn-primary" 
            style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} 
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} 
            onClick={handlePrint}
          >
            <Printer size={16} /> Cetak Kas
          </button>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }} 
            onClick={() => handleOpenCreate('pengeluaran')}
          >
            <ArrowDownCircle size={18} /> + Pengeluaran
          </button>
          <button className="btn-primary" onClick={() => handleOpenCreate('pemasukan')}>
            <ArrowUpCircle size={18} /> + Pemasukan
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid-4-cols mb-6 no-print">
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Total Pemasukan</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {formatRp(summary.totalPemasukan)}
          </div>
          <div className="stat-subtext">Kas Masuk Periode Ini</div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Total Pengeluaran</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>
            {formatRp(summary.totalPengeluaran)}
          </div>
          <div className="stat-subtext">Kas Keluar Periode Ini</div>
        </div>

        <div className="card stat-card" style={{ padding: '20px', backgroundColor: summary.saldoKas >= 0 ? '#f0fdf4' : '#fef2f2', border: summary.saldoKas >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
          <div className="stat-title">Sisa Saldo Kas</div>
          <div className="stat-value" style={{ color: summary.saldoKas >= 0 ? '#15803d' : '#b91c1c' }}>
            {formatRp(summary.saldoKas)}
          </div>
          <div className="stat-subtext">Saldo Kas Bersih</div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Volume Transaksi</div>
          <div className="stat-value" style={{ color: 'var(--color-primary-container)' }}>
            {summary.totalTransaksi}
          </div>
          <div className="stat-subtext">Transaksi Tercatat</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card w-full no-print">
        
        {/* Filter Controls Bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            
            {/* Toggle Bulanan vs Harian */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => setFilterMode('bulanan')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'bulanan' ? 'white' : 'transparent',
                  color: filterMode === 'bulanan' ? 'var(--color-primary-container)' : '#64748b',
                  boxShadow: filterMode === 'bulanan' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('harian')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'harian' ? 'white' : 'transparent',
                  color: filterMode === 'harian' ? 'var(--color-primary-container)' : '#64748b',
                  boxShadow: filterMode === 'harian' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Harian (Rentang)
              </button>
            </div>

            {filterMode === 'bulanan' ? (
              <>
                <div className="input-with-icon" style={{ minWidth: '150px' }}>
                  <Calendar className="icon" size={18} />
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }} 
                    value={filterBulan} 
                    onChange={(e) => setFilterBulan(Number(e.target.value))}
                  >
                    {monthNames.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="input-with-icon" style={{ width: '120px' }}>
                  <select 
                    className="input-field" 
                    value={filterTahun} 
                    onChange={(e) => setFilterTahun(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  value={filterDari} 
                  onChange={(e) => setFilterDari(e.target.value)} 
                />
                <span style={{ fontSize: '13px', color: '#64748b' }}>s/d</span>
                <input 
                  type="date" 
                  className="input-field" 
                  value={filterSampai} 
                  onChange={(e) => setFilterSampai(e.target.value)} 
                />
              </div>
            )}

            <div className="input-with-icon" style={{ minWidth: '160px' }}>
              <Filter className="icon" size={18} />
              <select 
                className="input-field" 
                style={{ paddingLeft: '40px' }} 
                value={filterTipe} 
                onChange={(e) => setFilterTipe(e.target.value)}
              >
                <option value="semua">Semua Transaksi</option>
                <option value="pemasukan">Hanya Pemasukan</option>
                <option value="pengeluaran">Hanya Pengeluaran</option>
              </select>
            </div>
          </div>

          <div className="input-with-icon" style={{ maxWidth: '280px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Cari transaksi / ket..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th style={{ width: '120px' }}>Tanggal</th>
                <th style={{ width: '130px' }}>Tipe</th>
                <th>Kategori Transaksi</th>
                <th>Keterangan / Rincian</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Nominal</th>
                <th style={{ width: '100px' }}>Metode</th>
                <th style={{ width: '140px' }}>PJ / Pencatat</th>
                <th className="text-center" style={{ width: '90px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center" style={{ padding: '40px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-primary-container)' }} />
                    <span style={{ color: '#64748b' }}>Memuat arus kas keuangan...</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>
                    Belum ada transaksi kas tercatat pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`badge ${item.tipe === 'pemasukan' ? 'badge-success' : ''}`} style={item.tipe !== 'pemasukan' ? { backgroundColor: '#fee2e2', color: '#991b1b' } : {}}>
                        {item.tipe === 'pemasukan' ? '+ Pemasukan' : '- Pengeluaran'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--color-primary-container)' }}>
                      {item.kategori}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {item.keterangan || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '15px', color: item.tipe === 'pemasukan' ? '#15803d' : '#b91c1c' }}>
                      {item.tipe === 'pemasukan' ? '+' : '-'}{formatRp(item.nominal)}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {item.metode || 'tunai'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {item.penanggung_jawab || '-'}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          style={{ border: 'none', background: 'transparent', color: '#ea580c', cursor: 'pointer', padding: '6px' }}
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Transaksi"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT / EDIT TRANSAKSI */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? 'Edit Transaksi Kas' : 'Catat Transaksi Keuangan Baru'}
              </h2>
              <X className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Tipe Selector Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipe: 'pemasukan', kategori: kategoriPemasukan[0] }))}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: form.tipe === 'pemasukan' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: form.tipe === 'pemasukan' ? '#f0fdf4' : 'white',
                      color: form.tipe === 'pemasukan' ? '#15803d' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ArrowUpCircle size={18} /> Pemasukan (Kas Masuk)
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipe: 'pengeluaran', kategori: kategoriPengeluaran[0] }))}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: form.tipe === 'pengeluaran' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: form.tipe === 'pengeluaran' ? '#fef2f2' : 'white',
                      color: form.tipe === 'pengeluaran' ? '#b91c1c' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ArrowDownCircle size={18} /> Pengeluaran (Kas Keluar)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tanggal Transaksi</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={form.tanggal} 
                      onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kategori Transaksi</label>
                    <select 
                      className="input-field"
                      value={form.kategori}
                      onChange={(e) => setForm(prev => ({ ...prev, kategori: e.target.value }))}
                    >
                      {(form.tipe === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Nominal (Rp) <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number" 
                      min="1"
                      className="input-field" 
                      style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}
                      placeholder="Contoh: 250000"
                      value={form.nominal} 
                      onChange={(e) => setForm(prev => ({ ...prev, nominal: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Metode</label>
                    <select 
                      className="input-field"
                      value={form.metode}
                      onChange={(e) => setForm(prev => ({ ...prev, metode: e.target.value }))}
                    >
                      <option value="tunai">Tunai / Cash</option>
                      <option value="transfer">Transfer Bank</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Penanggung Jawab / Pencatat</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Bendahara / Pengurus"
                      value={form.penanggung_jawab} 
                      onChange={(e) => setForm(prev => ({ ...prev, penanggung_jawab: e.target.value }))}
                    />
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Keterangan / Rincian</label>
                    <textarea 
                      rows={2} 
                      className="input-field" 
                      placeholder="Contoh: Honor ustadzah bulan Oktober, atau pembelian modul jilid 2"
                      value={form.keterangan} 
                      onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={form.tipe === 'pengeluaran' ? { backgroundColor: '#dc2626', borderColor: '#b91c1c' } : {}}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanKeuanganPage;
