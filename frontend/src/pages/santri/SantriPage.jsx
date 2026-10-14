import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, X, Save, User, UserCheck, Calendar, Phone, MapPin, Loader2 } from 'lucide-react';
import { santriAPI, kelasAPI } from '../../services/api';
import '../dashboard/Dashboard.css';
import StatisticsCards from '../../components/StatisticsCards';

const SantriPage = () => {
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [formData, setFormData] = useState({
    nomor_induk: '', nama_lengkap: '', nama_panggilan: '', kelas_id: '',
    no_hp_wali: '', no_hp_ayah: '', no_hp_ibu: '', alamat: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'L',
    anak_ke: '', jumlah_saudara: '', nik: '', rt: '', rw: '', desa: '', kecamatan: '', kabupaten: '',
    hobi: '', cita_cita: '', no_kk: '', nama_ayah: '', nik_ayah: '', pekerjaan_ayah: '', pendidikan_ayah: '',
    nama_ibu: '', nik_ibu: '', pekerjaan_ibu: '', pendidikan_ibu: '', nama_wali: '', pekerjaan_wali: '',
    hubungan_keluarga: '', tanggal_daftar: '', tanggal_keluar: '',
    foto: null, kk: null, akte: null
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [santri, kelas] = await Promise.all([
        santriAPI.getAll().catch(() => []),
        kelasAPI.getAll().catch(() => [])
      ]);
      setSantriList(santri || []);
      setKelasList(kelas || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (type, santri = null) => {
    setActiveModal(type);
    if (santri) {
      setSelectedSantri(santri);
      setFormData({
        nomor_induk: santri.nomor_induk || '',
        nama_lengkap: santri.nama_lengkap || '',
        nama_panggilan: santri.nama_panggilan || '',
        kelas_id: santri.kelas_id || '',
        status: santri.status || 'aktif',
        no_hp_wali: santri.no_hp_wali || '',
        no_hp_ayah: santri.no_hp_ayah || '',
        no_hp_ibu: santri.no_hp_ibu || '',
        alamat: santri.alamat || '',
        tempat_lahir: santri.tempat_lahir || '',
        tanggal_lahir: santri.tanggal_lahir || '',
        jenis_kelamin: santri.jenis_kelamin || 'L',
        anak_ke: santri.anak_ke || '',
        jumlah_saudara: santri.jumlah_saudara || '',
        nik: santri.nik || '',
        rt: santri.rt || '',
        rw: santri.rw || '',
        desa: santri.desa || '',
        kecamatan: santri.kecamatan || '',
        kabupaten: santri.kabupaten || '',
        hobi: santri.hobi || '',
        cita_cita: santri.cita_cita || '',
        no_kk: santri.no_kk || '',
        nama_ayah: santri.nama_ayah || '',
        nik_ayah: santri.nik_ayah || '',
        pekerjaan_ayah: santri.pekerjaan_ayah || '',
        pendidikan_ayah: santri.pendidikan_ayah || '',
        nama_ibu: santri.nama_ibu || '',
        nik_ibu: santri.nik_ibu || '',
        pekerjaan_ibu: santri.pekerjaan_ibu || '',
        pendidikan_ibu: santri.pendidikan_ibu || '',
        nama_wali: santri.nama_wali || '',
        pekerjaan_wali: santri.pekerjaan_wali || '',
        hubungan_keluarga: santri.hubungan_keluarga || '',
        tanggal_daftar: santri.tanggal_daftar || '',
        tanggal_keluar: santri.tanggal_keluar || '',
        foto: null, kk: null, akte: null,
        password: santri.password || 'siswa123'
      });
    } else {
      setFormData({
        nomor_induk: '', nama_lengkap: '', nama_panggilan: '', kelas_id: '',
        status: 'aktif', no_hp_wali: '', no_hp_ayah: '', no_hp_ibu: '', alamat: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'L',
        anak_ke: '', jumlah_saudara: '', nik: '', rt: '', rw: '', desa: '', kecamatan: '', kabupaten: '',
        hobi: '', cita_cita: '', no_kk: '', nama_ayah: '', nik_ayah: '', pekerjaan_ayah: '', pendidikan_ayah: '',
        nama_ibu: '', nik_ibu: '', pekerjaan_ibu: '', pendidikan_ibu: '', nama_wali: '', pekerjaan_wali: '',
        hubungan_keluarga: '', tanggal_daftar: '', tanggal_keluar: '',
        foto: null, kk: null, akte: null,
        password: 'siswa123'
      });
    }
  };

  const closeModal = () => { setActiveModal(null); setSelectedSantri(null); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build FormData
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (activeModal === 'add') {
        await santriAPI.create(submitData);
      } else {
        await santriAPI.update(selectedSantri.id, submitData);
      }
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await santriAPI.delete(selectedSantri.id);
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleExport = () => {
    const headers = ['No', 'NIS', 'Nama', 'Kelas', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredList.map((s, i) => `${i + 1},${s.nomor_induk},${s.nama_lengkap},${s.kelas?.nama_kelas || '-'},${s.status}`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_santri_tpq.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredList = santriList.filter(s => {
    const matchSearch = !searchQuery || s.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) || s.nomor_induk?.includes(searchQuery);
    const matchKelas = !filterKelas || s.kelas_id === filterKelas;
    return matchSearch && matchKelas;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal, bVal;
    if (sortConfig.key === 'nis') {
      aVal = a.nomor_induk; bVal = b.nomor_induk;
    } else if (sortConfig.key === 'nama') {
      aVal = a.nama_lengkap?.toLowerCase(); bVal = b.nama_lengkap?.toLowerCase();
    } else if (sortConfig.key === 'kelas') {
      aVal = a.kelas?.nama_kelas?.toLowerCase(); bVal = b.kelas?.nama_kelas?.toLowerCase();
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getDirectGDriveLink = (link) => {
    if (!link) return null;
    
    let fileId = '';
    
    // Deteksi ID dari berbagai format link GDrive
    if (link.includes('/file/d/')) {
      fileId = link.split('/d/')[1].split('/')[0];
    } else if (link.includes('id=')) {
      fileId = link.split('id=')[1].split('&')[0];
    } else if (link.includes('drive.google.com/uc?')) {
      // Jika link sudah format uc?, ambil ID-nya saja
      const urlObj = new URL(link);
      fileId = urlObj.searchParams.get('id');
    }

    if (fileId) {
      // Kita gunakan format lh3 dengan tambahan parameter size agar lebih cepat di-load
      return `https://lh3.googleusercontent.com/d/${fileId}=s400`;
    }
    
    return link;
  };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-title">Data Santri</h1>
          <p className="page-subtitle">Kelola data seluruh santri TPQ Anfak Al Azizah</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('add')}>
          <Plus size={18} /> Tambah Santri
        </button>
      </div>

      <StatisticsCards loading={loading} items={[
        { label: 'Total Santri', value: santriList.length },
        { label: 'Santri Aktif', value: santriList.filter(s => s.status === 'aktif').length },
        { label: 'Nonaktif', value: santriList.filter(s => s.status === 'nonaktif').length, color: '#64748b' },
        { label: 'Keluar / Pindah', value: santriList.filter(s => s.status === 'pindah').length, color: '#c2410c' },
        { label: 'Khotam / Lulus', value: santriList.filter(s => s.status === 'lulus').length },
        { label: 'Laki-laki / Perempuan', value: `${santriList.filter(s => s.jenis_kelamin === 'L').length} / ${santriList.filter(s => s.jenis_kelamin === 'P').length}` },
      ]} />
      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1">
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon" size={18} />
              <input type="text" className="input-field" placeholder="Cari nama atau NIS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="input-with-icon">
              <Filter className="icon" size={18} />
              <select className="input-field" style={{ paddingLeft: '40px' }} value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={handleExport}>
            <Download size={18} /> Export Data
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>No</th>
                <th onClick={() => handleSort('nis')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Urutkan NIS">NIS {sortConfig.key === 'nis' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('nama')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Urutkan Nama">Nama Lengkap {sortConfig.key === 'nama' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('kelas')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Urutkan Kelas">Kelas {sortConfig.key === 'kelas' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th>Status</th><th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              ) : sortedList.length === 0 ? (
                <tr><td colSpan="6" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data santri</td></tr>
              ) : sortedList.map((santri, index) => (
                <tr key={santri.id}>
                  <td>{index + 1}</td>
                  <td>{santri.nomor_induk}</td>
                  <td className="font-medium">{santri.nama_lengkap}</td>
                  <td>{santri.kelas?.nama_kelas || '-'}</td>
                  <td>
                    <span className={`badge ${santri.status === 'aktif' ? 'badge-success' : ''}`} style={santri.status !== 'aktif' ? { backgroundColor: '#f1f5f9', color: '#64748b' } : {}}>
                      {santri.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => openModal('view', santri)} title="Lihat"><Eye size={18} /></button>
                      <button className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors" onClick={() => openModal('edit', santri)} title="Edit"><Edit size={18} /></button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => openModal('delete', santri)} title="Hapus"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{activeModal === 'add' ? 'Tambah Santri Baru' : 'Edit Data Santri'}</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-4">
                  {/* DATA PRIBADI */}
                  <div className="col-span-2"><h3 className="font-bold text-gray-700 border-b pb-2">Data Pribadi</h3></div>
                  <div className="form-group col-span-2">
                    <label className="form-label font-bold text-blue-600">Password Login (Manual)</label>
                    <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="input-field border-blue-400 bg-blue-50 text-lg font-bold" required />
                    <p className="text-[10px] text-blue-500">Wajib diisi untuk login siswa!</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor Induk (NIS)</label>
                    <input type="text" name="nomor_induk" value={formData.nomor_induk} onChange={handleInputChange} className="input-field" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">NIK Santri</label>
                    <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} className="input-field" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Panggilan</label>
                    <input type="text" name="nama_panggilan" value={formData.nama_panggilan} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin</label>
                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} className="input-field">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 col-span-1">
                    <div className="form-group">
                      <label className="form-label">Tempat Lahir</label>
                      <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Lahir</label>
                      <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 col-span-2">
                    <div className="form-group">
                      <label className="form-label">Anak Ke</label>
                      <input type="number" name="anak_ke" value={formData.anak_ke} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Jumlah Saudara</label>
                      <input type="number" name="jumlah_saudara" value={formData.jumlah_saudara} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hobi</label>
                      <input type="text" name="hobi" value={formData.hobi} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cita-Cita</label>
                      <input type="text" name="cita_cita" value={formData.cita_cita} onChange={handleInputChange} className="input-field" />
                    </div>
                  </div>

                  {/* DATA ALAMAT */}
                  <div className="col-span-2 mt-2"><h3 className="font-bold text-gray-700 border-b pb-2">Alamat</h3></div>
                  <div className="form-group col-span-2">
                    <label className="form-label">Alamat Lengkap</label>
                    <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} className="input-field" rows="2" style={{ resize: 'none' }}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4 col-span-2">
                    <div className="form-group">
                      <label className="form-label">RT</label>
                      <input type="text" name="rt" value={formData.rt} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">RW</label>
                      <input type="text" name="rw" value={formData.rw} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Desa / Kelurahan</label>
                      <input type="text" name="desa" value={formData.desa} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kecamatan</label>
                      <input type="text" name="kecamatan" value={formData.kecamatan} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group col-span-2">
                      <label className="form-label">Kabupaten / Kota</label>
                      <input type="text" name="kabupaten" value={formData.kabupaten} onChange={handleInputChange} className="input-field" />
                    </div>
                  </div>

                  {/* DATA KELUARGA */}
                  <div className="col-span-2 mt-2"><h3 className="font-bold text-gray-700 border-b pb-2">Data Keluarga</h3></div>
                  <div className="form-group col-span-2">
                    <label className="form-label">Nomor KK</label>
                    <input type="text" name="no_kk" value={formData.no_kk} onChange={handleInputChange} className="input-field" />
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="col-span-2 font-semibold text-sm text-gray-600 mb-1">Data Ayah</div>
                    <div className="form-group"><label className="form-label">Nama Ayah</label><input type="text" name="nama_ayah" value={formData.nama_ayah} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">NIK Ayah</label><input type="text" name="nik_ayah" value={formData.nik_ayah} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Pekerjaan Ayah</label><input type="text" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Pendidikan Ayah</label><input type="text" name="pendidikan_ayah" value={formData.pendidikan_ayah} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group col-span-2"><label className="form-label">No. HP Ayah</label><input type="text" name="no_hp_ayah" value={formData.no_hp_ayah} onChange={handleInputChange} className="input-field" placeholder="Contoh: 0812..." /></div>
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                    <div className="col-span-2 font-semibold text-sm text-gray-600 mb-1">Data Ibu</div>
                    <div className="form-group"><label className="form-label">Nama Ibu</label><input type="text" name="nama_ibu" value={formData.nama_ibu} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">NIK Ibu</label><input type="text" name="nik_ibu" value={formData.nik_ibu} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Pekerjaan Ibu</label><input type="text" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Pendidikan Ibu</label><input type="text" name="pendidikan_ibu" value={formData.pendidikan_ibu} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group col-span-2"><label className="form-label">No. HP Ibu</label><input type="text" name="no_hp_ibu" value={formData.no_hp_ibu} onChange={handleInputChange} className="input-field" placeholder="Contoh: 0812..." /></div>
                  </div>

                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                    <div className="col-span-2 font-semibold text-sm text-gray-600 mb-1">Data Wali (Jika Ada)</div>
                    <div className="form-group"><label className="form-label">Nama Wali</label><input type="text" name="nama_wali" value={formData.nama_wali} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Pekerjaan Wali</label><input type="text" name="pekerjaan_wali" value={formData.pekerjaan_wali} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Hubungan Keluarga</label><input type="text" name="hubungan_keluarga" value={formData.hubungan_keluarga} onChange={handleInputChange} className="input-field" /></div>
                    <div className="form-group"><label className="form-label">Nomor Telepon Wali/Ortu</label><input type="text" name="no_hp_wali" value={formData.no_hp_wali} onChange={handleInputChange} className="input-field" /></div>
                  </div>

                  {/* DATA TPQ */}
                  <div className="col-span-2 mt-2"><h3 className="font-bold text-gray-700 border-b pb-2">Status TPQ</h3></div>
                  <div className="form-group">
                    <label className="form-label">Kelas</label>
                    <select name="kelas_id" value={formData.kelas_id} onChange={handleInputChange} className="input-field" required>
                      <option value="">Pilih Kelas</option>
                      {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="input-field">
                      <option value="aktif">Aktif</option>
                      <option value="lulus">Khotam / Lulus</option>
                      <option value="pindah">Keluar / Pindah</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Masuk</label>
                    <input type="date" name="tanggal_daftar" value={formData.tanggal_daftar} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Keluar / Lulus</label>
                    <input type="date" name="tanggal_keluar" value={formData.tanggal_keluar} onChange={handleInputChange} className="input-field" />
                  </div>
                  
                  {/* File Uploads */}
                  <div className="col-span-2 pt-4 mt-2 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Upload Dokumen (Opsional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label text-sm">Pas Foto (Max 5MB)</label>
                        <input type="file" name="foto" accept="image/*" onChange={handleFileChange} className="input-field p-2 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="form-group">
                        <label className="form-label text-sm">Scan KK (Max 5MB)</label>
                        <input type="file" name="kk" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="form-group">
                        <label className="form-label text-sm">Scan Akte Kelahiran</label>
                        <input type="file" name="akte" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 border border-gray-300 rounded text-sm" />
                      </div>
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
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      <span>Menyimpan & Upload...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      <span>Simpan Data</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {activeModal === 'view' && selectedSantri && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Detail Santri</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <div className="modal-body">
              <div className="flex flex-col items-center mb-6">
                {selectedSantri.foto_url ? (
                  <img 
                    src={getDirectGDriveLink(selectedSantri.foto_url)} 
                    alt="Foto Santri" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gold mb-3 shadow-sm" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3"><User size={48} /></div>
                )}
                
                {/* Fallback link untuk foto jika gambar pecah */}
                {selectedSantri.foto_url && (
                  <a href={selectedSantri.foto_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline mb-2">
                    Buka Foto Asli ↗
                  </a>
                )}
                
                <h3 className="text-xl font-bold text-gray-800">{selectedSantri.nama_lengkap}</h3>
                <p className="text-gray-500">{selectedSantri.nomor_induk}</p>
                <span className={`mt-2 badge ${selectedSantri.status === 'aktif' ? 'badge-success' : ''}`}>{selectedSantri.status}</span>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <UserCheck size={20} className="text-gray-400" />
                    <div><p className="text-xs text-gray-500">Kelas</p><p className="font-medium text-gray-800">{selectedSantri.kelas?.nama_kelas || '-'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={20} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Usia & Tgl Lahir</p>
                      <p className="font-medium text-gray-800">
                        {selectedSantri.tanggal_lahir ? `${Math.floor((new Date() - new Date(selectedSantri.tanggal_lahir)) / 31557600000)} Thn (${selectedSantri.tempat_lahir || ''} ${selectedSantri.tanggal_lahir})` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Detail Pribadi</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Nama Panggilan:</span> {selectedSantri.nama_panggilan || '-'}</div>
                    <div><span className="text-gray-500">Gender:</span> {selectedSantri.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</div>
                    <div><span className="text-gray-500">Anak Ke:</span> {selectedSantri.anak_ke || '-'} dari {selectedSantri.jumlah_saudara || '-'}</div>
                    <div><span className="text-gray-500">NIK:</span> {selectedSantri.nik || '-'}</div>
                    <div><span className="text-gray-500">Hobi:</span> {selectedSantri.hobi || '-'}</div>
                    <div><span className="text-gray-500">Cita-Cita:</span> {selectedSantri.cita_cita || '-'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Alamat Lengkap</h4>
                  <p className="mb-1">{selectedSantri.alamat || '-'}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">RT/RW:</span> {selectedSantri.rt || '-'}/{selectedSantri.rw || '-'}</div>
                    <div><span className="text-gray-500">Desa:</span> {selectedSantri.desa || '-'}</div>
                    <div><span className="text-gray-500">Kecamatan:</span> {selectedSantri.kecamatan || '-'}</div>
                    <div><span className="text-gray-500">Kabupaten:</span> {selectedSantri.kabupaten || '-'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Data Orang Tua & Wali</h4>
                  <div className="mb-1"><span className="text-gray-500">No. KK:</span> {selectedSantri.no_kk || '-'}</div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <div className="font-medium">Ayah: {selectedSantri.nama_ayah || '-'}</div>
                      <div className="text-xs text-gray-500">NIK: {selectedSantri.nik_ayah || '-'}</div>
                      <div className="text-xs text-gray-500">Pekerjaan: {selectedSantri.pekerjaan_ayah || '-'}</div>
                      <div className="text-xs text-gray-500">Pendidikan: {selectedSantri.pendidikan_ayah || '-'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10}/> {selectedSantri.no_hp_ayah || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Ibu: {selectedSantri.nama_ibu || '-'}</div>
                      <div className="text-xs text-gray-500">NIK: {selectedSantri.nik_ibu || '-'}</div>
                      <div className="text-xs text-gray-500">Kerja: {selectedSantri.pekerjaan_ibu || '-'}</div>
                      <div className="text-xs text-gray-500">Pendidikan: {selectedSantri.pendidikan_ibu || '-'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10}/> {selectedSantri.no_hp_ibu || '-'}</div>
                    </div>
                  </div>
                  {(selectedSantri.nama_wali || selectedSantri.no_hp_wali) && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="font-medium">Wali: {selectedSantri.nama_wali || '-'} ({selectedSantri.hubungan_keluarga || 'Hubungan'})</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={12}/> {selectedSantri.no_hp_wali || '-'}</div>
                      <div className="text-xs text-gray-500">Pekerjaan: {selectedSantri.pekerjaan_wali || '-'}</div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Riwayat TPQ</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Tanggal Masuk:</span> {selectedSantri.tanggal_daftar || '-'}</div>
                    <div><span className="text-gray-500">Tanggal Keluar:</span> {selectedSantri.tanggal_keluar || '-'}</div>
                  </div>
                </div>

                {/* Dokumen Section */}
                {(selectedSantri.kk_url || selectedSantri.akte_url) && (
                  <div className="pt-4 border-t border-gray-100 mt-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dokumen Lampiran</h4>
                    <div className="flex flex-col gap-2">
                      {selectedSantri.kk_url && (
                        <a href={selectedSantri.kk_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-all border border-blue-100">
                          <span className="flex items-center gap-2 font-medium"><Download size={16} /> Kartu Keluarga</span>
                          <Eye size={16} />
                        </a>
                      )}
                      {selectedSantri.akte_url && (
                        <a href={selectedSantri.akte_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-all border border-emerald-100">
                          <span className="flex items-center gap-2 font-medium"><Download size={16} /> Akte Kelahiran</span>
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {activeModal === 'delete' && selectedSantri && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header border-none">
              <h2 className="modal-title">Hapus Santri</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <div className="modal-body text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
              <p className="text-gray-600 mb-2">Apakah Anda yakin ingin menghapus data santri ini?</p>
              <p className="font-bold text-gray-800 text-lg">{selectedSantri.nama_lengkap}</p>
              <p className="text-sm text-gray-400 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="modal-footer border-none pt-0">
              <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
              <button className="btn-primary" style={{ backgroundColor: '#dc2626' }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Menghapus...' : 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SantriPage;
