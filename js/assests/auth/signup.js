/**
 * Journify Signup Page JavaScript
 * Handles multi-step signup form, validation, and user registration
 */

class SignupPage {
    constructor() {
        // Form elements
        this.form = document.getElementById('signupForm');
        this.currentStep = 1;
        this.totalSteps = 3;
        this.isSubmitting = false;
        
        // Form inputs
        this.fullNameInput = document.getElementById('fullName');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.termsCheckbox = document.getElementById('termsAgree');
        this.emailUpdatesCheckbox = document.getElementById('emailUpdates');
        
        // Step navigation buttons
        this.step1NextBtn = document.getElementById('step1Next');
        this.step2BackBtn = document.getElementById('step2Back');
        this.step2NextBtn = document.getElementById('step2Next');
        this.step3BackBtn = document.getElementById('step3Back');
        this.createAccountBtn = document.getElementById('createAccountButton');
        this.getStartedBtn = document.getElementById('getStartedButton');
        
        // Password toggles
        this.passwordToggle = document.getElementById('passwordToggle');
        this.confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        
        // Overlays
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.successOverlay = document.getElementById('successOverlay');
        
        // Progress elements
        this.progressSteps = document.querySelectorAll('.progress-step');
        this.progressLines = document.querySelectorAll('.progress-line');
        
        // Form steps
        this.formSteps = document.querySelectorAll('.form-step');
        
        // Validation state
        this.validationState = {
            fullName: false,
            email: false,
            password: false,
            confirmPassword: false,
            terms: false
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupRealTimeValidation();
        this.checkExistingSession();
        this.showStep(1);
    }

    bindEvents() {
        // Step navigation
        this.step1NextBtn.addEventListener('click', () => this.nextStep());
        this.step2BackBtn.addEventListener('click', () => this.previousStep());
        this.step2NextBtn.addEventListener('click', () => this.nextStep());
        this.step3BackBtn.addEventListener('click', () => this.previousStep());
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.createAccountBtn.addEventListener('click', (e) => this.handleSubmit(e));
        
        // Password toggles
        this.passwordToggle.addEventListener('click', () => this.togglePassword('password'));
        this.confirmPasswordToggle.addEventListener('click', () => this.togglePassword('confirmPassword'));
        
        // Success overlay
        this.getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Terms checkbox
        this.termsCheckbox.addEventListener('change', () => this.validateTerms());
        
        // Clear errors on input
        this.form.addEventListener('input', () => this.clearGeneralError());
    }

    setupRealTimeValidation() {
        // Full name validation
        this.fullNameInput.addEventListener('input', debounce(() => {
            this.validateFullName(false);
        }, 300));
        
        this.fullNameInput.addEventListener('blur', () => {
            this.validateFullName(true);
        });
        
        // Email validation
        this.emailInput.addEventListener('input', debounce(() => {
            this.validateEmail(false);
        }, 300));
        
        this.emailInput.addEventListener('blur', () => {
            this.validateEmail(true);
        });
        
        // Password validation
        this.passwordInput.addEventListener('input', debounce(() => {
            this.validatePassword(false);
            this.updatePasswordStrength();
            if (this.confirmPasswordInput.value) {
                this.validateConfirmPassword(false);
            }
        }, 300));
        
        this.passwordInput.addEventListener('blur', () => {
            this.validatePassword(true);
        });
        
        // Confirm password validation
        this.confirmPasswordInput.addEventListener('input', debounce(() => {
            this.validateConfirmPassword(false);
        }, 300));
        
        this.confirmPasswordInput.addEventListener('blur', () => {
            this.validateConfirmPassword(true);
        });
    }

    async checkExistingSession() {
        try {
            if (AuthService.isAuthenticated()) {
                this.showLoadingOverlay('Redirecting to dashboard...');
                await this.delay(1000);
                window.location.href = '/pages/dashboard.html';
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateProgress();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        this.formSteps.forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentFormStep = document.querySelector(`[data-step="${stepNumber}"]`);
        if (currentFormStep) {
            currentFormStep.classList.add('active');
        }
        
        // Focus first input in step
        this.focusFirstInput(stepNumber);
        
        // Scroll to top of form
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateProgress() {
        this.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Update progress lines
        this.progressLines.forEach((line, index) => {
            if (index + 1 < this.currentStep) {
                line.classList.add('completed');
            } else {
                line.classList.remove('completed');
            }
        });
    }

    focusFirstInput(stepNumber) {
        setTimeout(() => {
            let inputToFocus;
            switch (stepNumber) {
                case 1:
                    inputToFocus = this.fullNameInput;
                    break;
                case 2:
                    inputToFocus = this.passwordInput;
                    break;
                case 3:
                    inputToFocus = this.termsCheckbox;
                    break;
            }
            if (inputToFocus) {
                inputToFocus.focus();
            }
        }, 300);
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            default:
                return false;
        }
    }

    validateStep1() {
        const nameValid = this.validateFullName(true);
        const emailValid = this.validateEmail(true);
        return nameValid && emailValid;
    }

    validateStep2() {
        const passwordValid = this.validatePassword(true);
        const confirmPasswordValid = this.validateConfirmPassword(true);
        return passwordValid && confirmPasswordValid;
    }

    validateStep3() {
        return this.validateTerms(true);
    }

    validateFullName(showError = true) {
        const name = this.fullNameInput.value.trim();
        const validation = Validation.validateName(name);
        
        if (validation.isValid) {
            this.showFieldSuccess('fullName');
            this.validationState.fullName = true;
            return true;
        } else {
            if (showError) {
                this.showFieldError('fullName', validation.errors[0]);
            } else {
                this.clearFieldError('fullName');
            }
            this.validationState.fullName = false;
            return false;
        }
    }

    validateEmail(showError = true) {
        const email = this.emailInput.value.trim();
        const validation = Validation.validateEmail(email);
        
        if (validation.isValid) {
            this.showFieldSuccess('email');
            this.validationState.email = true;
            
            // Show email suggestions if any
            if (validation.warnings && validation.warnings.length > 0) {
                this.showEmailSuggestion(validation.warnings[0]);
            } else {
                this.clearEmailSuggestion();
            }
            
            return true;
        } else {
            if (showError) {
                this.showFieldError('email', validation.errors[0]);
            } else {
                this.clearFieldError('email');
            }
            this.clearEmailSuggestion();
            this.validationState.email = false;
            return false;
        }
    }

    validatePassword(showError = true) {
        const password = this.passwordInput.value;
        const validation = Validation.validatePassword(password);
        
        if (validation.isValid) {
            this.validationState.password = true;
            this.clearFieldError('password');
            return true;
        } else {
            if (showError) {
                this.showFieldError('password', validation.errors[0]);
            } else {
                this.clearFieldError('password');
            }
            this.validationState.password = false;
            return false;
        }
    }

    validateConfirmPassword(showError = true) {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        
        if (!confirmPassword) {
            if (showError) {
                this.showFieldError('confirmPassword', 'Please confirm your password');
            }
            this.validationState.confirmPassword = false;
            return false;
        }
        
        if (password !== confirmPassword) {
            if (showError) {
                this.showFieldError('confirmPassword', 'Passwords do not match');
            } else {
                this.clearFieldError('confirmPassword');
            }
            this.validationState.confirmPassword = false;
            return false;
        }
        
        this.showFieldSuccess('confirmPassword');
        this.validationState.confirmPassword = true;
        return true;
    }

    validateTerms(showError = true) {
        const termsAccepted = this.termsCheckbox.checked;
        
        if (!termsAccepted) {
            if (showError) {
                this.showError('You must agree to the Terms of Service and Privacy Policy');
            }
            this.validationState.terms = false;
            return false;
        }
        
        this.clearGeneralError();
        this.validationState.terms = true;
        return true;
    }

    updatePasswordStrength() {
        const password = this.passwordInput.value;
        const strengthResult = Validation.calculatePasswordStrength(password);
        
        // Update strength meter
        this.updateStrengthMeter(strengthResult.level, strengthResult.score);
        
        // Update strength text
        this.updateStrengthText(strengthResult.level);
        
        // Update requirements
        this.updatePasswordRequirements(password);
    }

    updateStrengthMeter(level, score) {
        const strengthBars = document.querySelectorAll('.strength-bar');
        const levels = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'];
        
        strengthBars.forEach((bar, index) => {
            // Remove all level classes
            levels.forEach(lvl => bar.classList.remove(lvl));
            
            // Add appropriate class based on strength
            if (score >= (index + 1) * 20) {
                bar.classList.add('active');
                bar.classList.add(level);
            } else {
                bar.classList.remove('active');
            }
        });
    }

    updateStrengthText(level) {
        const strengthText = document.querySelector('.strength-text');
        const levelTexts = {
            'very-weak': 'Very Weak',
            'weak': 'Weak',
            'medium': 'Medium',
            'strong': 'Strong',
            'very-strong': 'Very Strong'
        };
        
        if (this.passwordInput.value.length === 0) {
            strengthText.textContent = 'Enter a password';
            strengthText.style.color = 'var(--color-text-secondary)';
        } else {
            strengthText.textContent = levelTexts[level] || 'Weak';
            strengthText.style.color = `var(--strength-${level})`;
        }
    }

    updatePasswordRequirements(password) {
        const requirements = {
            length: password.length >= 6,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password)
        };
        
        Object.entries(requirements).forEach(([requirement, met]) => {
            const requirementEl = document.querySelector(`[data-requirement="${requirement}"]`);
            if (requirementEl) {
                requirementEl.classList.toggle('met', met);
            }
        });
    }

    togglePassword(fieldName) {
        const input = document.getElementById(fieldName);
        const toggle = document.getElementById(`${fieldName}Toggle`);
        const eyeIcon = toggle.querySelector('.icon-eye');
        const eyeOffIcon = toggle.querySelector('.icon-eye-off');
        
        const isPassword = input.type === 'password';
        
        input.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('hidden', isPassword);
        eyeOffIcon.classList.toggle('hidden', !isPassword);
        
        // Update aria-label for accessibility
        toggle.setAttribute('aria-label', 
            isPassword ? 'Hide password' : 'Show password'
        );
        
        // Focus back to input
        input.focus();
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validate all steps
        if (!this.validateAllSteps()) {
            return;
        }
        
        const formData = this.getFormData();
        
        try {
            this.setSubmittingState(true);
            
            // Attempt signup
            const result = await AuthService.signup(formData);
            
            if (result.success) {
                this.showSuccessOverlay();
            } else {
                this.showError(result.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.setSubmittingState(false);
        }
    }

    validateAllSteps() {
        const step1Valid = this.validateStep1();
        const step2Valid = this.validateStep2();
        const step3Valid = this.validateStep3();
        
        if (!step1Valid) {
            this.showStep(1);
            this.currentStep = 1;
            this.updateProgress();
            return false;
        }
        
        if (!step2Valid) {
            this.showStep(2);
            this.currentStep = 2;
            this.updateProgress();
            return false;
        }
        
        if (!step3Valid) {
            return false;
        }
        
        return true;
    }

    getFormData() {
        return {
            name: this.fullNameInput.value.trim(),
            email: this.emailInput.value.trim().toLowerCase(),
            password: this.passwordInput.value,
            emailUpdates: this.emailUpdatesCheckbox.checked
        };
    }

    showSuccessOverlay() {
        this.hideLoadingOverlay();
        this.successOverlay.classList.remove('hidden');
        
        // Focus the get started button for accessibility
        setTimeout(() => {
            this.getStartedBtn.focus();
        }, 500);
    }

    handleGetStarted() {
        // Redirect to onboarding or dashboard
        const user = AuthService.getCurrentUser();
        if (user && !user.hasCompletedOnboarding) {
            window.location.href = '/pages/onboarding/step1.html';
        } else {
            window.location.href = '/pages/dashboard.html';
        }
    }

    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        
        const btnText = this.createAccountBtn.querySelector('.btn-text');
        const btnLoader = this.createAccountBtn.querySelector('.btn-loader');
        
        if (isSubmitting) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            this.createAccountBtn.disabled = true;
            this.createAccountBtn.setAttribute('aria-busy', 'true');
            this.showLoadingOverlay('Creating your account...');
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            this.createAccountBtn.disabled = false;
            this.createAccountBtn.setAttribute('aria-busy', 'false');
            this.hideLoadingOverlay();
        }
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
        const wrapper = input.closest('.input-wrapper');
        
        input.classList.add('error');
        input.classList.remove('success');
        input.setAttribute('aria-invalid', 'true');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.setAttribute('role', 'alert');
        }
        
        // Hide success validation icon
        if (wrapper) {
            const successIcon = wrapper.querySelector('.validation-success');
            const errorIcon = wrapper.querySelector('.validation-error');
            
            if (successIcon) successIcon.classList.add('hidden');
            if (errorIcon) errorIcon.classList.remove('hidden');
        }
    }

    showFieldSuccess(fieldName) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        const wrapper = input.closest('.input-wrapper');
        
        input.classList.remove('error');
        input.classList.add('success');
        input.setAttribute('aria-invalid', 'false');
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.removeAttribute('role');
        }
        
        // Show success validation icon
        if (wrapper) {
            const successIcon = wrapper.querySelector('.validation-success');
            const errorIcon = wrapper.querySelector('.validation-error');
            
            if (successIcon) successIcon.classList.remove('hidden');
            if (errorIcon) errorIcon.classList.add('hidden');
        }
    }

    clearFieldError(fieldName) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        const wrapper = input.closest('.input-wrapper');
        
        input.classList.remove('error', 'success');
        input.setAttribute('aria-invalid', 'false');
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.removeAttribute('role');
        }
        
        // Hide validation icons
        if (wrapper) {
            const successIcon = wrapper.querySelector('.validation-success');
            const errorIcon = wrapper.querySelector('.validation-error');
            
            if (successIcon) successIcon.classList.add('hidden');
            if (errorIcon) errorIcon.classList.add('hidden');
        }
    }

    showEmailSuggestion(suggestion) {
        const suggestionElement = document.getElementById('email-suggestion');
        if (suggestionElement) {
            suggestionElement.textContent = suggestion;
        }
    }

    clearEmailSuggestion() {
        const suggestionElement = document.getElementById('email-suggestion');
        if (suggestionElement) {
            suggestionElement.textContent = '';
        }
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

    handleKeydown(event) {
        // Handle Enter key navigation
        if (event.key === 'Enter' && !this.isSubmitting) {
            const activeElement = document.activeElement;
            
            // If on a step navigation button, trigger it
            if (activeElement === this.step1NextBtn || 
                activeElement === this.step2NextBtn) {
                event.preventDefault();
                this.nextStep();
            } else if (activeElement === this.step2BackBtn || 
                       activeElement === this.step3BackBtn) {
                event.preventDefault();
                this.previousStep();
            } else if (activeElement === this.createAccountBtn) {
                event.preventDefault();
                this.handleSubmit(event);
            }
        }
        
        // Handle Escape key
        if (event.key === 'Escape') {
            if (!this.successOverlay.classList.contains('hidden')) {
                this.handleGetStarted();
            }
        }
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

// Initialize signup page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if required dependencies are loaded
    if (typeof AuthService === 'undefined' || 
        typeof StorageService === 'undefined' || 
        typeof Validation === 'undefined') {
        console.error('Required dependencies not loaded');
        return;
    }
    
    // Initialize signup page
    window.signupPage = new SignupPage();
});

// Handle page visibility changes (security feature)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Clear sensitive form data when page is hidden (optional security measure)
        // Uncomment if needed for high-security environments
        // document.getElementById('password').value = '';
        // document.getElementById('confirmPassword').value = '';
    }
});

// Export for potential testing or external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignupPage;
}