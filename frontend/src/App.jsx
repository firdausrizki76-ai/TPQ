import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import PendaftaranPage from './pages/auth/PendaftaranPage';
import AttendanceHistoryPage from './pages/teacher/AttendanceHistoryPage';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import AdminPendaftaranPage from './pages/pendaftaran/AdminPendaftaranPage';
import SantriPage from './pages/santri/SantriPage';
import GuruPage from './pages/guru/GuruPage';
import KelasPage from './pages/kelas/KelasPage';
import AbsensiPage from './pages/absensi/AbsensiPage';
import PrestasiAdminPage from './pages/prestasi/PrestasiAdminPage';
import PembayaranPage from './pages/pembayaran/PembayaranPage';
import TabunganPage from './pages/tabungan/TabunganPage';
import LaporanKeuanganPage from './pages/laporan/LaporanKeuanganPage';
import LaporanPage from './pages/laporan/LaporanPage';
import PengaturanPage from './pages/pengaturan/PengaturanPage';
import UjianPage from './pages/ujian/UjianPage';
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentPrestasiPage from './pages/student/StudentPrestasiPage';
import TeacherLayout from './components/layout/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherPrestasiPage from './pages/teacher/TeacherPrestasiPage';

import ScannerPage from './pages/absensi/ScannerPage';
import ClassListPage from './pages/teacher/ClassListPage';
import StudentTabunganPage from './pages/student/StudentTabunganPage';
import StudentTagihanPage from './pages/student/StudentTagihanPage';
import StudentIzinPage from './pages/student/StudentIzinPage';
import StudentRiwayatPendidikan from './pages/student/StudentRiwayatPendidikan';
import ProfilePage from './pages/shared/ProfilePage';
import TeacherIzinPage from './pages/teacher/TeacherIzinPage';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('tpq_token');
  const userStr = localStorage.getItem('tpq_user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRole && user.role !== allowedRole) {
      // Khusus: Kepala Lembaga diperbolehkan akses rute Admin
      if (user.role === 'kepala' && allowedRole === 'admin') {
        return children;
      }

      if (user.role === 'admin' || user.role === 'kepala') return <Navigate to="/dashboard" replace />;
      if (user.role === 'guru') return <Navigate to="/guru/dashboard" replace />;
      if (user.role === 'siswa') return <Navigate to="/siswa/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/daftar" element={<PendaftaranPage />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin"><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pendaftaran" element={<AdminPendaftaranPage />} />
          <Route path="/santri" element={<SantriPage />} />
          <Route path="/guru" element={<GuruPage />} />
          <Route path="/kelas" element={<KelasPage />} />
          <Route path="/absensi" element={<AbsensiPage />} />
          <Route path="/prestasi" element={<PrestasiAdminPage />} />
          <Route path="/ujian" element={<UjianPage />} />
          <Route path="/pembayaran" element={<PembayaranPage />} />
          <Route path="/tabungan" element={<TabunganPage />} />
          <Route path="/laporan-keuangan" element={<LaporanKeuanganPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
          <Route path="/pengaturan" element={<PengaturanPage />} />
        </Route>
        
        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRole="guru"><TeacherLayout /></ProtectedRoute>}>
          <Route path="/guru/dashboard" element={<TeacherDashboard />} />
          <Route path="/guru/kelas" element={<ClassListPage />} />
          <Route path="/guru/prestasi" element={<TeacherPrestasiPage />} />
          <Route path="/guru/absen" element={<ScannerPage />} />
          <Route path="/guru/absen/riwayat" element={<AttendanceHistoryPage />} />
          <Route path="/guru/tabungan" element={<TabunganPage />} />
          <Route path="/guru/ujian" element={<UjianPage />} />
          <Route path="/guru/izin" element={<TeacherIzinPage />} />
          <Route path="/guru/profile" element={<ProfilePage />} />
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRole="siswa"><StudentLayout /></ProtectedRoute>}>
          <Route path="/siswa" element={<Navigate to="/siswa/dashboard" replace />} />
          <Route path="/siswa/dashboard" element={<StudentDashboard />} />
          <Route path="/siswa/prestasi" element={<StudentPrestasiPage />} />
          <Route path="/siswa/izin" element={<StudentIzinPage />} />
          <Route path="/siswa/tabungan" element={<StudentTabunganPage />} />
          <Route path="/siswa/tagihan" element={<StudentTagihanPage />} />
          <Route path="/siswa/riwayat-pendidikan" element={<StudentRiwayatPendidikan />} />
          <Route path="/siswa/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
