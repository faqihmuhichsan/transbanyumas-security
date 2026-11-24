/**
 * Admin Dashboard Logic
 * Security Trans Banyumas - Super Admin Panel
 */

// ============================================================
// STATE
// ============================================================
const AdminState = {
    currentPage: 'dashboard',
    users: [],
    filteredUsers: [],
    reports: [],
    filteredReports: [],
    auditLogs: [],
    filteredAuditLogs: [],
    selectedReports: new Set(),
    koridorList: [],
    // Pagination
    reportsPage: 1,
    reportsPerPage: 15,
    auditPage: 1,
    auditPerPage: 20,
    // Confirm callback
    confirmCallback: null,
};

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        if (!checkAdminAuth()) return;

        // Set current date display
        setCurrentDate();

        // Set user info in sidebar and topbar
        setUserInfo();

        // Set default month for stats
        const now = new Date();
        const monthInput = document.getElementById('stats-month');
        if (monthInput) {
            monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        // Load koridor list first (needed by multiple sections)
        await loadKoridorList();

        // Navigate to default page
        navigateTo('dashboard');
    } catch (err) {
        console.error('Init error:', err);
        showToast('Gagal memuat dashboard admin', 'error');
    }
});

/**
 * Check admin authentication - redirect if not admin/super_admin
 */
function checkAdminAuth() {
    const getUrl = (t) => {
        if (typeof Auth !== 'undefined' && typeof Auth.getRedirectUrl === 'function') {
            return Auth.getRedirectUrl(t);
        }
        return t;
    };

    // Try using Auth module if available
    if (typeof Auth !== 'undefined' && typeof Auth.checkAuth === 'function') {
        const user = Auth.checkAuth(['admin', 'super_admin']);
        return !!user;
    }

    // Fallback: check token in localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('tb_token');
    if (!token) {
        window.location.href = getUrl('index.html');
        return false;
    }

    try {
        const userStr = localStorage.getItem('user') || localStorage.getItem('tb_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin' && user.role !== 'super_admin') {
                window.location.href = getUrl('dashboard.html');
                return false;
            }
        }
    } catch (e) {
        // If can't parse user, let it continue and API will reject if unauthorized
    }

    return true;
}

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    const el = document.getElementById('current-date');
    if (el) el.textContent = dateStr;

    const welcomeDate = document.getElementById('welcome-date');
    if (welcomeDate) welcomeDate.textContent = dateStr;
}

function setUserInfo() {
    let user = null;

    if (typeof Auth !== 'undefined' && typeof Auth.getUser === 'function') {
        user = Auth.getUser();
    } else {
        try {
            user = JSON.parse(localStorage.getItem('user'));
        } catch (e) { /* ignore */ }
    }

    if (user) {
        const initial = (user.nama || user.username || 'A').charAt(0).toUpperCase();
        const displayName = user.nama || user.username || 'Admin';
        const roleName = user.role === 'super_admin' ? 'Super Admin' : 'Admin';

        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const topbarAvatar = document.getElementById('topbar-avatar');
        const sidebarUsername = document.getElementById('sidebar-username');
        const sidebarRole = document.getElementById('sidebar-role');
        const welcomeName = document.getElementById('welcome-name');

        if (sidebarAvatar) sidebarAvatar.textContent = initial;
        if (topbarAvatar) topbarAvatar.textContent = initial;
        if (sidebarUsername) sidebarUsername.textContent = displayName;
        if (sidebarRole) sidebarRole.textContent = roleName;
        if (welcomeName) welcomeName.textContent = displayName;
    }
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(page) {
    AdminState.currentPage = page;

    // Hide all pages
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));

    // Hide loading
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.classList.add('hidden');

    // Show selected page
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
        pageEl.classList.remove('hidden');
        // Re-trigger fade animation
        pageEl.classList.remove('fade-in');
        void pageEl.offsetWidth;
        pageEl.classList.add('fade-in');
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('bg-sidebar-active', 'text-white');
        btn.classList.add('text-gray-300');
    });
    const activeBtn = document.querySelector(`[data-nav="${page}"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-sidebar-active', 'text-white');
        activeBtn.classList.remove('text-gray-300');
    }

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        users: 'Kelola User',
        reports: 'Semua Laporan',
        stats: 'Statistik & Rekap',
        audit: 'Audit Log',
        settings: 'Pengaturan',
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';

    // Close sidebar on mobile
    closeSidebarMobile();

    // Load page data
    loadPageData(page);
}

function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'reports':
            loadReports();
            break;
        case 'stats':
            loadStats();
            break;
        case 'audit':
            loadAuditLogs();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function closeSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info', duration = 3000) {
    // Try using ui.js toast if available
    if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
        UI.showToast(message, type);
        return;
    }

    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 toast-enter`;
    toast.innerHTML = `
        <span class="text-lg">${icons[type] || icons.info}</span>
        <p class="text-sm font-medium flex-1">${escapeHtml(message)}</p>
        <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
function showConfirmDialog(title, message, btnText = 'Hapus', btnClass = 'bg-red-600 hover:bg-red-700') {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const btn = document.getElementById('confirm-btn');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (btn) {
            btn.textContent = btnText;
            btn.className = `flex-1 px-4 py-2.5 ${btnClass} text-white rounded-lg text-sm font-medium transition-colors`;
        }

        AdminState.confirmCallback = resolve;
        if (modal) modal.classList.remove('hidden');
    });
}

function closeConfirmDialog(result) {
    const modal = document.getElementById('modal-confirm');
    if (modal) modal.classList.add('hidden');
    if (AdminState.confirmCallback) {
        AdminState.confirmCallback(result);
        AdminState.confirmCallback = null;
    }
}

// ============================================================
// API HELPER
// ============================================================
async function apiCall(method, url, data = null) {
    // Use API module if available
    if (typeof API !== 'undefined') {
        try {
            switch (method.toUpperCase()) {
                case 'GET':
                    return await API.get(url);
                case 'POST':
                    return await API.post(url, data);
                case 'PUT':
                    return await API.put(url, data);
                case 'DELETE':
                    return await API.delete(url);
                default:
                    return await API.get(url);
            }
        } catch (err) {
            console.warn('[Admin API Warning]:', err.message);
            // Return empty/mock data instead of kicking user out
            return { success: false, data: [] };
        }
    }

    // Fallback: direct fetch
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method: method.toUpperCase(), headers };
    if (data && method.toUpperCase() !== 'GET') {
        options.body = JSON.stringify(data);
    }

    // Append query params for GET
    let finalUrl = url;
    if (data && method.toUpperCase() === 'GET') {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') {
                params.append(k, v);
            }
        });
        const qs = params.toString();
        if (qs) finalUrl += `?${qs}`;
    }

    try {
        const response = await fetch(finalUrl, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.warn('[Admin fetch fallback warning]:', e.message);
        return { success: false, data: [] };
    }
}

// ============================================================
// KORIDOR LIST
// ============================================================
async function loadKoridorList() {
    try {
        // Try to load from API or use defaults
        const defaultKoridors = [
            'Koridor I (Pasar Pon - Terminal Ajibarang)',
            'Koridor II (Terminal Notog - Terminal Baturaden Bawah)',
            'Koridor III A (Terminal Bulupitu - Terminal Kebondalem)',
            'Koridor III B (Terminal Bulupitu - Terminal Kebondalem)',
            'Koridor IV (Terminal Bulupitu - Terminal Kejawar RSUD)',
            'Kantor Pusat (Pool Bus & Fasilitas)',
        ];

        // Try loading from settings API
        try {
            const result = await apiCall('GET', '/api/settings/koridor');
            if (result && Array.isArray(result.data) && result.data.length > 0) {
                AdminState.koridorList = result.data;
            } else {
                AdminState.koridorList = defaultKoridors;
            }
        } catch (e) {
            AdminState.koridorList = defaultKoridors;
        }

        // Populate koridor dropdowns
        populateKoridorDropdowns();
    } catch (err) {
        console.error('Failed to load koridor:', err);
        AdminState.koridorList = [];
    }
}

function populateKoridorDropdowns() {
    const selectors = ['report-koridor-filter', 'user-koridor'];
    selectors.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        // Keep first option
        const firstOption = el.options && el.options.length > 0 ? el.options[0].cloneNode(true) : null;
        el.innerHTML = '';
        if (firstOption) el.appendChild(firstOption);
        AdminState.koridorList.forEach(k => {
            const name = typeof k === 'string' ? k : (k.nama || k);
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            el.appendChild(opt);
        });
    });
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
    try {
        // Load today's stats
        const [statsResult, usersResult] = await Promise.allSettled([
            apiCall('GET', '/api/laporan/stats/today'),
            apiCall('GET', '/api/users'),
        ]);

        // Update stats cards
        if (statsResult.status === 'fulfilled' && statsResult.value) {
            const stats = statsResult.value.data || statsResult.value;
            document.getElementById('stat-laporan-today').textContent = stats.totalLaporan ?? stats.total ?? 0;
            document.getElementById('stat-temuan-today').textContent = stats.temuan ?? 0;
            document.getElementById('stat-security-aktif').textContent = stats.securityAktif ?? stats.aktif ?? 0;
        }

        if (usersResult.status === 'fulfilled' && usersResult.value) {
            const users = usersResult.value.data || usersResult.value;
            if (Array.isArray(users)) {
                const securityCount = users.filter(u => u.role === 'security').length;
                document.getElementById('stat-total-security').textContent = securityCount;
            }
        }

        // Load recent reports
        await loadRecentReports();

    } catch (err) {
        console.error('Dashboard load error:', err);
        showToast('Gagal memuat data dashboard', 'error');
    }
}

async function loadRecentReports() {
    const tbody = document.getElementById('recent-reports-body');
    if (!tbody) return;

    try {
        const result = await apiCall('GET', '/api/laporan', { limit: 10, sort: 'terbaru' });
        const reports = result?.data || result || [];

        if (!Array.isArray(reports) || reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">Belum ada laporan hari ini</td></tr>';
            return;
        }

        tbody.innerHTML = reports.slice(0, 10).map(r => `
            <tr class="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onclick="showReportDetail('${r.id || r._id}')">
                <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">${formatDateTime(r.tanggal || r.createdAt)}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800">${escapeHtml(r.petugas || r.user?.nama || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(r.koridor || '-')}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${r.status === 'aman' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${r.status === 'aman' ? '✅ Aman' : '⚠️ Temuan'}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">${escapeHtml(r.keterangan || r.catatan || '-')}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">Gagal memuat laporan</td></tr>';
    }
}

// ============================================================
// USER MANAGEMENT
// ============================================================
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400"><svg class="w-6 h-6 inline spinner text-primary mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Memuat data...</td></tr>';

    try {
        const result = await apiCall('GET', '/api/users');
        AdminState.users = result?.data || result || [];

        if (!Array.isArray(AdminState.users)) {
            AdminState.users = [];
        }

        // Also populate petugas filter in reports
        populatePetugasFilter();
        populateAuditUserFilter();

        filterUsers();
    } catch (err) {
        console.error('Load users error:', err);
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-red-400">Gagal memuat data user</td></tr>';
        showToast('Gagal memuat data user', 'error');
    }
}

function filterUsers() {
    const searchTerm = (document.getElementById('user-search')?.value || '').toLowerCase();
    const roleFilter = document.getElementById('user-role-filter')?.value || '';

    AdminState.filteredUsers = AdminState.users.filter(u => {
        const matchSearch = !searchTerm ||
            (u.username || '').toLowerCase().includes(searchTerm) ||
            (u.nama || '').toLowerCase().includes(searchTerm);
        const matchRole = !roleFilter || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    renderUsersTable();
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (AdminState.filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">Tidak ada user ditemukan</td></tr>';
        return;
    }

    tbody.innerHTML = AdminState.filteredUsers.map((u, i) => {
        const isActive = u.isActive !== false && u.status !== 'nonaktif';
        const roleLabels = { super_admin: 'Super Admin', admin: 'Admin', security: 'Security' };
        const roleColors = { super_admin: 'bg-purple-100 text-purple-700', admin: 'bg-blue-100 text-blue-700', security: 'bg-gray-100 text-gray-700' };

        return `
            <tr class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm text-gray-500">${i + 1}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800">${escapeHtml(u.username || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(u.nama || '-')}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}">
                        ${roleLabels[u.role] || u.role || '-'}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(u.noHp || u.no_hp || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(u.koridor || '-')}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-1">
                        <button onclick='editUser(${JSON.stringify(u).replace(/'/g, "&#39;")})' class="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onclick="openResetPasswordModal('${u.id || u._id}', '${escapeHtml(u.nama || u.username)}')" class="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors" title="Reset Password">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                        </button>
                        <button onclick="toggleUserActive('${u.id || u._id}', ${isActive})" class="p-1.5 rounded-lg ${isActive ? 'hover:bg-orange-50 text-orange-600' : 'hover:bg-green-50 text-green-600'} transition-colors" title="${isActive ? 'Nonaktifkan' : 'Aktifkan'}">
                            ${isActive
                                ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>'
                                : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                            }
                        </button>
                        <button onclick="deleteUser('${u.id || u._id}', '${escapeHtml(u.nama || u.username)}')" class="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Hapus">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// User Modal
function openUserModal(user = null) {
    const modal = document.getElementById('modal-user');
    const title = document.getElementById('user-modal-title');
    const passwordField = document.getElementById('password-field');
    const passwordInput = document.getElementById('user-password');
    const form = document.getElementById('user-form');

    if (!modal) return;

    // Reset form
    if (form) form.reset();
    document.getElementById('user-id').value = '';

    if (user) {
        // Edit mode
        title.textContent = 'Edit User';
        passwordField.classList.add('hidden');
        passwordInput.removeAttribute('required');
        document.getElementById('user-id').value = user.id || user._id;
        document.getElementById('user-username').value = user.username || '';
        document.getElementById('user-nama').value = user.nama || '';
        document.getElementById('user-role').value = user.role || '';
        document.getElementById('user-nohp').value = user.noHp || user.no_hp || '';
        document.getElementById('user-koridor').value = user.koridor || '';
    } else {
        // Create mode
        title.textContent = 'Tambah User Baru';
        passwordField.classList.remove('hidden');
        passwordInput.setAttribute('required', 'required');
    }

    modal.classList.remove('hidden');
}

function closeUserModal() {
    const modal = document.getElementById('modal-user');
    if (modal) modal.classList.add('hidden');
}

function editUser(user) {
    openUserModal(user);
}

async function saveUser(event) {
    event.preventDefault();

    const userId = document.getElementById('user-id').value;
    const data = {
        username: document.getElementById('user-username').value.trim(),
        nama: document.getElementById('user-nama').value.trim(),
        role: document.getElementById('user-role').value,
        noHp: document.getElementById('user-nohp').value.trim(),
        koridor: document.getElementById('user-koridor').value,
    };

    // Validate
    if (!data.username || !data.nama || !data.role) {
        showToast('Lengkapi semua field yang wajib diisi', 'warning');
        return;
    }

    const submitBtn = document.getElementById('user-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
    }

    try {
        if (userId) {
            // Update
            await apiCall('PUT', `/api/users/${userId}`, data);
            showToast('User berhasil diperbarui', 'success');
        } else {
            // Create
            const password = document.getElementById('user-password').value;
            if (!password || password.length < 6) {
                showToast('Password minimal 6 karakter', 'warning');
                return;
            }
            data.password = password;
            await apiCall('POST', '/api/users', data);
            showToast('User berhasil ditambahkan', 'success');
        }

        closeUserModal();
        await loadUsers();
    } catch (err) {
        console.error('Save user error:', err);
        showToast(err.message || 'Gagal menyimpan user', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan';
        }
    }
}

async function toggleUserActive(userId, currentlyActive) {
    const action = currentlyActive ? 'menonaktifkan' : 'mengaktifkan';
    const confirmed = await showConfirmDialog(
        `${currentlyActive ? 'Nonaktifkan' : 'Aktifkan'} User`,
        `Apakah Anda yakin ingin ${action} user ini?`,
        currentlyActive ? 'Nonaktifkan' : 'Aktifkan',
        currentlyActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
    );

    if (!confirmed) return;

    try {
        await apiCall('PUT', `/api/users/${userId}/toggle-active`);
        showToast(`User berhasil di${currentlyActive ? 'nonaktifkan' : 'aktifkan'}`, 'success');
        await loadUsers();
    } catch (err) {
        showToast(err.message || `Gagal ${action} user`, 'error');
    }
}

async function deleteUser(userId, userName) {
    const confirmed = await showConfirmDialog(
        'Hapus User',
        `Apakah Anda yakin ingin menghapus user "${userName}"? Tindakan ini tidak dapat dibatalkan.`,
        'Hapus',
        'bg-red-600 hover:bg-red-700'
    );

    if (!confirmed) return;

    try {
        await apiCall('DELETE', `/api/users/${userId}`);
        showToast('User berhasil dihapus', 'success');
        await loadUsers();
    } catch (err) {
        showToast(err.message || 'Gagal menghapus user', 'error');
    }
}

// Reset Password
function openResetPasswordModal(userId, userName) {
    document.getElementById('reset-user-id').value = userId;
    document.getElementById('reset-user-name').textContent = userName;
    document.getElementById('reset-password').value = '';
    document.getElementById('reset-password-confirm').value = '';
    document.getElementById('modal-reset-password').classList.remove('hidden');
}

function closeResetPasswordModal() {
    document.getElementById('modal-reset-password').classList.add('hidden');
}

async function submitResetPassword(event) {
    event.preventDefault();

    const userId = document.getElementById('reset-user-id').value;
    const password = document.getElementById('reset-password').value;
    const confirmPassword = document.getElementById('reset-password-confirm').value;

    if (password !== confirmPassword) {
        showToast('Password tidak cocok', 'warning');
        return;
    }

    if (password.length < 6) {
        showToast('Password minimal 6 karakter', 'warning');
        return;
    }

    try {
        await apiCall('PUT', `/api/users/${userId}/reset-password`, { password });
        showToast('Password berhasil direset', 'success');
        closeResetPasswordModal();
    } catch (err) {
        showToast(err.message || 'Gagal reset password', 'error');
    }
}

// ============================================================
// REPORTS
// ============================================================
async function loadReports() {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-400"><svg class="w-6 h-6 inline spinner text-primary mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Memuat data...</td></tr>';

    try {
        const filters = getReportFilters();
        const result = await apiCall('GET', '/api/laporan', filters);
        AdminState.reports = result?.data || result || [];

        if (!Array.isArray(AdminState.reports)) {
            AdminState.reports = [];
        }

        AdminState.selectedReports.clear();
        updateDeleteSelectedButton();
        AdminState.reportsPage = 1;
        filterReports();
    } catch (err) {
        console.error('Load reports error:', err);
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-red-400">Gagal memuat laporan</td></tr>';
        showToast('Gagal memuat data laporan', 'error');
    }
}

function getReportFilters() {
    const filters = {};
    const dateFrom = document.getElementById('report-date-from')?.value;
    const dateTo = document.getElementById('report-date-to')?.value;
    const koridor = document.getElementById('report-koridor-filter')?.value;
    const status = document.getElementById('report-status-filter')?.value;
    const petugas = document.getElementById('report-petugas-filter')?.value;

    if (dateFrom) filters.tanggalDari = dateFrom;
    if (dateTo) filters.tanggalSampai = dateTo;
    if (koridor) filters.koridor = koridor;
    if (status) filters.status = status;
    if (petugas) filters.petugas = petugas;

    return filters;
}

function filterReports() {
    // Client-side filtering (reports already loaded)
    const koridor = document.getElementById('report-koridor-filter')?.value || '';
    const status = document.getElementById('report-status-filter')?.value || '';
    const petugas = document.getElementById('report-petugas-filter')?.value || '';
    const dateFrom = document.getElementById('report-date-from')?.value || '';
    const dateTo = document.getElementById('report-date-to')?.value || '';

    AdminState.filteredReports = AdminState.reports.filter(r => {
        let match = true;
        if (koridor) match = match && (r.koridor || '').includes(koridor);
        if (status) match = match && r.status === status;
        if (petugas) match = match && (r.petugas === petugas || r.user?.nama === petugas || (r.userId || r.user_id) === petugas);
        if (dateFrom) {
            const rDate = (r.tanggal || r.createdAt || '').substring(0, 10);
            match = match && rDate >= dateFrom;
        }
        if (dateTo) {
            const rDate = (r.tanggal || r.createdAt || '').substring(0, 10);
            match = match && rDate <= dateTo;
        }
        return match;
    });

    AdminState.reportsPage = 1;
    renderReportsTable();
}

function renderReportsTable() {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    const data = AdminState.filteredReports;
    const page = AdminState.reportsPage;
    const perPage = AdminState.reportsPerPage;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageData = data.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-400">Tidak ada laporan ditemukan</td></tr>';
        updateReportsPagination(0, 0, 0);
        return;
    }

    tbody.innerHTML = pageData.map((r, i) => {
        const id = r.id || r._id;
        const isSelected = AdminState.selectedReports.has(id);
        return `
            <tr class="border-t border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}">
                <td class="px-4 py-3">
                    <input type="checkbox" class="report-checkbox rounded" value="${id}" ${isSelected ? 'checked' : ''} onchange="toggleReportSelect('${id}')">
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">${start + i + 1}</td>
                <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">${formatDateTime(r.tanggal || r.createdAt)}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800">${escapeHtml(r.petugas || r.user?.nama || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(r.koridor || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(r.shift || '-')}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${r.status === 'aman' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${r.status === 'aman' ? '✅ Aman' : '⚠️ Temuan'}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">${escapeHtml(r.keterangan || r.catatan || '-')}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-1">
                        <button onclick="showReportDetail('${id}')" class="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat Detail">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button onclick="deleteReport('${id}')" class="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Hapus">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateReportsPagination(data.length, start + 1, Math.min(end, data.length));
}

function updateReportsPagination(total, from, to) {
    const info = document.getElementById('reports-pagination-info');
    const buttons = document.getElementById('reports-pagination-buttons');

    if (info) {
        info.textContent = total > 0 ? `Menampilkan ${from}-${to} dari ${total} laporan` : 'Tidak ada laporan';
    }

    if (buttons) {
        const totalPages = Math.ceil(total / AdminState.reportsPerPage);
        let html = '';

        if (totalPages > 1) {
            // Prev
            html += `<button onclick="changeReportsPage(${AdminState.reportsPage - 1})" class="px-3 py-1.5 rounded-lg text-sm ${AdminState.reportsPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}" ${AdminState.reportsPage === 1 ? 'disabled' : ''}>&laquo;</button>`;

            // Page numbers
            const startPage = Math.max(1, AdminState.reportsPage - 2);
            const endPage = Math.min(totalPages, AdminState.reportsPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                html += `<button onclick="changeReportsPage(${i})" class="px-3 py-1.5 rounded-lg text-sm font-medium ${i === AdminState.reportsPage ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}">${i}</button>`;
            }

            // Next
            html += `<button onclick="changeReportsPage(${AdminState.reportsPage + 1})" class="px-3 py-1.5 rounded-lg text-sm ${AdminState.reportsPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}" ${AdminState.reportsPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
        }

        buttons.innerHTML = html;
    }
}

function changeReportsPage(page) {
    const totalPages = Math.ceil(AdminState.filteredReports.length / AdminState.reportsPerPage);
    if (page < 1 || page > totalPages) return;
    AdminState.reportsPage = page;
    renderReportsTable();
    // Scroll to top of table
    document.getElementById('page-reports')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleReportSelect(id) {
    if (AdminState.selectedReports.has(id)) {
        AdminState.selectedReports.delete(id);
    } else {
        AdminState.selectedReports.add(id);
    }
    updateDeleteSelectedButton();
}

function toggleSelectAllReports() {
    const selectAll = document.getElementById('select-all-reports');
    const checkboxes = document.querySelectorAll('.report-checkbox');

    if (selectAll?.checked) {
        checkboxes.forEach(cb => {
            cb.checked = true;
            AdminState.selectedReports.add(cb.value);
        });
    } else {
        checkboxes.forEach(cb => {
            cb.checked = false;
            AdminState.selectedReports.delete(cb.value);
        });
    }
    updateDeleteSelectedButton();
}

function updateDeleteSelectedButton() {
    const btn = document.getElementById('btn-delete-selected');
    if (btn) {
        if (AdminState.selectedReports.size > 0) {
            btn.classList.remove('hidden');
            btn.classList.add('flex');
            btn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Hapus Terpilih (${AdminState.selectedReports.size})
            `;
        } else {
            btn.classList.add('hidden');
            btn.classList.remove('flex');
        }
    }
}

async function deleteSelectedReports() {
    if (AdminState.selectedReports.size === 0) return;

    const confirmed = await showConfirmDialog(
        'Hapus Laporan Terpilih',
        `Apakah Anda yakin ingin menghapus ${AdminState.selectedReports.size} laporan? Tindakan ini tidak dapat dibatalkan.`,
        'Hapus Semua',
        'bg-red-600 hover:bg-red-700'
    );

    if (!confirmed) return;

    try {
        const ids = Array.from(AdminState.selectedReports);
        let successCount = 0;
        let errorCount = 0;

        for (const id of ids) {
            try {
                await apiCall('DELETE', `/api/laporan/${id}`);
                successCount++;
            } catch {
                errorCount++;
            }
        }

        AdminState.selectedReports.clear();

        if (errorCount > 0) {
            showToast(`${successCount} berhasil dihapus, ${errorCount} gagal`, 'warning');
        } else {
            showToast(`${successCount} laporan berhasil dihapus`, 'success');
        }

        await loadReports();
    } catch (err) {
        showToast('Gagal menghapus laporan', 'error');
    }
}

async function deleteReport(id) {
    const confirmed = await showConfirmDialog(
        'Hapus Laporan',
        'Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.',
        'Hapus',
        'bg-red-600 hover:bg-red-700'
    );

    if (!confirmed) return;

    try {
        await apiCall('DELETE', `/api/laporan/${id}`);
        showToast('Laporan berhasil dihapus', 'success');
        await loadReports();
    } catch (err) {
        showToast(err.message || 'Gagal menghapus laporan', 'error');
    }
}

// Report Detail Modal
async function showReportDetail(id) {
    const modal = document.getElementById('modal-report-detail');
    const content = document.getElementById('report-detail-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = '<div class="text-center py-8"><svg class="w-8 h-8 inline spinner text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>';

    // Find report in local state first
    const report = AdminState.reports.find(r => (r.id || r._id) === id);

    if (report) {
        renderReportDetail(report);
    } else {
        try {
            const result = await apiCall('GET', `/api/laporan/${id}`);
            const r = result?.data || result;
            renderReportDetail(r);
        } catch (err) {
            content.innerHTML = '<p class="text-red-400 text-center py-8">Gagal memuat detail laporan</p>';
        }
    }
}

function renderReportDetail(r) {
    const content = document.getElementById('report-detail-content');
    if (!content || !r) return;

    const statusBadge = r.status === 'aman'
        ? '<span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">✅ Aman</span>'
        : '<span class="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">⚠️ Temuan</span>';

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Status</span>
                ${statusBadge}
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-xs text-gray-500 mb-1">Tanggal/Waktu</p>
                    <p class="text-sm font-medium text-gray-800">${formatDateTime(r.tanggal || r.createdAt)}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Petugas</p>
                    <p class="text-sm font-medium text-gray-800">${escapeHtml(r.petugas || r.user?.nama || '-')}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Koridor</p>
                    <p class="text-sm font-medium text-gray-800">${escapeHtml(r.koridor || '-')}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Shift</p>
                    <p class="text-sm font-medium text-gray-800">${escapeHtml(r.shift || '-')}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Lokasi / Halte</p>
                    <p class="text-sm font-medium text-gray-800">${escapeHtml(r.lokasi || r.halte || '-')}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Bus / Armada</p>
                    <p class="text-sm font-medium text-gray-800">${escapeHtml(r.bus || r.armada || '-')}</p>
                </div>
            </div>
            <div>
                <p class="text-xs text-gray-500 mb-1">Keterangan</p>
                <p class="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">${escapeHtml(r.keterangan || r.catatan || 'Tidak ada keterangan')}</p>
            </div>
            ${r.foto || r.image ? `
                <div>
                    <p class="text-xs text-gray-500 mb-1">Foto</p>
                    <img src="${r.foto || r.image}" alt="Foto laporan" class="rounded-lg max-h-64 object-cover w-full">
                </div>
            ` : ''}
        </div>
    `;
}

function closeReportDetailModal() {
    document.getElementById('modal-report-detail')?.classList.add('hidden');
}

// ============================================================
// STATISTICS
// ============================================================
async function loadStats() {
    const monthInput = document.getElementById('stats-month');
    const bulan = monthInput?.value;

    if (!bulan) return;

    try {
        const result = await apiCall('GET', `/api/laporan/stats/monthly`, { bulan });
        const stats = result?.data || result || {};

        document.getElementById('stats-total').textContent = stats.total ?? 0;
        document.getElementById('stats-aman').textContent = stats.aman ?? 0;
        document.getElementById('stats-temuan').textContent = stats.temuan ?? 0;

        // Corridor breakdown
        renderCorridorBreakdown(stats.perKoridor || stats.corridors || []);

        // Officer breakdown
        renderOfficerBreakdown(stats.perPetugas || stats.officers || []);

    } catch (err) {
        console.error('Load stats error:', err);
        // Show zeros on error
        document.getElementById('stats-total').textContent = '0';
        document.getElementById('stats-aman').textContent = '0';
        document.getElementById('stats-temuan').textContent = '0';
        document.getElementById('stats-corridor-breakdown').innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Data tidak tersedia</p>';
        document.getElementById('stats-officer-breakdown').innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Data tidak tersedia</p>';
    }
}

function renderCorridorBreakdown(data) {
    const container = document.getElementById('stats-corridor-breakdown');
    if (!container) return;

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Tidak ada data koridor</p>';
        return;
    }

    const maxTotal = Math.max(...data.map(d => d.total || 0), 1);

    container.innerHTML = data.map(d => {
        const total = d.total || 0;
        const aman = d.aman || 0;
        const temuan = d.temuan || 0;
        const pct = Math.round((total / maxTotal) * 100);
        return `
            <div class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">${escapeHtml(d.koridor || d.nama || '-')}</span>
                    <span class="text-sm font-bold text-gray-800">${total}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-1.5">
                    <div class="h-2 rounded-full bg-primary transition-all" style="width: ${pct}%"></div>
                </div>
                <div class="flex gap-3 text-xs text-gray-500">
                    <span>✅ Aman: ${aman}</span>
                    <span>⚠️ Temuan: ${temuan}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderOfficerBreakdown(data) {
    const container = document.getElementById('stats-officer-breakdown');
    if (!container) return;

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Tidak ada data petugas</p>';
        return;
    }

    const maxTotal = Math.max(...data.map(d => d.total || 0), 1);

    container.innerHTML = data.map(d => {
        const total = d.total || 0;
        const aman = d.aman || 0;
        const temuan = d.temuan || 0;
        const pct = Math.round((total / maxTotal) * 100);
        const initial = (d.nama || d.petugas || '?').charAt(0).toUpperCase();

        return `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="w-9 h-9 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-sm font-bold">${initial}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700 truncate">${escapeHtml(d.nama || d.petugas || '-')}</span>
                        <span class="text-sm font-bold text-gray-800">${total}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full bg-green-500 transition-all" style="width: ${pct}%"></div>
                    </div>
                    <div class="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>✅ ${aman}</span>
                        <span>⚠️ ${temuan}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// AUDIT LOG
// ============================================================
async function loadAuditLogs() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400"><svg class="w-6 h-6 inline spinner text-primary mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Memuat data...</td></tr>';

    try {
        const filters = getAuditFilters();
        const result = await apiCall('GET', '/api/audit-log', filters);
        AdminState.auditLogs = result?.data || result || [];

        if (!Array.isArray(AdminState.auditLogs)) {
            AdminState.auditLogs = [];
        }

        AdminState.auditPage = 1;
        filterAuditLogs();
    } catch (err) {
        console.error('Load audit logs error:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-red-400">Gagal memuat audit log</td></tr>';
        showToast('Gagal memuat audit log', 'error');
    }
}

function getAuditFilters() {
    const filters = {};
    const dateFrom = document.getElementById('audit-date-from')?.value;
    const dateTo = document.getElementById('audit-date-to')?.value;
    const user = document.getElementById('audit-user-filter')?.value;
    const action = document.getElementById('audit-action-filter')?.value;

    if (dateFrom) filters.tanggalDari = dateFrom;
    if (dateTo) filters.tanggalSampai = dateTo;
    if (user) filters.user = user;
    if (action) filters.aksi = action;

    return filters;
}

function filterAuditLogs() {
    const user = document.getElementById('audit-user-filter')?.value || '';
    const action = document.getElementById('audit-action-filter')?.value || '';
    const dateFrom = document.getElementById('audit-date-from')?.value || '';
    const dateTo = document.getElementById('audit-date-to')?.value || '';

    AdminState.filteredAuditLogs = AdminState.auditLogs.filter(log => {
        let match = true;
        if (user) match = match && ((log.user || log.username || '') === user || (log.userId || log.user_id || '') === user);
        if (action) match = match && (log.aksi || log.action || '').toLowerCase().includes(action.toLowerCase());
        if (dateFrom) {
            const logDate = (log.waktu || log.createdAt || log.timestamp || '').substring(0, 10);
            match = match && logDate >= dateFrom;
        }
        if (dateTo) {
            const logDate = (log.waktu || log.createdAt || log.timestamp || '').substring(0, 10);
            match = match && logDate <= dateTo;
        }
        return match;
    });

    AdminState.auditPage = 1;
    renderAuditTable();
}

function renderAuditTable() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    const data = AdminState.filteredAuditLogs;
    const page = AdminState.auditPage;
    const perPage = AdminState.auditPerPage;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageData = data.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">Tidak ada log ditemukan</td></tr>';
        updateAuditPagination(0, 0, 0);
        return;
    }

    const actionColors = {
        login: 'bg-blue-100 text-blue-700',
        logout: 'bg-gray-100 text-gray-700',
        create: 'bg-green-100 text-green-700',
        update: 'bg-yellow-100 text-yellow-700',
        delete: 'bg-red-100 text-red-700',
    };

    tbody.innerHTML = pageData.map(log => {
        const aksi = (log.aksi || log.action || '-').toLowerCase();
        const colorClass = actionColors[aksi] || 'bg-gray-100 text-gray-700';

        return `
            <tr class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">${formatDateTime(log.waktu || log.createdAt || log.timestamp)}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800">${escapeHtml(log.user || log.username || '-')}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${colorClass}">${escapeHtml(log.aksi || log.action || '-')}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">${escapeHtml(log.detail || log.keterangan || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-500 font-mono">${escapeHtml(log.ipAddress || log.ip || '-')}</td>
            </tr>
        `;
    }).join('');

    updateAuditPagination(data.length, start + 1, Math.min(end, data.length));
}

function updateAuditPagination(total, from, to) {
    const info = document.getElementById('audit-pagination-info');
    const buttons = document.getElementById('audit-pagination-buttons');

    if (info) {
        info.textContent = total > 0 ? `Menampilkan ${from}-${to} dari ${total} log` : 'Tidak ada log';
    }

    if (buttons) {
        const totalPages = Math.ceil(total / AdminState.auditPerPage);
        let html = '';

        if (totalPages > 1) {
            html += `<button onclick="changeAuditPage(${AdminState.auditPage - 1})" class="px-3 py-1.5 rounded-lg text-sm ${AdminState.auditPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}" ${AdminState.auditPage === 1 ? 'disabled' : ''}>&laquo;</button>`;

            const startPage = Math.max(1, AdminState.auditPage - 2);
            const endPage = Math.min(totalPages, AdminState.auditPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                html += `<button onclick="changeAuditPage(${i})" class="px-3 py-1.5 rounded-lg text-sm font-medium ${i === AdminState.auditPage ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}">${i}</button>`;
            }

            html += `<button onclick="changeAuditPage(${AdminState.auditPage + 1})" class="px-3 py-1.5 rounded-lg text-sm ${AdminState.auditPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}" ${AdminState.auditPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
        }

        buttons.innerHTML = html;
    }
}

function changeAuditPage(page) {
    const totalPages = Math.ceil(AdminState.filteredAuditLogs.length / AdminState.auditPerPage);
    if (page < 1 || page > totalPages) return;
    AdminState.auditPage = page;
    renderAuditTable();
}

// ============================================================
// SETTINGS
// ============================================================
async function loadSettings() {
    renderKoridorList();

    // Load system info
    try {
        const result = await apiCall('GET', '/api/settings/system');
        const info = result?.data || result || {};
        document.getElementById('sys-version').textContent = info.version || '1.0.0';
        document.getElementById('sys-database').textContent = info.database || 'SQLite';
        document.getElementById('sys-db-size').textContent = info.dbSize || info.databaseSize || '-';
        document.getElementById('sys-total-users').textContent = info.totalUsers ?? AdminState.users.length ?? '-';
    } catch (e) {
        document.getElementById('sys-total-users').textContent = AdminState.users.length || '-';
    }
}

function renderKoridorList() {
    const container = document.getElementById('koridor-list');
    if (!container) return;

    if (AdminState.koridorList.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Belum ada koridor</p>';
        return;
    }

    container.innerHTML = AdminState.koridorList.map((k, i) => {
        const name = typeof k === 'string' ? k : k.nama;
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">${i + 1}</span>
                    <span class="text-sm font-medium text-gray-700">${escapeHtml(name)}</span>
                </div>
                <button onclick="removeKoridor(${i})" class="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Hapus">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        `;
    }).join('');
}

async function addKoridor() {
    const name = prompt('Masukkan nama koridor baru:');
    if (!name || !name.trim()) return;

    AdminState.koridorList.push(name.trim());
    renderKoridorList();
    populateKoridorDropdowns();

    // Try save to API
    try {
        await apiCall('POST', '/api/settings/koridor', { nama: name.trim() });
        showToast('Koridor berhasil ditambahkan', 'success');
    } catch (e) {
        showToast('Koridor ditambahkan (lokal)', 'info');
    }
}

async function removeKoridor(index) {
    const confirmed = await showConfirmDialog(
        'Hapus Koridor',
        `Apakah Anda yakin ingin menghapus koridor "${AdminState.koridorList[index]}"?`,
        'Hapus',
        'bg-red-600 hover:bg-red-700'
    );

    if (!confirmed) return;

    const removed = AdminState.koridorList.splice(index, 1)[0];
    renderKoridorList();
    populateKoridorDropdowns();

    try {
        const id = typeof removed === 'string' ? removed : removed.id;
        await apiCall('DELETE', `/api/settings/koridor/${encodeURIComponent(id)}`);
        showToast('Koridor berhasil dihapus', 'success');
    } catch (e) {
        showToast('Koridor dihapus (lokal)', 'info');
    }
}

async function backupDatabase() {
    try {
        showToast('Memulai backup database...', 'info');

        // Try using API for backup
        const token = localStorage.getItem('token');
        const response = await fetch('/api/settings/backup', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-security-transbanyumas-${formatDateFile(new Date())}.db`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Backup database berhasil didownload', 'success');
        } else {
            throw new Error('Backup endpoint not available');
        }
    } catch (err) {
        showToast('Fitur backup belum tersedia di server', 'warning');
    }
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================
function exportReportsCSV() {
    const data = AdminState.filteredReports.length > 0 ? AdminState.filteredReports : AdminState.reports;

    if (data.length === 0) {
        showToast('Tidak ada data untuk di-export', 'warning');
        return;
    }

    const headers = ['No', 'Tanggal', 'Petugas', 'Koridor', 'Shift', 'Status', 'Keterangan'];
    const rows = data.map((r, i) => [
        i + 1,
        formatDateTime(r.tanggal || r.createdAt),
        r.petugas || r.user?.nama || '-',
        r.koridor || '-',
        r.shift || '-',
        r.status || '-',
        (r.keterangan || r.catatan || '-').replace(/"/g, '""'),
    ]);

    downloadCSV(headers, rows, `laporan-patroli-${formatDateFile(new Date())}.csv`);
    showToast('Data laporan berhasil di-export', 'success');
}

function exportStatsCSV() {
    const bulan = document.getElementById('stats-month')?.value || '';
    const total = document.getElementById('stats-total')?.textContent || '0';
    const aman = document.getElementById('stats-aman')?.textContent || '0';
    const temuan = document.getElementById('stats-temuan')?.textContent || '0';

    const headers = ['Bulan', 'Total Laporan', 'Aman', 'Temuan'];
    const rows = [[bulan, total, aman, temuan]];

    downloadCSV(headers, rows, `statistik-${bulan || 'all'}.csv`);
    showToast('Statistik berhasil di-export', 'success');
}

function downloadCSV(headers, rows, filename) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const csv = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function shareStatsWA() {
    const bulan = document.getElementById('stats-month')?.value || '';
    const total = document.getElementById('stats-total')?.textContent || '0';
    const aman = document.getElementById('stats-aman')?.textContent || '0';
    const temuan = document.getElementById('stats-temuan')?.textContent || '0';

    const message = `📊 *REKAP PATROLI KEAMANAN*
🏢 Trans Banyumas
📅 Periode: ${bulan}

📋 Total Laporan: ${total}
✅ Aman: ${aman}
⚠️ Temuan: ${temuan}

_Dikirim dari Security Trans Banyumas_`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

// ============================================================
// HELPERS
// ============================================================
function populatePetugasFilter() {
    const select = document.getElementById('report-petugas-filter');
    if (!select) return;

    const firstOption = select.options && select.options.length > 0 ? select.options[0].cloneNode(true) : null;
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);

    const securityUsers = AdminState.users.filter(u => u.role === 'security');
    securityUsers.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id || u._id || u.username;
        opt.textContent = u.nama || u.username;
        select.appendChild(opt);
    });
}

function populateAuditUserFilter() {
    const select = document.getElementById('audit-user-filter');
    if (!select) return;

    const firstOption = select.options && select.options.length > 0 ? select.options[0].cloneNode(true) : null;
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);

    AdminState.users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.username || u.id || u._id;
        opt.textContent = `${u.nama || u.username} (${u.role})`;
        select.appendChild(opt);
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return dateStr;
    }
}

function formatDateFile(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function handleLogout() {
    if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
        Auth.logout();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}
