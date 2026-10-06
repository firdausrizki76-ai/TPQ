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
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nama_panggilan: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    hobi: '',
    cita_cita: '',
    alamat: '',
    rt: '',
    rw: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
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

  return (
    <div className="login-container min-h-screen p-4 flex flex-col items-center justify-center" style={{ padding: '30px 16px' }}>
      <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Tombol Kembali */}
        <div style={{ marginBottom: '16px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Halaman Login
          </button>
        </div>

        {/* SUKSES DAFTAR */}
        {successData ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', borderTop: '4px solid var(--color-gold)' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={40} />
            </div>

            <span className="badge badge-success" style={{ marginBottom: '8px' }}>
              Pendaftaran Berhasil Dikirim
            </span>

            <h2 style={{ fontSize: '24px', color: 'var(--color-primary-container)', margin: '8px 0' }}>
              Alhamdulillah, Data Telah Diterima!
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 24px auto' }}>
              Formulir pendaftaran santri baru TPQ Anfak Al Azizah telah tersimpan. Pengurus akan segera menghubungi nomor WhatsApp Anda.
            </p>

            {/* Bukti Registrasi Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Nomor Registrasi</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--color-primary-container)' }}>
                    {successData.nomor_pendaftaran}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Tanggal</span>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                    {new Date(successData.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Nama Santri:</span>
                  <strong>{successData.nama_lengkap} {successData.nama_panggilan ? `(${successData.nama_panggilan})` : ''}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Jenis Kelamin:</span>
                  <strong>{successData.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Tempat, Tgl Lahir:</span>
                  <strong>{successData.tempat_lahir || '-'}, {successData.tanggal_lahir || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Hobi / Cita-cita:</span>
                  <strong>{successData.hobi || '-'} / {successData.cita_cita || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Ayah / Ibu Kandung:</span>
                  <strong>{successData.nama_ayah || '-'} / {successData.nama_ibu || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Nomor WhatsApp:</span>
                  <strong style={{ color: '#059669' }}>{successData.no_hp}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Alamat & Domisili:</span>
                  <strong>
                    {successData.alamat ? `${successData.alamat}, ` : ''}
                    {successData.rt ? `RT ${successData.rt} ` : ''}
                    {successData.rw ? `RW ${successData.rw}, ` : ''}
                    {successData.desa ? `Desa ${successData.desa}, ` : ''}
                    {successData.kecamatan ? `Kec. ${successData.kecamatan}, ` : ''}
                    {successData.kabupaten ? successData.kabupaten : ''}
                  </strong>
                </div>
              </div>
            </div>

            {/* Aksi Selesai */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1' }}
                onClick={() => window.print()}
              >
                <Printer size={16} /> Cetak Bukti Pendaftaran
              </button>

              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => navigate('/login')}
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </div>
        ) : (
          /* FORM PENDAFTARAN */
          <div className="card" style={{ padding: '36px 30px', borderTop: '4px solid var(--color-gold)' }}>
            
            {/* Header Form */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                <Sparkles size={14} color="#d97706" /> Penerimaan Santri Baru Online
              </div>
              <h1 style={{ fontSize: '26px', color: 'var(--color-primary-container)', margin: '4px 0' }}>
                Formulir Pendaftaran Santri Baru
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                TPQ Anfak Al Azizah — Silakan isi biodata calon santri dengan lengkap
              </p>
            </div>

            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* BAGIAN 1: DATA CALON SANTRI */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary-container)', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>
                  1. Data Diri Calon Santri
                </h3>

                <div className="form-group">
                  <label className="form-label">Nama Lengkap Santri <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="text" 
                    name="nama_lengkap" 
                    value={formData.nama_lengkap} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="Masukkan nama lengkap calon santri" 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Nama Panggilan</label>
                    <input 
                      type="text" 
                      name="nama_panggilan" 
                      value={formData.nama_panggilan} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Contoh: Faras" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="jenis_kelamin" 
                          value="L" 
                          checked={formData.jenis_kelamin === 'L'} 
                          onChange={handleChange} 
                        />
                        Laki-Laki
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="jenis_kelamin" 
                          value="P" 
                          checked={formData.jenis_kelamin === 'P'} 
                          onChange={handleChange} 
                        />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tempat Lahir</label>
                    <input 
                      type="text" 
                      name="tempat_lahir" 
                      value={formData.tempat_lahir} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Kota lahir" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      name="tanggal_lahir" 
                      value={formData.tanggal_lahir} 
                      onChange={handleChange} 
                      className="input-field" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hobi</label>
                    <input 
                      type="text" 
                      name="hobi" 
                      value={formData.hobi} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Contoh: Membaca, Menggambar" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cita-cita</label>
                    <input 
                      type="text" 
                      name="cita_cita" 
                      value={formData.cita_cita} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Contoh: Guru, Dokter, Hafiz Qur'an" 
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: ALAMAT & DOMISILI */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary-container)', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>
                  2. Alamat & Tempat Tinggal
                </h3>

                <div className="form-group">
                  <label className="form-label">Alamat (Jalan / Dusun / Gang)</label>
                  <textarea 
                    name="alamat" 
                    rows={2} 
                    value={formData.alamat} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="Contoh: Jl. Pesantren No. 12, Dusun Krajan" 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">RT</label>
                    <input 
                      type="text" 
                      name="rt" 
                      value={formData.rt} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Contoh: 02" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">RW</label>
                    <input 
                      type="text" 
                      name="rw" 
                      value={formData.rw} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Contoh: 05" 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Desa / Kelurahan</label>
                    <input 
                      type="text" 
                      name="desa" 
                      value={formData.desa} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Nama desa/kelurahan" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kecamatan</label>
                    <input 
                      type="text" 
                      name="kecamatan" 
                      value={formData.kecamatan} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Nama kecamatan" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Kabupaten / Kota</label>
                  <input 
                    type="text" 
                    name="kabupaten" 
                    value={formData.kabupaten} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="Nama kabupaten/kota" 
                  />
                </div>
              </div>

              {/* BAGIAN 3: DATA ORANG TUA */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary-container)', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>
                  3. Data Orang Tua & Kontak
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Nama Ayah Kandung</label>
                    <input 
                      type="text" 
                      name="nama_ayah" 
                      value={formData.nama_ayah} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Nama ayah kandung" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nama Ibu Kandung</label>
                    <input 
                      type="text" 
                      name="nama_ibu" 
                      value={formData.nama_ibu} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="Nama ibu kandung" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor WhatsApp <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="tel" 
                    name="no_hp" 
                    value={formData.no_hp} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="Contoh: 081234567890" 
                    required 
                    style={{ fontSize: '15px', fontWeight: 'bold' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Nomor WhatsApp ini digunakan panitia untuk konfirmasi jadwal tes penempatan & informasi TPQ.
                  </span>
                </div>
              </div>

              {/* BAGIAN 4: PILIHAN TINGKAT */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary-container)', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>
                  4. Pilihan Jenjang & Keterangan (Opsional)
                </h3>

                <div className="form-group">
                  <label className="form-label">Pilihan Jenjang / Jilid Awal (Opsional)</label>
                  <select 
                    name="kelas_id" 
                    value={formData.kelas_id} 
                    onChange={handleChange} 
                    className="input-field"
                  >
                    <option value="">-- Rekomendasi berdasarkan tes penempatan --</option>
                    {kelasList.map(k => (
                      <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan / Kemampuan Mengaji Saat Ini</label>
                  <textarea 
                    name="catatan" 
                    rows={2} 
                    value={formData.catatan} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="Contoh: Sudah pernah belajar Iqro 2, mengenal huruf hijaiyah, dll." 
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-primary w-full" 
                style={{ padding: '14px', fontSize: '16px', fontWeight: 'bold' }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sedang Mengirim Formulir...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Kirim Pendaftaran Santri Baru
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
