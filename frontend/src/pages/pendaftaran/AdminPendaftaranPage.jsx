import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Filter, CheckCircle2, XCircle, Clock, 
  Eye, Trash2, Check, RefreshCw, Printer, AlertCircle, Phone, 
  Calendar, BookOpen, MapPin, User, ArrowRight, Loader2, Download
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
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

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
      showActionMsg('error', 'Gagal memuat data pendaftaran: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const showActionMsg = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: '', text: '' }), 4000);
  };

  const handleOpenApprove = (item) => {
    // Generate suggested NIS (year + 4 digits e.g. 260596)
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
      await pendaftaranAPI.approve(approveItem.id, approveForm);
      showActionMsg('success', `Santri ${approveItem.nama_lengkap} berhasil diterima dan dimasukkan ke data santri aktif!`);
      setApproveItem(null);
      loadData();
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
      showActionMsg('success', `Pendaftaran atas nama ${name} ditolak.`);
      loadData();
    } catch (e) {
      alert('Gagal mengupdate status: ' + e.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus permanen pendaftaran ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await pendaftaranAPI.delete(id);
      showActionMsg('success', 'Data pendaftaran berhasil dihapus.');
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

  // Counters
  const counts = {
    total: pendaftaranList.length,
    menunggu: pendaftaranList.filter(i => i.status === 'menunggu').length,
    diterima: pendaftaranList.filter(i => i.status === 'diterima').length,
    ditolak: pendaftaranList.filter(i => i.status === 'ditolak').length
  };

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionMessage.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Pendaftaran Santri Baru</h1>
              <p className="text-xs text-slate-500">Kelola dan verifikasi pendaftaran calon santri baru TPQ</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('semua')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${statusFilter === 'semua' ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendaftar</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('menunggu')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${statusFilter === 'menunggu' ? 'border-amber-500 ring-2 ring-amber-100 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} /> Menunggu Verifikasi
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{counts.menunggu}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('diterima')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${statusFilter === 'diterima' ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Diterima (Santri Aktif)
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{counts.diterima}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('ditolak')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${statusFilter === 'ditolak' ? 'border-rose-500 ring-2 ring-rose-100 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle size={14} /> Ditolak
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{counts.ditolak}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama, no. registrasi, HP..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="semua">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="diterima">Diterima</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Registrasi</th>
                <th className="py-3.5 px-4">Calon Santri</th>
                <th className="py-3.5 px-4">JK</th>
                <th className="py-3.5 px-4">Orang Tua / Wali</th>
                <th className="py-3.5 px-4">WhatsApp / HP</th>
                <th className="py-3.5 px-4">Pilihan Kelas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data pendaftaran...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada pendaftaran dengan kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800">
                      {item.nomor_pendaftaran}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.nama_lengkap}</div>
                      {item.nama_panggilan && (
                        <div className="text-[11px] text-slate-500">Panggilan: {item.nama_panggilan}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.jenis_kelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {item.jenis_kelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.nama_ayah || item.nama_ibu || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <a 
                        href={`https://wa.me/${item.no_hp.replace(/^0/, '62').replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        <Phone size={13} /> {item.no_hp}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.kelas?.nama_kelas || <span className="text-slate-400 italic">Tes Penempatan</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'menunggu' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} /> Menunggu
                        </span>
                      )}
                      {item.status === 'diterima' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Diterima
                        </span>
                      )}
                      {item.status === 'ditolak' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          title="Lihat Detail"
                          onClick={() => setDetailItem(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {item.status === 'menunggu' && (
                          <>
                            <button
                              type="button"
                              title="Terima & Masukkan ke Santri"
                              onClick={() => handleOpenApprove(item)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium text-xs flex items-center gap-1 px-2"
                            >
                              <Check size={14} /> Terima
                            </button>

                            <button
                              type="button"
                              title="Tolak Pendaftaran"
                              onClick={() => handleReject(item.id, item.nama_lengkap)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          title="Hapus"
                          onClick={() => handleDelete(item.id, item.nama_lengkap)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={15} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Detail Calon Santri
                </span>
                <h3 className="text-xl font-bold text-slate-800">{detailItem.nama_lengkap}</h3>
                <span className="font-mono text-xs text-slate-500">{detailItem.nomor_pendaftaran}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Jenis Kelamin</span>
                  <span className="font-semibold text-slate-800">
                    {detailItem.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tempat & Tanggal Lahir</span>
                  <span className="font-semibold text-slate-800">
                    {detailItem.tempat_lahir || '-'}, {detailItem.tanggal_lahir || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nama Ayah</span>
                  <span className="font-semibold text-slate-800">{detailItem.nama_ayah || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nama Ibu</span>
                  <span className="font-semibold text-slate-800">{detailItem.nama_ibu || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">No. WhatsApp / HP</span>
                  <span className="font-semibold text-emerald-700">{detailItem.no_hp}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Alamat Tinggal</span>
                  <span className="font-semibold text-slate-800">{detailItem.alamat || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block font-semibold mb-1">Catatan / Keterangan Calon Santri:</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 italic">
                  {detailItem.catatan || 'Tidak ada catatan khusus.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Tutup
                </button>
                {detailItem.status === 'menunggu' && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      handleOpenApprove(item);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Check size={16} /> Terima Santri
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Penerimaan Santri</h3>
                <p className="text-xs text-slate-500">{approveItem.nama_lengkap}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Induk Santri (NIS) Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={approveForm.nomor_induk}
                  onChange={(e) => setApproveForm(prev => ({ ...prev, nomor_induk: e.target.value }))}
                  required
                  placeholder="Contoh: 260596"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  NIS ini akan menjadi identitas resmi dan ID login santri.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempatkan di Kelas / Jilid <span className="text-rose-500">*</span>
                </label>
                <select
                  value={approveForm.kelas_id}
                  onChange={(e) => setApproveForm(prev => ({ ...prev, kelas_id: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                Dengan menyetujui, calon santri ini akan otomatis tersimpan di tabel <strong>Santri Aktif</strong> dan akun login santri dengan password bawaan siap digunakan.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setApproveItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
                  {processing ? 'Menyimpan...' : 'Terima Santri Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendaftaranPage;
