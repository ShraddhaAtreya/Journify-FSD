/**
 * Journify Helper Utilities
 * Collection of utility functions for common operations, formatting, and UI helpers
 */

class HelperUtils {
    constructor() {
        this.constants = window.Constants || {};
        this.debugMode = this.constants.DEV_CONFIG?.DEBUG_MODE || false;
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type
     * @returns {string} - Formatted date string
     */
    formatDate(date, format = 'display') {
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Date';
            }

            const options = this.getDateFormatOptions(format);
            return new Intl.DateTimeFormat('en-US', options).format(dateObj);
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
        }
    }

    /**
     * Get date format options for Intl.DateTimeFormat
     * @param {string} format - Format type
     * @returns {object} - Format options
     */
    getDateFormatOptions(format) {
        const formats = {
            display: { month: 'short', day: 'numeric', year: 'numeric' },
            full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
            short: { month: 'numeric', day: 'numeric', year: 'numeric' },
            time: { hour: 'numeric', minute: '2-digit', hour12: true },
            datetime: { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            },
            relative: null // Handled separately
        };

        return formats[format] || formats.display;
    }

    /**
     * Get relative time string (e.g., "2 hours ago")
     * @param {Date|string} date - Date to compare
     * @returns {string} - Relative time string
     */
    getRelativeTime(date) {
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            const now = new Date();
            const diffMs = now - dateObj;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffSeconds < 60) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
            }
            if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} month${months !== 1 ? 's' : ''} ago`;
            }
            
            const years = Math.floor(diffDays / 365);
            return `${years} year${years !== 1 ? 's' : ''} ago`;
        } catch (error) {
            console.error('Relative time calculation error:', error);
            return 'Unknown';
        }
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately
     * @returns {Function} - Debounced function
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string} - Unique ID
     */
    generateId(prefix = 'id') {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        return `${prefix}_${timestamp}_${randomStr}`;
    }

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} - Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * Check if object is empty
     * @param {object} obj - Object to check
     * @returns {boolean} - True if empty
     */
    isEmpty(obj) {
        if (obj == null) return true;
        if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
        return Object.keys(obj).length === 0;
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} - Capitalized string
     */
    capitalize(str) {
        if (typeof str !== 'string' || str.length === 0) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert string to title case
     * @param {string} str - String to convert
     * @returns {string} - Title case string
     */
    toTitleCase(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncateText(text, maxLength = 100) {
        if (typeof text !== 'string') return text;
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Parse query string parameters
     * @param {string} queryString - Query string to parse
     * @returns {object} - Parsed parameters
     */
    parseQueryString(queryString = window.location.search) {
        const params = {};
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    /**
     * Build query string from object
     * @param {object} params - Parameters object
     * @returns {string} - Query string
     */
    buildQueryString(params) {
        const urlParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                urlParams.append(key, value);
            }
        });
        
        return urlParams.toString();
    }

    /**
     * Detect device type
     * @returns {string} - Device type (mobile, tablet, desktop)
     */
    getDeviceType() {
        const userAgent = navigator.userAgent;
        
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile';
        }
        
        return 'desktop';
    }

    /**
     * Check if user prefers dark mode
     * @returns {boolean} - True if dark mode preferred
     */
    prefersDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Check if user prefers reduced motion
     * @returns {boolean} - True if reduced motion preferred
     */
    prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Animate element with CSS classes
     * @param {HTMLElement} element - Element to animate
     * @param {string} animationClass - CSS animation class
     * @param {number} duration - Animation duration in ms
     * @returns {Promise} - Promise that resolves when animation completes
     */
    animateElement(element, animationClass, duration = 1000) {
        return new Promise((resolve) => {
            if (this.prefersReducedMotion()) {
                resolve();
                return;
            }

            element.classList.add(animationClass);
            
            const handleAnimationEnd = () => {
                element.classList.remove(animationClass);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
            
            // Fallback timeout
            setTimeout(() => {
                if (element.classList.contains(animationClass)) {
                    element.classList.remove(animationClass);
                    resolve();
                }
            }, duration);
        });
    }

    /**
     * Smooth scroll to element
     * @param {HTMLElement|string} target - Element or selector
     * @param {object} options - Scroll options
     */
    scrollToElement(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close notification">×</button>
            </div>
        `;

        // Add toast styles if not already present
        this.addToastStyles();

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('toast-show'), 100);

        // Auto remove
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    /**
     * Remove toast notification
     * @param {HTMLElement} toast - Toast element to remove
     */
    removeToast(toast) {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Add toast styles to document
     */
    addToastStyles() {
        if (document.getElementById('toast-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 300px;
                padding: 16px;
                border-radius: 8px;
                color: white;
                font-family: var(--font-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .toast-show {
                transform: translateX(0);
            }
            
            .toast-hide {
                transform: translateX(100%);
            }
            
            .toast-success {
                background: #10b981;
            }
            
            .toast-error {
                background: #ef4444;
            }
            
            .toast-warning {
                background: #f59e0b;
            }
            
            .toast-info {
                background: #3b82f6;
            }
            
            .toast-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .toast-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            @media (max-width: 480px) {
                .toast {
                    right: 10px;
                    left: 10px;
                    min-width: auto;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Get mood color for mood type
     * @param {string} moodType - Mood type
     * @returns {string} - Color value
     */
    getMoodColor(moodType) {
        const moodConfig = this.constants.MOOD_CONFIG?.TYPES || {};
        return moodConfig[moodType?.toUpperCase()]?.color || '#6b7280';
    }

    /**
     * Get mood emoji for mood type
     * @param {string} moodType - Mood type
     * @returns {string} - Emoji
     */
    getMoodEmoji(moodType) {
        const moodConfig = this.constants.MOOD_CONFIG?.TYPES || {};
        return moodConfig[moodType?.toUpperCase()]?.emoji || '😐';
    }

    /**
     * Calculate streak from entries
     * @param {Array} entries - Array of entry objects with dates
     * @returns {object} - Streak information
     */
    calculateStreak(entries) {
        if (!Array.isArray(entries) || entries.length === 0) {
            return { current: 0, longest: 0, total: 0 };
        }

        // Sort entries by date (newest first)
        const sortedEntries = entries
            .map(entry => ({
                ...entry,
                date: new Date(entry.date)
            }))
            .sort((a, b) => b.date - a.date);

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get unique dates
        const uniqueDates = [...new Set(sortedEntries.map(entry => 
            entry.date.toDateString()
        ))];

        // Calculate current streak
        for (let i = 0; i < uniqueDates.length; i++) {
            const entryDate = new Date(uniqueDates[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (entryDate.toDateString() === expectedDate.toDateString()) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Calculate longest streak
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const currentDate = new Date(uniqueDates[i]);
                const previousDate = new Date(uniqueDates[i - 1]);
                const dayDiff = Math.abs((previousDate - currentDate) / (1000 * 60 * 60 * 24));

                if (dayDiff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            current: currentStreak,
            longest: longestStreak,
            total: uniqueDates.length
        };
    }

    /**
     * Validate and format user input
     * @param {string} input - User input
     * @param {string} type - Input type (email, name, etc.)
     * @returns {string} - Formatted input
     */
    formatUserInput(input, type = 'text') {
        if (typeof input !== 'string') return input;

        switch (type) {
            case 'email':
                return input.trim().toLowerCase();
            case 'name':
                return this.toTitleCase(input.trim());
            case 'phone':
                return input.replace(/\D/g, '');
            case 'text':
            default:
                return input.trim();
        }
    }

    /**
     * Generate avatar initials from name
     * @param {string} name - Full name
     * @returns {string} - Initials (max 2 characters)
     */
    getInitials(name) {
        if (typeof name !== 'string' || !name.trim()) return '?';
        
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }
        
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    /**
     * Log debug information
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[Helpers]', ...args);
        }
    }

    /**
     * Log warning information
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        console.warn('[Helpers]', ...args);
    }

    /**
     * Log error information
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        console.error('[Helpers]', ...args);
    }
}

// Create singleton instance
const helpers = new HelperUtils();

// Export for global use
window.Helpers = helpers;

// Export individual functions for convenience
window.formatDate = (date, format) => helpers.formatDate(date, format);
window.getRelativeTime = (date) => helpers.getRelativeTime(date);
window.debounce = (func, wait, immediate) => helpers.debounce(func, wait, immediate);
window.throttle = (func, limit) => helpers.throttle(func, limit);
window.generateId = (prefix) => helpers.generateId(prefix);
window.showToast = (message, type, duration) => helpers.showToast(message, type, duration);
window.getMoodColor = (moodType) => helpers.getMoodColor(moodType);
window.getMoodEmoji = (moodType) => helpers.getMoodEmoji(moodType);
window.copyToClipboard = (text) => helpers.copyToClipboard(text);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HelperUtils;
}

// Development helper
if (window.Constants?.DEV_CONFIG?.DEBUG_MODE) {
    console.log('🔧 Helper Utils Loaded:', window.Helpers);
}