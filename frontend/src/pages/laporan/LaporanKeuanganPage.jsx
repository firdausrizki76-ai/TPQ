import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, 
  Plus, Search, Filter, Printer, Download, Trash2, Edit, 
  CheckCircle2, AlertCircle, RefreshCw, X, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Loader2
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
      'Tipe': d.tipe.toUpperCase(),
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
    XLSX.writeFile(wb, `Laporan_Keuangan_TPQ_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <DollarSign size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Laporan Kas & Keuangan</h1>
            <p className="text-xs text-slate-500">
              Pencatatan arus kas operasional TPQ (Pemasukan & Pengeluaran)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCreate('pemasukan')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={16} /> + Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('pengeluaran')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={16} /> + Pengeluaran
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <Printer size={15} /> Cetak
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-emerald-700 text-xs font-semibold"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pemasukan */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Total Pemasukan
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              {formatRp(summary.totalPemasukan)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Kas Masuk Periode Ini
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
              Total Pengeluaran
            </span>
            <div className="text-2xl font-black text-rose-800 mt-1">
              {formatRp(summary.totalPengeluaran)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Kas Keluar Periode Ini
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight size={24} />
          </div>
        </div>

        {/* Sisa Saldo Kas */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-amber-50/40">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              Sisa Saldo Kas Bersih
            </span>
            <div className={`text-2xl font-black mt-1 ${summary.saldoKas >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
              {formatRp(summary.saldoKas)}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {summary.totalTransaksi} Transaksi Tercatat
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Toggle Mode: Bulanan vs Harian */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              type="button"
              onClick={() => setFilterMode('bulanan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'bulanan' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('harian')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'harian' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Harian (Rentang)
            </button>
          </div>

          {filterMode === 'bulanan' ? (
            <div className="flex items-center gap-2">
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>

              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={filterDari}
                onChange={(e) => setFilterDari(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={filterSampai}
                onChange={(e) => setFilterSampai(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          )}

          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="semua">Semua Tipe</option>
            <option value="pemasukan">Hanya Pemasukan</option>
            <option value="pengeluaran">Hanya Pengeluaran</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi / keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4">Penanggung Jawab</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data transaksi kas...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada transaksi kas pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.tipe === 'pemasukan' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowUpRight size={12} /> Pemasukan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ArrowDownRight size={12} /> Pengeluaran
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.kategori}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.keterangan}>
                      {item.keterangan || '-'}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                      item.tipe === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {item.tipe === 'pemasukan' ? '+' : '-'}{formatRp(item.nominal)}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">
                      {item.metode || 'Tunai'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.penanggung_jawab || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? 'Edit Transaksi Kas' : 'Catat Transaksi Keuangan Baru'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Toggle Tipe */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ 
                        ...prev, 
                        tipe: 'pemasukan', 
                        kategori: kategoriPemasukan[0] 
                      }));
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      form.tipe === 'pemasukan' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowUpRight size={16} /> Kas Masuk
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ 
                        ...prev, 
                        tipe: 'pengeluaran', 
                        kategori: kategoriPengeluaran[0] 
                      }));
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      form.tipe === 'pengeluaran' 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowDownRight size={16} /> Kas Keluar
                  </button>
                </div>
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold"
                  >
                    {(form.tipe === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 150000"
                    value={form.nominal}
                    onChange={(e) => setForm(prev => ({ ...prev, nominal: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Metode & Penanggung Jawab */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={form.metode}
                    onChange={(e) => setForm(prev => ({ ...prev, metode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="tunai">Tunai / Cash</option>
                    <option value="transfer">Transfer Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab</label>
                  <input
                    type="text"
                    placeholder="Nama Pencatat / Bendahara"
                    value={form.penanggung_jawab}
                    onChange={(e) => setForm(prev => ({ ...prev, penanggung_jawab: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Rincian</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pembelian spidol, modul Qiraati jilid 1-3 sebanyak 10 paket"
                  value={form.keterangan}
                  onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md ${
                    form.tipe === 'pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
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
