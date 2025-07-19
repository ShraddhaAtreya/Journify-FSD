/**
 * Journify Validation Service
 * Comprehensive form validation utilities and helper functions
 */

class ValidationService {
    constructor() {
        // Get validation rules from constants
        this.rules = window.ValidationRules || this.getDefaultRules();
        this.errorMessages = window.ErrorMessages?.VALIDATION || this.getDefaultErrorMessages();
    }

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {object} - Validation result
     */
    validateEmail(email) {
        const result = {
            isValid: true,
            errors: []
        };

        // Check if email is provided
        if (!email || typeof email !== 'string') {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Trim and convert to lowercase
        email = email.trim().toLowerCase();

        // Check minimum length
        if (email.length < this.rules.EMAIL.MIN_LENGTH) {
            result.isValid = false;
            result.errors.push(`Email must be at least ${this.rules.EMAIL.MIN_LENGTH} characters long.`);
        }

        // Check maximum length
        if (email.length > this.rules.EMAIL.MAX_LENGTH) {
            result.isValid = false;
            result.errors.push(`Email must be less than ${this.rules.EMAIL.MAX_LENGTH} characters long.`);
        }

        // Check email format
        if (!this.rules.EMAIL.PATTERN.test(email)) {
            result.isValid = false;
            result.errors.push(this.errorMessages.INVALID_EMAIL_FORMAT);
        }

        // Additional email validations
        if (result.isValid) {
            // Check for common typos
            const commonTypos = this.checkEmailTypos(email);
            if (commonTypos.length > 0) {
                result.warnings = commonTypos;
            }

            // Check for disposable email domains
            if (this.isDisposableEmail(email)) {
                result.warnings = result.warnings || [];
                result.warnings.push('This appears to be a temporary email address.');
            }
        }

        return result;
    }

    /**
     * Validate password
     * @param {string} password - Password to validate
     * @returns {object} - Validation result
     */
    validatePassword(password) {
        const result = {
            isValid: true,
            errors: [],
            strength: 'weak'
        };

        // Check if password is provided
        if (!password || typeof password !== 'string') {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Check minimum length
        if (password.length < this.rules.PASSWORD.MIN_LENGTH) {
            result.isValid = false;
            result.errors.push(this.errorMessages.PASSWORD_TOO_SHORT);
        }

        // Check maximum length
        if (password.length > this.rules.PASSWORD.MAX_LENGTH) {
            result.isValid = false;
            result.errors.push(`Password must be less than ${this.rules.PASSWORD.MAX_LENGTH} characters long.`);
        }

        // Check password strength
        if (result.isValid) {
            const strengthResult = this.calculatePasswordStrength(password);
            result.strength = strengthResult.level;
            result.strengthScore = strengthResult.score;
            result.strengthFeedback = strengthResult.feedback;
        }

        return result;
    }

    /**
     * Validate name field
     * @param {string} name - Name to validate
     * @returns {object} - Validation result
     */
    validateName(name) {
        const result = {
            isValid: true,
            errors: []
        };

        // Check if name is provided
        if (!name || typeof name !== 'string') {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Trim whitespace
        name = name.trim();

        // Check minimum length
        if (name.length < this.rules.NAME.MIN_LENGTH) {
            result.isValid = false;
            result.errors.push(this.errorMessages.NAME_TOO_SHORT);
        }

        // Check maximum length
        if (name.length > this.rules.NAME.MAX_LENGTH) {
            result.isValid = false;
            result.errors.push(`Name must be less than ${this.rules.NAME.MAX_LENGTH} characters long.`);
        }

        // Check name pattern (letters, spaces, hyphens, apostrophes only)
        if (!this.rules.NAME.PATTERN.test(name)) {
            result.isValid = false;
            result.errors.push('Name can only contain letters, spaces, hyphens, and apostrophes.');
        }

        return result;
    }

    /**
     * Validate mood note
     * @param {string} note - Mood note to validate
     * @returns {object} - Validation result
     */
    validateMoodNote(note) {
        const result = {
            isValid: true,
            errors: []
        };

        // Check if note is provided
        if (!note || typeof note !== 'string') {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Trim whitespace
        note = note.trim();

        // Check minimum length
        if (note.length < this.rules.MOOD_NOTE.MIN_LENGTH) {
            result.isValid = false;
            result.errors.push(this.errorMessages.MOOD_NOTE_TOO_SHORT);
        }

        // Check maximum length
        if (note.length > this.rules.MOOD_NOTE.MAX_LENGTH) {
            result.isValid = false;
            result.errors.push(`Mood note must be less than ${this.rules.MOOD_NOTE.MAX_LENGTH} characters long.`);
        }

        return result;
    }

    /**
     * Validate journal entry
     * @param {string} entry - Journal entry to validate
     * @returns {object} - Validation result
     */
    validateJournalEntry(entry) {
        const result = {
            isValid: true,
            errors: []
        };

        // Check if entry is provided
        if (!entry || typeof entry !== 'string') {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Trim whitespace
        entry = entry.trim();

        // Check minimum length
        if (entry.length < this.rules.JOURNAL_ENTRY.MIN_LENGTH) {
            result.isValid = false;
            result.errors.push(this.errorMessages.JOURNAL_TOO_SHORT);
        }

        // Check maximum length
        if (entry.length > this.rules.JOURNAL_ENTRY.MAX_LENGTH) {
            result.isValid = false;
            result.errors.push(`Journal entry must be less than ${this.rules.JOURNAL_ENTRY.MAX_LENGTH} characters long.`);
        }

        return result;
    }

    /**
     * Validate date
     * @param {string|Date} date - Date to validate
     * @param {boolean} allowFuture - Whether future dates are allowed
     * @returns {object} - Validation result
     */
    validateDate(date, allowFuture = false) {
        const result = {
            isValid: true,
            errors: []
        };

        // Check if date is provided
        if (!date) {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Convert to Date object if string
        let dateObj;
        if (typeof date === 'string') {
            dateObj = new Date(date);
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            result.isValid = false;
            result.errors.push(this.errorMessages.INVALID_DATE);
            return result;
        }

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            result.isValid = false;
            result.errors.push(this.errorMessages.INVALID_DATE);
            return result;
        }

        // Check if future date is allowed
        if (!allowFuture) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const inputDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            
            if (inputDate > today) {
                result.isValid = false;
                result.errors.push(this.errorMessages.FUTURE_DATE_NOT_ALLOWED);
            }
        }

        return result;
    }

    /**
     * Check for common email typos
     * @param {string} email - Email to check
     * @returns {array} - Array of suggestions
     */
    checkEmailTypos(email) {
        const suggestions = [];
        const commonDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'icloud.com', 'live.com', 'msn.com'
        ];

        const domain = email.split('@')[1];
        if (!domain) return suggestions;

        // Check for common typos
        const typoMap = {
            'gmial.com': 'gmail.com',
            'gmai.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'yaho.com': 'yahoo.com',
            'hotmial.com': 'hotmail.com',
            'hotmai.com': 'hotmail.com',
            'outlok.com': 'outlook.com',
            'outloook.com': 'outlook.com'
        };

        if (typoMap[domain]) {
            suggestions.push(`Did you mean ${email.replace(domain, typoMap[domain])}?`);
        }

        return suggestions;
    }

    /**
     * Check if email is from a disposable email provider
     * @param {string} email - Email to check
     * @returns {boolean} - True if disposable
     */
    isDisposableEmail(email) {
        const disposableDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'temp-mail.org'
        ];

        const domain = email.split('@')[1];
        return disposableDomains.includes(domain);
    }

    /**
     * Calculate password strength
     * @param {string} password - Password to analyze
     * @returns {object} - Strength analysis
     */
    calculatePasswordStrength(password) {
        let score = 0;
        const feedback = [];

        // Length check
        if (password.length >= 8) score += 25;
        else if (password.length >= 6) score += 10;
        else feedback.push('Use at least 8 characters');

        // Character variety
        if (/[a-z]/.test(password)) score += 15;
        else feedback.push('Include lowercase letters');

        if (/[A-Z]/.test(password)) score += 15;
        else feedback.push('Include uppercase letters');

        if (/[0-9]/.test(password)) score += 15;
        else feedback.push('Include numbers');

        if (/[^A-Za-z0-9]/.test(password)) score += 20;
        else feedback.push('Include special characters');

        // Bonus points
        if (password.length >= 12) score += 10;
        if (/[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) score += 5; // Multiple special chars

        // Determine strength level
        let level;
        if (score >= 80) level = 'very-strong';
        else if (score >= 60) level = 'strong';
        else if (score >= 40) level = 'medium';
        else if (score >= 20) level = 'weak';
        else level = 'very-weak';

        return {
            score,
            level,
            feedback: feedback.length > 0 ? feedback : ['Great password!']
        };
    }

    /**
     * Sanitize HTML input to prevent XSS
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate form data
     * @param {object} formData - Form data to validate
     * @param {object} rules - Validation rules
     * @returns {object} - Validation result
     */
    validateForm(formData, rules) {
        const result = {
            isValid: true,
            errors: {},
            warnings: {}
        };

        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            let fieldResult;

            switch (rule.type) {
                case 'email':
                    fieldResult = this.validateEmail(value);
                    break;
                case 'password':
                    fieldResult = this.validatePassword(value);
                    break;
                case 'name':
                    fieldResult = this.validateName(value);
                    break;
                case 'moodNote':
                    fieldResult = this.validateMoodNote(value);
                    break;
                case 'journalEntry':
                    fieldResult = this.validateJournalEntry(value);
                    break;
                case 'date':
                    fieldResult = this.validateDate(value, rule.allowFuture);
                    break;
                default:
                    fieldResult = this.validateGeneric(value, rule);
            }

            if (!fieldResult.isValid) {
                result.isValid = false;
                result.errors[field] = fieldResult.errors;
            }

            if (fieldResult.warnings) {
                result.warnings[field] = fieldResult.warnings;
            }
        }

        return result;
    }

    /**
     * Generic validation for custom rules
     * @param {any} value - Value to validate
     * @param {object} rule - Validation rule
     * @returns {object} - Validation result
     */
    validateGeneric(value, rule) {
        const result = {
            isValid: true,
            errors: []
        };

        // Required check
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            result.isValid = false;
            result.errors.push(this.errorMessages.REQUIRED_FIELD);
            return result;
        }

        // Skip other validations if not required and empty
        if (!rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            return result;
        }

        // Type check
        if (rule.type && typeof value !== rule.type) {
            result.isValid = false;
            result.errors.push(`Value must be a ${rule.type}`);
        }

        // Length checks for strings
        if (typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                result.isValid = false;
                result.errors.push(`Must be at least ${rule.minLength} characters long`);
            }

            if (rule.maxLength && value.length > rule.maxLength) {
                result.isValid = false;
                result.errors.push(`Must be less than ${rule.maxLength} characters long`);
            }

            if (rule.pattern && !rule.pattern.test(value)) {
                result.isValid = false;
                result.errors.push(rule.patternMessage || 'Invalid format');
            }
        }

        // Range checks for numbers
        if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                result.isValid = false;
                result.errors.push(`Must be at least ${rule.min}`);
            }

            if (rule.max !== undefined && value > rule.max) {
                result.isValid = false;
                result.errors.push(`Must be at most ${rule.max}`);
            }
        }

        return result;
    }

    /**
     * Get default validation rules if constants not loaded
     * @returns {object} - Default rules
     */
    getDefaultRules() {
        return {
            EMAIL: {
                PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                MAX_LENGTH: 254,
                MIN_LENGTH: 5
            },
            PASSWORD: {
                MIN_LENGTH: 6,
                MAX_LENGTH: 128
            },
            NAME: {
                MIN_LENGTH: 2,
                MAX_LENGTH: 50,
                PATTERN: /^[a-zA-Z\s'-]+$/
            },
            MOOD_NOTE: {
                MIN_LENGTH: 3,
                MAX_LENGTH: 500
            },
            JOURNAL_ENTRY: {
                MIN_LENGTH: 10,
                MAX_LENGTH: 5000
            }
        };
    }

    /**
     * Get default error messages if constants not loaded
     * @returns {object} - Default error messages
     */
    getDefaultErrorMessages() {
        return {
            REQUIRED_FIELD: 'This field is required.',
            INVALID_EMAIL_FORMAT: 'Please enter a valid email address.',
            PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
            NAME_TOO_SHORT: 'Name must be at least 2 characters long.',
            MOOD_NOTE_TOO_SHORT: 'Mood note must be at least 3 characters long.',
            JOURNAL_TOO_SHORT: 'Journal entry must be at least 10 characters long.',
            INVALID_DATE: 'Please select a valid date.',
            FUTURE_DATE_NOT_ALLOWED: 'Future dates are not allowed.'
        };
    }

    /**
     * Simple email validation (for quick checks)
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        return this.rules.EMAIL.PATTERN.test(email.trim().toLowerCase());
    }

    /**
     * Simple password validation (for quick checks)
     * @param {string} password - Password to validate
     * @returns {boolean} - True if valid
     */
    isValidPassword(password) {
        if (!password || typeof password !== 'string') return false;
        return password.length >= this.rules.PASSWORD.MIN_LENGTH;
    }

    /**
     * Check if a string is empty or only whitespace
     * @param {string} str - String to check
     * @returns {boolean} - True if empty
     */
    isEmpty(str) {
        return !str || typeof str !== 'string' || str.trim().length === 0;
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} - True if valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// Create singleton instance
const validationService = new ValidationService();

// Export for global use
window.Validation = validationService;

// Export individual methods for convenience
window.isValidEmail = (email) => validationService.isValidEmail(email);
window.isValidPassword = (password) => validationService.isValidPassword(password);
window.validateForm = (formData, rules) => validationService.validateForm(formData, rules);
window.sanitizeInput = (input) => validationService.sanitizeInput(input);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationService;
}

// Development helper
if (window.Constants?.DEV_CONFIG?.DEBUG_MODE) {
    console.log('✅ Validation Service Loaded:', window.Validation);
}