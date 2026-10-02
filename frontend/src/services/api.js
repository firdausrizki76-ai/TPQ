const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('tpq_token');

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers,
    ...options,
  };
  
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }
  try {
    const response = await fetch(url, config);
    const json = await response.json();
    if (!response.ok || !json.success) {
      if (response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('tpq_token');
        localStorage.removeItem('tpq_user');
        window.location.href = '/login';
      }
      throw new Error(json.message || 'Terjadi kesalahan pada server');
    }
    return json.data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// Auth
export const authAPI = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => {
    localStorage.removeItem('tpq_token');
    localStorage.removeItem('tpq_user');
    window.location.href = '/login';
  },
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => request('/dashboard/stats'),
  getAktivitas: () => request('/dashboard/aktivitas'),
};

// Santri
export const santriAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/santri${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/santri/${id}`),
  create: (body) => request('/santri', { method: 'POST', body }),
  update: (id, body) => request(`/santri/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/santri/${id}`, { method: 'DELETE' }),
};

// Guru
export const guruAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/guru${qs ? `?${qs}` : ''}`);
  },
  create: (body) => request('/guru', { method: 'POST', body }),
  update: (id, body) => request(`/guru/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/guru/${id}`, { method: 'DELETE' }),
};

// Kelas
export const kelasAPI = {
  getAll: () => request('/kelas'),
  getSantri: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/kelas/${id}/santri${qs ? `?${qs}` : ''}`);
  },
  update: (id, body) => request(`/kelas/${id}`, { method: 'PUT', body }),
};

// Absensi
export const absensiAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/absensi${qs ? `?${qs}` : ''}`);
  },
  getRekap: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/absensi/rekap${qs ? `?${qs}` : ''}`);
  },
  create: (body) => request('/absensi', { method: 'POST', body }),
  update: (id, body) => request(`/absensi/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/absensi/${id}`, { method: 'DELETE' }),
};

// Ujian
export const ujianAPI = {
  getAll: () => request('/ujian'),
  register: (body) => request('/ujian/register', { method: 'POST', body }),
  inputNilai: (body) => request('/ujian/nilai', { method: 'POST', body }),
  naikKelas: (body) => request('/ujian/naik-kelas', { method: 'POST', body }),
  getHistory: (santriId) => request(`/ujian/history/${santriId}`),
  getRiwayatAll: () => request('/ujian/riwayat-all'),
  getRekapBulanan: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/ujian/rekap-bulanan${qs ? `?${qs}` : ''}`);
  },
  updateHistory: (id, body) => request(`/ujian/history/${id}`, { method: 'PUT', body }),
  deleteHistory: (id) => request(`/ujian/history/${id}`, { method: 'DELETE' }),
  delete: (id) => request(`/ujian/${id}`, { method: 'DELETE' }),
};

// Pembayaran
export const pembayaranAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pembayaran${qs ? `?${qs}` : ''}`);
  },
  getStats: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pembayaran/stats${qs ? `?${qs}` : ''}`);
  },
  create: (body) => request('/pembayaran', { method: 'POST', body }),
  update: (id, body) => request(`/pembayaran/${id}`, { method: 'PUT', body }),
  generate: (body) => request('/pembayaran/generate', { method: 'POST', body }),
  delete: (id) => request(`/pembayaran/${id}`, { method: 'DELETE' }),
};

// Tabungan
export const tabunganAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tabungan${qs ? `?${qs}` : ''}`);
  },
  getSummaryGuru: () => request('/tabungan/summary-guru'),
  getRiwayat: (santriId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tabungan/${santriId}/riwayat${qs ? `?${qs}` : ''}`);
  },
  setorKeAdmin: (body) => request('/tabungan/setor-admin', { method: 'POST', body }),
  getRekapAdmin: () => request('/tabungan/rekap-admin'),
  getRekapGuru: () => request('/tabungan/rekap-guru'),
  transact: (body) => request('/tabungan', { method: 'POST', body }),
  delete: (id) => request(`/tabungan/${id}`, { method: 'DELETE' }),
};

// Laporan
export const laporanAPI = {
  getKeuangan: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/laporan/keuangan${qs ? `?${qs}` : ''}`);
  },
  getAbsensi: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/laporan/absensi${qs ? `?${qs}` : ''}`);
  },
  getTabungan: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/laporan/tabungan${qs ? `?${qs}` : ''}`);
  },
  getAkademik: () => request('/laporan/akademik'),
};

// Pengaturan
export const pengaturanAPI = {
  get: () => request('/pengaturan'),
  save: (body) => request('/pengaturan', { method: 'PUT', body }),
};

// Jenis Pembayaran
export const jenisPembayaranAPI = {
  getAll: () => request('/jenis-pembayaran'),
  create: (body) => request('/jenis-pembayaran', { method: 'POST', body }),
  update: (id, body) => request(`/jenis-pembayaran/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/jenis-pembayaran/${id}`, { method: 'DELETE' }),
};

// Users Management
export const userAPI = {
  getAll: () => request('/users'),
  create: (body) => request('/users', { method: 'POST', body }),
  update: (id, body) => request(`/users/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

// Pendaftaran Santri Baru
export const pendaftaranAPI = {
  submitPublic: (body) => request('/pendaftaran', { method: 'POST', body }),
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pendaftaran${qs ? `?${qs}` : ''}`);
  },
  update: (id, body) => request(`/pendaftaran/${id}`, { method: 'PUT', body }),
  approve: (id, body = {}) => request(`/pendaftaran/${id}/approve`, { method: 'POST', body }),
  delete: (id) => request(`/pendaftaran/${id}`, { method: 'DELETE' }),
};

// Prestasi Santri (Harian / Mutaba'ah)
export const prestasiAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/prestasi${qs ? `?${qs}` : ''}`);
  },
  create: (body) => request('/prestasi', { method: 'POST', body }),
  update: (id, body) => request(`/prestasi/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/prestasi/${id}`, { method: 'DELETE' }),
  getRapot: (santriId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/prestasi/rapot/${santriId}${qs ? `?${qs}` : ''}`);
  },
};

// Transaksi Keuangan (Kas Masuk & Keluar)
export const transaksiKeuanganAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transaksi-keuangan${qs ? `?${qs}` : ''}`);
  },
  create: (body) => request('/transaksi-keuangan', { method: 'POST', body }),
  update: (id, body) => request(`/transaksi-keuangan/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/transaksi-keuangan/${id}`, { method: 'DELETE' }),
};

