// ============================================================
// TIMI FXX MARKETING - ADMIN JAVASCRIPT
// ============================================================

const API_BASE_URL = 'https://timifxx-marketing-production.up.railway.app';

let adminToken = localStorage.getItem('adminToken');
let currentSection = 'dashboard';

const loginOverlay = document.getElementById('login-overlay');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');

// ============================================================
// CHECK AUTH
// ============================================================
async function checkAuth() {
    console.log('🔐 Checking authentication...');
    console.log('📝 Token exists:', !!adminToken);

    if (!adminToken) {
        console.log('❌ No token found, showing login');
        showLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        console.log('📡 Auth check response:', response.status);

        if (response.ok) {
            console.log('✅ Auth successful');
            showDashboard();
            loadDashboard();
        } else {
            console.log('❌ Auth failed, clearing token');
            localStorage.removeItem('adminToken');
            adminToken = null;
            showLogin();
        }
    } catch (error) {
        console.error('❌ Auth check error:', error);
        showLogin();
    }
}

// ============================================================
// SHOW/HIDE
// ============================================================
function showLogin() {
    console.log('🔓 Showing login');
    if (loginOverlay) loginOverlay.classList.remove('hidden');
    if (adminDashboard) adminDashboard.style.display = 'none';
}

function showDashboard() {
    console.log('🔒 Showing dashboard');
    if (loginOverlay) loginOverlay.classList.add('hidden');
    if (adminDashboard) adminDashboard.style.display = 'flex';
}

// ============================================================
// ADMIN LOGIN
// ============================================================
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        console.log('🔑 Login attempt:', email);

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
            console.log('📡 Login response:', response.status);

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            document.getElementById('admin-user-email').textContent = email;
            
            console.log('✅ Login successful!');
            showDashboard();
            loadDashboard();

        } catch (error) {
            console.error('❌ Login error:', error);
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
    console.log('🔓 Logging out');
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
    console.log('📂 Switching to:', section);
    currentSection = section;
    document.querySelectorAll('.sidebar-link[data-section]').forEach(l => l.classList.remove('active'));
    document.querySelector(`.sidebar-link[data-section="${section}"]`)?.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    const titles = {
        dashboard: 'Dashboard',
        orders: 'Orders',
        services: 'Services',
        settings: 'Settings'
    };
    document.getElementById('admin-section-title').textContent = titles[section] || section;
    if (section === 'dashboard') loadDashboard();
    if (section === 'orders') loadOrders();
    if (section === 'services') loadAdminServices();
}

// ============================================================
// LOAD DASHBOARD
// ============================================================
async function loadDashboard() {
    console.log('📊 Loading dashboard...');
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
        console.log('📊 Dashboard data:', data);

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

        if (data.recentOrders && data.recentOrders.length > 0) {
            recentOrdersTable.innerHTML = createOrdersTable(data.recentOrders);
        } else {
            recentOrdersTable.innerHTML = `<p style="color:var(--text-secondary);padding:20px 0;">No recent orders.</p>`;
        }

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        statsGrid.innerHTML = `<p style="color:var(--text-secondary);">Failed to load dashboard data.</p>`;
    }
}

// ============================================================
// LOAD ORDERS
// ============================================================
async function loadOrders() {
    console.log('📋 Loading orders...');
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
        console.log('📋 Orders loaded:', orders.length);

        if (orders && orders.length > 0) {
            tableContainer.innerHTML = createOrdersTable(orders);
        } else {
            tableContainer.innerHTML = `<p style="color:var(--text-secondary);padding:20px 0;">No orders found.</p>`;
        }

        setupOrderFilters();

    } catch (error) {
        console.error('❌ Error loading orders:', error);
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
        const status = row.dataset.status || '';
        const matchSearch = text.includes(searchTerm);
        const matchStatus = !statusFilter || status === statusFilter;
        row.style.display = (matchSearch && matchStatus) ? '' : 'none';
    });
}

// ============================================================
// VIEW ORDER DETAILS
// ============================================================
async function viewOrder(orderId) {
    console.log('👁️ Viewing order:', orderId);
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    modal.classList.add('active');
    content.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load order details');
        }

        const order = await response.json();
        console.log('👁️ Order details:', order);

        content.innerHTML = `
            <div class="order-detail-row">
                <span class="label">Order Number</span>
                <span class="value"><strong>${escapeHtml(order.order_number)}</strong></span>
            </div>
            <div class="order-detail-row">
                <span class="label">Service</span>
                <span class="value">${escapeHtml(order.service_name || 'N/A')}</span>
            </div>
            <div class="order-detail-row">
                <span class="label">Price</span>
                <span class="value">$${order.price}</span>
            </div>
            <div class="order-detail-row">
                <span class="label">Status</span>
                <span class="value"><span class="status-badge-small ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></span>
            </div>
            <div class="order-detail-row">
                <span class="label">Customer</span>
                <span class="value">${escapeHtml(order.customer_name)}</span>
            </div>
            <div class="order-detail-row">
                <span class="label">Email</span>
                <span class="value">${escapeHtml(order.customer_email)}</span>
            </div>
            <div class="order-detail-row">
                <span class="label">Telegram</span>
                <span class="value">${escapeHtml(order.telegram_username)}</span>
            </div>
            ${order.whatsapp_number ? `
                <div class="order-detail-row">
                    <span class="label">WhatsApp</span>
                    <span class="value">${escapeHtml(order.whatsapp_number)}</span>
                </div>
            ` : ''}
            <div class="order-detail-row">
                <span class="label">Order Date</span>
                <span class="value">${new Date(order.created_at).toLocaleString()}</span>
            </div>
            ${order.details ? `
                <div class="order-detail-row" style="flex-direction:column;align-items:stretch;gap:4px;">
                    <span class="label">Details</span>
                    <span class="value" style="text-align:left;white-space:pre-wrap;">${escapeHtml(order.details)}</span>
                </div>
            ` : ''}
            <div class="order-detail-notes">
                <label style="font-weight:600;display:block;margin-bottom:8px;">Admin Notes</label>
                <textarea id="admin-notes-textarea" rows="3">${escapeHtml(order.admin_notes || '')}</textarea>
                <button onclick="saveAdminNotes(${order.id})" class="btn-primary btn-small" style="margin-top:10px;">
                    <i class="fas fa-save"></i> Save Notes
                </button>
            </div>
            <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
                <button onclick="openStatusModal(${order.id}, '${order.status}')" class="btn-secondary btn-small">
                    <i class="fas fa-exchange-alt"></i> Change Status
                </button>
                <button onclick="document.getElementById('order-detail-modal').classList.remove('active')" class="btn-outline btn-small">
                    Close
                </button>
            </div>
        `;

    } catch (error) {
        console.error('❌ Error loading order details:', error);
        content.innerHTML = `<p style="color:var(--text-secondary);">Failed to load order details.</p>`;
    }
}

// ============================================================
// SAVE ADMIN NOTES
// ============================================================
async function saveAdminNotes(orderId) {
    const textarea = document.getElementById('admin-notes-textarea');
    if (!textarea) return;
    const notes = textarea.value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/notes`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes })
        });

        if (!response.ok) {
            throw new Error('Failed to save notes');
        }

        showToast('Notes saved successfully!', 'success');

    } catch (error) {
        console.error('❌ Error saving notes:', error);
        showToast('Failed to save notes.', 'error');
    }
}

// ============================================================
// STATUS MODAL
// ============================================================
function openStatusModal(orderId, currentStatus) {
    const modal = document.getElementById('status-modal');
    const orderIdInput = document.getElementById('status-order-id');
    const statusSelect = document.getElementById('status-select');
    orderIdInput.value = orderId;
    statusSelect.value = currentStatus;
    modal.classList.add('active');
}

document.getElementById('status-modal-close')?.addEventListener('click', function() {
    document.getElementById('status-modal').classList.remove('active');
});

document.getElementById('status-change-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const orderId = document.getElementById('status-order-id').value;
    const newStatus = document.getElementById('status-select').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        showToast('Order status updated successfully!', 'success');
        document.getElementById('status-modal').classList.remove('active');
        if (currentSection === 'dashboard') loadDashboard();
        if (currentSection === 'orders') loadOrders();

    } catch (error) {
        console.error('❌ Error updating status:', error);
        showToast('Failed to update order status.', 'error');
    }
});

// ============================================================
// LOAD ADMIN SERVICES
// ============================================================
async function loadAdminServices() {
    const tableContainer = document.getElementById('services-table');
    tableContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load services');
        }

        const services = await response.json();

        if (services && services.length > 0) {
            tableContainer.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Price</th>
                            <th>Price Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${services.map(service => `
                            <tr>
                                <td><strong>${escapeHtml(service.name)}</strong></td>
                                <td>$${service.price}</td>
                                <td>${service.price_type === 'starting_from' ? 'Starting from' : 'Fixed'}</td>
                                <td class="${service.is_active ? 'service-active' : 'service-inactive'}">
                                    ${service.is_active ? 'Active' : 'Inactive'}
                                </td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn-edit" onclick="openPriceModal(${service.id}, ${service.price})" title="Change Price">
                                            <i class="fas fa-dollar-sign"></i>
                                        </button>
                                        <button onclick="toggleServiceStatus(${service.id}, ${service.is_active})" 
                                                class="${service.is_active ? 'btn-status' : 'btn-view'}"
                                                title="${service.is_active ? 'Deactivate' : 'Activate'}">
                                            ${service.is_active ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            tableContainer.innerHTML = `<p style="color:var(--text-secondary);padding:20px 0;">No services found.</p>`;
        }

    } catch (error) {
        console.error('❌ Error loading services:', error);
        tableContainer.innerHTML = `<p style="color:var(--text-secondary);">Failed to load services.</p>`;
    }
}

// ============================================================
// PRICE MODAL
// ============================================================
function openPriceModal(serviceId, currentPrice) {
    const modal = document.getElementById('price-modal');
    const serviceIdInput = document.getElementById('price-service-id');
    const priceInput = document.getElementById('price-input');
    serviceIdInput.value = serviceId;
    priceInput.value = currentPrice;
    modal.classList.add('active');
}

document.getElementById('price-modal-close')?.addEventListener('click', function() {
    document.getElementById('price-modal').classList.remove('active');
});

document.getElementById('price-change-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const serviceId = document.getElementById('price-service-id').value;
    const newPrice = parseFloat(document.getElementById('price-input').value);

    if (isNaN(newPrice) || newPrice < 0) {
        showToast('Please enter a valid price.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/services/${serviceId}/price`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ price: newPrice })
        });

        if (!response.ok) {
            throw new Error('Failed to update price');
        }

        showToast('Service price updated successfully!', 'success');
        document.getElementById('price-modal').classList.remove('active');
        loadAdminServices();

    } catch (error) {
        console.error('❌ Error updating price:', error);
        showToast('Failed to update service price.', 'error');
    }
});

// ============================================================
// TOGGLE SERVICE STATUS
// ============================================================
async function toggleServiceStatus(serviceId, currentStatus) {
    const newStatus = !currentStatus;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/services/${serviceId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update service status');
        }

        showToast(`Service ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
        loadAdminServices();

    } catch (error) {
        console.error('❌ Error updating service status:', error);
        showToast('Failed to update service status.', 'error');
    }
}

// ============================================================
// CHANGE PASSWORD
// ============================================================
document.getElementById('change-password-btn')?.addEventListener('click', function() {
    document.getElementById('password-modal').classList.add('active');
});

document.getElementById('password-modal-close')?.addEventListener('click', function() {
    document.getElementById('password-modal').classList.remove('active');
});

document.getElementById('password-change-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to change password');
        }

        showToast('Password changed successfully!', 'success');
        document.getElementById('password-modal').classList.remove('active');
        this.reset();

    } catch (error) {
        console.error('❌ Error changing password:', error);
        showToast(error.message || 'Failed to change password.', 'error');
    }
});

document.querySelectorAll('.admin-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

window.viewOrder = viewOrder;
window.openStatusModal = openStatusModal;
window.openPriceModal = openPriceModal;
window.toggleServiceStatus = toggleServiceStatus;
window.saveAdminNotes = saveAdminNotes;
window.loadOrders = loadOrders;
window.loadAdminServices = loadAdminServices;
window.loadDashboard = loadDashboard;

console.log('🔐 Admin credentials:');
console.log('   Email: timinii156@gmail.com');
console.log('   Password: Admin2034462');

// ============================================================
// INIT
// ============================================================
checkAuth();
