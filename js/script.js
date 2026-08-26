// ============================================================
// TIMI FXX MARKETING - MAIN JAVASCRIPT
// ============================================================

// Get API URL from config
const API_BASE_URL = window.API_BASE_URL || 'https://timifxx-marketing-production.up.railway.app';

console.log('🚀 Script loaded, API_URL:', API_BASE_URL);

// ============================================================
// NAVIGATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded');

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Mobile nav toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileClose = document.querySelector('.mobile-nav-close');

    if (hamburger && mobileOverlay) {
        hamburger.addEventListener('click', function() {
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (mobileClose && mobileOverlay) {
        mobileClose.addEventListener('click', function() {
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    const mobileLinks = document.querySelectorAll('.mobile-nav ul li a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ============================================================
    // LOAD SERVICES
    // ============================================================
    loadServices();

    // ============================================================
    // LOAD FOOTER SERVICES
    // ============================================================
    loadFooterServices();

    // ============================================================
    // CONTACT FORM
    // ============================================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            if (!data['Your Name'] || !data['Your Email'] || !data['Your Message']) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            showToast('Thank you! We will get back to you soon.', 'success');
            this.reset();
        });
    }

    // ============================================================
    // NEWSLETTER FORM
    // ============================================================
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = this.querySelector('input[type="email"]');
            if (input && input.value) {
                showToast('Subscribed successfully!', 'success');
                input.value = '';
            }
        });
    });

    // ============================================================
    // SMOOTH SCROLL
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// ============================================================
// LOAD SERVICES - FIXED VERSION
// ============================================================
async function loadServices() {
    const container = document.getElementById('services-container');
    if (!container) {
        console.error('❌ Services container not found!');
        return;
    }

    console.log('🔄 Loading services...');
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const url = `${API_BASE_URL}/api/services`;
        console.log('📡 Fetching from:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const services = await response.json();
        console.log('✅ Services loaded:', services.length, services);

        if (!services || services.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary);">
                    <p>No services available at the moment.</p>
                </div>
            `;
            return;
        }

        const serviceIcons = [
            'fa-regular fa-circle-check',
            'fa-regular fa-comment-dots',
            'fa-regular fa-window-maximize',
            'fa-regular fa-thumbs-up',
            'fa-regular fa-gear',
            'fa-regular fa-pen-to-square',
            'fa-regular fa-chart-simple',
            'fa-regular fa-file-lines',
            'fa-regular fa-shield',
            'fa-regular fa-magnifying-glass-chart',
            'fa-regular fa-shield-halved'
        ];

        container.innerHTML = services.map((service, index) => `
            <div class="service-card">
                <div class="service-card-icon">
                    <i class="${serviceIcons[index % serviceIcons.length]}"></i>
                </div>
                <h3>${escapeHtml(service.name)}</h3>
                <p class="service-desc">${escapeHtml(service.description || 'Professional Telegram marketing service')}</p>
                <div class="service-price">$${service.price}</div>
                <div class="service-price-type">${service.price_type === 'starting_from' ? 'Starting from' : 'Fixed price'}</div>
                <div class="service-status ${service.is_active ? 'active' : 'inactive'}">
                    ${service.is_active ? 'Active' : 'Inactive'}
                </div>
                <a href="order.html?service=${service.id}" class="btn-order">Order Now</a>
            </div>
        `).join('');

        console.log('✅ Services rendered successfully!');

    } catch (error) {
        console.error('❌ Error loading services:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-secondary);">
                <p>Unable to load services. Please try again later.</p>
                <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">
                    Error: ${error.message}
                </p>
                <button onclick="loadServices()" style="margin-top:16px;padding:10px 24px;background:var(--primary-gradient);border:none;border-radius:8px;color:white;cursor:pointer;">Retry</button>
            </div>
        `;
    }
}

// ============================================================
// LOAD FOOTER SERVICES
// ============================================================
async function loadFooterServices() {
    const container = document.getElementById('footer-services');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/services`);
        
        if (!response.ok) {
            throw new Error('Failed to load services');
        }

        const services = await response.json();
        const activeServices = services.filter(s => s.is_active).slice(0, 5);

        container.innerHTML = activeServices.map(service => `
            <li><a href="order.html?service=${service.id}">${escapeHtml(service.name)}</a></li>
        `).join('');

    } catch (error) {
        console.error('Error loading footer services:', error);
        container.innerHTML = '<li><a href="order.html">View All Services</a></li>';
    }
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
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

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================
window.loadServices = loadServices;
window.showToast = showToast;
window.API_BASE_URL = API_BASE_URL;

console.log('✅ script.js loaded successfully');
