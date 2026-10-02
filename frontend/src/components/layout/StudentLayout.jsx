import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, User, Wallet, Receipt, Award } from 'lucide-react';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/siswa/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { path: '/siswa/prestasi', icon: Award, label: 'Prestasi' },
    { path: '/siswa/tabungan', icon: Wallet, label: 'Tabungan' },
    { path: '/siswa/tagihan', icon: Receipt, label: 'Tagihan' },
    { path: '/siswa/izin', icon: FileText, label: 'Izin' },
    { path: '/siswa/profile', icon: User, label: 'Profil' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', width: '100%', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Top Header */}
      <header style={{ 
        backgroundColor: '#064e3b', 
        color: 'white', 
        padding: '16px 20px', 
        position: 'relative', 
        zIndex: 10, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/assets/logoapp.png" alt="Logo" style={{ height: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', borderRadius: '8px' }} />
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-display, serif)', fontSize: '15px', lineHeight: 1.2, color: '#D4AF37', margin: 0, fontWeight: 'bold' }}>TPQ Anfak Al Azizah</h2>
              <p style={{ fontSize: '11px', color: '#a7f3d0', margin: 0, fontWeight: '500' }}>Portal Siswa</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '0', paddingBottom: '90px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'rgba(255,255,255,0.97)', 
        backdropFilter: 'blur(12px)', 
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: '8px 0 12px 0', 
        boxShadow: '0 -4px 16px rgba(0,0,0,0.05)', 
        borderTop: '1px solid #f1f5f9', 
        zIndex: 100 
      }}>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path || (item.path === '/siswa/dashboard' && location.pathname === '/siswa');
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '2px', 
                background: 'transparent', 
                border: 'none', 
                color: isActive ? '#064e3b' : '#94a3b8', 
                fontFamily: 'var(--font-family-body, sans-serif)', 
                fontSize: '10px', 
                cursor: 'pointer', 
                flex: 1,
                fontWeight: isActive ? '700' : '500',
                padding: '4px 0'
              }}
            >
              <div style={{ 
                padding: '6px 16px', 
                borderRadius: '16px', 
                transition: 'all 0.2s',
                backgroundColor: isActive ? '#dcfce7' : 'transparent',
                color: isActive ? '#064e3b' : '#94a3b8'
              }}>
                <IconComponent size={22} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default StudentLayout;
