/**
 * Journify Application Constants
 * Contains all application-wide constants, configuration, and enums
 */

// Application Information
const APP_CONFIG = {
    NAME: 'Journify',
    VERSION: '1.0.0',
    TAGLINE: 'Track how you feel. Transform how you live.',
    DESCRIPTION: 'A comprehensive mood tracking and journaling web application',
    AUTHOR: 'Journify Team',
    COPYRIGHT: '© 2025 Journify. All rights reserved.'
};

// API Configuration (for future backend integration)
const API_CONFIG = {
    BASE_URL: process?.env?.API_BASE_URL || 'https://api.journify.app',
    VERSION: 'v1',
    TIMEOUT: 30000, // 30 seconds
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            SIGNUP: '/auth/signup',
            LOGOUT: '/auth/logout',
            REFRESH: '/auth/refresh',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password',
            VERIFY_EMAIL: '/auth/verify-email'
        },
        USER: {
            PROFILE: '/user/profile',
            UPDATE_PROFILE: '/user/update',
            DELETE_ACCOUNT: '/user/delete',
            CHANGE_PASSWORD: '/user/change-password'
        },
        ENTRIES: {
            LIST: '/entries',
            CREATE: '/entries',
            UPDATE: '/entries/:id',
            DELETE: '/entries/:id',
            SEARCH: '/entries/search'
        },
        ANALYTICS: {
            MOOD_TRENDS: '/analytics/mood-trends',
            SENTIMENT_ANALYSIS: '/analytics/sentiment',
            STREAK_DATA: '/analytics/streaks',
            INSIGHTS: '/analytics/insights'
        },
        EXPORT: {
            PDF: '/export/pdf',
            JSON: '/export/json',
            CSV: '/export/csv'
        }
    }
};

// Mood Configuration
const MOOD_CONFIG = {
    TYPES: {
        HAPPY: {
            id: 'happy',
            label: 'Happy',
            emoji: '😊',
            color: '#10b981',
            bgColor: '#d1fae5',
            description: 'Feeling joyful and content'
        },
        SAD: {
            id: 'sad',
            label: 'Sad',
            emoji: '😢',
            color: '#3b82f6',
            bgColor: '#dbeafe',
            description: 'Feeling down or melancholy'
        },
        ANGRY: {
            id: 'angry',
            label: 'Angry',
            emoji: '😠',
            color: '#ef4444',
            bgColor: '#fee2e2',
            description: 'Feeling frustrated or irritated'
        },
        ANXIOUS: {
            id: 'anxious',
            label: 'Anxious',
            emoji: '😰',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            description: 'Feeling worried or nervous'
        },
        CALM: {
            id: 'calm',
            label: 'Calm',
            emoji: '😌',
            color: '#8b5cf6',
            bgColor: '#ede9fe',
            description: 'Feeling peaceful and relaxed'
        },
        EXCITED: {
            id: 'excited',
            label: 'Excited',
            emoji: '🤩',
            color: '#ec4899',
            bgColor: '#fce7f3',
            description: 'Feeling energetic and enthusiastic'
        },
        NEUTRAL: {
            id: 'neutral',
            label: 'Neutral',
            emoji: '😐',
            color: '#6b7280',
            bgColor: '#f3f4f6',
            description: 'Feeling neither positive nor negative'
        }
    },
    SCALE: {
        MIN: 1,
        MAX: 10,
        DEFAULT: 5
    },
    SENTIMENT_MAPPING: {
        'happy': 'positive',
        'excited': 'positive',
        'calm': 'neutral',
        'neutral': 'neutral',
        'sad': 'negative',
        'angry': 'negative',
        'anxious': 'negative'
    }
};

// Storage Keys
const STORAGE_KEYS = {
    // Authentication
    USER_TOKEN: 'journify_user_token',
    USER_DATA: 'journify_user_data',
    REFRESH_TOKEN: 'journify_refresh_token',
    REMEMBERED_EMAIL: 'journify_remembered_email',
    
    // User Preferences
    THEME: 'journify_theme',
    MOOD_BASED_THEME: 'journify_mood_based_theme',
    NOTIFICATIONS_ENABLED: 'journify_notifications_enabled',
    LANGUAGE: 'journify_language',
    
    // Application Data
    MOOD_ENTRIES: 'journify_mood_entries',
    JOURNAL_ENTRIES: 'journify_journal_entries',
    USER_STREAKS: 'journify_user_streaks',
    ANALYTICS_CACHE: 'journify_analytics_cache',
    
    // App State
    ONBOARDING_COMPLETED: 'journify_onboarding_completed',
    LAST_SYNC: 'journify_last_sync',
    OFFLINE_QUEUE: 'journify_offline_queue',
    APP_VERSION: 'journify_app_version'
};

// Validation Rules
const VALIDATION_RULES = {
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        MAX_LENGTH: 254,
        MIN_LENGTH: 5
    },
    PASSWORD: {
        MIN_LENGTH: 6,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: false,
        REQUIRE_LOWERCASE: false,
        REQUIRE_NUMBER: false,
        REQUIRE_SPECIAL: false
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

// Date and Time Configuration
const DATE_CONFIG = {
    FORMATS: {
        DISPLAY: 'MMM dd, yyyy',
        FULL: 'EEEE, MMMM dd, yyyy',
        SHORT: 'MM/dd/yyyy',
        ISO: 'yyyy-MM-dd',
        TIME: 'HH:mm',
        DATETIME: 'MMM dd, yyyy HH:mm'
    },
    TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
    WEEK_START: 1, // Monday = 1, Sunday = 0
    STREAK_TIMEZONE_OFFSET: 0 // UTC offset for streak calculations
};

// Theme Configuration
const THEME_CONFIG = {
    MODES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },
    MOOD_BASED_THEMES: {
        happy: {
            primary: '#10b981',
            secondary: '#d1fae5',
            accent: '#059669'
        },
        sad: {
            primary: '#3b82f6',
            secondary: '#dbeafe',
            accent: '#2563eb'
        },
        angry: {
            primary: '#ef4444',
            secondary: '#fee2e2',
            accent: '#dc2626'
        },
        anxious: {
            primary: '#f59e0b',
            secondary: '#fef3c7',
            accent: '#d97706'
        },
        calm: {
            primary: '#8b5cf6',
            secondary: '#ede9fe',
            accent: '#7c3aed'
        },
        excited: {
            primary: '#ec4899',
            secondary: '#fce7f3',
            accent: '#db2777'
        },
        neutral: {
            primary: '#6b7280',
            secondary: '#f3f4f6',
            accent: '#4b5563'
        }
    }
};

// Export Configuration
const EXPORT_CONFIG = {
    FORMATS: {
        PDF: 'pdf',
        JSON: 'json',
        CSV: 'csv'
    },
    PDF_OPTIONS: {
        PAGE_SIZE: 'a4',
        ORIENTATION: 'portrait',
        MARGINS: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        }
    },
    MAX_ENTRIES_PER_EXPORT: 1000,
    FILENAME_FORMAT: 'journify-export-{date}'
};

// Analytics Configuration
const ANALYTICS_CONFIG = {
    TRENDS: {
        PERIODS: ['7d', '30d', '90d', '1y', 'all'],
        DEFAULT_PERIOD: '30d'
    },
    SENTIMENT: {
        POSITIVE_THRESHOLD: 0.1,
        NEGATIVE_THRESHOLD: -0.1,
        NEUTRAL_RANGE: [-0.1, 0.1]
    },
    STREAKS: {
        MIN_STREAK_DAYS: 2,
        MAX_BREAK_DAYS: 1
    },
    CACHE_DURATION: 300000 // 5 minutes in milliseconds
};

// Navigation Configuration
const NAVIGATION_CONFIG = {
    ROUTES: {
        HOME: '/',
        LOGIN: '/pages/login.html',
        SIGNUP: '/pages/signup.html',
        DASHBOARD: '/pages/dashboard.html',
        CALENDAR: '/pages/calendar.html',
        JOURNAL: '/pages/journal.html',
        ANALYTICS: '/pages/analytics.html',
        EXPORT: '/pages/export.html',
        SETTINGS: '/pages/settings.html',
        ONBOARDING: {
            STEP1: '/pages/onboarding/step1.html',
            STEP2: '/pages/onboarding/step2.html',
            STEP3: '/pages/onboarding/step3.html',
            STEP4: '/pages/onboarding/step4.html'
        }
    },
    PROTECTED_ROUTES: [
        '/pages/dashboard.html',
        '/pages/calendar.html',
        '/pages/journal.html',
        '/pages/analytics.html',
        '/pages/export.html',
        '/pages/settings.html'
    ],
    PUBLIC_ROUTES: [
        '/pages/login.html',
        '/pages/signup.html'
    ]
};

// Error Messages
const ERROR_MESSAGES = {
    // Authentication Errors
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
        USER_NOT_FOUND: 'No account found with this email address.',
        EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
        WEAK_PASSWORD: 'Password must be at least 6 characters long.',
        INVALID_EMAIL: 'Please enter a valid email address.',
        SESSION_EXPIRED: 'Your session has expired. Please log in again.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.'
    },
    
    // Validation Errors
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required.',
        INVALID_EMAIL_FORMAT: 'Please enter a valid email address.',
        PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
        NAME_TOO_SHORT: 'Name must be at least 2 characters long.',
        MOOD_NOTE_TOO_SHORT: 'Mood note must be at least 3 characters long.',
        JOURNAL_TOO_SHORT: 'Journal entry must be at least 10 characters long.',
        INVALID_DATE: 'Please select a valid date.',
        FUTURE_DATE_NOT_ALLOWED: 'Future dates are not allowed.'
    },
    
    // Data Errors
    DATA: {
        SAVE_FAILED: 'Failed to save your data. Please try again.',
        LOAD_FAILED: 'Failed to load your data. Please refresh the page.',
        DELETE_FAILED: 'Failed to delete the entry. Please try again.',
        EXPORT_FAILED: 'Failed to export your data. Please try again.',
        SYNC_FAILED: 'Failed to sync your data. Please check your connection.'
    },
    
    // Network Errors
    NETWORK: {
        CONNECTION_ERROR: 'Connection error. Please check your internet connection.',
        SERVER_ERROR: 'Server error. Please try again later.',
        TIMEOUT: 'Request timed out. Please try again.',
        OFFLINE: 'You are currently offline. Changes will be saved locally.'
    },
    
    // General Errors
    GENERAL: {
        UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
        FEATURE_NOT_AVAILABLE: 'This feature is not available yet.',
        BROWSER_NOT_SUPPORTED: 'Your browser is not supported. Please use a modern browser.'
    }
};

// Success Messages
const SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN_SUCCESS: 'Welcome back! Redirecting to your dashboard...',
        SIGNUP_SUCCESS: 'Account created successfully! Please check your email for verification.',
        LOGOUT_SUCCESS: 'You have been logged out successfully.',
        PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
        PASSWORD_CHANGED: 'Your password has been changed successfully.'
    },
    DATA: {
        ENTRY_SAVED: 'Your entry has been saved successfully.',
        ENTRY_UPDATED: 'Your entry has been updated successfully.',
        ENTRY_DELETED: 'Entry deleted successfully.',
        EXPORT_SUCCESS: 'Your data has been exported successfully.',
        SETTINGS_SAVED: 'Your settings have been saved.'
    }
};

// Feature Flags (for gradual feature rollout)
const FEATURE_FLAGS = {
    VOICE_INPUT: true,
    GOOGLE_AUTH: false, // Disabled for now
    OFFLINE_MODE: true,
    ANALYTICS_EXPORT: true,
    MOOD_BASED_THEMING: true,
    NOTIFICATION_REMINDERS: false,
    COLLABORATIVE_JOURNALING: false,
    AI_INSIGHTS: false
};

// Browser Support Configuration
const BROWSER_SUPPORT = {
    MIN_VERSIONS: {
        chrome: 70,
        firefox: 65,
        safari: 12,
        edge: 79
    },
    REQUIRED_FEATURES: [
        'localStorage',
        'Promise',
        'fetch',
        'addEventListener'
    ]
};

// Performance Configuration
const PERFORMANCE_CONFIG = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    AUTO_SAVE_DELAY: 2000,
    CACHE_EXPIRY: 3600000, // 1 hour
    MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
    LAZY_LOAD_THRESHOLD: 100
};

// Accessibility Configuration
const A11Y_CONFIG = {
    FOCUS_TRAP: true,
    HIGH_CONTRAST_SUPPORT: true,
    SCREEN_READER_SUPPORT: true,
    KEYBOARD_NAVIGATION: true,
    ARIA_LABELS: true,
    COLOR_CONTRAST_RATIO: 4.5
};

// Development Configuration
const DEV_CONFIG = {
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    MOCK_API: true,
    PERFORMANCE_MONITORING: false,
    ERROR_REPORTING: false
};

// Export all constants
window.Constants = {
    APP_CONFIG,
    API_CONFIG,
    MOOD_CONFIG,
    STORAGE_KEYS,
    VALIDATION_RULES,
    DATE_CONFIG,
    THEME_CONFIG,
    EXPORT_CONFIG,
    ANALYTICS_CONFIG,
    NAVIGATION_CONFIG,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    FEATURE_FLAGS,
    BROWSER_SUPPORT,
    PERFORMANCE_CONFIG,
    A11Y_CONFIG,
    DEV_CONFIG
};

// Also export individual objects for easier access
window.AppConfig = APP_CONFIG;
window.ApiConfig = API_CONFIG;
window.MoodConfig = MOOD_CONFIG;
window.StorageKeys = STORAGE_KEYS;
window.ValidationRules = VALIDATION_RULES;
window.ErrorMessages = ERROR_MESSAGES;
window.SuccessMessages = SUCCESS_MESSAGES;

// Freeze objects to prevent modification
if (Object.freeze) {
    Object.freeze(window.Constants);
    Object.freeze(window.AppConfig);
    Object.freeze(window.ApiConfig);
    Object.freeze(window.MoodConfig);
    Object.freeze(window.StorageKeys);
    Object.freeze(window.ValidationRules);
    Object.freeze(window.ErrorMessages);
    Object.freeze(window.SuccessMessages);
}

// Development helper
if (DEV_CONFIG.DEBUG_MODE) {
    console.log('🚀 Journify Constants Loaded:', window.Constants);
}