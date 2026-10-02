import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { authAPI } from '../../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ role, username, password });
      
      // Simpan token dan data user
      localStorage.setItem('tpq_token', response.token);
      localStorage.setItem('tpq_user', JSON.stringify(response.user));
      
      // Arahkan ke dashboard yang sesuai
      if (role === 'siswa') {
        navigate('/siswa/dashboard');
      } else if (role === 'guru') {
        navigate('/guru/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Gagal login, periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container flex items-center justify-center min-h-screen p-4">
      <div className="login-wrapper w-full flex flex-col items-center">
        {/* BANNER GEDE PENDAFTARAN SANTRI BARU */}
        <div 
          onClick={() => navigate('/daftar')}
          role="button"
          tabIndex={0}
          className="pendaftaran-banner-card"
        >
          <div className="pendaftaran-banner-icon">
            <UserPlus size={24} />
          </div>
          <div className="pendaftaran-banner-content">
            <span className="pendaftaran-banner-tag">
              Penerimaan Santri Baru
            </span>
            <h3 className="pendaftaran-banner-title">
              Pendaftaran Santri Baru <span>Klik Disini</span>
            </h3>
            <p className="pendaftaran-banner-sub">
              Daftar online santri baru TPQ Anfak Al Azizah
            </p>
          </div>
          <div className="pendaftaran-banner-arrow">
            <ArrowRight size={20} />
          </div>
        </div>

        {/* Logo moved to center */}
        <div className="login-logo-center">
          <img src="/assets/logoapp.png" alt="Logo TPQ Anfak Al Azizah" className="logo" />
        </div>
        
        <div className="login-card arch-container flex flex-col items-center">
          <div className="login-header text-center w-full">
            <h2>Selamat Datang</h2>
            <p className="text-sm">TPQ Anfak Al Azizah</p>
          </div>

          <div className="role-selector flex w-full mb-6 mt-2">
            <button 
              type="button" 
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); setError(''); }}
            >
              Admin & Kepala Lembaga
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'guru' ? 'active' : ''}`}
              onClick={() => { setRole('guru'); setError(''); }}
            >
              Guru
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'siswa' ? 'active' : ''}`}
              onClick={() => { setRole('siswa'); setError(''); }}
            >
              Siswa
            </button>
          </div>
          
          <form onSubmit={handleLogin} className="login-form w-full flex-col">
            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-group mb-4">
              <label className="input-label">{role === 'siswa' ? 'NIS / Username' : 'NIP / Username'}</label>
              <div className="input-with-icon">
                <User className="icon" size={18} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Masukkan ID" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group mb-6">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock className="icon" size={18} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Masukkan Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Masuk <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
