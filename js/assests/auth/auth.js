/**
 * Journify Authentication Service
 * Handles user authentication, session management, and user data
 */

class AuthService {
    constructor() {
        this.storageKeys = window.StorageKeys || this.getDefaultKeys();
        this.apiConfig = window.ApiConfig || {};
        this.validationRules = window.ValidationRules || {};
        this.currentUser = null;
        this.authToken = null;
        this.refreshToken = null;
        this.sessionTimeout = null;
        this.debugMode = window.Constants?.DEV_CONFIG?.DEBUG_MODE || false;
        
        // Mock users database (for development without backend)
        this.mockUsers = this.initializeMockUsers();
        
        // Initialize service
        this.init();
    }

    /**
     * Initialize authentication service
     */
    init() {
        this.loadStoredSession();
        this.setupSessionManagement();
        this.log('Auth service initialized');
    }

    /**
     * Load existing session from storage
     */
    loadStoredSession() {
        try {
            const token = StorageService.getItem(this.storageKeys.USER_TOKEN, true);
            const userData = StorageService.getItem(this.storageKeys.USER_DATA);
            const refreshToken = StorageService.getItem(this.storageKeys.REFRESH_TOKEN, true);

            if (token && userData) {
                this.authToken = token;
                this.currentUser = userData;
                this.refreshToken = refreshToken;
                
                // Validate token
                if (this.isTokenValid(token)) {
                    this.log('Session restored from storage');
                    this.startSessionTimer();
                } else {
                    this.log('Stored token expired, clearing session');
                    this.clearSession();
                }
            }
        } catch (error) {
            this.error('Failed to load stored session:', error);
            this.clearSession();
        }
    }

    /**
     * Set up session management and auto-refresh
     */
    setupSessionManagement() {
        // Set up token refresh timer
        this.startSessionTimer();
        
        // Listen for storage changes from other tabs
        window.addEventListener('journifyStorageChange', (event) => {
            if (event.detail.key === this.storageKeys.USER_TOKEN) {
                this.handleTokenChangeFromOtherTab(event.detail);
            }
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated()) {
                this.validateSession();
            }
        });
    }

    /**
     * User login
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<object>} - Login result
     */
    async login(email, password) {
        try {
            this.log('Attempting login for:', email);

            // Validate input
            const emailValidation = Validation.validateEmail(email);
            const passwordValidation = Validation.validatePassword(password);

            if (!emailValidation.isValid) {
                return {
                    success: false,
                    message: emailValidation.errors.join(', ')
                };
            }

            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.errors.join(', ')
                };
            }

            // Normalize email
            email = email.trim().toLowerCase();

            // Simulate API delay
            await this.delay(1000);

            // Check against mock users (replace with real API call)
            const loginResult = await this.authenticateUser(email, password);

            if (loginResult.success) {
                // Set up user session
                await this.setupUserSession(loginResult.user, loginResult.tokens);
                
                this.log('Login successful for:', email);
                return {
                    success: true,
                    user: this.currentUser,
                    message: 'Login successful'
                };
            } else {
                this.log('Login failed for:', email, loginResult.message);
                return {
                    success: false,
                    message: loginResult.message
                };
            }

        } catch (error) {
            this.error('Login error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred during login'
            };
        }
    }

    /**
     * User signup/registration
     * @param {object} userData - User registration data
     * @returns {Promise<object>} - Signup result
     */
    async signup(userData) {
        try {
            this.log('Attempting signup for:', userData.email);

            // Validate user data
            const validation = this.validateSignupData(userData);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.errors.join(', ')
                };
            }

            // Normalize email
            userData.email = userData.email.trim().toLowerCase();

            // Check if user already exists
            if (this.userExists(userData.email)) {
                return {
                    success: false,
                    message: 'An account with this email already exists'
                };
            }

            // Simulate API delay
            await this.delay(1500);

            // Create new user
            const newUser = await this.createUser(userData);

            if (newUser.success) {
                // Set up user session
                await this.setupUserSession(newUser.user, newUser.tokens);
                
                this.log('Signup successful for:', userData.email);
                return {
                    success: true,
                    user: this.currentUser,
                    message: 'Account created successfully'
                };
            } else {
                return {
                    success: false,
                    message: newUser.message
                };
            }

        } catch (error) {
            this.error('Signup error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred during signup'
            };
        }
    }

    /**
     * User logout
     * @returns {Promise<object>} - Logout result
     */
    async logout() {
        try {
            this.log('Logging out user:', this.currentUser?.email);

            // If we had a backend, we'd invalidate the token here
            // await this.invalidateTokenOnServer(this.authToken);

            // Clear local session
            this.clearSession();

            // Simulate API delay
            await this.delay(500);

            this.log('Logout successful');
            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            this.error('Logout error:', error);
            // Clear session anyway
            this.clearSession();
            return {
                success: true,
                message: 'Logged out successfully'
            };
        }
    }

    /**
     * Refresh authentication token
     * @returns {Promise<object>} - Refresh result
     */
    async refreshAuthToken() {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            this.log('Refreshing authentication token');

            // Simulate API call
            await this.delay(1000);

            // Generate new tokens
            const tokens = this.generateTokens(this.currentUser);

            // Update stored tokens
            StorageService.setItem(this.storageKeys.USER_TOKEN, tokens.authToken, true);
            StorageService.setItem(this.storageKeys.REFRESH_TOKEN, tokens.refreshToken, true);

            this.authToken = tokens.authToken;
            this.refreshToken = tokens.refreshToken;

            this.log('Token refreshed successfully');
            this.startSessionTimer();

            return {
                success: true,
                tokens: tokens
            };

        } catch (error) {
            this.error('Token refresh failed:', error);
            this.clearSession();
            return {
                success: false,
                message: 'Session expired, please log in again'
            };
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isAuthenticated() {
        return !!(this.currentUser && this.authToken && this.isTokenValid(this.authToken));
    }

    /**
     * Get current user data
     * @returns {object|null} - Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Update user profile
     * @param {object} updates - Profile updates
     * @returns {Promise<object>} - Update result
     */
    async updateProfile(updates) {
        try {
            if (!this.isAuthenticated()) {
                return {
                    success: false,
                    message: 'Not authenticated'
                };
            }

            this.log('Updating profile for:', this.currentUser.email);

            // Validate updates
            const validation = this.validateProfileUpdates(updates);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.errors.join(', ')
                };
            }

            // Simulate API delay
            await this.delay(1000);

            // Update user data
            this.currentUser = { ...this.currentUser, ...updates };
            
            // Update stored user data
            StorageService.setItem(this.storageKeys.USER_DATA, this.currentUser);

            this.log('Profile updated successfully');
            return {
                success: true,
                user: this.currentUser,
                message: 'Profile updated successfully'
            };

        } catch (error) {
            this.error('Profile update error:', error);
            return {
                success: false,
                message: 'Failed to update profile'
            };
        }
    }

    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<object>} - Change result
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                return {
                    success: false,
                    message: 'Not authenticated'
                };
            }

            this.log('Changing password for:', this.currentUser.email);

            // Validate current password
            const user = this.mockUsers.find(u => u.email === this.currentUser.email);
            if (!user || user.password !== this.hashPassword(currentPassword)) {
                return {
                    success: false,
                    message: 'Current password is incorrect'
                };
            }

            // Validate new password
            const passwordValidation = Validation.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.errors.join(', ')
                };
            }

            // Simulate API delay
            await this.delay(1000);

            // Update password in mock database
            user.password = this.hashPassword(newPassword);

            this.log('Password changed successfully');
            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            this.error('Password change error:', error);
            return {
                success: false,
                message: 'Failed to change password'
            };
        }
    }

    /**
     * Delete user account
     * @returns {Promise<object>} - Deletion result
     */
    async deleteAccount() {
        try {
            if (!this.isAuthenticated()) {
                return {
                    success: false,
                    message: 'Not authenticated'
                };
            }

            this.log('Deleting account for:', this.currentUser.email);

            // Simulate API delay
            await this.delay(1500);

            // Remove user from mock database
            const userIndex = this.mockUsers.findIndex(u => u.email === this.currentUser.email);
            if (userIndex !== -1) {
                this.mockUsers.splice(userIndex, 1);
            }

            // Clear all user data
            StorageService.clear(false);
            this.clearSession();

            this.log('Account deleted successfully');
            return {
                success: true,
                message: 'Account deleted successfully'
            };

        } catch (error) {
            this.error('Account deletion error:', error);
            return {
                success: false,
                message: 'Failed to delete account'
            };
        }
    }

    /**
     * Authenticate user against mock database
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<object>} - Authentication result
     */
    async authenticateUser(email, password) {
        const user = this.mockUsers.find(u => u.email === email);
        
        if (!user) {
            return {
                success: false,
                message: 'No account found with this email address'
            };
        }

        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            return {
                success: false,
                message: 'Invalid password'
            };
        }

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Return user data (without password)
        const userData = { ...user };
        delete userData.password;

        return {
            success: true,
            user: userData,
            tokens: tokens
        };
    }

    /**
     * Create new user
     * @param {object} userData - User data
     * @returns {Promise<object>} - Creation result
     */
    async createUser(userData) {
        try {
            const newUser = {
                id: this.generateUserId(),
                email: userData.email,
                name: userData.name,
                password: this.hashPassword(userData.password),
                createdAt: new Date().toISOString(),
                hasCompletedOnboarding: false,
                preferences: {
                    theme: 'light',
                    moodBasedTheme: true,
                    notifications: true
                }
            };

            // Add to mock database
            this.mockUsers.push(newUser);

            // Generate tokens
            const tokens = this.generateTokens(newUser);

            // Return user data (without password)
            const userData_clean = { ...newUser };
            delete userData_clean.password;

            return {
                success: true,
                user: userData_clean,
                tokens: tokens
            };

        } catch (error) {
            this.error('User creation failed:', error);
            return {
                success: false,
                message: 'Failed to create account'
            };
        }
    }

    /**
     * Set up user session after successful authentication
     * @param {object} user - User data
     * @param {object} tokens - Authentication tokens
     */
    async setupUserSession(user, tokens) {
        this.currentUser = user;
        this.authToken = tokens.authToken;
        this.refreshToken = tokens.refreshToken;

        // Store in localStorage
        StorageService.setItem(this.storageKeys.USER_TOKEN, tokens.authToken, true);
        StorageService.setItem(this.storageKeys.USER_DATA, user);
        StorageService.setItem(this.storageKeys.REFRESH_TOKEN, tokens.refreshToken, true);

        // Start session timer
        this.startSessionTimer();

        // Emit authentication event
        window.dispatchEvent(new CustomEvent('journifyAuthChange', {
            detail: {
                isAuthenticated: true,
                user: user
            }
        }));
    }

    /**
     * Clear user session
     */
    clearSession() {
        this.currentUser = null;
        this.authToken = null;
        this.refreshToken = null;

        // Clear session timer
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }

        // Remove from storage
        StorageService.removeItem(this.storageKeys.USER_TOKEN);
        StorageService.removeItem(this.storageKeys.USER_DATA);
        StorageService.removeItem(this.storageKeys.REFRESH_TOKEN);

        // Emit authentication event
        window.dispatchEvent(new CustomEvent('journifyAuthChange', {
            detail: {
                isAuthenticated: false,
                user: null
            }
        }));
    }

    /**
     * Start session timer for automatic token refresh
     */
    startSessionTimer() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }

        // Refresh token 5 minutes before expiry
        const refreshTime = (55 * 60 * 1000); // 55 minutes
        
        this.sessionTimeout = setTimeout(() => {
            this.refreshAuthToken();
        }, refreshTime);
    }

    /**
     * Validate session and token
     */
    async validateSession() {
        if (!this.isAuthenticated()) {
            return false;
        }

        // Check if token needs refresh
        if (this.shouldRefreshToken()) {
            const result = await this.refreshAuthToken();
            return result.success;
        }

        return true;
    }

    /**
     * Check if token is valid
     * @param {string} token - Token to validate
     * @returns {boolean} - Token validity
     */
    isTokenValid(token) {
        if (!token) return false;

        try {
            // Parse JWT-like token (simplified)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            
            return payload.exp > now;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if token should be refreshed
     * @returns {boolean} - Whether token should be refreshed
     */
    shouldRefreshToken() {
        if (!this.authToken) return false;

        try {
            const payload = JSON.parse(atob(this.authToken.split('.')[1]));
            const now = Date.now() / 1000;
            const timeUntilExpiry = payload.exp - now;
            
            // Refresh if less than 10 minutes until expiry
            return timeUntilExpiry < (10 * 60);
        } catch (error) {
            return true;
        }
    }

    /**
     * Generate authentication tokens
     * @param {object} user - User data
     * @returns {object} - Generated tokens
     */
    generateTokens(user) {
        const now = Math.floor(Date.now() / 1000);
        const authExp = now + (60 * 60); // 1 hour
        const refreshExp = now + (7 * 24 * 60 * 60); // 7 days

        // Create JWT-like tokens (simplified)
        const authPayload = {
            sub: user.id,
            email: user.email,
            iat: now,
            exp: authExp
        };

        const refreshPayload = {
            sub: user.id,
            type: 'refresh',
            iat: now,
            exp: refreshExp
        };

        return {
            authToken: this.createToken(authPayload),
            refreshToken: this.createToken(refreshPayload)
        };
    }

    /**
     * Create a simple JWT-like token
     * @param {object} payload - Token payload
     * @returns {string} - Generated token
     */
    createToken(payload) {
        const header = { typ: 'JWT', alg: 'HS256' };
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        const signature = btoa('journify_secret_key'); // Simplified signature
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * Simple password hashing (use bcrypt in production)
     * @param {string} password - Password to hash
     * @returns {string} - Hashed password
     */
    hashPassword(password) {
        // Simple hash for development (use bcrypt in production)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Generate unique user ID
     * @returns {string} - User ID
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Check if user exists
     * @param {string} email - Email to check
     * @returns {boolean} - User exists
     */
    userExists(email) {
        return this.mockUsers.some(user => user.email === email);
    }

    /**
     * Validate signup data
     * @param {object} userData - User data to validate
     * @returns {object} - Validation result
     */
    validateSignupData(userData) {
        const result = { isValid: true, errors: [] };

        // Validate email
        const emailValidation = Validation.validateEmail(userData.email);
        if (!emailValidation.isValid) {
            result.isValid = false;
            result.errors.push(...emailValidation.errors);
        }

        // Validate name
        const nameValidation = Validation.validateName(userData.name);
        if (!nameValidation.isValid) {
            result.isValid = false;
            result.errors.push(...nameValidation.errors);
        }

        // Validate password
        const passwordValidation = Validation.validatePassword(userData.password);
        if (!passwordValidation.isValid) {
            result.isValid = false;
            result.errors.push(...passwordValidation.errors);
        }

        return result;
    }

    /**
     * Validate profile updates
     * @param {object} updates - Updates to validate
     * @returns {object} - Validation result
     */
    validateProfileUpdates(updates) {
        const result = { isValid: true, errors: [] };

        if (updates.name) {
            const nameValidation = Validation.validateName(updates.name);
            if (!nameValidation.isValid) {
                result.isValid = false;
                result.errors.push(...nameValidation.errors);
            }
        }

        return result;
    }

    /**
     * Handle token change from other tab
     * @param {object} changeData - Storage change data
     */
    handleTokenChangeFromOtherTab(changeData) {
        if (changeData.newValue) {
            // Another tab logged in
            this.loadStoredSession();
        } else {
            // Another tab logged out
            this.clearSession();
        }
    }

    /**
     * Initialize mock users for development
     * @returns {array} - Mock users array
     */
    initializeMockUsers() {
        return [
            {
                id: 'user_1',
                email: 'demo@journify.com',
                name: 'Demo User',
                password: this.hashPassword('password123'),
                createdAt: '2025-01-01T00:00:00.000Z',
                hasCompletedOnboarding: true,
                preferences: {
                    theme: 'light',
                    moodBasedTheme: true,
                    notifications: true
                }
            },
            {
                id: 'user_2',
                email: 'test@example.com',
                name: 'Test User',
                password: this.hashPassword('test123'),
                createdAt: '2025-01-01T00:00:00.000Z',
                hasCompletedOnboarding: false,
                preferences: {
                    theme: 'dark',
                    moodBasedTheme: false,
                    notifications: false
                }
            }
        ];
    }

    /**
     * Get default storage keys
     * @returns {object} - Default keys
     */
    getDefaultKeys() {
        return {
            USER_TOKEN: 'journify_user_token',
            USER_DATA: 'journify_user_data',
            REFRESH_TOKEN: 'journify_refresh_token'
        };
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Logging methods
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[AuthService]', ...args);
        }
    }

    error(...args) {
        console.error('[AuthService]', ...args);
    }
}

// Create singleton instance
const authService = new AuthService();

// Export for global use
window.AuthService = authService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}

// Development helper
if (window.Constants?.DEV_CONFIG?.DEBUG_MODE) {
    console.log('🔐 Auth Service Loaded:', window.AuthService);
    console.log('👤 Mock Users Available:');
    console.log('  demo@journify.com / password123');
    console.log('  test@example.com / test123');
}