import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Filter, Calendar, Printer, Download, Eye, 
  Trash2, Edit, Plus, BookOpen, CheckCircle2, User, Loader2, 
  Sparkles, RefreshCw, X, ChevronRight, Bookmark, Check, Tag
} from 'lucide-react';
import { prestasiAPI, kelasAPI, pengaturanAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const PrestasiAdminPage = () => {
  const [activeTab, setActiveTab] = useState('rekap'); // 'rekap' | 'riwayat'
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [santriList, setSantriList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Category Management State
  const [kategoriList, setKategoriList] = useState([
    'Qiraati', 'Tahfidz', 'Tahsin', 'Doa Harian', 'Hadits', 'Praktik Ibadah', 'Adab & Akhlak'
  ]);
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Filters for History
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');

  // Rapot Modal State
  const [rapotData, setRapotData] = useState(null);
  const [loadingRapot, setLoadingRapot] = useState(false);

  // Input Modal State
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
    loadKategori();
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

  const loadKategori = async () => {
    try {
      const settings = await pengaturanAPI.get();
      if (settings?.kategori_prestasi) {
        try {
          const parsed = JSON.parse(settings.kategori_prestasi);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setKategoriList(parsed);
          }
        } catch (_) {}
      }
    } catch (e) {
      console.error('Gagal memuat kategori prestasi:', e);
    }
  };

  const handleSaveKategoriList = async (newList) => {
    setSavingCat(true);
    try {
      await pengaturanAPI.save({ kategori_prestasi: JSON.stringify(newList) });
      setKategoriList(newList);
      return true;
    } catch (e) {
      alert('Gagal menyimpan kategori: ' + e.message);
      return false;
    } finally {
      setSavingCat(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const val = newCatInput.trim();
    if (!val) return;
    if (kategoriList.some(c => c.toLowerCase() === val.toLowerCase())) {
      alert('Kategori dengan nama tersebut sudah ada.');
      return;
    }
    const updated = [...kategoriList, val];
    const success = await handleSaveKategoriList(updated);
    if (success) setNewCatInput('');
  };

  const handleStartEdit = (index, val) => {
    setEditingCatIndex(index);
    setEditingCatValue(val);
  };

  const handleSaveEdit = async (index) => {
    const val = editingCatValue.trim();
    if (!val) {
      alert('Nama kategori tidak boleh kosong.');
      return;
    }
    const oldVal = kategoriList[index];
    if (val === oldVal) {
      setEditingCatIndex(null);
      return;
    }
    if (kategoriList.some((c, i) => i !== index && c.toLowerCase() === val.toLowerCase())) {
      alert('Kategori dengan nama tersebut sudah ada.');
      return;
    }
    const updated = [...kategoriList];
    updated[index] = val;
    const success = await handleSaveKategoriList(updated);
    if (success) {
      setEditingCatIndex(null);
      setEditingCatValue('');
      if (inputForm.kategori === oldVal) {
        setInputForm(prev => ({ ...prev, kategori: val }));
      }
    }
  };

  const handleDeleteCategory = async (catToDelete) => {
    if (kategoriList.length <= 1) {
      alert('Minimal harus ada 1 kategori tersisa.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus kategori "${catToDelete}"?`)) return;
    const updated = kategoriList.filter(c => c !== catToDelete);
    const success = await handleSaveKategoriList(updated);
    if (success && inputForm.kategori === catToDelete) {
      setInputForm(prev => ({ ...prev, kategori: updated[0] }));
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
    <div className="flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="page-title">Prestasi & Rapot Santri</h1>
          <p className="page-subtitle">Rekapitulasi pencapaian harian, mutaba'ah mengaji, hafalan, dan cetak rapot santri</p>
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
            onClick={() => { if (activeTab === 'rekap') loadSantriByKelas(); else loadHistory(); }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowInputModal(true)}>
            <Plus size={18} /> Input Prestasi Harian
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid-4-cols mb-6 no-print">
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Kelas Dipilih</div>
          <div className="stat-value" style={{ color: 'var(--color-primary-container)' }}>
            {kelasList.find(k => k.id === selectedKelas)?.nama_kelas || '-'}
          </div>
          <div className="stat-subtext">{santriList.length} Santri Terdaftar</div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Riwayat Tercatat</div>
          <div className="stat-value" style={{ color: 'var(--color-gold)' }}>
            {historyList.length}
          </div>
          <div className="stat-subtext">Catatan Mutaba'ah</div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Metode Utama</div>
          <div className="stat-value" style={{ color: '#059669', fontSize: '22px' }}>
            Qiraati
          </div>
          <div className="stat-subtext">Pra-Qiraati s/d Jilid 6</div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-title">Format Rapot</div>
          <div className="stat-value" style={{ color: '#0284c7', fontSize: '22px' }}>
            Resmi TPQ
          </div>
          <div className="stat-subtext">Siap Cetak PDF/Print</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }} className="no-print">
        {[
          { id: 'rekap', label: 'Rapot & Rekapitulasi per Kelas', icon: <BookOpen size={16} /> },
          { id: 'riwayat', label: 'Riwayat & Mutaba\'ah Harian', icon: <Calendar size={16} /> }
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
                border: isActive ? '1px solid var(--color-primary-container)' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#f0fdf4' : 'white', 
                color: isActive ? 'var(--color-primary-container)' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 8px rgba(6, 78, 59, 0.08)' : 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: REKAP & RAPOT PRESTASI */}
      {activeTab === 'rekap' && (
        <div className="card w-full no-print">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              <div className="input-with-icon" style={{ minWidth: '220px' }}>
                <BookOpen className="icon" size={18} />
                <select 
                  className="input-field" 
                  style={{ paddingLeft: '40px', fontWeight: 'bold' }} 
                  value={selectedKelas} 
                  onChange={(e) => setSelectedKelas(e.target.value)}
                >
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
                <Search className="icon" size={18} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Cari nama santri atau NIS..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Menampilkan {filteredSantri.length} Santri
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th style={{ width: '120px' }}>NIS</th>
                  <th>Nama Lengkap Santri</th>
                  <th style={{ width: '60px' }}>JK</th>
                  <th>Nama Wali Santri</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th className="text-center" style={{ width: '160px' }}>Cetak Rapot</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '40px' }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-primary-container)' }} />
                      <span style={{ color: '#64748b' }}>Memuat data santri...</span>
                    </td>
                  </tr>
                ) : filteredSantri.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>
                      Tidak ada santri di kelas ini.
                    </td>
                  </tr>
                ) : (
                  filteredSantri.map((santri, index) => (
                    <tr key={santri.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary-container)' }}>
                        {santri.nomor_induk}
                      </td>
                      <td className="font-medium" style={{ fontSize: '14px' }}>
                        {santri.nama_lengkap}
                      </td>
                      <td>
                        <span className={`badge ${santri.jenis_kelamin === 'L' ? 'badge-info' : ''}`} style={santri.jenis_kelamin !== 'L' ? { backgroundColor: '#fce7f3', color: '#9d174d' } : {}}>
                          {santri.jenis_kelamin || 'L'}
                        </span>
                      </td>
                      <td>{santri.nama_wali || santri.nama_ayah || santri.nama_ibu || '-'}</td>
                      <td>
                        <span className="badge badge-success">
                          {santri.status || 'aktif'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          className="btn-primary" 
                          style={{ 
                            padding: '6px 14px', 
                            fontSize: '12px', 
                            backgroundColor: '#fffbeb', 
                            color: '#b45309', 
                            border: '1px solid #fde68a',
                            borderBottom: '2px solid #d97706'
                          }} 
                          onClick={() => handleOpenRapot(santri)}
                        >
                          <Printer size={15} /> Cetak Rapot
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT & MUTABA'AH HARIAN */}
      {activeTab === 'riwayat' && (
        <div className="card w-full no-print">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="input-with-icon">
                <BookOpen className="icon" size={18} />
                <select 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }} 
                  value={selectedKelas} 
                  onChange={(e) => setSelectedKelas(e.target.value)}
                >
                  <option value="">Semua Kelas</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div className="input-with-icon">
                <Filter className="icon" size={18} />
                <select 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }} 
                  value={filterKategori} 
                  onChange={(e) => setFilterKategori(e.target.value)}
                >
                  <option value="semua">Semua Kategori</option>
                  {kategoriList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="input-with-icon">
                <Calendar className="icon" size={18} />
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }} 
                  value={filterTanggal} 
                  onChange={(e) => setFilterTanggal(e.target.value)} 
                />
              </div>

              {filterTanggal && (
                <button 
                  style={{ border: 'none', background: 'transparent', color: '#e11d48', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => setFilterTanggal('')}
                >
                  Reset Tanggal
                </button>
              )}
            </div>

            <button 
              className="btn-primary" 
              style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }} 
              onClick={loadHistory}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Segarkan
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Tanggal</th>
                  <th>Nama Santri</th>
                  <th>Kelas</th>
                  <th>Kategori</th>
                  <th>Materi / Jilid / Surat</th>
                  <th>Hal / Ayat</th>
                  <th>Nilai</th>
                  <th>Catatan Ustadz</th>
                  <th>Pencatat</th>
                  <th className="text-center" style={{ width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center" style={{ padding: '40px' }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-primary-container)' }} />
                      <span style={{ color: '#64748b' }}>Memuat riwayat prestasi...</span>
                    </td>
                  </tr>
                ) : historyList.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>
                      Belum ada catatan mutaba'ah pada filter ini.
                    </td>
                  </tr>
                ) : (
                  historyList.map(item => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-primary-container)' }}>
                          {item.santri?.nama_lengkap || '-'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          {item.santri?.nomor_induk}
                        </div>
                      </td>
                      <td>{item.santri?.kelas?.nama_kelas || '-'}</td>
                      <td>
                        <span className={`badge ${
                          item.kategori === 'Tahfidz' ? 'badge-info' : 
                          item.kategori === 'Qiraati' ? 'badge-success' : ''
                        }`} style={item.kategori !== 'Tahfidz' && item.kategori !== 'Qiraati' ? { backgroundColor: '#fef3c7', color: '#92400e' } : {}}>
                          {item.kategori}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{item.jilid_surat}</td>
                      <td>{item.halaman_ayat || '-'}</td>
                      <td>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: (item.nilai || '').includes('A') || item.status === 'lanjut' ? '#16a34a' : '#ea580c' 
                        }}>
                          {item.nilai || item.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', fontStyle: 'italic', maxWidth: '240px' }}>
                        {item.catatan || '-'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {item.guru?.nama_lengkap || 'Admin'}
                      </td>
                      <td className="text-center">
                        <button 
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                          onClick={() => handleDeleteHistory(item.id)}
                          title="Hapus Catatan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAPOT CETAK MODAL */}
      {rapotData && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '850px' }}>
            <div className="modal-header no-print">
              <h2 className="modal-title flex items-center gap-2">
                <Printer size={20} color="var(--color-primary-container)" /> Pratinjau Rapot Prestasi Santri
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn-primary" onClick={handlePrintRapot}>
                  <Printer size={16} /> Cetak / Print Sekarang
                </button>
                <X className="modal-close" onClick={() => setRapotData(null)} />
              </div>
            </div>

            <div className="modal-body" style={{ backgroundColor: 'white' }}>
              <div id="rapot-print" style={{ padding: '20px 30px', fontFamily: 'serif', color: '#1b1c1a' }}>
                
                {/* Kop Surat */}
                <div style={{ textAlign: 'center', borderBottom: '3px double #064e3b', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <img src="/assets/logoapp.png" alt="Logo" style={{ height: '70px', width: 'auto' }} />
                    <div style={{ textAlign: 'center' }}>
                      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#064e3b', margin: 0, textTransform: 'uppercase' }}>
                        TPQ ANFAK AL AZIZAH
                      </h1>
                      <p style={{ fontSize: '14px', margin: '4px 0', color: '#334155' }}>
                        Pendidikan Al-Qur'an Terpadu — Metode Qiraati
                      </p>
                      <p style={{ fontSize: '12px', margin: 0, color: '#64748b' }}>
                        LAPORAN HASIL PRESTASI & MUTABA'AH BELAJAR SANTRI
                      </p>
                    </div>
                  </div>
                </div>

                {/* Identitas Santri */}
                <table style={{ width: '100%', marginBottom: '20px', fontSize: '14px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '160px', padding: '6px 0', fontWeight: 'bold' }}>Nama Lengkap</td>
                      <td style={{ width: '15px' }}>:</td>
                      <td style={{ fontWeight: 'bold', fontSize: '15px', color: '#064e3b' }}>{rapotData.santri.nama_lengkap}</td>
                      <td style={{ width: '140px', padding: '6px 0', fontWeight: 'bold' }}>Kelas / Tingkat</td>
                      <td style={{ width: '15px' }}>:</td>
                      <td style={{ fontWeight: 'bold' }}>{rapotData.santri.kelas?.nama_kelas || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Nomor Induk (NIS)</td>
                      <td>:</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{rapotData.santri.nomor_induk}</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Wali Kelas</td>
                      <td>:</td>
                      <td>{rapotData.santri.wali?.nama_lengkap || 'Ustadz / Ustadzah'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Orang Tua / Wali</td>
                      <td>:</td>
                      <td style={{ fontWeight: 'bold' }}>{rapotData.santri.nama_wali || rapotData.santri.nama_ayah || rapotData.santri.nama_ibu || '-'}</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>No. HP / WA Wali</td>
                      <td>:</td>
                      <td>{rapotData.santri.no_hp_wali || rapotData.santri.no_hp_ayah || rapotData.santri.no_hp_ibu || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Ringkasan Box Capaian */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ border: '2px solid #064e3b', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f0fdf4' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Capaian Qiraati Terakhir
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                      {rapotData.lastQiraati ? rapotData.lastQiraati.jilid_surat : 'Belum Tercatat'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px' }}>
                      {rapotData.lastQiraati?.halaman_ayat ? `Halaman / Ayat: ${rapotData.lastQiraati.halaman_ayat}` : ''}
                    </div>
                  </div>

                  <div style={{ border: '2px solid #7e22ce', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#faf5ff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#7e22ce', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Capaian Tahfidz Terakhir
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                      {rapotData.lastTahfidz ? rapotData.lastTahfidz.jilid_surat : 'Belum Tercatat'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9333ea', marginTop: '2px' }}>
                      {rapotData.lastTahfidz?.halaman_ayat ? `Ayat: ${rapotData.lastTahfidz.halaman_ayat}` : ''}
                    </div>
                  </div>
                </div>

                {/* Tabel Rincian Prestasi */}
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', color: '#064e3b' }}>
                  Rincian Mutaba'ah & Perkembangan Santri
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'left' }}>Tanggal</th>
                      <th style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'left' }}>Kategori</th>
                      <th style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'left' }}>Materi / Surat</th>
                      <th style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'left' }}>Hal / Ayat</th>
                      <th style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'center' }}>Nilai Kelancaran</th>
                      <th style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'left' }}>Catatan Pembimbing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapotData.allRecords.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ border: '1px solid #334155', padding: '20px', textAlign: 'center', color: '#64748b' }}>
                          Belum ada rekam catatan prestasi harian untuk santri ini.
                        </td>
                      </tr>
                    ) : (
                      rapotData.allRecords.map((r, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid #334155', padding: '8px 10px' }}>
                            {new Date(r.tanggal).toLocaleDateString('id-ID')}
                          </td>
                          <td style={{ border: '1px solid #334155', padding: '8px 10px', fontWeight: 'bold' }}>{r.kategori}</td>
                          <td style={{ border: '1px solid #334155', padding: '8px 10px' }}>{r.jilid_surat}</td>
                          <td style={{ border: '1px solid #334155', padding: '8px 10px' }}>{r.halaman_ayat || '-'}</td>
                          <td style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                            {r.nilai || r.status}
                          </td>
                          <td style={{ border: '1px solid #334155', padding: '8px 10px', fontStyle: 'italic' }}>{r.catatan || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Tanda Tangan */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', fontSize: '13px', marginTop: '40px' }}>
                  <div>
                    <p style={{ margin: '0 0 70px 0' }}>Mengetahui,<br />Orang Tua / Wali Santri</p>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                      ( {rapotData.santri.nama_wali || rapotData.santri.nama_ayah || rapotData.santri.nama_ibu || '....................................'} )
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 70px 0' }}>Wali Kelas / Guru Pembimbing,</p>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {rapotData.santri.wali?.nama_lengkap || 'Ustadz / Ustadzah'} )</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 70px 0' }}>
                      Sidoarjo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                      Kepala TPQ Anfak Al Azizah
                    </p>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( Kepala Lembaga )</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* INPUT PRESTASI MODAL */}
      {showInputModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Input Prestasi Harian Santri</h2>
              <X className="modal-close" onClick={() => setShowInputModal(false)} />
            </div>

            <form onSubmit={handleSavePrestasi}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tanggal</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={inputForm.tanggal} 
                      onChange={(e) => setInputForm(prev => ({ ...prev, tanggal: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select 
                      className="input-field"
                      value={inputForm.kategori}
                      onChange={(e) => setInputForm(prev => ({ ...prev, kategori: e.target.value }))}
                    >
                      {kategoriList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Pilih Santri <span style={{ color: 'red' }}>*</span></label>
                    <select 
                      className="input-field"
                      style={{ fontWeight: 'bold', color: 'var(--color-primary-container)' }}
                      value={inputForm.santri_id}
                      onChange={(e) => setInputForm(prev => ({ ...prev, santri_id: e.target.value }))}
                      required
                    >
                      <option value="">-- Pilih Santri --</option>
                      {santriList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nomor_induk} - {s.nama_lengkap}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Materi / Jilid / Surat <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Contoh: Jilid 2 / Surat Al-Ikhlas"
                      value={inputForm.jilid_surat}
                      onChange={(e) => setInputForm(prev => ({ ...prev, jilid_surat: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Halaman / Ayat</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Contoh: Hal 12 / Ayat 1-5"
                      value={inputForm.halaman_ayat}
                      onChange={(e) => setInputForm(prev => ({ ...prev, halaman_ayat: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nilai Kelancaran</label>
                    <select 
                      className="input-field"
                      value={inputForm.nilai}
                      onChange={(e) => setInputForm(prev => ({ ...prev, nilai: e.target.value }))}
                    >
                      <option value="A (Sangat Lancar)">A (Sangat Lancar / Mumtaz)</option>
                      <option value="B (Lancar)">B (Lancar / Jayyid)</option>
                      <option value="C (Cukup Lancar)">C (Cukup / Maqbul)</option>
                      <option value="D (Mengulang)">D (Mengulang / Rasib)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Progres</label>
                    <select 
                      className="input-field"
                      style={{ fontWeight: 'bold' }}
                      value={inputForm.status}
                      onChange={(e) => setInputForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="lanjut">Lanjut Materi Berikutnya</option>
                      <option value="lancar">Lancar (Tetap)</option>
                      <option value="ulang">Ulang Materi Ini</option>
                    </select>
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Catatan / Evaluasi Ustadz</label>
                    <textarea 
                      rows={2} 
                      className="input-field" 
                      placeholder="Catatan makhraj, tajwid, atau motivasi"
                      value={inputForm.catatan}
                      onChange={(e) => setInputForm(prev => ({ ...prev, catatan: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                  onClick={() => setShowInputModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {submitting ? 'Menyimpan...' : 'Simpan Prestasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL KELOLA KATEGORI PRESTASI */}
      {showKategoriModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Kelola Kategori Prestasi</h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Tambah, ubah nama, atau hapus kategori penilaian santri
                </span>
              </div>
              <X className="modal-close" onClick={() => { setShowKategoriModal(false); setEditingCatIndex(null); }} />
            </div>

            <div className="modal-body">
              {/* Form Tambah Kategori */}
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ketik nama kategori baru..." 
                  value={newCatInput} 
                  onChange={(e) => setNewCatInput(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingCat || !newCatInput.trim()}
                  style={{ flexShrink: 0 }}
                >
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Tambah
                </button>
              </form>

              {/* List Kategori */}
              <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', width: '40px' }}>No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama Kategori</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kategoriList.map((cat, idx) => (
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
                                onClick={() => handleSaveEdit(idx)}
                                title="Simpan Nama Kategori"
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
                                onClick={() => handleStartEdit(idx, cat)}
                                title="Edit Nama Kategori"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                type="button" 
                                style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                                onClick={() => handleDeleteCategory(cat)}
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

export default PrestasiAdminPage;
