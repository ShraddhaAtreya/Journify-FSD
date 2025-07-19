/**
 * Login Page JavaScript
 * Handles login form validation, submission, and user authentication
 */

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.rememberCheckbox = document.getElementById('remember');
        this.loginButton = document.getElementById('loginButton');
        this.forgotPasswordLink = document.getElementById('forgotPassword');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingSession();
        this.setupFormValidation();
        this.prefillRememberedEmail();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Password toggle
        this.passwordToggle.addEventListener('click', () => this.togglePassword());
        
        // Real-time validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        this.passwordInput.addEventListener('input', () => this.clearFieldError('password'));
        
        // Forgot password
        this.forgotPasswordLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isSubmitting) {
                this.form.dispatchEvent(new Event('submit'));
            }
        });
        
        // Clear form errors on input
        this.form.addEventListener('input', () => this.clearGeneralError());
    }

    async checkExistingSession() {
        try {
            if (AuthService.isAuthenticated()) {
                this.showLoadingOverlay('Redirecting to dashboard...');
                await this.delay(1000); // Brief delay for better UX
                window.location.href = '/dashboard.html';
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }

    prefillRememberedEmail() {
        const rememberedEmail = StorageService.getItem('rememberedEmail');
        if (rememberedEmail) {
            this.emailInput.value = rememberedEmail;
            this.rememberCheckbox.checked = true;
        }
    }

    setupFormValidation() {
        // Add input event listeners for live validation feedback
        this.emailInput.addEventListener('input', debounce(() => {
            if (this.emailInput.value.length > 0) {
                this.validateEmail(false); // Silent validation
            }
        }, 300));

        this.passwordInput.addEventListener('input', debounce(() => {
            if (this.passwordInput.value.length > 0) {
                this.validatePassword(false); // Silent validation
            }
        }, 300));
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Validate form
        const isValid = await this.validateForm();
        if (!isValid) return;
        
        // Get form data
        const formData = this.getFormData();
        
        try {
            this.setSubmittingState(true);
            
            // Attempt login
            const result = await AuthService.login(formData.email, formData.password);
            
            if (result.success) {
                // Handle remember me
                this.handleRememberMe(formData.email);
                
                // Show success state
                this.showSuccessState();
                
                // Redirect based on user state
                await this.handleSuccessfulLogin(result.user);
            } else {
                this.showError(result.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.setSubmittingState(false);
        }
    }

    async validateForm() {
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();
        
        return emailValid && passwordValid;
    }

    validateEmail(showError = true) {
        const email = this.emailInput.value.trim();
        const errorElement = document.getElementById('email-error');
        
        if (!email) {
            if (showError) this.showFieldError('email', 'Email is required');
            return false;
        }
        
        if (!Validation.isValidEmail(email)) {
            if (showError) this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError('email');
        return true;
    }

    validatePassword(showError = true) {
        const password = this.passwordInput.value;
        
        if (!password) {
            if (showError) this.showFieldError('password', 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            if (showError) this.showFieldError('password', 'Password must be at least 6 characters');
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    getFormData() {
        return {
            email: this.emailInput.value.trim().toLowerCase(),
            password: this.passwordInput.value,
            remember: this.rememberCheckbox.checked
        };
    }

    togglePassword() {
        const isPassword = this.passwordInput.type === 'password';
        const eyeIcon = this.passwordToggle.querySelector('.icon-eye');
        const eyeOffIcon = this.passwordToggle.querySelector('.icon-eye-off');
        
        this.passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('hidden', isPassword);
        eyeOffIcon.classList.toggle('hidden', !isPassword);
        
        // Update aria-label for accessibility
        this.passwordToggle.setAttribute('aria-label', 
            isPassword ? 'Hide password' : 'Show password'
        );
        
        // Focus back to password input
        this.passwordInput.focus();
    }

    handleRememberMe(email) {
        if (this.rememberCheckbox.checked) {
            StorageService.setItem('rememberedEmail', email);
        } else {
            StorageService.removeItem('rememberedEmail');
        }
    }

    async handleSuccessfulLogin(user) {
        // Determine redirect destination
        const redirectUrl = this.getRedirectUrl(user);
        
        // Show loading with appropriate message
        this.showLoadingOverlay('Taking you to your dashboard...');
        
        // Brief delay for better UX
        await this.delay(1500);
        
        // Redirect
        window.location.href = redirectUrl;
    }

    getRedirectUrl(user) {
        // Check URL parameters for redirect
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        if (redirectTo && this.isValidRedirectUrl(redirectTo)) {
            return redirectTo;
        }
        
        // Check if user needs onboarding
        if (!user.hasCompletedOnboarding) {
            return '/pages/onboarding/step1.html';
        }
        
        // Default to dashboard
        return '/pages/dashboard.html';
    }

    isValidRedirectUrl(url) {
        // Only allow internal redirects for security
        const allowedPaths = [
            '/pages/dashboard.html',
            '/pages/calendar.html',
            '/pages/journal.html',
            '/pages/analytics.html',
            '/pages/export.html',
            '/pages/settings.html'
        ];
        
        return allowedPaths.some(path => url.startsWith(path));
    }

    handleForgotPassword(event) {
        event.preventDefault();
        
        // For now, show an alert. In production, this would open a modal or redirect
        alert('Password reset functionality will be implemented soon. Please contact support if you need assistance.');
        
        // Future implementation:
        // this.showForgotPasswordModal();
    }

    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        
        const btnText = this.loginButton.querySelector('.btn-text');
        const btnLoader = this.loginButton.querySelector('.btn-loader');
        
        if (isSubmitting) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            this.loginButton.disabled = true;
            this.loginButton.setAttribute('aria-busy', 'true');
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            this.loginButton.disabled = false;
            this.loginButton.setAttribute('aria-busy', 'false');
        }
    }

    showSuccessState() {
        // Add success styling to form
        this.form.classList.add('success');
        
        // Update button text briefly
        const btnText = this.loginButton.querySelector('.btn-text');
        const originalText = btnText.textContent;
        btnText.textContent = 'Success!';
        
        setTimeout(() => {
            btnText.textContent = originalText;
        }, 2000);
    }

    showLoadingOverlay(message) {
        const loadingText = this.loadingOverlay.querySelector('.loading-text');
        loadingText.textContent = message;
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoadingOverlay() {
        this.loadingOverlay.classList.add('hidden');
    }

    showFieldError(fieldName, message) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
    }

    clearFieldError(fieldName) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
        errorElement.textContent = '';
        errorElement.removeAttribute('role');
    }

    showError(message) {
        const errorElement = document.getElementById('form-error');
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    clearGeneralError() {
        const errorElement = document.getElementById('form-error');
        errorElement.textContent = '';
        errorElement.removeAttribute('role');
    }

    clearAllErrors() {
        this.clearFieldError('email');
        this.clearFieldError('password');
        this.clearGeneralError();
        this.form.classList.remove('success');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize login page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if required dependencies are loaded
    if (typeof AuthService === 'undefined' || 
        typeof StorageService === 'undefined' || 
        typeof Validation === 'undefined') {
        console.error('Required dependencies not loaded');
        return;
    }
    
    // Initialize login page
    window.loginPage = new LoginPage();
});

// Handle page visibility changes (security feature)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Clear sensitive form data when page is hidden (optional security measure)
        // Uncomment if needed for high-security environments
        // document.getElementById('password').value = '';
    }
});

// Export for potential testing or external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginPage;
}