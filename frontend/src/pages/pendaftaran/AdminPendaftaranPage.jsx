import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Filter, CheckCircle2, XCircle, Clock, 
  Eye, Trash2, Check, RefreshCw, Printer, AlertCircle, Phone, 
  Calendar, BookOpen, MapPin, User, ArrowRight, Loader2, Download, X,
  MessageCircle, Copy, ExternalLink
} from 'lucide-react';
import { pendaftaranAPI, kelasAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const AdminPendaftaranPage = () => {
  const [pendaftaranList, setPendaftaranList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  
  // Modals
  const [detailItem, setDetailItem] = useState(null);
  const [approveItem, setApproveItem] = useState(null);
  const [approveForm, setApproveForm] = useState({ nomor_induk: '', kelas_id: '' });
  const [processing, setProcessing] = useState(false);

  // WhatsApp Modal State
  const [waModalItem, setWaModalItem] = useState(null);
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'semua') params.status = statusFilter;
      
      const [list, kelas] = await Promise.all([
        pendaftaranAPI.getAll(params),
        kelasList.length === 0 ? kelasAPI.getAll() : Promise.resolve(kelasList)
      ]);
      
      setPendaftaranList(list || []);
      if (kelasList.length === 0 && kelas) setKelasList(kelas);
    } catch (e) {
      console.error(e);
      alert('Gagal memuat data pendaftaran: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const generateWhatsAppMessage = (item) => {
    const nama = item.nama_lengkap || '';
    const jk = item.jenis_kelamin === 'P' ? 'Putri' : 'Putra';
    const nis = item.santri?.nomor_induk || item.nomor_induk || '';
    const username = item.santri?.nomor_induk || item.nomor_induk || (nis || '');
    const password = item.santri?.password || (nis ? `siswa${nis.slice(-4)}` : '');

    return `Assalamualaikum Warahmatullahi Wabarakatuh
Kepada Yth.
Orang Tua/Wali dari
${nama}

Selamat kepada Bapak/Ibu Wali Santri dari ${nama}.
${jk} anda dinyatakan diterima sebagai santri baru di TPQ Anfak Al Aziziah dengan nomor induk ${nis}.
Semoga ananda diberikan kelancaran, keberkahan, dan kemudahan dalam menuntut ilmu di TPQ Anfak Al Aziziah. Dan semoga mendapatkan ilmu yang bermanfaat serta menjadi anak yang sholeh/sholehah.
Selanjutnya untuk informasi administrasi, tabungan santri bisa mengakses Link Web Aplikasi : https://tpq-anfak-alaziziah.vercel.app/login atau Link Apk Android : https://bit.ly/TPQ_AAA_Digital
Dengan rincian akun sebagai berikut
Username : ${username}
Password : ${password} (Password bisa dirubah setelah login)

Terima kasih atas kepercayaanya.
Wassalamualaikum warahmatullahi wabarakatuh.
Admin TPQ Anfak Al Aziziah`;
  };

  const handleOpenWhatsApp = (item) => {
    setWaModalItem(item);
    setWaPhone(item.no_hp || item.santri?.no_hp_wali || '');
    setWaMessage(generateWhatsAppMessage(item));
    setCopied(false);
  };

  const handleSendWhatsApp = () => {
    const phone = cleanPhone(waPhone);
    if (!phone) {
      alert('Nomor WhatsApp tidak boleh kosong');
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      alert('Gagal menyalin teks');
    }
  };

  const handleOpenApprove = (item) => {
    const yearPrefix = String(new Date().getFullYear()).slice(-2);
    const suggestedNis = `${yearPrefix}${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    setApproveForm({
      nomor_induk: suggestedNis,
      kelas_id: item.kelas_id || (kelasList[0]?.id || '')
    });
    setApproveItem(item);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approveForm.nomor_induk.trim()) {
      alert('Nomor Induk Santri (NIS) wajib diisi');
      return;
    }

    setProcessing(true);
    try {
      const res = await pendaftaranAPI.approve(approveItem.id, approveForm);
      const createdSantri = res?.data?.santri || {
        nomor_induk: approveForm.nomor_induk,
        password: 'siswa' + approveForm.nomor_induk.slice(-4)
      };
      
      const updatedApprovedItem = {
        ...approveItem,
        status: 'diterima',
        santri: createdSantri,
        nomor_induk: approveForm.nomor_induk
      };

      setApproveItem(null);
      await loadData();

      // Buka modal WhatsApp langsung untuk kemudahan konfirmasi
      handleOpenWhatsApp(updatedApprovedItem);
    } catch (e) {
      alert('Gagal memproses persetujuan: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Yakin ingin menolak pendaftaran atas nama ${name}?`)) return;
    try {
      await pendaftaranAPI.update(id, { status: 'ditolak' });
      alert(`Pendaftaran atas nama ${name} ditolak.`);
      loadData();
    } catch (e) {
      alert('Gagal mengupdate status: ' + e.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus permanen data pendaftaran ${name}?`)) return;
    try {
      await pendaftaranAPI.delete(id);
      loadData();
    } catch (e) {
      alert('Gagal menghapus data: ' + e.message);
    }
  };

  const filteredList = pendaftaranList.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(s)) ||
      (item.nomor_pendaftaran && item.nomor_pendaftaran.toLowerCase().includes(s)) ||
      (item.no_hp && item.no_hp.toLowerCase().includes(s)) ||
      (item.nama_ayah && item.nama_ayah.toLowerCase().includes(s))
    );
  });

  const counts = {
    total: pendaftaranList.length,
    menunggu: pendaftaranList.filter(i => i.status === 'menunggu').length,
    diterima: pendaftaranList.filter(i => i.status === 'diterima').length,
    ditolak: pendaftaranList.filter(i => i.status === 'ditolak').length
  };

  return (
    <div className="flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="page-title">Pendaftaran Santri Baru</h1>
          <p className="page-subtitle">Kelola dan verifikasi formulir pendaftaran calon santri baru online</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn-primary" 
            style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }}
            onClick={loadData}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid-4-cols mb-6 no-print">
        <div 
          className="card stat-card" 
          style={{ padding: '20px', cursor: 'pointer', border: statusFilter === 'semua' ? '2px solid var(--color-primary-container)' : '1px solid var(--color-surface-container-highest)' }}
          onClick={() => setStatusFilter('semua')}
        >
          <div className="stat-title">Total Pendaftar</div>
          <div className="stat-value" style={{ color: 'var(--color-primary-container)' }}>{counts.total}</div>
          <div className="stat-subtext">Semua Calon Santri</div>
        </div>

        <div 
          className="card stat-card" 
          style={{ padding: '20px', cursor: 'pointer', border: statusFilter === 'menunggu' ? '2px solid #d97706' : '1px solid var(--color-surface-container-highest)', backgroundColor: '#fffbeb' }}
          onClick={() => setStatusFilter('menunggu')}
        >
          <div className="stat-title" style={{ color: '#b45309' }}>Menunggu Verifikasi</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{counts.menunggu}</div>
          <div className="stat-subtext" style={{ color: '#b45309' }}>Perlu Ditindaklanjuti</div>
        </div>

        <div 
          className="card stat-card" 
          style={{ padding: '20px', cursor: 'pointer', border: statusFilter === 'diterima' ? '2px solid #16a34a' : '1px solid var(--color-surface-container-highest)', backgroundColor: '#f0fdf4' }}
          onClick={() => setStatusFilter('diterima')}
        >
          <div className="stat-title" style={{ color: '#15803d' }}>Diterima (Santri Aktif)</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{counts.diterima}</div>
          <div className="stat-subtext" style={{ color: '#15803d' }}>Sudah Terdaftar</div>
        </div>

        <div 
          className="card stat-card" 
          style={{ padding: '20px', cursor: 'pointer', border: statusFilter === 'ditolak' ? '2px solid #dc2626' : '1px solid var(--color-surface-container-highest)', backgroundColor: '#fef2f2' }}
          onClick={() => setStatusFilter('ditolak')}
        >
          <div className="stat-title" style={{ color: '#b91c1c' }}>Ditolak</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{counts.ditolak}</div>
          <div className="stat-subtext" style={{ color: '#b91c1c' }}>Tidak Memenuhi Syarat</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card w-full no-print">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 flex-wrap">
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon" size={18} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Cari nama, no reg, HP..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <div className="input-with-icon">
              <Filter className="icon" size={18} />
              <select 
                className="input-field" 
                style={{ paddingLeft: '40px' }} 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="semua">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="diterima">Diterima</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            Menampilkan {filteredList.length} Pendaftar
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>No. Registrasi</th>
                <th>Calon Santri</th>
                <th style={{ width: '50px' }}>JK</th>
                <th>Orang Tua / Wali</th>
                <th>WhatsApp / HP</th>
                <th>Pilihan Kelas</th>
                <th style={{ width: '110px' }}>Status</th>
                <th className="text-center" style={{ width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center" style={{ padding: '40px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-primary-container)' }} />
                    <span style={{ color: '#64748b' }}>Memuat data pendaftaran...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>
                    Belum ada pendaftaran calon santri pada kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary-container)' }}>
                        {item.nomor_pendaftaran}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.nama_lengkap}</div>
                      {item.nama_panggilan && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Panggilan: {item.nama_panggilan}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.jenis_kelamin === 'L' ? 'badge-info' : ''}`} style={item.jenis_kelamin !== 'L' ? { backgroundColor: '#fce7f3', color: '#9d174d' } : {}}>
                        {item.jenis_kelamin || 'L'}
                      </span>
                    </td>
                    <td>{item.nama_ayah || item.nama_ibu || '-'}</td>
                    <td>
                      <a 
                        href={`https://wa.me/${(item.no_hp || '').replace(/^0/, '62').replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 'bold' }}
                      >
                        <Phone size={14} /> {item.no_hp}
                      </a>
                    </td>
                    <td>{item.kelas?.nama_kelas || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tes Penempatan</span>}</td>
                    <td>
                      {item.status === 'menunggu' && (
                        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                          Menunggu
                        </span>
                      )}
                      {item.status === 'diterima' && (
                        <span className="badge badge-success">
                          Diterima
                        </span>
                      )}
                      {item.status === 'ditolak' && (
                        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center items-center gap-1 flex-wrap">
                        <button 
                          style={{ border: 'none', background: 'transparent', color: '#0284c7', cursor: 'pointer', padding: '6px' }}
                          onClick={() => setDetailItem(item)}
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>

                        <button 
                          className="btn-primary" 
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            backgroundColor: '#25D366', 
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderRadius: '6px',
                            border: 'none',
                            fontWeight: '600'
                          }}
                          onClick={() => handleOpenWhatsApp(item)}
                          title="Kirim Pesan WhatsApp Penerimaan"
                        >
                          <MessageCircle size={14} /> WA
                        </button>

                        {item.status === 'menunggu' && (
                          <>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#059669' }}
                              onClick={() => handleOpenApprove(item)}
                              title="Terima Santri"
                            >
                              <Check size={14} /> Terima
                            </button>
                            <button 
                              style={{ border: 'none', background: 'transparent', color: '#ea580c', cursor: 'pointer', padding: '6px' }}
                              onClick={() => handleReject(item.id, item.nama_lengkap)}
                              title="Tolak"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}

                        <button 
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                          onClick={() => handleDelete(item.id, item.nama_lengkap)}
                          title="Hapus"
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

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Detail Calon Santri Baru</h2>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                  {detailItem.nomor_pendaftaran} &bull; Tgl: {new Date(detailItem.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              <X className="modal-close" onClick={() => setDetailItem(null)} />
            </div>

            <div className="modal-body">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '180px', padding: '8px 0', fontWeight: 'bold' }}>Nama Lengkap</td>
                    <td style={{ width: '15px' }}>:</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--color-primary-container)' }}>{detailItem.nama_lengkap}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Nama Panggilan</td>
                    <td>:</td>
                    <td>{detailItem.nama_panggilan || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Jenis Kelamin</td>
                    <td>:</td>
                    <td>{detailItem.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Tempat, Tgl Lahir</td>
                    <td>:</td>
                    <td>{detailItem.tempat_lahir || '-'}, {detailItem.tanggal_lahir || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Hobi / Cita-cita</td>
                    <td>:</td>
                    <td>{detailItem.hobi || '-'} / {detailItem.cita_cita || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Nama Ayah / Ibu</td>
                    <td>:</td>
                    <td>{detailItem.nama_ayah || '-'} / {detailItem.nama_ibu || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>No. WhatsApp</td>
                    <td>:</td>
                    <td>
                      <a 
                        href={`https://wa.me/${(detailItem.no_hp || '').replace(/^0/, '62').replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 'bold' }}
                      >
                        <Phone size={14} /> {detailItem.no_hp}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Alamat Tinggal</td>
                    <td>:</td>
                    <td>{detailItem.alamat || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>RT / RW</td>
                    <td>:</td>
                    <td>RT {detailItem.rt || '-'} / RW {detailItem.rw || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Desa / Kelurahan</td>
                    <td>:</td>
                    <td>{detailItem.desa || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Kecamatan</td>
                    <td>:</td>
                    <td>{detailItem.kecamatan || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Kabupaten / Kota</td>
                    <td>:</td>
                    <td>{detailItem.kabupaten || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Rekomendasi Kelas</td>
                    <td>:</td>
                    <td>{detailItem.kelas?.nama_kelas || 'Tes Penempatan'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Catatan Khusus</td>
                    <td>:</td>
                    <td style={{ fontStyle: 'italic', color: '#475569' }}>{detailItem.catatan || 'Tidak ada catatan.'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-primary" 
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                onClick={() => setDetailItem(null)}
              >
                Tutup
              </button>
              <button 
                type="button" 
                className="btn-primary"
                style={{ backgroundColor: '#25D366', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  const item = detailItem;
                  setDetailItem(null);
                  handleOpenWhatsApp(item);
                }}
              >
                <MessageCircle size={16} /> Hubungi via WA
              </button>
              {detailItem.status === 'menunggu' && (
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => {
                    const item = detailItem;
                    setDetailItem(null);
                    handleOpenApprove(item);
                  }}
                >
                  <Check size={16} /> Lanjut Terima Santri
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveItem && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Konfirmasi Terima Santri</h2>
              <X className="modal-close" onClick={() => setApproveItem(null)} />
            </div>

            <form onSubmit={handleConfirmApprove}>
              <div className="modal-body">
                <p style={{ fontSize: '14px', marginBottom: '16px', color: '#334155' }}>
                  Calon santri: <strong>{approveItem.nama_lengkap}</strong> akan didaftarkan ke sistem santri aktif TPQ.
                </p>

                <div className="form-group">
                  <label className="form-label">Nomor Induk Santri (NIS) Baru <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '18px', color: 'var(--color-primary-container)' }}
                    value={approveForm.nomor_induk} 
                    onChange={(e) => setApproveForm(prev => ({ ...prev, nomor_induk: e.target.value }))}
                    required 
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    NIS ini akan digunakan untuk nomor administrasi dan ID login santri.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Tempatkan di Kelas <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    className="input-field"
                    style={{ fontWeight: 'bold' }}
                    value={approveForm.kelas_id}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, kelas_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map(k => (
                      <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                    ))}
                  </select>
                </div>

                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#166534' }}>
                  Setelah disetujui, akun santri otomatis aktif dengan password bawaan <strong>siswa{approveForm.nomor_induk.slice(-4)}</strong>.
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                  onClick={() => setApproveItem(null)}
                  disabled={processing}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={processing}>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {processing ? 'Menyimpan...' : 'Terima & Simpan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WHATSAPP MODAL */}
      {waModalItem && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid #25D366' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '50%', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>Kirim Pengumuman ke WhatsApp</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Calon Santri: <strong>{waModalItem.nama_lengkap}</strong> &bull; No. Reg: {waModalItem.nomor_pendaftaran}
                  </span>
                </div>
              </div>
              <X className="modal-close" onClick={() => setWaModalItem(null)} />
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {waModalItem.status !== 'diterima' && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>
                    <strong>Perhatian:</strong> Status pendaftaran saat ini masih <em>{waModalItem.status}</em>. Template di bawah disiapkan untuk pengumuman penerimaan santri baru.
                  </span>
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  Nomor WhatsApp Orang Tua / Wali <span style={{ color: 'red' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={waPhone} 
                    onChange={(e) => setWaPhone(e.target.value)} 
                    placeholder="Contoh: 085743333291"
                    style={{ fontWeight: 'bold', fontSize: '15px', color: '#166534', flex: 1 }}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '8px' }}>
                    Target: <strong>+{cleanPhone(waPhone) || '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>
                    Isi Pesan Konfirmasi Penerimaan (Dapat diedit bebas):
                  </label>
                  <button 
                    type="button" 
                    onClick={handleCopyText}
                    style={{ 
                      border: '1px solid #cbd5e1', 
                      background: copied ? '#dcfce7' : '#ffffff', 
                      color: copied ? '#166534' : '#475569', 
                      borderRadius: '6px', 
                      padding: '4px 10px', 
                      fontSize: '11px', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600'
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Tersalin ke Clipboard!' : 'Salin Pesan'}
                  </button>
                </div>
                <textarea 
                  className="input-field" 
                  rows={14} 
                  value={waMessage} 
                  onChange={(e) => setWaMessage(e.target.value)}
                  style={{ 
                    fontFamily: 'inherit', 
                    fontSize: '13px', 
                    lineHeight: '1.6', 
                    backgroundColor: '#f8fafc',
                    resize: 'vertical',
                    padding: '12px'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                onClick={() => setWaModalItem(null)}
              >
                Tutup
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={handleCopyText}
                  className="btn-primary"
                  style={{ backgroundColor: '#e2e8f0', color: '#334155' }}
                >
                  <Copy size={16} /> {copied ? 'Tersalin' : 'Salin Teks'}
                </button>
                <button 
                  type="button" 
                  onClick={handleSendWhatsApp}
                  className="btn-primary"
                  style={{ backgroundColor: '#25D366', color: '#ffffff', fontWeight: 'bold' }}
                >
                  <ExternalLink size={16} /> Buka WhatsApp & Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendaftaranPage;
