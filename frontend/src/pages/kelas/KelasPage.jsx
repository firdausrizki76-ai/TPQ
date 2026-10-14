import React, { useState, useEffect } from 'react';
import { Search, Edit, X, Save, Download, Users, Plus, BookOpen, User, Loader2 } from 'lucide-react';
import { kelasAPI, guruAPI } from '../../services/api';
import '../dashboard/Dashboard.css';
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ZONES = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' };

const KelasPage = () => {
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [santriInKelas, setSantriInKelas] = useState([]);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [santriTab, setSantriTab] = useState('aktif');
  const [formData, setFormData] = useState({ deskripsi: '', wali_kelas_id: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { 
      const [data, guruData] = await Promise.all([
        kelasAPI.getAll().catch(() => []),
        guruAPI.getAll().catch(() => [])
      ]);
      setKelasList(data || []); 
      setGuruList(guruData || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openViewSantri = async (kelas) => {
    setSelectedKelas(kelas); setActiveModal('view_santri'); setSantriTab('aktif'); setLoadingSantri(true);
    try { const data = await kelasAPI.getSantri(kelas.id, { status: 'aktif' }); setSantriInKelas(data || []); } catch (e) { console.error(e); setSantriInKelas([]); }
    setLoadingSantri(false);
  };

  const loadSantriByTab = async (kelas, tab) => {
    setSantriTab(tab); setLoadingSantri(true);
    try { const data = await kelasAPI.getSantri(kelas.id, { status: tab }); setSantriInKelas(data || []); } catch (e) { console.error(e); setSantriInKelas([]); }
    setLoadingSantri(false);
  };

  const openEdit = (kelas) => {
    setSelectedKelas(kelas); setError(''); setFormData({ deskripsi: kelas.deskripsi || '', wali_kelas_id: kelas.wali_kelas_id || '', jadwal: kelas.jadwal || [], zona_waktu: kelas.zona_waktu || 'Asia/Makassar' }); setActiveModal('edit');
  };

  const closeModal = () => { setActiveModal(null); setSelectedKelas(null); setSantriInKelas([]); };
  const handleInputChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await kelasAPI.update(selectedKelas.id, formData); await loadData(); closeModal(); } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const handleExport = () => {
    const csv = ['Urutan,Kode,Nama,Jumlah Santri', ...kelasList.map(k => `${k.urutan},${k.kode_kelas},${k.nama_kelas},${k.jumlah_santri||0}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data_kelas_tpq.csv'; a.click();
  };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div><h1 className="page-title">Data Kelas</h1><p className="page-subtitle">Manajemen kelas dan rombongan belajar (18 level Qiraati)</p></div>
      </div>

      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama kelas..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={handleExport}>
            <Download size={18} /> Export Data
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>Urutan</th><th>Kode Kelas</th><th>Nama Kelas</th><th>Wali Kelas</th><th>Jadwal</th><th>Jumlah Santri</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : kelasList.filter(k => k.nama_kelas.toLowerCase().includes(search.toLowerCase())).map(kelas => (
                <tr key={kelas.id}>
                  <td>{kelas.urutan}</td><td>{kelas.kode_kelas}</td><td className="font-medium">{kelas.nama_kelas}</td>
                  <td>{kelas.wali_kelas?.nama_lengkap || '-'}</td>
                  <td>{kelas.jadwal?.length ? kelas.jadwal.map((j, i) => <div key={i} className="text-xs">{DAYS[j.hari]} {j.mulai}–{j.selesai} {ZONES[kelas.zona_waktu || 'Asia/Makassar']}</div>) : <span className="text-xs text-gray-400">Belum diatur</span>}</td>
                  <td>{kelas.jumlah_santri || 0} Santri</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Lihat Santri" onClick={() => openViewSantri(kelas)}><Users size={18} /></button>
                      <button className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Edit Kelas" onClick={() => openEdit(kelas)}><Edit size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'edit' && selectedKelas && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '620px' }}>
          <div className="modal-header"><h2 className="modal-title">Edit Kelas: {selectedKelas.nama_kelas}</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmit}><div className="modal-body space-y-4">
            <div className="form-group">
              <label className="form-label">Wali Kelas</label>
              <select name="wali_kelas_id" value={formData.wali_kelas_id} onChange={handleInputChange} className="input-field">
                <option value="">-- Pilih Wali Kelas --</option>
                {guruList.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Deskripsi</label><textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} className="input-field" rows="3" style={{ resize: 'none' }}></textarea></div>
            <div className="form-group"><label className="form-label">Zona Waktu</label><select name="zona_waktu" className="input-field" value={formData.zona_waktu} onChange={handleInputChange}>{Object.entries(ZONES).map(([zone, label]) => <option key={zone} value={zone}>{label}</option>)}</select></div>
            <div className="form-group">
              <label className="form-label">Jadwal Hari dan Jam</label>
              <p className="text-xs text-gray-500 mb-3">Tambah sesi sesuai kebutuhan. Jam selesai pada hari yang sama. Absensi guru dihitung dari awal sesi pertama sampai akhir sesi terakhir kelas yang diampu.</p>
              {formData.jadwal.map((j, i) => <div className="schedule-session" key={i}>
                <select className="input-field" aria-label={`Hari sesi ${i + 1}`} value={j.hari} onChange={e => setFormData(f => ({ ...f, jadwal: f.jadwal.map((v, idx) => idx === i ? { ...v, hari: Number(e.target.value) } : v) }))}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
                <input required type="time" className="input-field" aria-label={`Jam mulai sesi ${i + 1}`} value={j.mulai} onChange={e => setFormData(f => ({ ...f, jadwal: f.jadwal.map((v, idx) => idx === i ? { ...v, mulai: e.target.value } : v) }))} />
                <input required type="time" className="input-field" aria-label={`Jam selesai sesi ${i + 1}`} value={j.selesai} onChange={e => setFormData(f => ({ ...f, jadwal: f.jadwal.map((v, idx) => idx === i ? { ...v, selesai: e.target.value } : v) }))} />
                <button type="button" title="Hapus sesi" onClick={() => setFormData(f => ({ ...f, jadwal: f.jadwal.filter((_, idx) => idx !== i) }))}><X size={18} /></button>
              </div>)}
              <button type="button" className="btn-primary" onClick={() => setFormData(f => ({ ...f, jadwal: [...f.jadwal, { hari: 1, mulai: '16:00', selesai: '17:00' }] }))}><Plus size={16} /> Tambah Sesi</button>
            </div>
            {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={18} /> Simpan</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'view_santri' && selectedKelas && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><BookOpen size={24} /></div>
              <div><h2 className="modal-title">Daftar Santri - {selectedKelas.nama_kelas}</h2><p className="text-xs text-gray-500">{selectedKelas.jumlah_santri || 0} santri terdaftar</p></div>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <div className="modal-body">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[{ id: 'aktif', label: 'Aktif' }, { id: 'keluar', label: 'Keluar' }].map(tab => (
                <button key={tab.id} onClick={() => loadSantriByTab(selectedKelas, tab.id)} style={{
                  padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  border: santriTab === tab.id ? '1.5px solid #10b981' : '1.5px solid #e5e7eb',
                  backgroundColor: santriTab === tab.id ? '#f0fdf4' : '#ffffff',
                  color: santriTab === tab.id ? '#047857' : '#6b7280'
                }}>{tab.label}</button>
              ))}
            </div>
            {loadingSantri ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
            : santriInKelas.length === 0 ? <p className="text-center text-gray-400 py-8">{santriTab === 'aktif' ? 'Belum ada santri aktif di kelas ini' : 'Belum ada santri keluar dari kelas ini'}</p>
            : <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {santriInKelas.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border"><User size={16} /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.nama_lengkap}</p>
                      <p className="text-xs text-gray-400">NIS: {s.nomor_induk}{s.tanggal_keluar ? ` • Keluar: ${new Date(s.tanggal_keluar).toLocaleDateString('id-ID')}` : ''}</p>
                    </div>
                  </div>
                  <span className={`badge ${s.status === 'aktif' ? 'badge-success' : ''} text-[10px] py-1 px-2`} style={s.status !== 'aktif' ? { backgroundColor: s.status === 'lulus' ? '#dbeafe' : '#fef2f2', color: s.status === 'lulus' ? '#1e40af' : '#991b1b' } : {}}>
                    {s.status === 'pindah' ? 'Keluar' : s.status === 'lulus' ? 'Khotam' : s.status}
                  </span>
                </div>
              ))}
            </div>}
          </div>
          <div className="modal-footer"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}
    </div>
  );
};

export default KelasPage;
