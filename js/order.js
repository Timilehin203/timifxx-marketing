// ============================================================
// TIMI FXX MARKETING - ORDER JAVASCRIPT
// ============================================================

// API_BASE_URL is set in config.js
const API_BASE_URL = window.API_BASE_URL || 'https://timifxx-marketing-production.up.railway.app';

document.addEventListener('DOMContentLoaded', function() {
    const serviceSelect = document.getElementById('service-select');
    const displayPrice = document.getElementById('display-price');
    const displayPriceType = document.getElementById('display-price-type');
    const orderForm = document.getElementById('order-form');
    const submitBtn = document.getElementById('submit-order');
    const modal = document.getElementById('order-modal');
    const orderNumberDisplay = document.getElementById('order-number');
    const modalClose = document.getElementById('modal-close');

    let services = [];

    // ============================================================
    // LOAD SERVICES INTO SELECT
    // ============================================================
    async function loadServicesForSelect() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/services`);
            
            if (!response.ok) {
                throw new Error('Failed to load services');
            }

            services = await response.json();
            const activeServices = services.filter(s => s.is_active);

            if (activeServices.length === 0) {
                serviceSelect.innerHTML = '<option value="">No services available</option>';
                return;
            }

            serviceSelect.innerHTML = `
                <option value="">Choose a service...</option>
                ${activeServices.map(service => `
                    <option value="${service.id}" data-price="${service.price}" data-price-type="${service.price_type}">
                        ${escapeHtml(service.name)} - $${service.price}
                    </option>
                `).join('')}
            `;

            // Check for pre-selected service from URL
            const urlParams = new URLSearchParams(window.location.search);
            const serviceId = urlParams.get('service');
            if (serviceId) {
                const matchingOption = serviceSelect.querySelector(`option[value="${serviceId}"]`);
                if (matchingOption) {
                    serviceSelect.value = serviceId;
                    updatePriceDisplay(serviceId);
                }
            }

        } catch (error) {
            console.error('Error loading services:', error);
            serviceSelect.innerHTML = '<option value="">Unable to load services</option>';
            showToast('Unable to load services. Please refresh.', 'error');
        }
    }

    // ============================================================
    // UPDATE PRICE DISPLAY
    // ============================================================
    function updatePriceDisplay(serviceId) {
        const selectedOption = serviceSelect.querySelector(`option[value="${serviceId}"]`);
        if (selectedOption && selectedOption.value) {
            const price = selectedOption.dataset.price;
            const priceType = selectedOption.dataset.priceType;
            displayPrice.textContent = `$${price}`;
            displayPriceType.textContent = priceType === 'starting_from' ? 'Starting from' : 'Fixed price';
        } else {
            displayPrice.textContent = '$0';
            displayPriceType.textContent = 'Select a service';
        }
    }

    // ============================================================
    // SERVICE SELECT CHANGE
    // ============================================================
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            updatePriceDisplay(this.value);
        });
    }

    // ============================================================
    // ORDER FORM SUBMIT
    // ============================================================
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const selectedOption = serviceSelect.querySelector(`option[value="${serviceSelect.value}"]`);
            if (!selectedOption || !selectedOption.value) {
                showToast('Please select a service', 'error');
                return;
            }

            const name = document.getElementById('customer-name').value.trim();
            const email = document.getElementById('customer-email').value.trim();
            const telegram = document.getElementById('telegram-username').value.trim();
            const whatsapp = document.getElementById('whatsapp-number').value.trim();
            const message = document.getElementById('order-message').value.trim();

            // Validation
            if (!name) {
                showToast('Please enter your full name', 'error');
                return;
            }
            if (!email || !isValidEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            if (!telegram) {
                showToast('Please enter your Telegram username', 'error');
                return;
            }

            const serviceId = selectedOption.value;

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            try {
                const orderData = {
                    service_id: parseInt(serviceId),
                    customer_name: name,
                    customer_email: email,
                    telegram_username: telegram,
                    whatsapp_number: whatsapp || null,
                    details: message || null
                };

                const response = await fetch(`${API_BASE_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to submit order');
                }

                // Show success modal
                orderNumberDisplay.textContent = data.orderNumber;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Reset form
                orderForm.reset();
                displayPrice.textContent = '$0';
                displayPriceType.textContent = 'Select a service';

            } catch (error) {
                console.error('Order submission error:', error);
                showToast(error.message || 'Order could not be submitted. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Order';
            }
        });
    }

    // ============================================================
    // MODAL CONTROLS
    // ============================================================
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ============================================================
    // VALIDATION HELPERS
    // ============================================================
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================================
    // INIT
    // ============================================================
    loadServicesForSelect();
});
