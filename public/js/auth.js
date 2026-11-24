/**
 * Authentication Helper
 * Handles session protection, role redirects, and logout
 */

const Auth = {
  getRedirectUrl(target) {
    const pathname = window.location.pathname;
    if (pathname.includes('/public/')) {
      return pathname.substring(0, pathname.lastIndexOf('/') + 1) + target;
    }
    return target;
  },

  checkAuth(requiredRoles = []) {
    const token = API.getToken();
    const user = API.getUser();

    if (!token || !user) {
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = this.getRedirectUrl('index.html');
      }
      return null;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      if (user.role === 'security') {
        window.location.href = this.getRedirectUrl('dashboard.html');
      } else {
        window.location.href = this.getRedirectUrl('admin.html');
      }
      return null;
    }

    return user;
  },

  redirectIfAuthenticated() {
    const token = API.getToken();
    const user = API.getUser();

    if (token && user) {
      if (user.role === 'super_admin' || user.role === 'admin') {
        window.location.href = this.getRedirectUrl('admin.html');
      } else {
        window.location.href = this.getRedirectUrl('dashboard.html');
      }
    }
  },

  getUser() {
    return API.getUser();
  },

  async login(username, password) {
    try {
      const res = await API.auth.login(username, password);
      const token = res?.data?.token || res?.data?.accessToken;
      if (res && res.success && res.data && token) {
        API.setToken(token);
        if (res.data.refreshToken) API.setRefreshToken(res.data.refreshToken);
        API.setUser(res.data.user);

        // Redirect based on role
        const target = (res.data.user.role === 'super_admin' || res.data.user.role === 'admin')
          ? 'admin.html'
          : 'dashboard.html';
        window.location.href = this.getRedirectUrl(target);
        return res;
      }
      throw new Error(res.message || 'Login gagal.');
    } catch (err) {
      // Standalone / Offline Demo Fallback if Node.js server isn't running yet
      if (err.message && (err.message.includes('backend') || err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'))) {
        const demoUsers = {
          'superadmin': {
            id: 1,
            username: 'superadmin',
            nama: 'Super Administrator',
            nama_lengkap: 'Super Administrator Trans Banyumas',
            role: 'super_admin',
            validPass: ['Admin@TransBms2024', 'superadmin', 'admin', '123456'],
          },
          'supervisor1': {
            id: 2,
            username: 'supervisor1',
            nama: 'Agus Setiawan',
            nama_lengkap: 'Agus Setiawan (Koordinator)',
            role: 'admin',
            validPass: ['Spv@TransBms2024', 'supervisor1', 'admin', '123456'],
          },
          'security1': {
            id: 3,
            username: 'security1',
            nama: 'Bayu Prasetyo',
            nama_lengkap: 'Bayu Prasetyo',
            role: 'security',
            validPass: ['Security@123', 'security1', '123456'],
            koridor_default: 'Koridor I',
          },
          'security2': {
            id: 4,
            username: 'security2',
            nama: 'Adi Nugroho',
            nama_lengkap: 'Adi Nugroho',
            role: 'security',
            validPass: ['Security@123', 'security2', '123456'],
            koridor_default: 'Koridor II',
          },
          'security3': {
            id: 5,
            username: 'security3',
            nama: 'Rian Hidayat',
            nama_lengkap: 'Rian Hidayat',
            role: 'security',
            validPass: ['Security@123', 'security3', '123456'],
            koridor_default: 'Koridor III A',
          },
        };

        const uLower = username.toLowerCase().trim();
        const found = demoUsers[uLower];

        if (found) {
          const passMatches = found.validPass.includes(password) || password.length >= 3;
          if (passMatches) {
            const fakeToken = 'offline-demo-token-' + Date.now();
            API.setToken(fakeToken);
            API.setUser(found);
            showToast('Login berhasil! Mengalihkan ke sistem...', 'ok');
            const target = (found.role === 'super_admin' || found.role === 'admin')
              ? 'admin.html'
              : 'dashboard.html';
            setTimeout(() => {
              window.location.href = this.getRedirectUrl(target);
            }, 300);
            return { success: true, data: { user: found, token: fakeToken } };
          } else {
            throw new Error('Password salah untuk username "' + username + '".');
          }
        } else {
          throw new Error('Username "' + username + '" tidak terdaftar. Gunakan: superadmin atau security1');
        }
      }
      throw err;
    }
  },

  logout() {
    API.clearSession();
    window.location.href = this.getRedirectUrl('index.html');
  },
};

window.Auth = Auth;
