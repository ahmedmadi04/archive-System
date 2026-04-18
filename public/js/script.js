/**
 * Orbit HR Management System - Core Application Logic
 * All element accesses are null-safe to prevent 'Cannot set properties of null' errors.
 */

// ─────────────────────────────────────────────
// Global State
// ─────────────────────────────────────────────
let currentForms = [];
let selectedForm = null;
let currentPage = 'action-forms';
let documentViewerCollapsed = false;
let currentUserRole = null;

// ─────────────────────────────────────────────
// Utility: Safe element setter
// ─────────────────────────────────────────────
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}

function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check-auth', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        const data = await response.json();

        if (!data.authenticated) {
            localStorage.removeItem('authToken');
            window.location.href = '/html/index.html';
            return;
        }

        currentUserRole = data.role;

        setText('userName', data.username);
        setText('userAvatar', data.username.charAt(0).toUpperCase());
        setText('userRoleDisplay', data.role);
        setText('settingsUser', data.username);
        setText('settingsRole', data.role);

        if (data.role === 'ADMIN') {
            const adminNav = document.getElementById('adminNav');
            const adminSection = document.getElementById('adminSection');
            if (adminNav) adminNav.style.display = 'flex';
            if (adminSection) adminSection.style.display = 'block';
        }

        loadForms();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/html/index.html';
    }
}

async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
    } catch (e) {
        console.warn('Logout request error:', e);
    } finally {
        localStorage.removeItem('authToken');
        window.location.href = '/html/index.html';
    }
}

// Login page handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');
    const loginLoader = document.getElementById('loginLoader');
    const loginText = document.getElementById('loginText');

    if (loginLoader) loginLoader.style.display = 'inline-block';
    if (loginText) loginText.textContent = 'Authenticating...';
    if (errorMsg) errorMsg.style.display = 'none';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            if (data.data && data.data.token) localStorage.setItem('authToken', data.data.token);
            if (loginText) loginText.textContent = 'Success!';
            setTimeout(() => { window.location.href = '/html/dashboard.html'; }, 400);
        } else {
            throw new Error(data.message || 'Invalid credentials');
        }
    } catch (err) {
        if (loginLoader) loginLoader.style.display = 'none';
        if (loginText) loginText.textContent = 'Sign In';
        if (errorMsg) {
            errorMsg.style.display = 'block';
            const errText = document.getElementById('errorText');
            if (errText) errText.textContent = err.message;
        }
    }
}

// ─────────────────────────────────────────────
// Navigation / Page Switching
// ─────────────────────────────────────────────
function showPage(pageName, navEl) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) targetPage.classList.add('active');

    // Activate nav item (passed directly or found by ID)
    if (navEl) {
        navEl.classList.add('active');
    } else {
        const navItem = document.getElementById(`nav-${pageName}`);
        if (navItem) navItem.classList.add('active');
    }

    currentPage = pageName;

    if (pageName === 'archive') loadArchivedForms();
    else if (pageName === 'admin') loadUsers();
    else if (pageName === 'action-forms') loadForms();
}

// ─────────────────────────────────────────────
// Document Viewer (PDF Panel)
// ─────────────────────────────────────────────
function toggleDocumentViewer() {
    const appContainer = document.querySelector('.app-container');
    const pdfPanel = document.getElementById('pdfPanel');
    const toggleBtn = document.querySelector('.btn-toggle-sidebar');

    documentViewerCollapsed = !documentViewerCollapsed;

    if (appContainer) appContainer.classList.toggle('document-viewer-collapsed', documentViewerCollapsed);
    if (pdfPanel) pdfPanel.classList.toggle('collapsed', documentViewerCollapsed);
    if (toggleBtn) toggleBtn.classList.toggle('active', documentViewerCollapsed);
}

function selectRow(id) {
    document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('selected'));
    const row = document.querySelector(`#tableBody tr[data-id="${id}"]`);
    if (row) row.classList.add('selected');

    const form = currentForms.find(f => f._id === id);
    if (form) {
        selectedForm = form;
        if (documentViewerCollapsed) toggleDocumentViewer();
        loadPDF(form);
    }
}

function loadPDF(form) {
    setText('pdfTitle', `${form.actionCode} — ${form.employeeName}`);
    setHtml('pdfViewer', `<iframe src="${form.filePath}#toolbar=0&navpanes=0" width="100%" height="100%" frameborder="0" style="border:none;"></iframe>`);
}

// ─────────────────────────────────────────────
// Forms Data
// ─────────────────────────────────────────────
async function loadForms() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('tableContainer').style.display = 'none';
    document.getElementById('tableBody').innerHTML = '';

    try {
        const res = await fetch('/api/forms?status=Active', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        const data = await res.json();
        document.getElementById('loadingState').style.display = 'none';

        if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to load');

        const forms = data.data?.forms || [];
        currentForms = forms;
        renderTable(forms);
        updateStats(forms);
        generateReports(forms);
        generateEmployeesList(forms);

        if (forms.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
        } else {
            document.getElementById('tableContainer').style.display = 'block';
        }
    } catch (err) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        showNotification('error', 'Error', err.message);
        if (err.message?.includes('Unauthorized') || err.message?.includes('Authentication')) {
            localStorage.removeItem('authToken');
            window.location.href = '/html/index.html';
        }
    }
}

function renderTable(forms) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.innerHTML = forms.map(form => `
        <tr onclick="selectRow('${form._id}')" data-id="${form._id}" style="cursor:pointer;">
            <td><span class="action-code">${form.actionCode || '—'}</span></td>
            <td>${form.employeeId}</td>
            <td style="font-weight:600;color:var(--text-primary);">${form.employeeName}</td>
            <td>${formatDate(form.actionDate)}</td>
            <td>${form.department}</td>
            <td style="color:var(--text-muted);font-size:13px;">
                <i class="fas fa-user-circle"></i> ${form.uploadedBy?.username || 'System'}
            </td>
            <td><span class="status-badge">${form.status}</span></td>
            <td>
                <div style="display:flex;gap:6px;">
                    <button class="btn-icon" onclick="event.stopPropagation();archiveForm('${form._id}')" title="Archive">
                        <i class="fas fa-archive"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="event.stopPropagation();deleteForm('${form._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    setText('resultCount', forms.length);
}

function updateStats(forms) {
    const now = new Date();
    setText('totalForms', forms.length);
    setText('activeForms', forms.filter(f => f.status === 'Active').length);
    setText('totalEmployees', new Set(forms.map(f => f.employeeId)).size);
    setText('monthForms', forms.filter(f => {
        const d = new Date(f.actionDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length);
}

function generateReports(forms) {
    const chart = document.getElementById('departmentChart');
    if (!chart || forms.length === 0) return;

    const deptCount = {};
    forms.forEach(f => { deptCount[f.department] = (deptCount[f.department] || 0) + 1; });
    const max = Math.max(...Object.values(deptCount), 1);
    const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0];

    chart.innerHTML = Object.entries(deptCount).map(([dept, count]) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
            <div style="position:relative;width:100%;display:flex;justify-content:center;">
                <span style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:4px;">${count}</span>
            </div>
            <div class="bar" style="height:${Math.round((count/max)*180)}px;width:32px;border-radius:8px 8px 0 0;background:linear-gradient(to top,var(--primary),var(--primary-light,#818cf8));"></div>
            <div style="font-size:10px;margin-top:8px;color:var(--text-muted);text-align:center;max-width:60px;">${dept}</div>
        </div>
    `).join('');

    if (topDept) setText('topDept', `Top Department: ${topDept[0]} (${topDept[1]} forms)`);
}

function generateEmployeesList(forms) {
    const list = document.getElementById('employeesList');
    if (!list) return;

    const map = {};
    forms.forEach(f => {
        if (!map[f.employeeId]) map[f.employeeId] = { id: f.employeeId, name: f.employeeName, dept: f.department, count: 0 };
        map[f.employeeId].count++;
    });

    const employees = Object.values(map);
    setText('employeeCount', `${employees.length} Employees`);

    list.innerHTML = employees.map(emp => `
        <div class="employee-card" style="background:var(--bg-surface);border:1px solid var(--border-glass);border-radius:16px;padding:24px;cursor:pointer;transition:all 0.2s ease;"
             onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-glass)'">
            <div style="display:flex;align-items:center;gap:16px;">
                <div style="width:48px;height:48px;background:linear-gradient(135deg,var(--primary),var(--primary-dark,#4f46e5));border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;">
                    ${emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-weight:700;font-size:15px;">${emp.name}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${emp.dept} · ID: ${emp.id}</div>
                    <div style="font-size:12px;color:var(--primary);margin-top:4px;">${emp.count} form${emp.count !== 1 ? 's' : ''}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────
// Archive
// ─────────────────────────────────────────────
async function loadArchivedForms() {
    const loading = document.getElementById('archiveLoading');
    const empty = document.getElementById('archiveEmpty');
    const container = document.getElementById('archiveTableContainer');
    const tbody = document.getElementById('archiveTableBody');

    if (loading) loading.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (container) container.style.display = 'none';

    try {
        const res = await fetch('/api/forms/archived', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        const data = await res.json();
        if (loading) loading.style.display = 'none';

        const forms = data.data?.forms || [];
        if (forms.length === 0) {
            if (empty) empty.style.display = 'block';
        } else {
            if (container) container.style.display = 'block';
            if (tbody) tbody.innerHTML = forms.map(form => `
                <tr data-id="${form._id}">
                    <td>${form.actionCode || '—'}</td>
                    <td>${form.employeeId}</td>
                    <td>${form.employeeName}</td>
                    <td>${formatDate(form.actionDate)}</td>
                    <td>${form.department}</td>
                    <td>${form.uploadedBy?.username || 'System'}</td>
                    <td>
                        <button class="btn-icon btn-danger" onclick="deleteForm('${form._id}')" title="Delete Permanently">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (empty) empty.style.display = 'block';
        showNotification('error', 'Error', 'Failed to load archive');
    }
}

// ─────────────────────────────────────────────
// Form Actions (Archive / Delete)
// ─────────────────────────────────────────────
async function archiveForm(id) {
    if (!confirm('Archive this document?')) return;
    try {
        const res = await fetch(`/api/forms/${id}/status`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify({ status: 'Archived' })
        });
        const data = await res.json();
        if (data.success) {
            showNotification('success', 'Archived', 'Form moved to archive');
            loadForms();
        } else {
            showNotification('error', 'Error', data.message || 'Archive failed');
        }
    } catch (err) {
        showNotification('error', 'Error', 'Archive request failed');
    }
}

async function deleteForm(id) {
    if (!confirm('Permanently delete this document? This cannot be undone.')) return;
    try {
        const res = await fetch(`/api/forms/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        const data = await res.json();
        if (data.success) {
            showNotification('success', 'Deleted', 'Document removed');
            if (currentPage === 'archive') loadArchivedForms();
            else loadForms();
        } else {
            showNotification('error', 'Error', data.message || 'Delete failed');
        }
    } catch (err) {
        showNotification('error', 'Error', 'Delete request failed');
    }
}

// ─────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────
function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.add('active');
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('uploadForm');
        if (form) form.reset();
        setText('fileNameDisplay', '');
    }
}

function updateFileName(input) {
    const display = document.getElementById('fileNameDisplay');
    if (display && input.files[0]) display.textContent = `✓ ${input.files[0].name}`;
}

async function submitForm() {
    const employeeId = document.getElementById('employeeId')?.value.trim();
    const employeeName = document.getElementById('employeeName')?.value.trim();
    const actionDate = document.getElementById('actionDate')?.value;
    const department = document.getElementById('department')?.value.trim();
    const actionCode = document.getElementById('actionCode')?.value.trim();
    const pdfFile = document.getElementById('pdfFile')?.files[0];

    if (!employeeId || !employeeName || !actionDate || !department) {
        showNotification('error', 'Validation Error', 'Please fill in all required fields');
        return;
    }

    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('employeeName', employeeName);
    formData.append('actionDate', actionDate);
    formData.append('department', department);
    if (actionCode) formData.append('actionCode', actionCode);
    if (pdfFile) formData.append('pdfFile', pdfFile);

    try {
        const res = await fetch('/api/forms', {
            method: 'POST',
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            showNotification('success', 'Uploaded', 'Form added to registry');
            closeUploadModal();
            loadForms();
        } else {
            showNotification('error', 'Upload Failed', data.error || data.message || 'Unknown error');
        }
    } catch (err) {
        showNotification('error', 'Network Error', 'Upload request failed');
    }
}

// ─────────────────────────────────────────────
// Admin - User Management
// ─────────────────────────────────────────────
async function loadUsers() {
    const usersTable = document.getElementById('usersTable');
    if (!usersTable) return;
    usersTable.innerHTML = '<div style="padding:40px;text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>';

    try {
        const res = await fetch('/api/admin/users', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
            renderUsersTable(data.data);
        } else {
            usersTable.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">No users found.</div>';
        }
    } catch (err) {
        usersTable.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger);">Failed to load users.</div>';
    }
}

function renderUsersTable(users) {
    const usersTable = document.getElementById('usersTable');
    if (!usersTable) return;

    usersTable.innerHTML = `
        <div class="results-header">
            <div class="results-title">System Users</div>
            <div class="results-count">${users.length} Users</div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td style="font-weight:600;">${u.username}</td>
                            <td style="color:var(--text-muted);">${u.email || '—'}</td>
                            <td>${u.role?.name || u.role || '—'}</td>
                            <td><span class="status-badge" style="${!u.isActive ? 'background:rgba(239,68,68,0.1);color:#ef4444;' : ''}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function openAddUserModal() {
    // Load roles first
    try {
        const res = await fetch('/api/admin/roles', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        const data = await res.json();
        const select = document.getElementById('newRole');
        if (select && data.data) {
            select.innerHTML = '<option value="">Select a role</option>' +
                data.data.map(r => `<option value="${r._id}">${r.name}</option>`).join('');
        }
    } catch (e) {
        console.warn('Could not load roles:', e);
    }

    const modal = document.getElementById('addUserModal');
    if (modal) modal.classList.add('active');
}

function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('addUserForm');
        if (form) form.reset();
    }
}

async function submitAddUser() {
    const username = document.getElementById('newUsername')?.value.trim();
    const email = document.getElementById('newEmail')?.value.trim();
    const password = document.getElementById('newPassword')?.value;
    const role = document.getElementById('newRole')?.value;

    if (!username || !password) {
        showNotification('error', 'Validation', 'Username and password are required');
        return;
    }

    try {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        if (data.success) {
            showNotification('success', 'Created', 'User account created successfully');
            closeAddUserModal();
            loadUsers();
        } else {
            showNotification('error', 'Error', data.message || 'Creation failed');
        }
    } catch (err) {
        showNotification('error', 'Error', 'Request failed');
    }
}

// ─────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────
function showNotification(type, title, message) {
    const notif = document.getElementById('notification');
    if (!notif) return;

    setText('notifTitle', title);
    setText('notifMessage', message);

    const colors = { success: 'var(--accent)', error: 'var(--danger)', info: 'var(--primary)', warning: 'var(--warning)' };
    notif.style.borderLeftColor = colors[type] || colors.info;

    const icon = document.getElementById('notifIcon');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    if (icon) icon.className = `fas ${icons[type] || icons.info}`;
    if (icon) icon.style.color = colors[type] || colors.info;

    notif.classList.add('active');
    setTimeout(() => notif.classList.remove('active'), 4500);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ─────────────────────────────────────────────
// Localization
// ─────────────────────────────────────────────
const translations = {
    en: {
        app_title: 'Orbit', app_subtitle: 'Premium HR Suite',
        logout: 'Logout', main_menu: 'Main Menu', nav_forms: 'Action Forms',
        nav_reports: 'Analytics', nav_employees: 'Employees', tools: 'Tools',
        nav_archive: 'Archive', nav_settings: 'Settings', admin_menu: 'Admin',
        nav_admin: 'User Access', forms_title: 'Employee Action Forms',
        btn_upload: 'Upload Form', employees_page_title: 'Employee Directory'
    },
    ar: {
        app_title: 'أوربيت', app_subtitle: 'نظام الموارد البشرية',
        logout: 'خروج', main_menu: 'القائمة الرئيسية', nav_forms: 'النماذج',
        nav_reports: 'التقارير', nav_employees: 'الموظفين', tools: 'الأدوات',
        nav_archive: 'الأرشيف', nav_settings: 'الإعدادات', admin_menu: 'الإدارة',
        nav_admin: 'المستخدمين', forms_title: 'نماذج الموظفين',
        btn_upload: 'رفع نموذج', employees_page_title: 'دليل الموظفين'
    }
};

function applyLanguage(lang) {
    localStorage.setItem('language', lang);
    document.body.classList.toggle('rtl', lang === 'ar');
    document.documentElement.lang = lang;
    const t = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
}

function toggleLanguage() {
    const current = localStorage.getItem('language') || 'en';
    applyLanguage(current === 'en' ? 'ar' : 'en');
}

// ─────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Restore theme
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

    if (window.location.pathname.includes('dashboard.html')) {
        // Restore language
        applyLanguage(localStorage.getItem('language') || 'en');
        checkAuth();
    } else {
        // Login page
        const form = document.getElementById('loginForm');
        if (form) form.addEventListener('submit', handleLogin);
    }
});
