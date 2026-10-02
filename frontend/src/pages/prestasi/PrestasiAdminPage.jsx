import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Search, Filter, Calendar, Printer, Download, Eye, 
  Trash2, Edit, Plus, BookOpen, CheckCircle2, User, Loader2, 
  Sparkles, RefreshCw, X, ChevronRight, Bookmark
} from 'lucide-react';
import { prestasiAPI, kelasAPI, santriAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const PrestasiAdminPage = () => {
  const [activeTab, setActiveTab] = useState('rekap'); // 'rekap' | 'riwayat'
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [santriList, setSantriList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filters for History
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');

  // Rapot Modal State
  const [rapotData, setRapotData] = useState(null);
  const [loadingRapot, setLoadingRapot] = useState(false);
  const [rapotPeriode, setRapotPeriode] = useState({
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear()
  });

  // Input Modal State (Admin can also input)
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputForm, setInputForm] = useState({
    santri_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Qiraati',
    jilid_surat: '',
    halaman_ayat: '',
    nilai: 'A (Sangat Lancar)',
    status: 'lancar',
    catatan: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'rekap') {
      loadSantriByKelas();
    } else {
      loadHistory();
    }
  }, [activeTab, selectedKelas, filterTanggal, filterKategori]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const kelas = await kelasAPI.getAll();
      setKelasList(kelas || []);
      if (kelas && kelas.length > 0) {
        setSelectedKelas(kelas[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSantriByKelas = async () => {
    if (!selectedKelas) return;
    setLoading(true);
    try {
      const data = await kelasAPI.getSantri(selectedKelas);
      setSantriList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedKelas) params.kelas_id = selectedKelas;
      if (filterTanggal) params.tanggal = filterTanggal;
      if (filterKategori !== 'semua') params.kategori = filterKategori;
      
      const data = await prestasiAPI.getAll(params);
      setHistoryList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRapot = async (santri) => {
    setLoadingRapot(true);
    try {
      const rapot = await prestasiAPI.getRapot(santri.id);
      setRapotData(rapot);
    } catch (e) {
      alert('Gagal memuat rapot: ' + e.message);
    } finally {
      setLoadingRapot(false);
    }
  };

  const handlePrintRapot = () => {
    window.print();
  };

  const handleSavePrestasi = async (e) => {
    e.preventDefault();
    if (!inputForm.santri_id) {
      alert('Silakan pilih santri');
      return;
    }
    if (!inputForm.jilid_surat.trim()) {
      alert('Materi / Jilid / Surat wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await prestasiAPI.create(inputForm);
      alert('Prestasi harian santri berhasil disimpan!');
      setShowInputModal(false);
      setInputForm({
        santri_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        kategori: 'Qiraati',
        jilid_surat: '',
        halaman_ayat: '',
        nilai: 'A (Sangat Lancar)',
        status: 'lancar',
        catatan: ''
      });
      if (activeTab === 'riwayat') loadHistory();
    } catch (e) {
      alert('Gagal menyimpan prestasi: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan prestasi ini?')) return;
    try {
      await prestasiAPI.delete(id);
      loadHistory();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
  };

  const filteredSantri = santriList.filter(s => {
    if (!search) return true;
    const str = search.toLowerCase();
    return (
      (s.nama_lengkap && s.nama_lengkap.toLowerCase().includes(str)) ||
      (s.nomor_induk && s.nomor_induk.toLowerCase().includes(str))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Prestasi & Rapot Santri</h1>
            <p className="text-xs text-slate-500">
              Rekapitulasi pencapaian harian, mutaba'ah mengaji, hafalan, dan cetak rapot santri
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInputModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus size={16} /> Input Prestasi Harian
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-4 pt-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('rekap')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rekap'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={16} /> Rapot & Rekapitulasi per Kelas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('riwayat')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'riwayat'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={16} /> Riwayat & Mutaba'ah Harian
        </button>
      </div>

      {/* TAB 1: REKAP & RAPOT PRESTASI */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-600">Pilih Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama santri atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Santri Table for Printing Rapot */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Santri — Siap Cetak Rapot
              </h3>
              <span className="text-xs text-slate-500">{filteredSantri.length} Santri Terdaftar</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">NIS</th>
                    <th className="py-3.5 px-4">Nama Lengkap Santri</th>
                    <th className="py-3.5 px-4">JK</th>
                    <th className="py-3.5 px-4">Wali Santri</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Cetak Rapot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                        Memuat data santri...
                      </td>
                    </tr>
                  ) : filteredSantri.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada santri di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    filteredSantri.map(santri => (
                      <tr key={santri.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                          {santri.nomor_induk}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {santri.nama_lengkap}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            santri.jenis_kelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {santri.jenis_kelamin === 'L' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {santri.nama_ayah || santri.nama_ibu || santri.nama_wali || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                            {santri.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenRapot(santri)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-all shadow-sm"
                          >
                            <Printer size={14} /> Cetak Rapot
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT PRESTASI HARIAN */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Kelas:</span>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Semua Kelas</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Kategori:</span>
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="semua">Semua Kategori</option>
                  <option value="Qiraati">Qiraati / Iqro</option>
                  <option value="Tahfidz">Tahfidz / Hafalan Surat</option>
                  <option value="Doa Harian">Doa Sehari-Hari</option>
                  <option value="Hadits">Hadits Pilihan</option>
                  <option value="Adab & Akhlak">Adab & Akhlak</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Tanggal:</span>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                {filterTanggal && (
                  <button 
                    onClick={() => setFilterTanggal('')}
                    className="text-xs text-rose-500 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Santri</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Capaian / Materi</th>
                    <th className="py-3.5 px-4">Nilai</th>
                    <th className="py-3.5 px-4">Catatan Ustadz</th>
                    <th className="py-3.5 px-4">Pencatat</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                        Memuat riwayat prestasi...
                      </td>
                    </tr>
                  ) : historyList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Belum ada catatan prestasi pada kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    historyList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.santri?.nama_lengkap || '-'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.santri?.nomor_induk}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {item.santri?.kelas?.nama_kelas || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.kategori === 'Tahfidz' ? 'bg-purple-100 text-purple-800' :
                            item.kategori === 'Qiraati' ? 'bg-emerald-100 text-emerald-800' :
                            item.kategori === 'Doa Harian' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.kategori}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.jilid_surat}</div>
                          {item.halaman_ayat && (
                            <div className="text-[11px] text-slate-500">{item.halaman_ayat}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'lancar' || (item.nilai && item.nilai.includes('A')) 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : item.status === 'ulang'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.nilai || item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.catatan}>
                          {item.catatan || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {item.guru?.nama_lengkap || 'Admin'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Catatan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RAPOT PRESTASI PRINT */}
      {rapotData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:max-w-none print:p-0">
            
            {/* Action Bar (Hidden on print) */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-emerald-700" />
                <h3 className="font-bold text-slate-800 text-sm">Pratinjau Rapot Prestasi Santri</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintRapot}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={15} /> Cetak / Print Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setRapotData(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* RAPOT SHEET CONTENT (PRINTABLE) */}
            <div className="printable-rapot space-y-6 text-slate-800 p-2">
              
              {/* Kop Lembaga */}
              <div className="text-center border-b-2 border-emerald-900 pb-4 mb-4">
                <div className="flex items-center justify-center gap-4 mb-1">
                  <img src="/assets/logoapp.png" alt="Logo" className="h-16 w-auto" />
                  <div>
                    <h2 className="text-xl font-bold font-serif uppercase tracking-wider text-emerald-950">
                      TPQ ANFAK AL AZIZAH
                    </h2>
                    <p className="text-xs text-slate-600">
                      Sistem Pendidikan Al-Qur'an Terpadu — Metode Qiraati
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Buku Rekapitulasi Prestasi & Mutaba'ah Harian Santri
                    </p>
                  </div>
                </div>
              </div>

              {/* Biodata Santri */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Lengkap</span>
                  <span className="font-bold text-sm text-emerald-950">{rapotData.santri.nama_lengkap}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Nomor Induk Santri (NIS)</span>
                  <span className="font-mono font-bold text-slate-800">{rapotData.santri.nomor_induk}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Kelas / Tingkat</span>
                  <span className="font-bold text-slate-800">{rapotData.santri.kelas?.nama_kelas || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Wali Kelas</span>
                  <span className="font-medium text-slate-800">{rapotData.santri.wali?.nama_lengkap || 'Ustadz / Ustadzah'}</span>
                </div>
              </div>

              {/* Ringkasan Capaian Terakhir */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-emerald-200 bg-emerald-50/60 p-4 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Capaian Qiraati Terakhir
                  </div>
                  <div className="text-lg font-bold text-emerald-950">
                    {rapotData.lastQiraati ? rapotData.lastQiraati.jilid_surat : 'Belum tercatat'}
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    {rapotData.lastQiraati?.halaman_ayat ? `Halaman / Ayat: ${rapotData.lastQiraati.halaman_ayat}` : ''}
                  </div>
                  {rapotData.lastQiraati && (
                    <div className="text-[10px] font-medium text-emerald-600 mt-1">
                      Nilai: {rapotData.lastQiraati.nilai || rapotData.lastQiraati.status} ({new Date(rapotData.lastQiraati.tanggal).toLocaleDateString('id-ID')})
                    </div>
                  )}
                </div>

                <div className="border border-purple-200 bg-purple-50/60 p-4 rounded-xl">
                  <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-1">
                    Capaian Tahfidz Terakhir
                  </div>
                  <div className="text-lg font-bold text-purple-950">
                    {rapotData.lastTahfidz ? rapotData.lastTahfidz.jilid_surat : 'Belum tercatat'}
                  </div>
                  <div className="text-xs text-purple-700 mt-0.5">
                    {rapotData.lastTahfidz?.halaman_ayat ? `Ayat: ${rapotData.lastTahfidz.halaman_ayat}` : ''}
                  </div>
                  {rapotData.lastTahfidz && (
                    <div className="text-[10px] font-medium text-purple-600 mt-1">
                      Nilai: {rapotData.lastTahfidz.nilai || rapotData.lastTahfidz.status} ({new Date(rapotData.lastTahfidz.tanggal).toLocaleDateString('id-ID')})
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Riwayat Capaian Santri */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Daftar Catatan Mutaba'ah & Prestasi Santri
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-[10px] uppercase">
                        <th className="p-2.5">Tanggal</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Materi / Jilid / Surat</th>
                        <th className="p-2.5">Hal / Ayat</th>
                        <th className="p-2.5">Nilai Kelancaran</th>
                        <th className="p-2.5">Catatan Ustadz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rapotData.allRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            Belum ada rekam prestasi untuk santri ini.
                          </td>
                        </tr>
                      ) : (
                        rapotData.allRecords.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 whitespace-nowrap text-slate-600">
                              {new Date(r.tanggal).toLocaleDateString('id-ID')}
                            </td>
                            <td className="p-2.5 font-semibold text-emerald-800">{r.kategori}</td>
                            <td className="p-2.5 font-medium text-slate-800">{r.jilid_surat}</td>
                            <td className="p-2.5 text-slate-600">{r.halaman_ayat || '-'}</td>
                            <td className="p-2.5">
                              <span className="font-semibold text-slate-800">{r.nilai || r.status}</span>
                            </td>
                            <td className="p-2.5 text-slate-600 italic">{r.catatan || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-8 grid grid-cols-3 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-16">Mengetahui,<br />Orang Tua / Wali Santri</p>
                  <p className="font-bold border-b border-slate-400 inline-block px-6 pb-1">
                    ( .................................... )
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 mb-16">Wali Kelas / Pengajar,</p>
                  <p className="font-bold border-b border-slate-400 inline-block px-6 pb-1">
                    ( {rapotData.santri.wali?.nama_lengkap || 'Ustadz / Ustadzah'} )
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 mb-16">
                    Madiun, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    Kepala TPQ Anfak Al Azizah
                  </p>
                  <p className="font-bold border-b border-slate-400 inline-block px-6 pb-1">
                    ( Kepala Lembaga TPQ )
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* INPUT PRESTASI MODAL */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-emerald-700" />
                <h3 className="font-bold text-slate-800 text-sm">Input Prestasi Harian Santri</h3>
              </div>
              <button 
                onClick={() => setShowInputModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePrestasi} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Input</label>
                  <input
                    type="date"
                    value={inputForm.tanggal}
                    onChange={(e) => setInputForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Prestasi</label>
                  <select
                    value={inputForm.kategori}
                    onChange={(e) => setInputForm(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Qiraati">Qiraati / Iqro</option>
                    <option value="Tahfidz">Tahfidz / Surat</option>
                    <option value="Doa Harian">Doa Sehari-Hari</option>
                    <option value="Hadits">Hadits Pilihan</option>
                    <option value="Praktik Ibadah">Praktik Ibadah / Sholat</option>
                    <option value="Adab & Akhlak">Adab & Akhlak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Santri <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inputForm.santri_id}
                  onChange={(e) => setInputForm(prev => ({ ...prev, santri_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nomor_induk} - {s.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Materi / Jilid / Surat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jilid 2 / Surat Al-Ikhlas"
                    value={inputForm.jilid_surat}
                    onChange={(e) => setInputForm(prev => ({ ...prev, jilid_surat: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Halaman / Ayat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Hal 12 / Ayat 1-4"
                    value={inputForm.halaman_ayat}
                    onChange={(e) => setInputForm(prev => ({ ...prev, halaman_ayat: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nilai</label>
                  <select
                    value={inputForm.nilai}
                    onChange={(e) => setInputForm(prev => ({ ...prev, nilai: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="A (Sangat Lancar)">A (Sangat Lancar / Mumtaz)</option>
                    <option value="B (Lancar)">B (Lancar / Jayyid)</option>
                    <option value="C (Cukup Lancar)">C (Cukup / Maqbul)</option>
                    <option value="D (Mengulang)">D (Mengulang / Rasib)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Progres</label>
                  <select
                    value={inputForm.status}
                    onChange={(e) => setInputForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold"
                  >
                    <option value="lanjut">Lanjut ke Halaman/Surat Berikutnya</option>
                    <option value="lancar">Lancar</option>
                    <option value="ulang">Ulang Materi Ini</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Evaluasi Ustadz</label>
                <textarea
                  rows={2}
                  placeholder="Catatan makhraj, tajwid, adab, atau motivasi belajar"
                  value={inputForm.catatan}
                  onChange={(e) => setInputForm(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInputModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {submitting ? 'Menyimpan...' : 'Simpan Prestasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrestasiAdminPage;
