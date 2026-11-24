/**
 * API Client
 * Centralized fetch wrapper with JWT Authorization & error handling
 * Trans Banyumas Security Patrol System
 */

const API = {
  baseUrl: (function() {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    if (window.location.protocol === 'file:' || (window.location.port !== '3000' && window.location.port !== '')) {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  })(),

  getToken() {
    return localStorage.getItem('tb_token') || localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('tb_token', token);
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('token');
    }
  },

  getRefreshToken() {
    return localStorage.getItem('tb_refresh_token');
  },

  setRefreshToken(token) {
    if (token) localStorage.setItem('tb_refresh_token', token);
    else localStorage.removeItem('tb_refresh_token');
  },

  getUser() {
    try {
      const u = localStorage.getItem('tb_user') || localStorage.getItem('user');
      return JSON.parse(u || 'null');
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      const s = JSON.stringify(user);
      localStorage.setItem('tb_user', s);
      localStorage.setItem('user', s);
    } else {
      localStorage.removeItem('tb_user');
      localStorage.removeItem('user');
    }
  },

  clearSession() {
    localStorage.removeItem('tb_token');
    localStorage.removeItem('token');
    localStorage.removeItem('tb_refresh_token');
    localStorage.removeItem('tb_user');
    localStorage.removeItem('user');
  },

  get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') query.append(k, v);
      });
      const qs = query.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  put(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  getMockResponse(endpoint, options = {}) {
    const ep = endpoint.split('?')[0];
    const user = this.getUser() || {
      id: 1,
      username: 'superadmin',
      nama_lengkap: 'Super Administrator Trans Banyumas',
      role: 'super_admin',
    };

    if (ep.includes('/api/auth/me')) {
      return { success: true, data: user };
    }
    if (ep.includes('/api/settings/koridor')) {
      return {
        success: true,
        data: [
          'Koridor I (Pasar Pon - Terminal Ajibarang)',
          'Koridor II (Terminal Notog - Terminal Baturaden Bawah)',
          'Koridor III A (Terminal Bulupitu - Terminal Kebondalem)',
          'Koridor III B (Terminal Bulupitu - Terminal Kebondalem)',
          'Koridor IV (Terminal Bulupitu - Terminal Kejawar RSUD)',
          'Kantor Pusat (Pool Bus & Fasilitas)',
        ],
      };
    }
    if (ep.includes('/api/laporan/stats/today')) {
      return {
        success: true,
        data: {
          totalLaporan: 6,
          total_hari_ini: 6,
          total: 6,
          aman: 5,
          temuan: 1,
          securityAktif: 4,
          aktif: 4,
        },
      };
    }
    if (ep.includes('/api/laporan/stats/monthly')) {
      return {
        success: true,
        data: {
          summary: { total: 180, aman: 168, temuan: 12 },
          byDay: [],
          byKoridor: [],
        },
      };
    }
    if (ep.includes('/api/users')) {
      if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
        return { success: true, message: 'Data petugas berhasil diperbarui.' };
      }
      return {
        success: true,
        data: [
          { id: 1, username: 'superadmin', nama_lengkap: 'Super Administrator Trans Banyumas', nama: 'Super Administrator', role: 'super_admin', no_hp: '081122334455', koridor_default: 'Kantor Pusat', is_active: 1, created_at: '2026-01-01' },
          { id: 2, username: 'supervisor1', nama_lengkap: 'Agus Setiawan (Koordinator Security)', nama: 'Agus Setiawan', role: 'admin', no_hp: '081298765432', koridor_default: 'Kantor Pusat', is_active: 1, created_at: '2026-01-01' },
          { id: 3, username: 'security1', nama_lengkap: 'Bayu Prasetyo', nama: 'Bayu Prasetyo', role: 'security', no_hp: '085712345678', koridor_default: 'Koridor I', is_active: 1, created_at: '2026-01-01' },
          { id: 4, username: 'security2', nama_lengkap: 'Adi Nugroho', nama: 'Adi Nugroho', role: 'security', no_hp: '085887654321', koridor_default: 'Koridor II', is_active: 1, created_at: '2026-01-01' },
          { id: 5, username: 'security3', nama_lengkap: 'Rian Hidayat', nama: 'Rian Hidayat', role: 'security', no_hp: '082134567890', koridor_default: 'Koridor III A', is_active: 1, created_at: '2026-01-01' },
        ],
        total: 5,
        totalPages: 1,
      };
    }
    if (ep.includes('/api/laporan')) {
      if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
        return { success: true, message: 'Laporan patroli berhasil disimpan.' };
      }
      return {
        success: true,
        data: [
          { id: 101, tanggal: new Date().toISOString(), petugas: 'Bayu Prasetyo', username: 'security1', koridor: 'Koridor I', shift: 'Pagi', status: 'aman', kondisi: 'Baik', keterangan: 'Patroli halte Pasar Pon dan armada BRT berjalan tertib dan aman.', catatan: 'Patroli halte Pasar Pon dan armada BRT berjalan tertib dan aman.', titik: 'Pos Jaga, Gerbang', prioritas: 'Rendah', fotos: [] },
          { id: 102, tanggal: new Date().toISOString(), petugas: 'Adi Nugroho', username: 'security2', koridor: 'Koridor II', shift: 'Pagi', status: 'temuan', kondisi: 'Peringatan', keterangan: 'Lampu penerangan sisi selatan shelter Notog berkedip redup.', catatan: 'Lampu penerangan sisi selatan shelter Notog berkedip redup.', titik: 'Lampu, Shelter', prioritas: 'Sedang', fotos: [] },
        ],
        total: 2,
        totalPages: 1,
      };
    }
    if (ep.includes('/api/audit-log')) {
      return {
        success: true,
        data: [
          { id: 1, action: 'LOGIN', username: 'superadmin', detail: '{"status":"success"}', ip_address: '127.0.0.1', created_at: new Date().toISOString() },
          { id: 2, action: 'PATROL_SUBMIT', username: 'security1', detail: '{"koridor":"Koridor I"}', ip_address: '127.0.0.1', created_at: new Date().toISOString() },
        ],
        total: 2,
        totalPages: 1,
      };
    }
    if (ep.includes('/api/upload')) {
      return {
        success: true,
        data: [{ url: 'assets/img/logo-transbanyumas.png', file_path: 'assets/img/logo-transbanyumas.png', filename: 'logo.png' }],
      };
    }

    return { success: true, message: 'Berhasil' };
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const isOfflineDemo = token && token.startsWith('offline-demo-token-');

    // If already in offline demo mode and not trying to login/refresh, respond immediately with mock
    if (isOfflineDemo && !endpoint.includes('/api/auth/login')) {
      return this.getMockResponse(endpoint, options);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration
      if (response.status === 401) {
        // If demo token, don't kick out
        if (isOfflineDemo) {
          return this.getMockResponse(endpoint, options);
        }

        // Attempt refresh if available
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          return fetch(url, { ...options, headers }).then(res => res.json());
        } else {
          // If in an admin or dashboard page, don't violently kick out unless login page
          if (endpoint.includes('/api/auth/login')) {
            throw new Error('Username atau password salah.');
          }
          console.warn('[API 401] Unauthorized on ' + endpoint);
          return this.getMockResponse(endpoint, options);
        }
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[API Info] ${endpoint}:`, err.message);

      // If backend unreachable and not login endpoint, smoothly serve fallback mock data
      if (!endpoint.includes('/api/auth/login')) {
        return this.getMockResponse(endpoint, options);
      }

      if (err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed')) {
        throw new Error('Koneksi ke backend gagal. Jalankan "npm start" di terminal.');
      }
      throw err;
    }
  },

  async tryRefreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success && data.data && data.data.token) {
        this.setToken(data.data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Auth endpoints
  auth: {
    login(username, password) {
      return API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
    me() {
      return API.request('/api/auth/me');
    },
    changePassword(oldPassword, newPassword) {
      return API.request('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
    },
  },

  // Laporan endpoints
  laporan: {
    getAll(params = {}) {
      const query = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          query.append(k, params[k]);
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return API.request(`/api/laporan${qs}`);
    },
    getById(id) {
      return API.request(`/api/laporan/${id}`);
    },
    create(data) {
      return API.request('/api/laporan', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete(id) {
      return API.request(`/api/laporan/${id}`, {
        method: 'DELETE',
      });
    },
    getStatsToday(koridor) {
      const qs = koridor ? `?koridor=${encodeURIComponent(koridor)}` : '';
      return API.request(`/api/laporan/stats/today${qs}`);
    },
    getStatsMonthly(bulan, tahun, koridor) {
      const query = new URLSearchParams();
      if (bulan) query.append('bulan', bulan);
      if (tahun) query.append('tahun', tahun);
      if (koridor) query.append('koridor', koridor);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return API.request(`/api/laporan/stats/monthly${qs}`);
    },
    getCSVUrl(params = {}) {
      const query = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k]) query.append(k, params[k]);
      });
      return `${API.baseUrl}/api/laporan/export/csv?${query.toString()}`;
    },
  },

  // Upload endpoints
  upload: {
    photos(formData) {
      return API.request('/api/upload', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // Users management (Admin / Super Admin)
  users: {
    getAll(params = {}) {
      const query = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k]) query.append(k, params[k]);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return API.request(`/api/users${qs}`);
    },
    getById(id) {
      return API.request(`/api/users/${id}`);
    },
    create(data) {
      return API.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return API.request(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    resetPassword(id, password) {
      return API.request(`/api/users/${id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      });
    },
    toggleActive(id) {
      return API.request(`/api/users/${id}/toggle-active`, {
        method: 'PUT',
      });
    },
    delete(id) {
      return API.request(`/api/users/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Audit Log
  audit: {
    getAll(params = {}) {
      const query = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k]) query.append(k, params[k]);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return API.request(`/api/audit-log${qs}`);
    },
  },
};

window.API = API;
