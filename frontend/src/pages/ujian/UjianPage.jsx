import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Award, ArrowRight, Save, X, Calendar, Loader2, Plus, CheckCircle2, Printer, History, BarChart3, GraduationCap } from 'lucide-react';
import { ujianAPI, kelasAPI, santriAPI } from '../../services/api';
import '../dashboard/Dashboard.css';
import WhatsAppLink from '../../components/WhatsAppLink';
import { promotionMessage } from '../../utils/whatsapp';

const UjianPage = () => {
  const [examData, setExamData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  // New states for tabs
  const [activeTab, setActiveTab] = useState('evaluasi'); // evaluasi, riwayat, rekap
  const [riwayatAll, setRiwayatAll] = useState([]);
  const [rekapBulanan, setRekapBulanan] = useState([]);
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear().toString());
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [loadingRekap, setLoadingRekap] = useState(false);
  // Existing states
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingHistory, setEditingHistory] = useState(null);
  const [printSantri, setPrintSantri] = useState(null);
  const [selectedSantriIds, setSelectedSantriIds] = useState([]);
  const [nextKelas, setNextKelas] = useState('');
  const [nextKelasId, setNextKelasId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [regFilterKelas, setRegFilterKelas] = useState('');
  const [formData, setFormData] = useState({ nilai: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0], hasil: 'lulus', tanggal_tes: '', tanggal_naik: '' });
  const [regFormData, setRegFormData] = useState({ nomor_tes: '', tanggal_mulai: new Date().toISOString().split('T')[0], tanggal_selesai: '', masa_tempuh: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');
  const isAdmin = user.role === 'admin';
  const isKepala = user.role === 'kepala';
  const isGuru = user.role === 'guru';
  const isAdminOrKepala = isAdmin || isKepala;

  useEffect(() => {
    if (regFormData.tanggal_mulai && regFormData.tanggal_selesai) {
      const d1 = new Date(regFormData.tanggal_mulai);
      const d2 = new Date(regFormData.tanggal_selesai);
      const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) {
        setRegFormData(prev => ({ ...prev, masa_tempuh: diff }));
      }
    }
  }, [regFormData.tanggal_mulai, regFormData.tanggal_selesai]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = isGuru ? { kelas: user.kelas_id } : {};
      const [ujian, kelas] = await Promise.all([ujianAPI.getAll(params).catch(() => []), kelasAPI.getAll().catch(() => [])]);
      setExamData(ujian || []); setKelasList(kelas || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadRiwayatAll = async () => {
    setLoadingRiwayat(true);
    try {
      const data = await ujianAPI.getRiwayatAll();
      setRiwayatAll(data || []);
    } catch (e) { console.error(e); }
    setLoadingRiwayat(false);
  };

  const loadRekapBulanan = async (tahun = rekapTahun) => {
    setLoadingRekap(true);
    try {
      const res = await ujianAPI.getRekapBulanan({ tahun });
      setRekapBulanan(res?.data || []);
    } catch (e) { console.error(e); }
    setLoadingRekap(false);
  };

  const openModal = async (type, item) => {
    setSelectedSantri(item);
    if (type === 'register_exam') {
      setLoading(true);
      try {
        const data = await santriAPI.getAll();
        setSantriList(data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    if (type === 'promotion_confirm' && item.santri?.kelas) {
      const currentUrutan = item.santri.kelas.urutan;
      const nextK = kelasList.find(k => k.urutan === currentUrutan + 1);
      setNextKelas(nextK ? nextK.nama_kelas : 'ALUMNI / LULUS');
      setNextKelasId(nextK ? nextK.id : '');
    }
    setActiveModal(type);
  };

  const closeModal = () => { 
    setActiveModal(null); 
    setSelectedSantri(null); 
    setSelectedSantriIds([]);
    setNextKelas(''); 
    setFormData({ nilai: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0], hasil: 'lulus', tanggal_tes: '', tanggal_naik: '' }); 
    setRegFormData({ nomor_tes: '', tanggal_mulai: new Date().toISOString().split('T')[0], tanggal_selesai: '', masa_tempuh: '' });
  };

  const handleInputChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleToggleSantri = (id) => {
    setSelectedSantriIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRegisterExam = async () => {
    if (selectedSantriIds.length === 0) return;
    setSaving(true);
    try {
      await ujianAPI.register({ santri_ids: selectedSantriIds, ...regFormData });
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await ujianAPI.inputNilai({ 
        santri_id: selectedSantri.santri_id, 
        kelas_dari_id: selectedSantri.kelas_id, 
        nilai_tes: parseInt(formData.nilai), 
        status_tes: formData.hasil, 
        catatan: formData.keterangan, 
        tanggal_tes: formData.tanggal_tes, 
        tanggal_naik: formData.tanggal_naik,
        tanggal_mulai: selectedSantri.tanggal_mulai,
        tanggal_selesai: selectedSantri.tanggal_selesai
      });
      await loadData(); 
      
      // Jika lulus, langsung tawarkan naik kelas
      if (formData.hasil === 'lulus') {
        openModal('promotion_confirm', selectedSantri);
      } else {
        closeModal();
      }
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handlePromotionConfirm = async () => {
    setSaving(true);
    try {
      await ujianAPI.naikKelas({ 
        santri_id: selectedSantri.santri_id, 
        kelas_dari_id: selectedSantri.kelas_id, 
        kelas_ke_id: nextKelasId, 
        tanggal_naik: formData.tanggal_naik || formData.tanggal_tes 
      });
      await loadData(); closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const openHistory = async (santriId, santriNama) => {
    setSelectedSantri({ santri_id: santriId, santri: { nama_lengkap: santriNama } });
    setActiveModal('history');
    setLoadingHistory(true);
    try {
      const data = await ujianAPI.getHistory(santriId);
      setHistoryList(data || []);
    } catch (e) { console.error(e); }
    setLoadingHistory(false);
  };

  const handleUpdateHistory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Hitung ulang masa tempuh jika tanggal berubah
      let masa_tempuh = editingHistory.masa_tempuh;
      if (formData.tanggal_mulai && formData.tanggal_selesai) {
        const d1 = new Date(formData.tanggal_mulai);
        const d2 = new Date(formData.tanggal_selesai);
        masa_tempuh = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      }

      await ujianAPI.updateHistory(editingHistory.id, {
        nilai_tes: parseInt(formData.nilai),
        status_tes: formData.hasil,
        catatan: formData.keterangan,
        tanggal_naik: formData.tanggal_naik,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        masa_tempuh
      });
      
      // Refresh history
      const data = await ujianAPI.getHistory(selectedSantri.santri_id);
      setHistoryList(data || []);
      setEditingHistory(null);
      alert('Riwayat berhasil diperbarui');
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat pendidikan ini?')) return;
    try {
      await ujianAPI.deleteHistory(id);
      
      // Refresh history
      const data = await ujianAPI.getHistory(selectedSantri.santri_id);
      setHistoryList(data || []);
      alert('Riwayat berhasil dihapus');
    } catch (e) { alert(e.message); }
  };

  const handlePrintKartu = (item) => {
    setPrintSantri(item);
    setTimeout(() => window.print(), 100);
  };

  const getStatus = (item) => {
    const pct = item.target_hari > 0 ? (item.aktual_hari / item.target_hari) * 100 : 0;
    if (pct >= 100) return 'Siap Ujian';
    return 'Belajar';
  };

  const filteredExam = examData.filter(item => !searchQuery || (item.santri?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()));
  
  const sortedExam = [...filteredExam].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = getStatus(a);
    let bVal = getStatus(b);
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredReg = santriList.filter(s => {
    const matchesSearch = !regSearchQuery || s.nama_lengkap?.toLowerCase().includes(regSearchQuery.toLowerCase()) || s.nomor_induk?.includes(regSearchQuery);
    const matchesKelas = !regFilterKelas || s.kelas_id === regFilterKelas;
    const isNotAlreadyInExam = !examData.some(e => e.santri_id === s.id && getStatus(e) === 'Siap Ujian');
    return matchesSearch && matchesKelas && s.status === 'aktif';
  });

  return (
    <div className="flex-col gap-6 w-full relative">
      {printSantri && (
        <div id="print-kartu-tes" className="print-only">
          <div className="a5-card">
            
            {/* Header Table: Left Aligned */}
            <table style={{ width: '100%', marginBottom: '0', padding: '10px', borderBottom: '1px solid #000', borderCollapse: 'collapse', border: 'none' }}>
              <tbody>
                <tr>
                  <td style={{ width: '70px', verticalAlign: 'middle', border: 'none', padding: 0 }}>
                    <img src={`${window.location.origin}/assets/logoapp.png`} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                  </td>
                  <td style={{ textAlign: 'left', verticalAlign: 'middle', border: 'none', padding: '0 0 0 8px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '500' }}>YAYASAN MAJELIS PENDIDIKAN ISLAM</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', lineHeight: '1.0', margin: '1px 0' }}>ANFAK AL AZIZIAH</div>
                    <div style={{ fontSize: '8px', lineHeight: '1.2' }}>Akta Notaris 04 Tgl 3 Juli 2007, No. Induk 02-06-04-001</div>
                    <div style={{ fontSize: '8px', lineHeight: '1.2' }}>Alamat : Tepus Wetan, Surodadi, Candimulyo, Magelang 56191</div>
                  </td>
                  <td style={{ width: '70px', verticalAlign: 'top', border: 'none', padding: 0, textAlign: 'right' }}>
                    <div style={{ width: '60px', height: '70px', border: '1px solid #ddd', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', display: 'inline-block', textAlign: 'center', padding: '3px', boxSizing: 'border-box' }}>
                      <img src="data:image/jpeg;base64,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" alt="Qiraati" style={{ width: '100%', height: '70px', objectFit: 'contain' }} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Title Section */}
            <div style={{ textAlign: 'center', padding: '8px 0', borderBottom: '1px solid #000', margin: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>KARTU TES KENAIKAN JILID</div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>TGL INPUT : {new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')}</div>
            </div>

            {/* Main Data Table */}
            <table className="ptable">
              <tbody>
                <tr>
                  <td colSpan="2" style={{ fontWeight: 'bold', fontSize: '14px', width: '65%' }}>
                    NOMOR : TES/26/05/{printSantri.santri?.nomor_induk?.slice(-3) || '001'}
                  </td>
                  <td style={{ width: '11.6%', textAlign: 'center', verticalAlign: 'top', fontSize: '9px', height: '35px' }}>IKL</td>
                  <td style={{ width: '11.6%', textAlign: 'center', verticalAlign: 'top', fontSize: '9px' }}>IA</td>
                  <td style={{ width: '11.6%', textAlign: 'center', verticalAlign: 'middle', fontSize: '9px', padding: '2px' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${printSantri.santri?.nomor_induk}`} 
                      alt="QR"
                      style={{ width: '35px', height: '35px', display: 'block', margin: '0 auto' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '150px' }}>Nomor Induk</td>
                  <td colSpan="4">{printSantri.santri?.nomor_induk || '-'}</td>
                </tr>
                <tr>
                  <td>Nama Lengkap</td>
                  <td colSpan="4">{printSantri.santri?.nama_lengkap || '-'}</td>
                </tr>
                <tr>
                  <td>Kelas</td>
                  <td colSpan="4">{printSantri.santri?.kelas?.nama_kelas || printSantri.kelas?.nama_kelas || '-'}</td>
                </tr>
                <tr>
                  <td>Tanggal Mulai</td>
                  <td colSpan="4">{printSantri.tanggal_mulai ? new Date(printSantri.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
                <tr>
                  <td>Tanggal Selesai</td>
                  <td colSpan="4">{printSantri.tanggal_selesai ? new Date(printSantri.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
                <tr>
                  <td>Masa Tempuh</td>
                  <td colSpan="4">{printSantri.aktual_hari || 0} hari</td>
                </tr>
                <tr>
                  <td>Tagihan Syahriyah</td>
                  <td style={{ width: '150px' }}>Rp {(printSantri.syahriyah_nominal || 0).toLocaleString('id-ID')}</td>
                  <td colSpan="3"></td>
                </tr>
                <tr>
                  <td style={{ height: '40px', verticalAlign: 'top' }}>Keterangan</td>
                  <td colSpan="4"></td>
                </tr>
                <tr>
                  <td>Tanggal Tes</td>
                  <td></td>
                  <td></td>
                  <td colSpan="2"></td>
                </tr>
                <tr>
                  <td>Tanggal Naik</td>
                  <td colSpan="4"></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>NAIK/TIDAK NAIK</td>
                  <td colSpan="4"></td>
                </tr>
              </tbody>
            </table>

            {/* Signatures Table: Larger boxes */}
            <table className="ptable" style={{ marginTop: '0' }}>
              <tbody>
                <tr>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '60px', fontSize: '11px' }}>Wali Santri</div>
                    <div style={{ fontSize: '11px' }}>( ........................... )</div>
                  </td>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '50px', fontSize: '11px' }}>Wali Kelas</div>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: '1.2' }}>
                      {printSantri.santri?.kelas?.wali?.nama_lengkap || '__________________'}
                    </div>
                  </td>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '60px', fontSize: '11px' }}>Kepala Lembaga</div>
                    <div style={{ fontSize: '11px' }}>( ........................... )</div>
                  </td>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '60px', fontSize: '11px' }}>Wali Kelas Baru</div>
                    <div style={{ fontSize: '11px' }}>( ........................... )</div>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      )}

      <div className="page-header mb-6 flex justify-between items-center no-print">
        <div><h1 className="page-title">Ujian & Kenaikan Kelas</h1><p className="page-subtitle">Kelola evaluasi akhir jilid dan kenaikan tingkat santri</p></div>
        <button className="btn-primary" onClick={() => openModal('register_exam')}><Plus size={18} /> Daftarkan Tes</button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 no-print">
        {[
          { id: 'evaluasi', label: 'Evaluasi & Ujian', icon: GraduationCap },
          { id: 'riwayat', label: 'Riwayat Real-Time', icon: History },
          { id: 'rekap', label: 'Rekap Bulanan', icon: BarChart3 }
        ].map(tab => (
          <button key={tab.id} type="button" className="flex items-center gap-2 transition-all duration-200" style={{
            padding: '10px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            border: activeTab === tab.id ? '1.5px solid #10b981' : '1.5px solid #e5e7eb',
            backgroundColor: activeTab === tab.id ? '#f0fdf4' : '#ffffff',
            color: activeTab === tab.id ? '#047857' : '#6b7280',
            boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(16, 185, 129, 0.1)' : 'none'
          }} onClick={() => { 
            setActiveTab(tab.id); 
            if (tab.id === 'riwayat') loadRiwayatAll();
            if (tab.id === 'rekap') loadRekapBulanan();
          }}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'evaluasi' && (
      <div className="card w-full">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama santri..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>No</th><th>Nama Santri</th><th>Kelas</th><th>Tanggal</th><th>Masa Tempuh</th><th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Urutkan berdasarkan status">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th><th className="text-center">Aksi</th><th>Riwayat</th></tr></thead>
            <tbody>
              {loading && !activeModal ? <tr><td colSpan="8" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : sortedExam.length === 0 ? <tr><td colSpan="8" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data pencapaian</td></tr>
              : sortedExam.map((item, i) => {
                const status = getStatus(item);
                const pct = item.target_hari > 0 ? Math.min((item.aktual_hari / item.target_hari) * 100, 100) : 0;
                return (
                  <tr key={item.id}>
                    <td>{i+1}</td>
                    <td className="font-medium">{item.santri?.nama_lengkap || '-'}</td>
                    <td><span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{item.santri?.kelas?.nama_kelas || item.kelas?.nama_kelas || '-'}</span></td>
                    <td className="text-xs text-gray-500">
                      <div>Mulai: {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID') : (item.tanggal_masuk ? new Date(item.tanggal_masuk).toLocaleDateString('id-ID') : '-')}</div>
                      <div>Selesai: {item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</div>
                    </td>
                    <td>
                      <span className="font-bold">{item.aktual_hari || 0} Hari</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${pct >= 100 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </td>
                    <td>
                      {status === 'Siap Ujian' && <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Siap Ujian</span>}
                      {status === 'Belajar' && <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>Belajar</span>}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center items-center h-full gap-2">
                        {status === 'Siap Ujian' && (
                          <>
                            <button className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Cetak Kartu Tes" onClick={() => handlePrintKartu(item)}><Printer size={18} /></button>
                            {isAdminOrKepala && (
                              <>
                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 font-medium" title="Input Nilai" onClick={() => openModal('input_nilai', item)}><Award size={18} /> Nilai</button>
                                {item.santri?.latest_riwayat?.status_tes === 'lulus' && (
                                  <button className="p-1 px-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded flex items-center gap-1 font-bold text-xs" title="Naikkan Kelas" onClick={() => openModal('promotion_confirm', item)}><Award size={14} /> Naikkan</button>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {status === 'Belajar' && <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Proses Belajar</span>}
                        {isAdminOrKepala && (
                          <button 
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded" 
                            title="Hapus" 
                            onClick={async () => {
                              if (window.confirm('Hapus data pencapaian ini?')) {
                                try {
                                  await ujianAPI.delete(item.id);
                                  loadData();
                                } catch (e) { alert(e.message); }
                              }
                            }}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <button className="p-1 px-3 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded font-medium" onClick={() => openHistory(item.santri_id, item.santri?.nama_lengkap)}>Riwayat</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'riwayat' && (
      <div className="card w-full">
        <h3 className="card-title mb-4">Riwayat Kenaikan Kelas (Real-Time)</h3>
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Tanggal Naik</th>
                <th>Nama Santri</th>
                <th>Dari Kelas</th>
                <th>Ke Kelas</th>
                <th>Nilai Tes</th>
                <th>Status</th>
                <th>Pemberitahuan</th>
              </tr>
            </thead>
            <tbody>
              {loadingRiwayat ? <tr><td colSpan="7" className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></td></tr>
              : riwayatAll.length === 0 ? <tr><td colSpan="7" className="text-center py-8 text-gray-400">Belum ada riwayat kenaikan kelas</td></tr>
              : riwayatAll.map((r, i) => (
                <tr key={r.id}>
                  <td>{r.tanggal_naik ? new Date(r.tanggal_naik).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="font-medium">{r.santri?.nama_lengkap || '-'}</td>
                  <td>{r.kelas_dari?.nama_kelas || '-'}</td>
                  <td className="font-bold text-emerald-600">{r.kelas_ke?.nama_kelas || '-'}</td>
                  <td>{r.nilai_tes || '-'}</td>
                  <td><span className={`badge ${r.status_tes === 'lulus' ? 'badge-success' : 'badge-info'}`}>{r.status_tes}</span></td>
                  <td><WhatsAppLink santri={r.santri} message={promotionMessage(r)} label="WA Kenaikan" enabled={['lulus', 'lulus_bersyarat'].includes(r.status_tes) && !!r.kelas_ke?.nama_kelas && !!r.tanggal_naik} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'rekap' && (
      <div className="card w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="card-title">Rekap Kenaikan Kelas per Bulan</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Tahun:</span>
            <input type="number" className="input-field py-1.5 px-3 text-sm" style={{ width: '100px' }} value={rekapTahun} onChange={(e) => { setRekapTahun(e.target.value); loadRekapBulanan(e.target.value); }} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Bulan</th>
                <th style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>Jumlah Naik Kelas</th>
                <th style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>Jumlah Remidi</th>
              </tr>
            </thead>
            <tbody>
              {loadingRekap ? <tr><td colSpan="3" className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></td></tr>
              : rekapBulanan.length === 0 ? <tr><td colSpan="3" className="text-center py-8 text-gray-400">Belum ada data</td></tr>
              : rekapBulanan.map((r, i) => (
                <tr key={r.bulan}>
                  <td className="font-medium">{new Date(2000, r.bulan - 1).toLocaleString('id-ID', { month: 'long' })}</td>
                  <td style={{ fontWeight: '700', color: '#166534' }}>{r.naik} orang</td>
                  <td style={{ fontWeight: '700', color: '#991b1b' }}>{r.remidi} orang</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeModal === 'register_exam' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '650px' }}>
          <div className="modal-header"><h2 className="modal-title">Daftarkan Peserta Tes</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body">
            {/* Form Data Tes */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="form-group col-span-2">
                <label className="form-label text-xs">Nomor Tes</label>
                <input type="text" className="input-field text-sm" placeholder="Contoh: TES/26/05/001" value={regFormData.nomor_tes} onChange={(e) => setRegFormData({...regFormData, nomor_tes: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Tanggal Mulai</label>
                <input type="date" className="input-field text-sm" value={regFormData.tanggal_mulai} onChange={(e) => setRegFormData({...regFormData, tanggal_mulai: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Tanggal Selesai</label>
                <input type="date" className="input-field text-sm" value={regFormData.tanggal_selesai} onChange={(e) => setRegFormData({...regFormData, tanggal_selesai: e.target.value})} />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label text-xs font-bold text-blue-600">Masa Tempuh (Otomatis)</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="input-field text-sm bg-blue-50 border-blue-200 font-bold text-blue-700" placeholder="60" value={regFormData.masa_tempuh} onChange={(e) => setRegFormData({...regFormData, masa_tempuh: e.target.value})} />
                  <span className="text-sm font-bold text-blue-600">Hari</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="input-with-icon flex-1">
                <Search className="icon" size={16} />
                <input type="text" className="input-field text-sm" placeholder="Cari nama santri..." value={regSearchQuery} onChange={(e) => setRegSearchQuery(e.target.value)} />
              </div>
              <select className="input-field text-sm" style={{ width: '150px' }} value={regFilterKelas} onChange={(e) => setRegFilterKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
              <table className="data-table w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm"><tr><th width="40">Pilih</th><th>Nama Santri</th><th>Kelas</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="3" className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  : filteredReg.length === 0 ? <tr><td colSpan="3" className="text-center py-8 text-gray-400">Tidak ada santri ditemukan</td></tr>
                  : filteredReg.map(s => (
                    <tr key={s.id} onClick={() => handleToggleSantri(s.id)} className="cursor-pointer hover:bg-blue-50">
                      <td className="text-center"><input type="checkbox" checked={selectedSantriIds.includes(s.id)} onChange={() => {}} /></td>
                      <td className="font-medium">{s.nama_lengkap}</td>
                      <td>{s.kelas?.nama_kelas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} /> <span>{selectedSantriIds.length} santri terpilih untuk didaftarkan tes.</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button className="btn-primary" onClick={handleRegisterExam} disabled={saving || selectedSantriIds.length === 0}>{saving ? 'Mendaftarkan...' : 'Daftarkan Sekarang'}</button>
          </div>
        </div></div>
      )}

      {activeModal === 'input_nilai' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header"><h2 className="modal-title">Input Hasil Ujian</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmitScore}><div className="modal-body">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm">{(selectedSantri.santri?.nama_lengkap || '?').charAt(0)}</div>
              <div><h4 className="font-bold text-gray-800">{selectedSantri.santri?.nama_lengkap}</h4><p className="text-xs text-blue-600">Ujian Kenaikan {selectedSantri.santri?.kelas?.nama_kelas || selectedSantri.kelas?.nama_kelas}</p></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group"><label className="form-label">Skor Ujian (0-100)</label><input type="number" name="nilai" className="input-field" value={formData.nilai} onChange={handleInputChange} required /></div>
                <div className="form-group"><label className="form-label">Hasil</label><select name="hasil" className="input-field" value={formData.hasil} onChange={handleInputChange}><option value="lulus">Lulus</option><option value="remidi">Remedi</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group"><label className="form-label">Tanggal Tes</label><input type="date" name="tanggal_tes" className="input-field" value={formData.tanggal_tes} onChange={handleInputChange} /></div>
                <div className="form-group"><label className="form-label">Tanggal Naik</label><input type="date" name="tanggal_naik" className="input-field" value={formData.tanggal_naik} onChange={handleInputChange} /></div>
              </div>
              <div className="form-group"><label className="form-label">Catatan</label><textarea name="keterangan" className="input-field" rows="3" style={{ resize: 'none' }} value={formData.keterangan} onChange={handleInputChange}></textarea></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Hasil'}</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'promotion_confirm' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '400px' }}>
          <div className="modal-header border-none"><h2 className="modal-title">Konfirmasi Kenaikan</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"><Award size={40} /></div>
            <p className="text-gray-600 mb-4">Ujian Selesai! Naikkan santri ini sekarang?</p>
            <div className="flex items-center justify-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-center"><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">DARI</p><span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{selectedSantri.santri?.kelas?.nama_kelas || selectedSantri.kelas?.nama_kelas}</span></div>
              <ArrowRight className="text-emerald-500" size={24} />
              <div className="text-center"><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">KE</p><span className="badge badge-success">{nextKelas}</span></div>
            </div>
            <h4 className="font-bold text-gray-800 mt-4">{selectedSantri.santri?.nama_lengkap}</h4>
          </div>
          <div className="modal-footer border-none pt-0">
            <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Nanti Saja</button>
            <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={handlePromotionConfirm} disabled={saving}>{saving ? 'Memproses...' : 'Ya, Naikkan Sekarang'}</button>
          </div>
        </div></div>
      )}

      {activeModal === 'history' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Riwayat Pendidikan</h2>
              <p className="text-xs text-gray-500">{selectedSantri.santri?.nama_lengkap}</p>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <div className="modal-body p-0">
            {loadingHistory ? (
              <div className="text-center py-12"><Loader2 size={32} className="animate-spin mx-auto text-blue-500" /></div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Belum ada riwayat pendidikan</div>
            ) : (
              <div className="p-4">
                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                  {historyList.map((h, idx) => (
                    <div key={h.id} className="relative pl-10">
                      <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm z-10"></div>
                      <div className="card p-4 bg-gray-50 border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(h.tanggal_naik || h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <div className="flex gap-2">
                            <span className={`badge ${h.status_tes === 'lulus' ? 'badge-success' : 'badge-danger'}`}>{h.status_tes}</span>
                            {isAdminOrKepala && (
                              <div className="flex gap-1">
                                <button 
                                  className="p-1 px-2 text-[10px] bg-white border border-orange-200 text-orange-600 rounded hover:bg-orange-50 font-bold"
                                  onClick={() => {
                                    setEditingHistory(h);
                                    setFormData({
                                      nilai: h.nilai_tes || '',
                                      hasil: h.status_tes || 'lulus',
                                      keterangan: h.catatan || '',
                                      tanggal_naik: h.tanggal_naik || '',
                                      tanggal_mulai: h.tanggal_mulai || '',
                                      tanggal_selesai: h.tanggal_selesai || ''
                                    });
                                  }}
                                >
                                  EDIT
                                </button>
                                <button 
                                  className="p-1 px-2 text-[10px] bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 font-bold"
                                  onClick={() => handleDeleteHistory(h.id)}
                                >
                                  HAPUS
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {editingHistory?.id === h.id ? (
                          <form onSubmit={handleUpdateHistory} className="mt-4 p-3 bg-white rounded-lg border border-orange-100 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="form-group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nilai</label>
                                <input type="number" name="nilai" className="input-field py-1 px-2 text-sm" value={formData.nilai} onChange={handleInputChange} required />
                              </div>
                              <div className="form-group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Hasil</label>
                                <select name="hasil" className="input-field py-1 px-2 text-sm" value={formData.hasil} onChange={handleInputChange}>
                                  <option value="lulus">Lulus</option>
                                  <option value="remidi">Remidi</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="form-group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Tgl Mulai</label>
                                <input type="date" name="tanggal_mulai" className="input-field py-1 px-2 text-xs" value={formData.tanggal_mulai} onChange={handleInputChange} />
                              </div>
                              <div className="form-group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Tgl Selesai</label>
                                <input type="date" name="tanggal_selesai" className="input-field py-1 px-2 text-xs" value={formData.tanggal_selesai} onChange={handleInputChange} />
                              </div>
                              <div className="form-group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Tgl Naik</label>
                                <input type="date" name="tanggal_naik" className="input-field py-1 px-2 text-xs" value={formData.tanggal_naik} onChange={handleInputChange} />
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Catatan</label>
                              <textarea name="keterangan" className="input-field py-1 px-2 text-sm" rows="2" value={formData.keterangan} onChange={handleInputChange}></textarea>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button type="button" className="btn-primary py-1 px-3 text-xs" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={() => setEditingHistory(null)}>Batal</button>
                              <button type="submit" className="btn-primary py-1 px-3 text-xs" disabled={saving}>{saving ? '...' : 'Simpan'}</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-bold text-gray-700">{h.kelas_dari?.nama_kelas}</span>
                              <ArrowRight size={14} className="text-gray-400" />
                              <span className="font-bold text-blue-600">{h.kelas_ke?.nama_kelas || h.kelas_dari?.nama_kelas}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs mt-3">
                              <div>
                                <p className="text-gray-400 mb-0.5 text-[9px] uppercase">Tgl Mulai</p>
                                <p className="font-bold text-gray-700">{h.tanggal_mulai ? new Date(h.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5 text-[9px] uppercase">Tgl Selesai</p>
                                <p className="font-bold text-gray-700">{h.tanggal_selesai ? new Date(h.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5 text-[9px] uppercase">Tgl Naik</p>
                                <p className="font-bold text-blue-600">{h.tanggal_naik ? new Date(h.tanggal_naik).toLocaleDateString('id-ID') : '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5 text-[9px] uppercase">Nilai Ujian</p>
                                <p className="font-bold text-gray-700">{h.nilai_tes || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5 text-[9px] uppercase">Masa Tempuh</p>
                                <p className="font-bold text-gray-700">{h.masa_tempuh ? `${h.masa_tempuh} Hari` : '-'}</p>
                              </div>
                              <div className="col-span-3 mt-1 pt-1 border-t border-gray-100">
                                <p className="text-gray-400 mb-0.5 text-[9px] uppercase">Catatan / Keterangan</p>
                                <p className="italic text-gray-600 text-xs">{h.catatan || '-'}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          @page { size: A5 portrait; margin: 10mm; }
          
          /* Hide everything by default */
          body * { visibility: hidden; }
          
          /* Show only the print container and its contents */
          #print-kartu-tes, #print-kartu-tes * { visibility: visible; }
          
          /* Position the print container and force parents to be visible but not show their own content */
          #print-kartu-tes {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Crucial: parents must not clip or hide the absolute child */
          html, body, #root, .app-layout, .main-wrapper, .content-area, .content-container, .flex-col {
            visibility: visible !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            position: static !important;
            display: block !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .a5-card { 
            width: 100%; 
            max-width: 148mm; 
            margin: 0 auto; 
            padding: 10px; 
            border: 2px solid #000; padding: 0; 
            background: #fff; 
            font-family: 'Times New Roman', serif; 
            box-sizing: border-box;
          }
          
          .ptable { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          .ptable th, .ptable td { border: 1px solid #000 !important; padding: 4px 8px; font-size: 11px; vertical-align: middle; }
        }
      `}</style>
    </div>
  );
};

export default UjianPage;
