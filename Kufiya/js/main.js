/**
 * Kufiya Dates - Main JavaScript
 * Global functionality shared across all pages
 */

// Main application object
const KufiyaDates = {
    // Configuration
    config: {
        apiBaseUrl: '/api/v1',
        stripePublicKey: 'pk_test_YOUR_STRIPE_KEY',
        currency: 'GBP',
        currencySymbol: '£',
        vatRate: 0.20,
        freeShippingThreshold: 50,
        shippingRates: {
            standard: 4.99,
            express: 9.99,
            nextDay: 14.99
        }
    },

    // State management
    state: {
        user: null,
        cart: [],
        theme: 'light',
        isLoading: false
    },

    // Initialize the application
    init() {
        this.loadState();
        this.setupTheme();
        this.setupEventListeners();
        this.updateUI();
        this.checkAuth();
    },

    // Load state from localStorage
    loadState() {
        // Load cart
        const savedCart = localStorage.getItem('kufiya_cart');
        if (savedCart) {
            try {
                this.state.cart = JSON.parse(savedCart);
            } catch (e) {
                console.error('Failed to load cart:', e);
                this.state.cart = [];
            }
        }

        // Load theme preference
        const savedTheme = localStorage.getItem('kufiya_theme');
        if (savedTheme) {
            this.state.theme = savedTheme;
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.state.theme = 'dark';
        }

        // Load user data
        const savedUser = localStorage.getItem('kufiya_user');
        if (savedUser) {
            try {
                this.state.user = JSON.parse(savedUser);
            } catch (e) {
                console.error('Failed to load user data:', e);
            }
        }
    },

    // Save state to localStorage
    saveState() {
        localStorage.setItem('kufiya_cart', JSON.stringify(this.state.cart));
        localStorage.setItem('kufiya_theme', this.state.theme);
        if (this.state.user) {
            localStorage.setItem('kufiya_user', JSON.stringify(this.state.user));
        }
    },

    // Theme Management
    setupTheme() {
        const html = document.documentElement;
        html.setAttribute('data-theme', this.state.theme);
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        localStorage.setItem('kufiya_theme', this.state.theme);
    },

    // Event Listeners
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
                mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Close mobile menu when clicking on a link
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    },

    // Update UI elements
    updateUI() {
        this.updateCartCount();
        this.updateAccountButton();
    },

    // Cart Management
    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.setAttribute('data-count', totalItems);
        }
    },

    addToCart(product) {
        const existingItem = this.state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: product.quantity || 1
            });
        }
        
        this.saveState();
        this.updateCartCount();
        this.showToast(`${product.name} added to cart`, 'success');
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.state.cart }));
    },

    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
        this.saveState();
        this.updateCartCount();
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.state.cart }));
    },

    updateCartItemQuantity(productId, quantity) {
        const item = this.state.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveState();
                this.updateCartCount();
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.state.cart }));
            }
        }
    },

    clearCart() {
        this.state.cart = [];
        this.saveState();
        this.updateCartCount();
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.state.cart }));
    },

    getCartTotal() {
        return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getCartVAT() {
        return this.getCartTotal() * this.config.vatRate;
    },

    getShippingCost(method = 'standard') {
        const subtotal = this.getCartTotal();
        if (subtotal >= this.config.freeShippingThreshold && method === 'standard') {
            return 0;
        }
        return this.config.shippingRates[method] || 0;
    },

    getOrderTotal(shippingMethod = 'standard') {
        return this.getCartTotal() + this.getCartVAT() + this.getShippingCost(shippingMethod);
    },

    // Authentication
    checkAuth() {
        const token = this.getAuthToken();
        if (token) {
            // Verify token is still valid
            this.verifyToken();
        }
        this.updateAccountButton();
    },

    getAuthToken() {
        return localStorage.getItem('kufiya_auth_token');
    },

    setAuthToken(token) {
        localStorage.setItem('kufiya_auth_token', token);
    },

    removeAuthToken() {
        localStorage.removeItem('kufiya_auth_token');
    },

    async verifyToken() {
        try {
            const response = await this.apiCall('/auth/verify', {
                method: 'GET'
            });
            
            if (response.valid) {
                this.state.user = response.user;
                this.saveState();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
        }
    },

    updateAccountButton() {
        const accountButton = document.querySelector('.account-button');
        if (accountButton) {
            if (this.state.user) {
                accountButton.setAttribute('aria-label', `My account - ${this.state.user.firstName}`);
            } else {
                accountButton.setAttribute('aria-label', 'Login or Register');
                accountButton.href = 'login.html';
            }
        }
    },

    async login(email, password) {
        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success) {
                this.setAuthToken(response.token);
                this.state.user = response.user;
                this.saveState();
                this.updateUI();
                return { success: true };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            return { success: false, error: 'Login failed. Please try again.' };
        }
    },

    logout() {
        this.removeAuthToken();
        this.state.user = null;
        localStorage.removeItem('kufiya_user');
        this.updateUI();
        
        // Redirect to home if on a protected page
        const protectedPages = ['account.html', 'orders.html', 'addresses.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    },

    // API Communication
    async apiCall(endpoint, options = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        const token = this.getAuthToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    },

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                ${this.getToastIcon(type)}
            </svg>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, duration);
    },

    getToastIcon(type) {
        const icons = {
            success: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
            error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
            warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
            info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
        };
        return icons[type] || icons.info;
    },

    // Newsletter Subscription
    async handleNewsletterSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;

        try {
            const response = await this.apiCall('/newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            if (response.success) {
                this.showToast('Successfully subscribed to newsletter!', 'success');
                form.reset();
            } else {
                this.showToast(response.message || 'Subscription failed', 'error');
            }
        } catch (error) {
            this.showToast('Failed to subscribe. Please try again.', 'error');
        }
    },

    // Utility Functions
    formatPrice(amount) {
        return `${this.config.currencySymbol}${amount.toFixed(2)}`;
    },

    formatDate(date, format = 'short') {
        const options = format === 'short' 
            ? { year: 'numeric', month: 'short', day: 'numeric' }
            : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        
        return new Date(date).toLocaleDateString('en-GB', options);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Form Validation
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },

    validatePostcode(postcode) {
        const re = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
        return re.test(postcode);
    },

    // Loading States
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        const body = document.body;
        
        if (isLoading) {
            body.style.cursor = 'wait';
        } else {
            body.style.cursor = '';
        }
    },

    // Analytics (placeholder for future implementation)
    trackEvent(category, action, label = null, value = null) {
        // Google Analytics or other analytics implementation
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
    },

    // Page-specific initialization
    initPage(pageName) {
        console.log(`Initializing ${pageName} page`);
        
        // Add active class to current nav item
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === currentPath.split('/').pop()) {
                link.classList.add('active');
            }
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KufiyaDates.init());
} else {
    KufiyaDates.init();
}

// Export for use in other modules
window.KufiyaDates = KufiyaDates;