// ============================================================
// TIMI FXX MARKETING - ADMIN JAVASCRIPT
// ============================================================

// API_BASE_URL is set in config.js
const API_BASE_URL = window.API_BASE_URL || 'https://timifxx-marketing-production.up.railway.app';

let adminToken = localStorage.getItem('adminToken');
let currentSection = 'dashboard';

// ============================================================
// DOM ELEMENTS
// ============================================================
const loginOverlay = document.getElementById('login-overlay');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');

// ============================================================
// CHECK AUTH STATUS
// ============================================================
async function checkAuth() {
    if (!adminToken) {
        showLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            showDashboard();
            loadDashboard();
        } else {
            localStorage.removeItem('adminToken');
            adminToken = null;
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

// ============================================================
// SHOW/HIDE
// ============================================================
function showLogin() {
    loginOverlay.classList.remove('hidden');
    adminDashboard.style.display = 'none';
}

function showDashboard() {
    loginOverlay.classList.add('hidden');
    adminDashboard.style.display = 'flex';
}

// ============================================================
// ADMIN LOGIN
// ============================================================
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        loginError.textContent = '';
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            document.getElementById('admin-user-email').textContent = email;
            showDashboard();
            loadDashboard();

        } catch (error) {
            loginError.textContent = error.message || 'Invalid email or password. Please try again.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> Login';
        }
    });
}

// ============================================================
// ADMIN LOGOUT
// ============================================================
document.getElementById('admin-logout')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    adminToken = null;
    showLogin();
    document.getElementById('login-password').value = '';
});

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.dataset.section;
        switchSection(section);
    });
});

function switchSection(section) {
    currentSection = section;

    // Update sidebar
    document.querySelectorAll('.sidebar-link[data-section]').forEach(l => l.classList.remove('active'));
    document.querySelector(`.sidebar-link[data-section="${section}"]`)?.classList.add('active');

    // Update sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');

    // Update header
    const titles = {
        dashboard: 'Dashboard',
        orders: 'Orders',
        services: 'Services',
        settings: 'Settings'
    };
    document.getElementById('admin-section-title').textContent = titles[section] || section;

    // Load data
    if (section === 'dashboard') loadDashboard();
    if (section === 'orders') loadOrders();
    if (section === 'services') loadAdminServices();
}

// ============================================================
// LOAD DASHBOARD
// ============================================================
async function loadDashboard() {
    const statsGrid = document.getElementById('stats-grid');
    const recentOrdersTable = document.getElementById('recent-orders-table');

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load dashboard');
        }

        const data = await response.json();

        // Stats
        statsGrid.innerHTML = `
            <div class="stat-card total">
                <span class="stat-icon"><i class="fas fa-shopping-cart"></i></span>
                <span class="stat-number">${data.totalOrders || 0}</span>
                <span class="stat-label">Total Orders</span>
            </div>
            <div class="stat-card pending">
                <span class="stat-icon"><i class="fas fa-clock"></i></span>
                <span class="stat-number">${data.pendingOrders || 0}</span>
                <span class="stat-label">Pending</span>
            </div>
            <div class="stat-card processing">
                <span class="stat-icon"><i class="fas fa-spinner"></i></span>
                <span class="stat-number">${data.processingOrders || 0}</span>
                <span class="stat-label">Processing</span>
            </div>
            <div class="stat-card completed">
                <span class="stat-icon"><i class="fas fa-check-circle"></i></span>
                <span class="stat-number">${data.completedOrders || 0}</span>
                <span class="stat-label">Completed</span>
            </div>
            <div class="stat-card cancelled">
                <span class="stat-icon"><i class="fas fa-times-circle"></i></span>
                <span class="stat-number">${data.cancelledOrders || 0}</span>
                <span class="stat-label">Cancelled</span>
            </div>
        `;

        // Recent orders
        if (data.recentOrders && data.recentOrders.length > 0) {
            recentOrdersTable.innerHTML = createOrdersTable(data.recentOrders);
        } else {
            recentOrdersTable.innerHTML = `<p style="color:var(--text-secondary);padding:20px 0;">No recent orders.</p>`;
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        statsGrid.innerHTML = `<p style="color:var(--text-secondary);">Failed to load dashboard data.</p>`;
    }
}

// ============================================================
// LOAD ORDERS
// ============================================================
async function loadOrders() {
    const tableContainer = document.getElementById('orders-table');
    tableContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load orders');
        }

        const orders = await response.json();

        if (orders && orders.length > 0) {
            tableContainer.innerHTML = createOrdersTable(orders);
        } else {
            tableContainer.innerHTML = `<p style="color:var(--text-secondary);padding:20px 0;">No orders found.</p>`;
        }

        // Setup filters
        setupOrderFilters();

    } catch (error) {
        console.error('Error loading orders:', error);
        tableContainer.innerHTML = `<p style="color:var(--text-secondary);">Failed to load orders.</p>`;
    }
}

// ============================================================
// CREATE ORDERS TABLE
// ============================================================
function createOrdersTable(orders) {
    if (!orders || orders.length === 0) {
        return `<p style="color:var(--text-secondary);padding:20px 0;">No orders found.</p>`;
    }

    return `
        <table>
            <thead>
                <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr data-order-id="${order.id}" data-status="${order.status}">
                        <td><strong>${escapeHtml(order.order_number)}</strong></td>
                        <td>${escapeHtml(order.customer_name)}</td>
                        <td>${escapeHtml(order.service_name || 'N/A')}</td>
                        <td>$${order.price}</td>
                        <td><span class="status-badge-small ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                        <td>${new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                            <div class="table-actions">
                                <button class="btn-view" onclick="viewOrder(${order.id})" title="View Details"><i class="fas fa-eye"></i></button>
                                <button class="btn-status" onclick="openStatusModal(${order.id}, '${order.status}')" title="Change Status"><i class="fas fa-exchange-alt"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============================================================
// ORDER FILTERS
// ============================================================
function setupOrderFilters() {
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('order-status-filter');
    const refreshBtn = document.getElementById('refresh-orders');

    if (searchInput) {
        searchInput.addEventListener('input', applyOrderFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyOrderFilters);
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrders);
    }
}

function applyOrderFilters() {
    const searchTerm = document.getElementById('order-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('order-status-filter')?.value || '';

    const rows = document.querySelectorAll('#orders-table table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const status = row.dataset.status
