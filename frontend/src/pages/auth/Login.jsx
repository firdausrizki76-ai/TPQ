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
          className="w-full max-w-[420px] mb-2 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 shadow-xl rounded-2xl overflow-hidden border-2 border-amber-300 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-3.5 relative z-30"
          style={{ animation: 'pulse 3s infinite' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <UserPlus size={22} className="text-emerald-950" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-block bg-amber-400/20 text-amber-300 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                  Penerimaan Santri Baru
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
              </div>
              <h3 className="font-extrabold text-[15px] leading-tight text-white">
                Pendaftaran Santri Baru <span className="text-amber-300 underline underline-offset-2">Klik Disini</span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                Buka formulir pendaftaran santri baru online
              </p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl text-amber-300 shrink-0">
              <ArrowRight size={18} />
            </div>
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
