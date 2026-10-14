import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X, Save, Download, User, Briefcase, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { guruAPI } from '../../services/api';
import '../dashboard/Dashboard.css';
import StatisticsCards from '../../components/StatisticsCards';

const GuruPage = () => {
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeModal, setActiveModal] = useState(null);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [formData, setFormData] = useState({ nip: '', nama_lengkap: '', jabatan: '', jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '', nik: '', no_kk: '', alamat: '', rt: '', rw: '', nama_ibu: '', no_hp: '', email: '', status: 'aktif', password: 'guru123' });
  const [files, setFiles] = useState({ foto: null, kk: null, ktp: null, ijazah: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const data = await guruAPI.getAll(); setGuruList(data || []); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (type, guru = null) => {
    setActiveModal(type);
    setFiles({ foto: null, kk: null, ktp: null, ijazah: null }); // Reset files
    if (guru) { 
      setSelectedGuru(guru); 
      setFormData({ 
        nip: guru.nip||'', 
        nama_lengkap: guru.nama_lengkap||'', 
        jabatan: guru.jabatan||'', 
        jenis_kelamin: guru.jenis_kelamin||'L',
        tempat_lahir: guru.tempat_lahir||'',
        tanggal_lahir: guru.tanggal_lahir||'',
        nik: guru.nik||'',
        no_kk: guru.no_kk||'',
        alamat: guru.alamat||'', 
        rt: guru.rt||'',
        rw: guru.rw||'',
        nama_ibu: guru.nama_ibu||'',
        no_hp: guru.no_hp||'', 
        email: guru.email||'', 
        status: guru.status||'aktif',
        password: guru.password || 'guru123'
      }); 
    }
    else { 
      setFormData({ nip: '', nama_lengkap: '', jabatan: '', jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '', nik: '', no_kk: '', alamat: '', rt: '', rw: '', nama_ibu: '', no_hp: '', email: '', status: 'aktif', password: 'guru123' }); 
    }
  };

  const closeModal = () => { setActiveModal(null); setSelectedGuru(null); };
  
  const handleInputChange = (e) => { 
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); 
  };

  const handleFileChange = (e) => {
    setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    
    try {
      const data = new FormData();
      
      // Bersihkan dan masukkan data teks
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        // Jangan masukkan objek (seperti data relasi) atau data kosong
        if (value !== null && typeof value !== 'object') {
          data.append(key, value);
        }
      });

      // Masukkan file
      if (files.foto) data.append('foto', files.foto);
      if (files.kk) data.append('kk', files.kk);
      if (files.ktp) data.append('ktp', files.ktp);
      if (files.ijazah) data.append('ijazah', files.ijazah);

      if (activeModal === 'add') await guruAPI.create(data);
      else await guruAPI.update(selectedGuru.id, data);
      
      await loadData(); 
      closeModal();
    } catch (e) { 
      console.error('Submit Error:', e);
      alert(e.message || 'Terjadi kesalahan saat menyimpan data'); 
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await guruAPI.delete(selectedGuru.id); await loadData(); closeModal(); } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleExport = () => {
    const csv = ['No,NIP,Nama,Jabatan,Telepon,Status', ...filtered.map((g, i) => `${i+1},${g.nip},${g.nama_lengkap},${g.jabatan},${g.no_hp},${g.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data_guru_tpq.csv'; a.click();
  };

  const getDirectGDriveLink = (link) => {
    if (!link) return null;
    let fileId = '';
    if (link.includes('/file/d/')) fileId = link.split('/d/')[1].split('/')[0];
    else if (link.includes('id=')) fileId = link.split('id=')[1].split('&')[0];
    else if (link.includes('drive.google.com/uc?')) {
      const urlObj = new URL(link);
      fileId = urlObj.searchParams.get('id');
    }
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}=s400` : link;
  };

  const filtered = guruList.filter(g => !searchQuery || (g.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) || (g.nip || '').includes(searchQuery));

  const sortedGuru = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal, bVal;
    if (sortConfig.key === 'nip') {
      aVal = a.nip; bVal = b.nip;
    } else if (sortConfig.key === 'nama') {
      aVal = a.nama_lengkap?.toLowerCase(); bVal = b.nama_lengkap?.toLowerCase();
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div><h1 className="page-title">Data Guru</h1><p className="page-subtitle">Kelola data tenaga pengajar dan staf</p></div>
        <button className="btn-primary" onClick={() => openModal('add')}><Plus size={18} /> Tambah Guru</button>
      </div>

      <StatisticsCards loading={loading} items={[
        { label: 'Total Guru', value: guruList.length },
        { label: 'Guru Aktif', value: guruList.filter(g => g.status === 'aktif').length },
        { label: 'Guru Nonaktif', value: guruList.filter(g => g.status === 'nonaktif').length, color: '#64748b' },
        { label: 'Laki-laki', value: guruList.filter(g => g.jenis_kelamin === 'L').length },
        { label: 'Perempuan', value: guruList.filter(g => g.jenis_kelamin === 'P').length },
      ]} />
      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama atau NIP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={handleExport}><Download size={18} /> Export Data</button>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>No</th>
                <th onClick={() => handleSort('nip')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Urutkan NIP">NIP {sortConfig.key === 'nip' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('nama')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Urutkan Nama">Nama Lengkap {sortConfig.key === 'nama' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th>Jabatan</th><th>No. HP</th><th>Status</th><th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : sortedGuru.length === 0 ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data guru</td></tr>
              : sortedGuru.map((guru, i) => (
                <tr key={guru.id}>
                  <td>{i+1}</td><td>{guru.nip}</td><td className="font-medium">{guru.nama_lengkap}</td><td>{guru.jabatan}</td><td>{guru.no_hp}</td>
                  <td><span className={`badge ${guru.status === 'aktif' ? 'badge-success' : ''}`} style={guru.status !== 'aktif' ? { backgroundColor: '#f1f5f9', color: '#64748b' } : {}}>{guru.status}</span></td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => openModal('view', guru)} title="Lihat"><Eye size={18} /></button>
                      <button className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors" onClick={() => openModal('edit', guru)} title="Edit"><Edit size={18} /></button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => openModal('delete', guru)} title="Hapus"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '700px' }}>
          <div className="modal-header"><h2 className="modal-title">{activeModal === 'add' ? 'Tambah Guru Baru' : 'Edit Data Guru'}</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="col-span-2"><h3 className="font-bold text-gray-700 border-b pb-2">Data Pegawai</h3></div>
                <div className="form-group col-span-2"><label className="form-label font-bold text-green-600">Password Login (Manual)</label><input type="text" name="password" value={formData.password} onChange={handleInputChange} className="input-field border-green-400 bg-green-50 text-lg font-bold" required /><p className="text-[10px] text-green-500">Wajib diisi untuk login guru!</p></div>
                <div className="form-group"><label className="form-label">NIP</label><input type="text" name="nip" value={formData.nip} onChange={handleInputChange} className="input-field" required /></div>
                <div className="form-group"><label className="form-label">Nama Lengkap</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} className="input-field" required /></div>
                <div className="form-group"><label className="form-label">Jabatan</label><input type="text" name="jabatan" value={formData.jabatan} onChange={handleInputChange} className="input-field" required /></div>
                <div className="form-group"><label className="form-label">Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="input-field"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></div>

                <div className="col-span-2 mt-2"><h3 className="font-bold text-gray-700 border-b pb-2">Data Pribadi</h3></div>
                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} className="input-field">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">No. KK</label><input type="text" name="no_kk" value={formData.no_kk} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group"><label className="form-label">Tempat Lahir</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group"><label className="form-label">Tanggal Lahir</label><input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group"><label className="form-label">NIK</label><input type="text" name="nik" value={formData.nik} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group"><label className="form-label">Nama Ibu Kandung</label><input type="text" name="nama_ibu" value={formData.nama_ibu} onChange={handleInputChange} className="input-field" /></div>

                <div className="col-span-2 mt-2"><h3 className="font-bold text-gray-700 border-b pb-2">Kontak & Alamat</h3></div>
                <div className="form-group"><label className="form-label">No. Telepon</label><input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group col-span-2"><label className="form-label">Alamat Lengkap</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} className="input-field" rows="2" style={{ resize: 'none' }}></textarea></div>
                <div className="form-group"><label className="form-label">RT</label><input type="text" name="rt" value={formData.rt} onChange={handleInputChange} className="input-field" /></div>
                <div className="form-group"><label className="form-label">RW</label><input type="text" name="rw" value={formData.rw} onChange={handleInputChange} className="input-field" /></div>
                
                {/* Upload Section */}
                <div className="col-span-2 pt-4 mt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Dokumen Guru</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group"><label className="form-label text-sm">Pas Foto</label><input type="file" name="foto" accept="image/*" onChange={handleFileChange} className="input-field p-2 text-sm" /></div>
                    <div className="form-group"><label className="form-label text-sm">Scan KTP</label><input type="file" name="ktp" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 text-sm" /></div>
                    <div className="form-group"><label className="form-label text-sm">Scan KK</label><input type="file" name="kk" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 text-sm" /></div>
                    <div className="form-group"><label className="form-label text-sm">Ijazah Terakhir</label><input type="file" name="ijazah" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 text-sm" /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
              <button 
                type="submit" 
                className={`btn-primary ${saving ? 'opacity-80 cursor-wait' : ''}`} 
                disabled={saving}
                style={saving ? { background: 'linear-gradient(90deg, var(--color-primary) 0%, #1a4d2e 100%)', animation: 'pulse 2s infinite' } : {}}
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin mr-2" /><span>Menyimpan & Upload...</span></>
                ) : (
                  <><Save size={18} className="mr-2" /><span>Simpan Data</span></>
                )}
              </button>
            </div>
          </form>
        </div></div>
      )}

      {activeModal === 'view' && selectedGuru && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '500px' }}>
          <div className="modal-header"><h2 className="modal-title">Detail Guru</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body">
            <div className="flex flex-col items-center mb-6">
              {selectedGuru.foto_url ? (
                <img src={getDirectGDriveLink(selectedGuru.foto_url)} referrerPolicy="no-referrer" alt="Foto Guru" className="w-24 h-24 rounded-full object-cover border-2 border-gold mb-3 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3"><User size={48} /></div>
              )}
              {selectedGuru.foto_url && <a href={selectedGuru.foto_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline mb-2">Buka Foto Asli ↗</a>}
              <h3 className="text-xl font-bold text-gray-800">{selectedGuru.nama_lengkap}</h3>
              <p className="text-gray-500">{selectedGuru.nip}</p>
              <span className={`mt-2 badge ${selectedGuru.status === 'aktif' ? 'badge-success' : ''}`}>{selectedGuru.status}</span>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Briefcase size={20} className="text-gray-400" /><div><p className="text-xs text-gray-500">Jabatan</p><p className="font-medium text-gray-800">{selectedGuru.jabatan}</p></div></div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Phone size={20} className="text-gray-400" /><div><p className="text-xs text-gray-500">No. Telepon</p><p className="font-medium text-gray-800">{selectedGuru.no_hp || '-'}</p></div></div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Detail Pribadi</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Gender:</span> {selectedGuru.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</div>
                  <div><span className="text-gray-500">TTL:</span> {selectedGuru.tempat_lahir || '-'}, {selectedGuru.tanggal_lahir || '-'}</div>
                  <div><span className="text-gray-500">NIK:</span> {selectedGuru.nik || '-'}</div>
                  <div><span className="text-gray-500">No. KK:</span> {selectedGuru.no_kk || '-'}</div>
                  <div className="col-span-2"><span className="text-gray-500">Nama Ibu Kandung:</span> {selectedGuru.nama_ibu || '-'}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Kontak & Alamat</h4>
                <div className="mb-2"><span className="text-gray-500">Email:</span> {selectedGuru.email || '-'}</div>
                <p className="mb-1"><span className="text-gray-500">Alamat:</span> {selectedGuru.alamat || '-'}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">RT/RW:</span> {selectedGuru.rt || '-'}/{selectedGuru.rw || '-'}</div>
                </div>
              </div>
              
              {/* Dokumen Section */}
              {(selectedGuru.kk_url || selectedGuru.ktp_url || selectedGuru.ijazah_url) && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dokumen Lampiran</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedGuru.ktp_url && <a href={selectedGuru.ktp_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-all border border-blue-100"><span className="flex items-center gap-2 font-medium"><Download size={16} /> Scan KTP</span><Eye size={16} /></a>}
                    {selectedGuru.kk_url && <a href={selectedGuru.kk_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 transition-all border border-indigo-100"><span className="flex items-center gap-2 font-medium"><Download size={16} /> Kartu Keluarga</span><Eye size={16} /></a>}
                    {selectedGuru.ijazah_url && <a href={selectedGuru.ijazah_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-all border border-emerald-100"><span className="flex items-center gap-2 font-medium"><Download size={16} /> Ijazah Terakhir</span><Eye size={16} /></a>}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}

      {activeModal === 'delete' && selectedGuru && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '400px' }}>
          <div className="modal-header border-none"><h2 className="modal-title">Hapus Guru</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <p className="text-gray-600 mb-2">Apakah Anda yakin ingin menghapus data guru ini?</p>
            <p className="font-bold text-gray-800 text-lg">{selectedGuru.nama_lengkap}</p>
          </div>
          <div className="modal-footer border-none pt-0">
            <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button className="btn-primary" style={{ backgroundColor: '#dc2626' }} onClick={handleDelete} disabled={saving}>{saving ? 'Menghapus...' : 'Hapus Sekarang'}</button>
          </div>
        </div></div>
      )}
    </div>
  );
};

export default GuruPage;

