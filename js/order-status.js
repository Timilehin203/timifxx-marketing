// ============================================================
// TIMI FXX MARKETING - ORDER STATUS JAVASCRIPT
// ============================================================

// API_BASE_URL is set in config.js
const API_BASE_URL = window.API_BASE_URL || 'https://timifxx-marketing-production.up.railway.app';

document.addEventListener('DOMContentLoaded', function() {
    const orderInput = document.getElementById('order-number-input');
    const trackBtn = document.getElementById('track-order-btn');
    const statusResult = document.getElementById('status-result');

    // ============================================================
    // TRACK ORDER
    // ============================================================
    async function trackOrder(orderNumber) {
        if (!orderNumber || orderNumber.trim() === '') {
            showToast('Please enter your order number', 'error');
            return;
        }

        const trimmedOrder = orderNumber.trim().toUpperCase();

        // Validate format
        if (!trimmedOrder.startsWith('TMF-')) {
            showToast('Invalid order number format. Example: TMF-2026-123456', 'error');
            return;
        }

        statusResult.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <div class="loading-spinner"></div>
                <p style="color:var(--text-secondary);margin-top:16px;">Checking order status...</p>
            </div>
        `;

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/status/${encodeURIComponent(trimmedOrder)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Order not found. Please check your order number.');
                }
                throw new Error('Failed to retrieve order status');
            }

            const order = await response.json();

            // Display order status
            displayOrderStatus(order);

        } catch (error) {
            console.error('Error tracking order:', error);
            statusResult.innerHTML = `
                <div class="status-card">
                    <div style="text-align:center;padding:40px;">
                        <i class="fas fa-exclamation-circle" style="font-size:48px;color:#ff4444;margin-bottom:16px;"></i>
                        <p style="color:var(--text-secondary);font-size:16px;">${error.message || 'Unable to retrieve order status. Please try again.'}</p>
                        <button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:var(--primary-gradient);border:none;border-radius:8px;color:white;cursor:pointer;">Try Again</button>
                    </div>
                </div>
            `;
        }
    }

    // ============================================================
    // DISPLAY ORDER STATUS
    // ============================================================
    function displayOrderStatus(order) {
        const statusMap = {
            'pending': { label: 'Pending', class: 'pending' },
            'processing': { label: 'Processing', class: 'processing' },
            'completed': { label: 'Completed', class: 'completed' },
            'cancelled': { label: 'Cancelled', class: 'cancelled' }
        };

        const statusInfo = statusMap[order.status.toLowerCase()] || { label: order.status, class: 'pending' };

        // Determine timeline steps
        const steps = ['pending', 'processing', 'completed'];
        const currentStepIndex = steps.indexOf(order.status.toLowerCase());
        const isCancelled = order.status.toLowerCase() === 'cancelled';

        let timelineHtml = '';
        if (isCancelled) {
            timelineHtml = `
                <div style="text-align:center;padding:8px 0;">
                    <span style="color:#ff4444;font-weight:600;">Order Cancelled</span>
                </div>
            `;
        } else {
            timelineHtml = steps.map((step, index) => {
                let status = '';
                if (index < currentStepIndex) status = 'completed';
                if (index === currentStepIndex) status = 'active';
                return `
                    <div class="timeline-step ${status}">
                        <div class="step-dot">
                            ${status === 'completed' ? '<i class="fas fa-check"></i>' : index + 1}
                        </div>
                        <span class="step-label">${step.charAt(0).toUpperCase() + step.slice(1)}</span>
                    </div>
                `;
            }).join('');
        }

        const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        statusResult.innerHTML = `
            <div class="status-card">
                <div class="status-card-header">
                    <span class="order-number">${escapeHtml(order.order_number)}</span>
                    <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
                </div>
                <div class="status-card-body">
                    <div class="detail-row">
                        <span class="detail-label">Service</span>
                        <span class="detail-value">${escapeHtml(order.service_name || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Price</span>
                        <span class="detail-value">$${order.price || '0'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order Date</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    ${order.customer_name ? `
                        <div class="detail-row">
                            <span class="detail-label">Customer</span>
                            <span class="detail-value">${escapeHtml(order.customer_name)}</span>
                        </div>
                    ` : ''}
                    ${order.telegram_username ? `
                        <div class="detail-row">
                            <span class="detail-label">Telegram</span>
                            <span class="detail-value">${escapeHtml(order.telegram_username)}</span>
                        </div>
                    ` : ''}
                    ${order.status !== 'cancelled' ? `
                        <div class="detail-row">
                            <span class="detail-label">Estimated Completion</span>
                            <span class="detail-value">${getEstimatedCompletion(order.status)}</span>
                        </div>
                    ` : ''}
                </div>
                ${!isCancelled ? `
                    <div class="status-timeline">
                        <h4>Order Progress</h4>
                        <div class="timeline-steps">
                            ${timelineHtml}
                        </div>
                    </div>
                ` : `
                    <div class="status-timeline">
                        <h4>Order Status</h4>
                        <div style="text-align:center;padding:8px 0;">
                            <span style="color:#ff4444;font-weight:600;">This order has been cancelled</span>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    // ============================================================
    // GET ESTIMATED COMPLETION
    // ============================================================
    function getEstimatedCompletion(status) {
        const now = new Date();
        let days = 0;
        switch (status.toLowerCase()) {
            case 'pending':
                days = 1;
                break;
            case 'processing':
                days = 2;
                break;
            case 'completed':
                return 'Completed';
            default:
                return 'Contact support';
        }
        const estimated = new Date(now);
        estimated.setDate(estimated.getDate() + days);
        return estimated.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    if (trackBtn) {
        trackBtn.addEventListener('click', function() {
            trackOrder(orderInput.value);
        });
    }

    if (orderInput) {
        orderInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackOrder(this.value);
            }
        });
    }

    // ============================================================
    // CHECK URL PARAMETERS
    // ============================================================
    const urlParams = new URLSearchParams(window.location.search);
    const orderParam = urlParams.get('order');
    if (orderParam) {
        orderInput.value = orderParam.toUpperCase();
        trackOrder(orderParam);
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
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
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }
});
