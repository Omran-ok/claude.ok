/**
 * Kufiya Dates - Authentication JavaScript
 * Handles login, registration, and password functionality
 */

// Authentication Module
const Auth = {
    // Initialize authentication pages
    init() {
        this.setupLoginForm();
        this.setupRegisterForm();
        this.setupPasswordToggles();
        this.setupSocialAuth();
        this.checkRedirect();
    },

    // Setup login form
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateLoginForm(loginForm)) {
                return;
            }

            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const remember = formData.get('remember') === 'on';

            await this.handleLogin(email, password, remember);
        });

        // Real-time validation
        const inputs = loginForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    },

    // Setup register form
    setupRegisterForm() {
        const registerForm = document.getElementById('register-form');
        if (!registerForm) return;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateRegisterForm(registerForm)) {
                return;
            }

            const formData = new FormData(registerForm);
            await this.handleRegister(formData);
        });

        // Password strength indicator
        const passwordInput = registerForm.querySelector('#password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
                this.validatePasswordMatch();
            });
        }

        // Confirm password validation
        const confirmPasswordInput = registerForm.querySelector('#confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }

        // Real-time validation
        const inputs = registerForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    },

    // Password visibility toggles
    setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const wrapper = button.parentElement;
                const input = wrapper.querySelector('input');
                const eyeIcon = button.querySelector('.eye-icon');
                const eyeOffIcon = button.querySelector('.eye-off-icon');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeIcon.classList.add('hidden');
                    eyeOffIcon.classList.remove('hidden');
                } else {
                    input.type = 'password';
                    eyeIcon.classList.remove('hidden');
                    eyeOffIcon.classList.add('hidden');
                }
            });
        });
    },

    // Social authentication
    setupSocialAuth() {
        const googleBtn = document.querySelector('.google-btn');
        const facebookBtn = document.querySelector('.facebook-btn');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleAuth());
        }

        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => this.handleFacebookAuth());
        }
    },

    // Validate login form
    validateLoginForm(form) {
        let isValid = true;
        
        const email = form.querySelector('#email');
        const password = form.querySelector('#password');

        if (!this.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        if (password.value.length < 1) {
            this.showFieldError(password, 'Password is required');
            isValid = false;
        }

        return isValid;
    },

    // Validate register form
    validateRegisterForm(form) {
        let isValid = true;

        // First name validation
        const firstName = form.querySelector('#firstName');
        if (firstName.value.trim().length < 2) {
            this.showFieldError(firstName, 'First name must be at least 2 characters');
            isValid = false;
        }

        // Last name validation
        const lastName = form.querySelector('#lastName');
        if (lastName.value.trim().length < 2) {
            this.showFieldError(lastName, 'Last name must be at least 2 characters');
            isValid = false;
        }

        // Email validation
        const email = form.querySelector('#email');
        if (!this.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        // Phone validation (optional)
        const phone = form.querySelector('#phone');
        if (phone.value && !this.validatePhone(phone.value)) {
            this.showFieldError(phone, 'Please enter a valid UK phone number');
            isValid = false;
        }

        // Password validation
        const password = form.querySelector('#password');
        if (password.value.length < 8) {
            this.showFieldError(password, 'Password must be at least 8 characters');
            isValid = false;
        }

        // Confirm password validation
        const confirmPassword = form.querySelector('#confirmPassword');
        if (password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            isValid = false;
        }

        // Terms validation
        const terms = form.querySelector('#terms');
        if (!terms.checked) {
            this.showFieldError(terms, 'You must agree to the terms and conditions');
            isValid = false;
        }

        return isValid;
    },

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        
        switch(field.type) {
            case 'email':
                if (!this.validateEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                }
                break;
            case 'tel':
                if (value && !this.validatePhone(value)) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                }
                break;
            case 'text':
                if (field.required && value.length < 2) {
                    this.showFieldError(field, 'This field must be at least 2 characters');
                }
                break;
            case 'password':
                if (field.required && value.length < 8) {
                    this.showFieldError(field, 'Password must be at least 8 characters');
                }
                break;
        }
    },

    // Email validation
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Phone validation (UK format)
    validatePhone(phone) {
        const re = /^(\+44|0)[\d\s-]{9,}$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    // Password match validation
    validatePasswordMatch() {
        const password = document.querySelector('#password');
        const confirmPassword = document.querySelector('#confirmPassword');
        
        if (!password || !confirmPassword) return;
        
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
        } else {
            this.clearFieldError(confirmPassword);
        }
    },

    // Update password strength indicator
    updatePasswordStrength(password) {
        const strengthContainer = document.querySelector('#password-strength');
        const strengthBar = strengthContainer.querySelector('.strength-bar');
        const strengthText = strengthContainer.querySelector('.strength-text');
        
        if (!strengthContainer) return;
        
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        strength = Object.values(checks).filter(Boolean).length;
        
        strengthContainer.classList.add('show');
        
        if (strength <= 2) {
            strengthBar.className = 'strength-bar weak';
            strengthText.textContent = 'Weak password';
        } else if (strength <= 4) {
            strengthBar.className = 'strength-bar medium';
            strengthText.textContent = 'Medium password';
        } else {
            strengthBar.className = 'strength-bar strong';
            strengthText.textContent = 'Strong password';
        }
    },

    // Show field error
    showFieldError(field, message) {
        field.classList.add('error');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    },

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
    },

    // Handle login
    async handleLogin(email, password, remember) {
        const submitBtn = document.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        
        try {
            const result = await KufiyaDates.login(email, password);
            
            if (result.success) {
                // Save remember me preference
                if (remember) {
                    localStorage.setItem('remember_email', email);
                } else {
                    localStorage.removeItem('remember_email');
                }
                
                // Redirect to account or previous page
                const redirect = this.getRedirectUrl();
                window.location.href = redirect;
            } else {
                KufiyaDates.showToast(result.error || 'Invalid email or password', 'error');
            }
        } catch (error) {
            KufiyaDates.showToast('An error occurred. Please try again.', 'error');
        } finally {
            // Hide loading state
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    },

    // Handle registration
    async handleRegister(formData) {
        const submitBtn = document.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            newsletter: formData.get('newsletter') === 'on'
        };
        
        try {
            const response = await KufiyaDates.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                // Show success message
                const form = document.getElementById('register-form');
                const successDiv = document.createElement('div');
                successDiv.className = 'success-message';
                successDiv.textContent = 'Account created successfully! Redirecting to login...';
                form.parentNode.insertBefore(successDiv, form);
                form.style.display = 'none';
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html?registered=true';
                }, 2000);
            } else {
                KufiyaDates.showToast(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            KufiyaDates.showToast('An error occurred. Please try again.', 'error');
        } finally {
            // Hide loading state
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    },

    // Handle Google authentication
    async handleGoogleAuth() {
        KufiyaDates.showToast('Google authentication coming soon', 'info');
        // Implement Google OAuth flow
    },

    // Handle Facebook authentication
    async handleFacebookAuth() {
        KufiyaDates.showToast('Facebook authentication coming soon', 'info');
        // Implement Facebook OAuth flow
    },

    // Check for redirect parameter
    checkRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Show message if just registered
        if (urlParams.get('registered') === 'true') {
            KufiyaDates.showToast('Registration successful! Please login to continue.', 'success');
        }
        
        // Show message if redirected from protected page
        if (urlParams.get('redirect') === 'true') {
            KufiyaDates.showToast('Please login to access this page', 'info');
        }
        
        // Pre-fill email if remember me was checked
        const rememberedEmail = localStorage.getItem('remember_email');
        if (rememberedEmail) {
            const emailInput = document.querySelector('#email');
            const rememberCheckbox = document.querySelector('#remember');
            if (emailInput) {
                emailInput.value = rememberedEmail;
            }
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    },

    // Get redirect URL after login
    getRedirectUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('return');
        
        // List of valid redirect pages
        const validPages = ['account.html', 'checkout.html', 'orders.html'];
        
        if (returnUrl && validPages.includes(returnUrl)) {
            return returnUrl;
        }
        
        // Default redirect to account page
        return 'account.html';
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}