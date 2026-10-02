import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, User, Phone, MapPin, Calendar, BookOpen, 
  ArrowLeft, CheckCircle2, Loader2, Sparkles, Printer, Send
} from 'lucide-react';
import { pendaftaranAPI, kelasAPI } from '../../services/api';
import './Login.css';

const PendaftaranPage = () => {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nama_panggilan: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    nama_ayah: '',
    nama_ibu: '',
    no_hp: '',
    kelas_id: '',
    catatan: ''
  });

  useEffect(() => {
    loadKelas();
  }, []);

  const loadKelas = async () => {
    try {
      const data = await kelasAPI.getAll();
      setKelasList(data || []);
    } catch (e) {
      console.error('Gagal memuat kelas:', e);
    } finally {
      setLoadingKelas(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!formData.nama_lengkap.trim()) {
      setErrorMessage('Nama lengkap calon santri wajib diisi.');
      return;
    }
    if (!formData.no_hp.trim()) {
      setErrorMessage('Nomor WhatsApp / HP Orang Tua wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        kelas_id: formData.kelas_id || null
      };
      const result = await pendaftaranAPI.submitPublic(payload);
      setSuccessData(result);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengirim pendaftaran, silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="login-container min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl my-6">
        
        {/* Header / Navigasi Balik */}
        <div className="flex items-center justify-between mb-4">
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-white hover:text-emerald-200 transition-colors bg-emerald-900/60 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium border border-emerald-700/50 shadow-sm"
          >
            <ArrowLeft size={16} /> Kembali ke Halaman Login
          </button>
        </div>

        {/* Jika Sudah Berhasil Mendaftar */}
        {successData ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-b-4 border-amber-400 text-center animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 size={46} />
            </div>

            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Pendaftaran Diterima
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-950 mb-2">
              Alhamdulillah! Formulir Berhasil Dikirim
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              Data calon santri telah tersimpan di sistem administrasi TPQ Anfak Al Azizah.
            </p>

            {/* Kartu Bukti Pendaftaran */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 text-left shadow-sm">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Nomor Registrasi Pendaftaran</div>
                  <div className="text-2xl font-mono font-bold text-emerald-700">{successData.nomor_pendaftaran}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-semibold">Tanggal Daftar</div>
                  <div className="text-sm font-medium text-slate-700">
                    {new Date(successData.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Nama Lengkap</span>
                  <span className="font-semibold text-slate-800">{successData.nama_lengkap}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Jenis Kelamin</span>
                  <span className="font-semibold text-slate-800">{successData.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Nama Orang Tua (Ayah / Ibu)</span>
                  <span className="font-semibold text-slate-800">
                    {successData.nama_ayah || successData.nama_ibu ? `${successData.nama_ayah || '-'} / ${successData.nama_ibu || '-'}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">WhatsApp / HP</span>
                  <span className="font-semibold text-emerald-700">{successData.no_hp}</span>
                </div>
                {successData.kelas?.nama_kelas && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-xs">Rekomendasi / Pilihan Kelas</span>
                    <span className="font-semibold text-slate-800">{successData.kelas.nama_kelas}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Aksi */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
              >
                <Printer size={18} /> Cetak Bukti Pendaftaran
              </button>

              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo Admin TPQ Anfak Al Azizah, saya ingin konfirmasi pendaftaran santri baru atas nama: ${successData.nama_lengkap} (No. Registrasi: ${successData.nomor_pendaftaran}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all"
              >
                <Send size={18} /> Konfirmasi via WhatsApp
              </a>

              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setFormData({
                    nama_lengkap: '',
                    nama_panggilan: '',
                    jenis_kelamin: 'L',
                    tempat_lahir: '',
                    tanggal_lahir: '',
                    alamat: '',
                    nama_ayah: '',
                    nama_ibu: '',
                    no_hp: '',
                    kelas_id: '',
                    catatan: ''
                  });
                }}
                className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
              >
                Daftar Lagi
              </button>
            </div>
          </div>
        ) : (
          /* Formulir Pendaftaran */
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-2xl border-b-4 border-amber-400">
            {/* Header Form */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-3">
                <Sparkles size={14} className="text-amber-500" /> Penerimaan Santri Baru TPQ
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-serif">
                Formulir Pendaftaran Santri Baru
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                TPQ Anfak Al Azizah — Silakan isi identitas calon santri dengan lengkap dan benar.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                <span className="font-semibold">Perhatian:</span> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* BAGIAN 1: IDENTITAS CALON SANTRI */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} className="text-emerald-600" /> 1. Data Diri Calon Santri
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap Santri <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap calon santri"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      name="nama_panggilan"
                      value={formData.nama_panggilan}
                      onChange={handleChange}
                      placeholder="Contoh: Faras"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="jenis_kelamin"
                          value="L"
                          checked={formData.jenis_kelamin === 'L'}
                          onChange={handleChange}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Laki-Laki
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="jenis_kelamin"
                          value="P"
                          checked={formData.jenis_kelamin === 'P'}
                          onChange={handleChange}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      name="tempat_lahir"
                      value={formData.tempat_lahir}
                      onChange={handleChange}
                      placeholder="Kota / Kabupaten lahir"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={formData.tanggal_lahir}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Tempat Tinggal
                    </label>
                    <textarea
                      name="alamat"
                      rows={2}
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Dusun / RT / RW / Desa / Kecamatan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: DATA ORANG TUA / WALI */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone size={16} className="text-emerald-600" /> 2. Data Orang Tua & Kontak
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Ayah Kandung
                    </label>
                    <input
                      type="text"
                      name="nama_ayah"
                      value={formData.nama_ayah}
                      onChange={handleChange}
                      placeholder="Nama ayah calon santri"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Ibu Kandung
                    </label>
                    <input
                      type="text"
                      name="nama_ibu"
                      value={formData.nama_ibu}
                      onChange={handleChange}
                      placeholder="Nama ibu calon santri"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      No. WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-emerald-600 font-semibold text-sm">
                        +62 / 0
                      </span>
                      <input
                        type="tel"
                        name="no_hp"
                        value={formData.no_hp}
                        onChange={handleChange}
                        placeholder="Contoh: 081234567890"
                        required
                        className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm font-medium"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Nomor ini akan digunakan pengurus untuk konfirmasi dan informasi TPQ.
                    </span>
                  </div>
                </div>
              </div>

              {/* BAGIAN 3: PILIHAN TINGKAT / KELAS */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-600" /> 3. Pilihan Kelas & Catatan
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilihan Tingkat / Jilid Awal (Opsional)
                    </label>
                    <select
                      name="kelas_id"
                      value={formData.kelas_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    >
                      <option value="">-- Rekomendasi berdasarkan tes penempatan nanti --</option>
                      {kelasList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan / Kemampuan Mengaji Saat Ini
                    </label>
                    <textarea
                      name="catatan"
                      rows={2}
                      value={formData.catatan}
                      onChange={handleChange}
                      placeholder="Contoh: Sudah pernah belajar Iqro 2 di rumah, mengenal huruf hijaiyah, dll."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Sedang Mengirim Formulir...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} /> Kirim Pendaftaran Santri Baru
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendaftaranPage;
