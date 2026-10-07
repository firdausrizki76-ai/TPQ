import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, 
  Plus, Search, Filter, Printer, Download, Trash2, Edit, 
  CheckCircle2, AlertCircle, RefreshCw, X, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Loader2, ArrowUpCircle, ArrowDownCircle, Tag, Check
} from 'lucide-react';
import { transaksiKeuanganAPI, pengaturanAPI } from '../../services/api';
import * as XLSX from 'xlsx';
import '../dashboard/Dashboard.css';

const LaporanKeuanganPage = () => {
  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    totalSyahriah: 0,
    saldoKas: 0,
    totalTransaksi: 0,
    saldoReal: 0,
    rekapKeseluruhan: {
      totalPemasukan: 0,
      totalPengeluaran: 0,
      totalSyahriah: 0,
      kasMasukManual: 0,
      saldoReal: 0,
      totalTransaksi: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMode, setFilterMode] = useState('bulanan'); // 'bulanan' | 'harian' | 'semua'
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterDari, setFilterDari] = useState('');
  const [filterSampai, setFilterSampai] = useState('');
  const [filterTipe, setFilterTipe] = useState('semua');
  const [search, setSearch] = useState('');
  const [includeSyahriah, setIncludeSyahriah] = useState(true);

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

  // Dynamic Categories State
  const [kategoriPemasukan, setKategoriPemasukan] = useState([
    'Infaq / Shodaqoh',
    'Donasi Donatur',
    'Biaya Pendaftaran Santri',
    'Bantuan Operasional (BOP)',
    'Penjualan Buku / Seragam',
    'Syahriah Santri',
    'Lain-lain'
  ]);

  const [kategoriPengeluaran, setKategoriPengeluaran] = useState([
    'Honor / Gaji Guru & Ustadz',
    'ATK, Modul & Cetak',
    'Operasional Listrik, Air & Wi-Fi',
    'Konsumsi Santri & Guru',
    'Perawatan & Sarana Gedung',
    'Kegiatan & Acara TPQ',
    'Lain-lain'
  ]);

  // Category Modal State
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [activeKategoriTab, setActiveKategoriTab] = useState('pemasukan'); // 'pemasukan' | 'pengeluaran'
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    loadKategori();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterMode, filterBulan, filterTahun, filterDari, filterSampai, filterTipe, includeSyahriah]);

  const loadKategori = async () => {
    try {
      const settings = await pengaturanAPI.get();
      if (settings?.kategori_kas_masuk) {
        try {
          const parsed = JSON.parse(settings.kategori_kas_masuk);
          if (Array.isArray(parsed) && parsed.length > 0) setKategoriPemasukan(parsed);
        } catch (_) {}
      }
      if (settings?.kategori_kas_keluar) {
        try {
          const parsed = JSON.parse(settings.kategori_kas_keluar);
          if (Array.isArray(parsed) && parsed.length > 0) setKategoriPengeluaran(parsed);
        } catch (_) {}
      }
    } catch (e) {
      console.error('Gagal memuat kategori kas:', e);
    }
  };

  const handleSaveCategories = async (tipe, newList) => {
    setSavingCategory(true);
    try {
      if (tipe === 'pemasukan') {
        await pengaturanAPI.save({ kategori_kas_masuk: JSON.stringify(newList) });
        setKategoriPemasukan(newList);
      } else {
        await pengaturanAPI.save({ kategori_kas_keluar: JSON.stringify(newList) });
        setKategoriPengeluaran(newList);
      }
      return true;
    } catch (e) {
      alert('Gagal menyimpan kategori: ' + e.message);
      return false;
    } finally {
      setSavingCategory(false);
    }
  };

  const handleAddKategori = async (e) => {
    e.preventDefault();
    const val = newCatInput.trim();
    if (!val) return;
    const currentList = activeKategoriTab === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran;
    if (currentList.some(c => c.toLowerCase() === val.toLowerCase())) {
      alert('Kategori tersebut sudah ada.');
      return;
    }
    const updated = [...currentList, val];
    const ok = await handleSaveCategories(activeKategoriTab, updated);
    if (ok) setNewCatInput('');
  };

  const handleStartEditCat = (index, val) => {
    setEditingCatIndex(index);
    setEditingCatValue(val);
  };

  const handleSaveEditCat = async (index) => {
    const val = editingCatValue.trim();
    if (!val) {
      alert('Nama kategori tidak boleh kosong.');
      return;
    }
    const currentList = activeKategoriTab === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran;
    const oldVal = currentList[index];
    if (val === oldVal) {
      setEditingCatIndex(null);
      return;
    }
    if (currentList.some((c, i) => i !== index && c.toLowerCase() === val.toLowerCase())) {
      alert('Kategori dengan nama tersebut sudah ada.');
      return;
    }
    const updated = [...currentList];
    updated[index] = val;
    const ok = await handleSaveCategories(activeKategoriTab, updated);
    if (ok) {
      setEditingCatIndex(null);
      setEditingCatValue('');
      if (form.kategori === oldVal) {
        setForm(prev => ({ ...prev, kategori: val }));
      }
    }
  };

  const handleDeleteCat = async (catToDelete) => {
    const currentList = activeKategoriTab === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran;
    if (currentList.length <= 1) {
      alert('Minimal harus ada 1 kategori tersisa.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus kategori "${catToDelete}"?`)) return;
    const updated = currentList.filter(c => c !== catToDelete);
    const ok = await handleSaveCategories(activeKategoriTab, updated);
    if (ok && form.kategori === catToDelete) {
      setForm(prev => ({ ...prev, kategori: updated[0] }));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTipe !== 'semua') params.tipe = filterTipe;
      params.include_syahriah = includeSyahriah ? 'true' : 'false';
      params.mode = filterMode;
      
      if (filterMode === 'harian') {
        if (filterDari) params.dari = filterDari;
        if (filterSampai) params.sampai = filterSampai;
      } else if (filterMode === 'bulanan') {
        if (filterBulan) params.bulan = filterBulan;
        if (filterTahun) params.tahun = filterTahun;
      }

      const res = await transaksiKeuanganAPI.getAll(params);
      setDataList(res?.items || []);
      setSummary({
        totalPemasukan: res?.totalPemasukan || 0,
        totalPengeluaran: res?.totalPengeluaran || 0,
        totalSyahriah: res?.totalSyahriah || 0,
        saldoKas: res?.saldoKas || 0,
        totalTransaksi: res?.totalTransaksi || 0,
        saldoReal: res?.saldoReal !== undefined ? res.saldoReal : (res?.rekapKeseluruhan?.saldoReal || 0),
        rekapKeseluruhan: res?.rekapKeseluruhan || {
          totalPemasukan: 0,
          totalPengeluaran: 0,
          totalSyahriah: 0,
          kasMasukManual: 0,
          saldoReal: 0,
          totalTransaksi: 0
        }
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
    const periodeText = filterMode === 'bulanan'
      ? `${monthNames[filterBulan - 1]} ${filterTahun}`
      : filterMode === 'harian'
        ? `${filterDari || 'Awal'} s/d ${filterSampai || 'Akhir'}`
        : 'Semua Waktu (Keseluruhan)';

    const meta = [
      { 'No': 'LAPORAN BUKU KAS & KEUANGAN TPQ ANFAK AL AZIZIAH' },
      { 'No': `Periode Laporan: ${periodeText}` },
      { 'No': `Waktu Unduh: ${new Date().toLocaleDateString('id-ID')}` },
      { 'No': '--- REKAPITULASI KAS KESELURUHAN (SALDO REAL SAAT INI) ---' },
      { 'No': 'Saldo Kas Riil Saat Ini', 'Tanggal': formatRp(summary.rekapKeseluruhan?.saldoReal ?? summary.saldoReal) },
      { 'No': 'Total Pemasukan Akumulatif', 'Tanggal': formatRp(summary.rekapKeseluruhan?.totalPemasukan) },
      { 'No': 'Total Pengeluaran Akumulatif', 'Tanggal': formatRp(summary.rekapKeseluruhan?.totalPengeluaran) },
      { 'No': '--- MUTASI ARUS KAS PERIODE INI ---' },
      { 'No': 'Pemasukan Periode Ini', 'Tanggal': formatRp(summary.totalPemasukan) },
      { 'No': 'Pengeluaran Periode Ini', 'Tanggal': formatRp(summary.totalPengeluaran) },
      { 'No': 'Surplus / Defisit Periode Ini', 'Tanggal': formatRp(summary.saldoKas) },
      { 'No': '' }
    ];

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

    const ws = XLSX.utils.json_to_sheet([...meta, ...formatted]);
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
            Periode: {filterMode === 'bulanan' ? `${monthNames[filterBulan - 1]} ${filterTahun}` : filterMode === 'harian' ? `${filterDari || 'Awal'} s/d ${filterSampai || 'Akhir'}` : 'Semua Waktu (Keseluruhan)'}
          </p>
        </div>

        {/* REKAPITULASI KESELURUHAN (SALDO REAL KAS TPQ) */}
        <div style={{ border: '2px solid #064e3b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', backgroundColor: '#f0fdf4' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center', borderBottom: '1px solid #bbf7d0', paddingBottom: '4px' }}>
            REKAPITULASI KAS KESELURUHAN (SALDO REAL KAS TPQ)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>TOTAL PEMASUKAN AKUMULATIF</span>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803d' }}>
                {formatRp(summary.rekapKeseluruhan?.totalPemasukan)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold' }}>TOTAL PENGELUARAN AKUMULATIF</span>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#b91c1c' }}>
                {formatRp(summary.rekapKeseluruhan?.totalPengeluaran)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#064e3b', fontWeight: 'bold' }}>⭐ SALDO REAL KAS SAAT INI</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#047857' }}>
                {formatRp(summary.rekapKeseluruhan?.saldoReal ?? summary.saldoReal)}
              </div>
            </div>
          </div>
        </div>

        {filterMode !== 'semua' && (
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>
              MUTASI ARUS KAS PERIODE INI ({filterMode === 'bulanan' ? `${monthNames[filterBulan - 1]} ${filterTahun}` : `${filterDari || 'Awal'} s/d ${filterSampai || 'Akhir'}`})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }}>PEMASUKAN PERIODE</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15803d' }}>{formatRp(summary.totalPemasukan)}</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold' }}>PENGELUARAN PERIODE</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b91c1c' }}>{formatRp(summary.totalPengeluaran)}</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 'bold' }}>SURPLUS / DEFISIT PERIODE</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: summary.saldoKas >= 0 ? '#15803d' : '#b91c1c' }}>{formatRp(summary.saldoKas)}</div>
              </div>
            </div>
          </div>
        )}

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
            onClick={() => setShowKategoriModal(true)}
          >
            <Tag size={16} /> Kelola Kategori
          </button>
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

      {/* REKAPITULASI KAS KESELURUHAN (SALDO REAL KAS TPQ) */}
      <div 
        className="card mb-6 no-print" 
        style={{ 
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)', 
          color: 'white', 
          padding: '24px', 
          borderRadius: '16px', 
          boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.3)',
          border: 'none',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={26} color="#fef08a" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.3px', color: '#ffffff' }}>
                  Rekapitulasi Keuangan Keseluruhan
                </h2>
                <span style={{ 
                  backgroundColor: '#fef08a', 
                  color: '#854d0e', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  padding: '2px 8px', 
                  borderRadius: '12px' 
                }}>
                  Semua Waktu
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                Akumulasi seluruh arus kas fisik & bank TPQ Anfak Al Aziziah sejak awal pencatatan
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              backgroundColor: 'rgba(255,255,255,0.18)', 
              backdropFilter: 'blur(4px)', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255,255,255,0.25)'
            }}>
              <CheckCircle2 size={14} color="#86efac" /> Saldo Real Kas Aktif
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Saldo Real Card */}
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.14)', 
            backdropFilter: 'blur(8px)',
            padding: '16px 20px', 
            borderRadius: '12px', 
            border: '2px solid rgba(254, 240, 138, 0.6)' 
          }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fef08a', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={15} /> ⭐ SALDO KAS RIIL (SAAT INI)
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {formatRp(summary.rekapKeseluruhan?.saldoReal ?? summary.saldoReal)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Sisa kas bersih nyata yang dimiliki TPQ
            </div>
          </div>

          {/* Total Pemasukan Keseluruhan */}
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.08)', 
            padding: '16px 20px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.15)' 
          }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#86efac', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={15} /> Total Semua Pemasukan
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>
              {formatRp(summary.rekapKeseluruhan?.totalPemasukan)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Kas Masuk: {formatRp(summary.rekapKeseluruhan?.kasMasukManual)} + Syahriah: {formatRp(summary.rekapKeseluruhan?.totalSyahriah)}
            </div>
          </div>

          {/* Total Pengeluaran Keseluruhan */}
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.08)', 
            padding: '16px 20px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.15)' 
          }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fca5a5', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowDownRight size={15} /> Total Semua Pengeluaran
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>
              {formatRp(summary.rekapKeseluruhan?.totalPengeluaran)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Seluruh biaya operasional yang dikeluarkan
            </div>
          </div>

          {/* Total Transaksi Keseluruhan */}
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.08)', 
            padding: '16px 20px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.15)' 
          }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e2e8f0', fontWeight: 'bold', marginBottom: '6px' }}>
              Total Transaksi Riil
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>
              {summary.rekapKeseluruhan?.totalTransaksi || summary.totalTransaksi} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>transaksi</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Histori pemasukan kas & pembayaran lunas
            </div>
          </div>
        </div>
      </div>

      {/* Mutasi Periode Terpilih (Jika Memfilter Bulanan atau Harian) */}
      {filterMode !== 'semua' && (
        <div className="mb-6 no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-primary-container)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Mutasi Arus Kas Periode Ini: <span style={{ color: 'var(--color-gold)', textDecoration: 'underline' }}>{filterMode === 'bulanan' ? `${monthNames[filterBulan - 1]} ${filterTahun}` : `${filterDari || 'Awal'} s/d ${filterSampai || 'Akhir'}`}</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {summary.totalTransaksi} transaksi pada periode ini
            </span>
          </div>

          <div className="grid-4-cols">
            <div className="card stat-card" style={{ padding: '18px' }}>
              <div className="stat-title">Pemasukan Periode Ini</div>
              <div className="stat-value" style={{ color: '#16a34a' }}>
                {formatRp(summary.totalPemasukan)}
              </div>
              <div className="stat-subtext">
                Kas Masuk Periode Ini
                {summary.totalSyahriah > 0 && (
                  <span style={{ display: 'block', color: '#15803d', fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>
                    (Syahriah: {formatRp(summary.totalSyahriah)})
                  </span>
                )}
              </div>
            </div>

            <div className="card stat-card" style={{ padding: '18px' }}>
              <div className="stat-title">Pengeluaran Periode Ini</div>
              <div className="stat-value" style={{ color: '#dc2626' }}>
                {formatRp(summary.totalPengeluaran)}
              </div>
              <div className="stat-subtext">Biaya Operasional Periode Ini</div>
            </div>

            <div className="card stat-card" style={{ padding: '18px', backgroundColor: summary.saldoKas >= 0 ? '#f0fdf4' : '#fef2f2', border: summary.saldoKas >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
              <div className="stat-title">Surplus / Defisit Periode Ini</div>
              <div className="stat-value" style={{ color: summary.saldoKas >= 0 ? '#15803d' : '#b91c1c' }}>
                {formatRp(summary.saldoKas)}
              </div>
              <div className="stat-subtext">Selisih Masuk - Keluar Periode Ini</div>
            </div>

            <div className="card stat-card" style={{ padding: '18px' }}>
              <div className="stat-title">Volume Periode Ini</div>
              <div className="stat-value" style={{ color: 'var(--color-primary-container)' }}>
                {summary.totalTransaksi}
              </div>
              <div className="stat-subtext">Transaksi Periode Ini</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card w-full no-print">
        
        {/* Filter Controls Bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            
            {/* Toggle Bulanan vs Harian vs Semua Waktu */}
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
              <button
                type="button"
                onClick={() => setFilterMode('semua')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'semua' ? 'white' : 'transparent',
                  color: filterMode === 'semua' ? 'var(--color-primary-container)' : '#64748b',
                  boxShadow: filterMode === 'semua' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Semua Waktu
              </button>
            </div>

            {filterMode === 'bulanan' && (
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
            )}

            {filterMode === 'harian' && (
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

            {filterMode === 'semua' && (
              <div style={{ fontSize: '12px', color: '#047857', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '8px 14px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                Menampilkan Seluruh Riwayat Kas (Semua Waktu)
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

            {/* Toggle Sinkronisasi Syahriah */}
            <label style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: includeSyahriah ? '#15803d' : '#64748b', 
              cursor: 'pointer', 
              padding: '8px 12px', 
              backgroundColor: includeSyahriah ? '#f0fdf4' : '#f8fafc', 
              border: includeSyahriah ? '1px solid #86efac' : '1px solid #cbd5e1', 
              borderRadius: '10px',
              userSelect: 'none'
            }}>
              <input 
                type="checkbox" 
                checked={includeSyahriah} 
                onChange={(e) => setIncludeSyahriah(e.target.checked)} 
              />
              Sinkronkan Pembayaran Syahriah
            </label>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{item.kategori}</span>
                        {item.is_syahriah && (
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            Auto Sync
                          </span>
                        )}
                      </div>
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
                      {item.is_syahriah ? (
                        <span style={{ fontSize: '11px', color: '#059669', fontStyle: 'italic', fontWeight: 'bold' }}>
                          Sinkron Syahriah
                        </span>
                      ) : (
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
                      )}
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
      {/* MODAL KELOLA KATEGORI KAS */}
      {showKategoriModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Kelola Kategori Kas</h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Tambah, ubah nama, atau hapus kategori kas TPQ
                </span>
              </div>
              <X className="modal-close" onClick={() => { setShowKategoriModal(false); setEditingCatIndex(null); }} />
            </div>

            <div className="modal-body">
              {/* Tab Selector Pemasukan vs Pengeluaran */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveKategoriTab('pemasukan'); setEditingCatIndex(null); }}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: activeKategoriTab === 'pemasukan' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: activeKategoriTab === 'pemasukan' ? '#f0fdf4' : 'white',
                    color: activeKategoriTab === 'pemasukan' ? '#15803d' : '#64748b',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Kategori Pemasukan ({kategoriPemasukan.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveKategoriTab('pengeluaran'); setEditingCatIndex(null); }}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: activeKategoriTab === 'pengeluaran' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    backgroundColor: activeKategoriTab === 'pengeluaran' ? '#fef2f2' : 'white',
                    color: activeKategoriTab === 'pengeluaran' ? '#b91c1c' : '#64748b',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Kategori Pengeluaran ({kategoriPengeluaran.length})
                </button>
              </div>

              {/* Form Tambah Kategori */}
              <form onSubmit={handleAddKategori} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={`Nama kategori ${activeKategoriTab} baru...`} 
                  value={newCatInput} 
                  onChange={(e) => setNewCatInput(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingCategory || !newCatInput.trim()}
                  style={activeKategoriTab === 'pengeluaran' ? { backgroundColor: '#dc2626', borderColor: '#b91c1c', flexShrink: 0 } : { flexShrink: 0 }}
                >
                  {savingCategory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Tambah
                </button>
              </form>

              {/* List Kategori Table */}
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', width: '40px' }}>No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama Kategori</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeKategoriTab === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran).map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {editingCatIndex === idx ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input 
                                type="text" 
                                className="input-field" 
                                value={editingCatValue} 
                                onChange={(e) => setEditingCatValue(e.target.value)}
                                autoFocus
                                style={{ padding: '4px 8px', fontSize: '13px' }}
                              />
                              <button 
                                type="button" 
                                className="btn-primary" 
                                style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#059669' }}
                                onClick={() => handleSaveEditCat(idx)}
                                title="Simpan Nama"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                type="button" 
                                style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                onClick={() => setEditingCatIndex(null)}
                                title="Batal"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{cat}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {editingCatIndex !== idx && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button 
                                type="button" 
                                style={{ border: 'none', background: 'transparent', color: '#0284c7', cursor: 'pointer', padding: '6px' }}
                                onClick={() => handleStartEditCat(idx, cat)}
                                title="Edit Nama Kategori"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                type="button" 
                                style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                                onClick={() => handleDeleteCat(cat)}
                                title="Hapus Kategori"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-primary" 
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                onClick={() => { setShowKategoriModal(false); setEditingCatIndex(null); }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanKeuanganPage;
