/**
 * Journify Storage Service
 * Comprehensive localStorage wrapper with encryption, compression, and data management
 */

class StorageService {
    constructor() {
        this.storageKeys = window.StorageKeys || this.getDefaultKeys();
        this.isSupported = this.checkStorageSupport();
        this.encryptionKey = this.generateEncryptionKey();
        this.compressionEnabled = true;
        this.debugMode = window.Constants?.DEV_CONFIG?.DEBUG_MODE || false;
        
        // Initialize storage versioning
        this.currentVersion = window.AppConfig?.VERSION || '1.0.0';
        this.initializeVersioning();
        
        // Set up storage event listeners
        this.setupEventListeners();
    }

    /**
     * Check if localStorage is supported and available
     * @returns {boolean} - True if localStorage is supported
     */
    checkStorageSupport() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage is not supported:', error.message);
            return false;
        }
    }

    /**
     * Generate encryption key for sensitive data
     * @returns {string} - Encryption key
     */
    generateEncryptionKey() {
        // In production, this would be more sophisticated
        const userAgent = navigator.userAgent;
        const timestamp = Date.now().toString();
        return btoa(userAgent + timestamp).slice(0, 16);
    }

    /**
     * Initialize storage versioning and migration
     */
    initializeVersioning() {
        const storedVersion = this.getItem(this.storageKeys.APP_VERSION, false);
        
        if (!storedVersion) {
            // First time user
            this.setItem(this.storageKeys.APP_VERSION, this.currentVersion, false);
            this.log('Storage initialized for version:', this.currentVersion);
        } else if (storedVersion !== this.currentVersion) {
            // Version migration needed
            this.migrateData(storedVersion, this.currentVersion);
            this.setItem(this.storageKeys.APP_VERSION, this.currentVersion, false);
        }
    }

    /**
     * Set up storage event listeners
     */
    setupEventListeners() {
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (event) => {
            this.handleStorageChange(event);
        });

        // Listen for quota exceeded errors
        window.addEventListener('error', (event) => {
            if (event.error && event.error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
        });
    }

    /**
     * Set item in localStorage with optional encryption and compression
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {boolean} encrypt - Whether to encrypt the data
     * @param {boolean} compress - Whether to compress the data
     * @returns {boolean} - Success status
     */
    setItem(key, value, encrypt = false, compress = null) {
        if (!this.isSupported) {
            this.warn('localStorage not supported, using memory fallback');
            return this.setMemoryItem(key, value);
        }

        try {
            // Prepare data object
            const dataObject = {
                value: value,
                timestamp: Date.now(),
                version: this.currentVersion,
                encrypted: encrypt,
                compressed: compress !== null ? compress : this.compressionEnabled
            };

            // Serialize the value
            let serializedValue = JSON.stringify(dataObject.value);

            // Compress if enabled
            if (dataObject.compressed && serializedValue.length > 1000) {
                serializedValue = this.compress(serializedValue);
                this.log(`Compressed data for ${key}: ${serializedValue.length} chars`);
            }

            // Encrypt if required
            if (encrypt) {
                serializedValue = this.encrypt(serializedValue);
                this.log(`Encrypted data for ${key}`);
            }

            // Update data object with processed value
            dataObject.value = serializedValue;

            // Store in localStorage
            localStorage.setItem(key, JSON.stringify(dataObject));
            
            this.log(`Stored ${key}:`, dataObject);
            return true;

        } catch (error) {
            this.handleStorageError('setItem', key, error);
            return false;
        }
    }

    /**
     * Get item from localStorage with automatic decryption and decompression
     * @param {string} key - Storage key
     * @param {boolean} expectEncrypted - Whether data is expected to be encrypted
     * @returns {any} - Retrieved value or null
     */
    getItem(key, expectEncrypted = false) {
        if (!this.isSupported) {
            return this.getMemoryItem(key);
        }

        try {
            const storedData = localStorage.getItem(key);
            
            if (storedData === null) {
                return null;
            }

            // Try to parse as new format (with metadata)
            let dataObject;
            try {
                dataObject = JSON.parse(storedData);
                
                // Check if it's the new format
                if (typeof dataObject === 'object' && dataObject.hasOwnProperty('value')) {
                    // New format with metadata
                    let value = dataObject.value;

                    // Decrypt if encrypted
                    if (dataObject.encrypted && expectEncrypted) {
                        value = this.decrypt(value);
                        this.log(`Decrypted data for ${key}`);
                    }

                    // Decompress if compressed
                    if (dataObject.compressed) {
                        value = this.decompress(value);
                        this.log(`Decompressed data for ${key}`);
                    }

                    // Parse the final value
                    const finalValue = typeof value === 'string' ? JSON.parse(value) : value;
                    
                    this.log(`Retrieved ${key}:`, finalValue);
                    return finalValue;
                } else {
                    // Old format or direct value
                    this.log(`Retrieved ${key} (legacy format):`, dataObject);
                    return dataObject;
                }
            } catch (parseError) {
                // If JSON parsing fails, return as string
                this.log(`Retrieved ${key} (raw string):`, storedData);
                return storedData;
            }

        } catch (error) {
            this.handleStorageError('getItem', key, error);
            return null;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} - Success status
     */
    removeItem(key) {
        if (!this.isSupported) {
            return this.removeMemoryItem(key);
        }

        try {
            localStorage.removeItem(key);
            this.log(`Removed ${key}`);
            return true;
        } catch (error) {
            this.handleStorageError('removeItem', key, error);
            return false;
        }
    }

    /**
     * Clear all application data from localStorage
     * @param {boolean} keepUserPreferences - Whether to keep user preferences
     * @returns {boolean} - Success status
     */
    clear(keepUserPreferences = true) {
        if (!this.isSupported) {
            this.clearMemoryStorage();
            return true;
        }

        try {
            const preserveKeys = keepUserPreferences ? [
                this.storageKeys.THEME,
                this.storageKeys.LANGUAGE,
                this.storageKeys.NOTIFICATIONS_ENABLED,
                this.storageKeys.REMEMBERED_EMAIL
            ] : [];

            // Backup preserved data
            const preservedData = {};
            preserveKeys.forEach(key => {
                const value = this.getItem(key);
                if (value !== null) {
                    preservedData[key] = value;
                }
            });

            // Clear all Journify data
            Object.values(this.storageKeys).forEach(key => {
                this.removeItem(key);
            });

            // Restore preserved data
            Object.entries(preservedData).forEach(([key, value]) => {
                this.setItem(key, value);
            });

            this.log('Storage cleared, preserved keys:', Object.keys(preservedData));
            return true;

        } catch (error) {
            this.handleStorageError('clear', 'all', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {object} - Storage usage information
     */
    getStorageInfo() {
        const info = {
            supported: this.isSupported,
            totalQuota: 0,
            usedSpace: 0,
            availableSpace: 0,
            journifyUsage: 0,
            itemCount: 0,
            items: {}
        };

        if (!this.isSupported) {
            return info;
        }

        try {
            // Calculate total localStorage usage
            let totalUsed = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalUsed += localStorage[key].length + key.length;
                }
            }

            // Calculate Journify-specific usage
            let journifyUsed = 0;
            let itemCount = 0;
            Object.values(this.storageKeys).forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    const itemSize = item.length + key.length;
                    journifyUsed += itemSize;
                    itemCount++;
                    info.items[key] = {
                        size: itemSize,
                        lastModified: this.getItemTimestamp(key)
                    };
                }
            });

            // Estimate quota (usually 5-10MB for localStorage)
            info.totalQuota = 10 * 1024 * 1024; // 10MB estimate
            info.usedSpace = totalUsed;
            info.availableSpace = info.totalQuota - totalUsed;
            info.journifyUsage = journifyUsed;
            info.itemCount = itemCount;

        } catch (error) {
            this.warn('Could not calculate storage info:', error);
        }

        return info;
    }

    /**
     * Get timestamp of when item was last modified
     * @param {string} key - Storage key
     * @returns {number|null} - Timestamp or null
     */
    getItemTimestamp(key) {
        try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
                const dataObject = JSON.parse(storedData);
                return dataObject.timestamp || null;
            }
        } catch (error) {
            // Ignore errors for legacy data
        }
        return null;
    }

    /**
     * Export all Journify data
     * @returns {object} - Exported data
     */
    exportData() {
        const exportData = {
            version: this.currentVersion,
            exportDate: new Date().toISOString(),
            data: {}
        };

        Object.entries(this.storageKeys).forEach(([keyName, key]) => {
            const value = this.getItem(key);
            if (value !== null) {
                exportData.data[keyName] = value;
            }
        });

        this.log('Data exported:', exportData);
        return exportData;
    }

    /**
     * Import data into storage
     * @param {object} importData - Data to import
     * @returns {boolean} - Success status
     */
    importData(importData) {
        try {
            if (!importData || typeof importData !== 'object' || !importData.data) {
                throw new Error('Invalid import data format');
            }

            // Validate version compatibility
            if (importData.version && importData.version !== this.currentVersion) {
                this.warn(`Version mismatch: ${importData.version} vs ${this.currentVersion}`);
            }

            // Import data
            Object.entries(importData.data).forEach(([keyName, value]) => {
                const storageKey = this.storageKeys[keyName];
                if (storageKey) {
                    this.setItem(storageKey, value);
                }
            });

            this.log('Data imported successfully');
            return true;

        } catch (error) {
            this.handleStorageError('importData', 'import', error);
            return false;
        }
    }

    /**
     * Migrate data between versions
     * @param {string} fromVersion - Source version
     * @param {string} toVersion - Target version
     */
    migrateData(fromVersion, toVersion) {
        this.log(`Migrating data from ${fromVersion} to ${toVersion}`);

        try {
            // Version-specific migration logic would go here
            // For now, just log the migration
            
            // Example migration for future use:
            // if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
            //     this.migrateFrom1_0_0To1_1_0();
            // }

            this.log('Data migration completed');

        } catch (error) {
            this.handleStorageError('migrateData', `${fromVersion}->${toVersion}`, error);
        }
    }

    /**
     * Handle storage quota exceeded
     */
    handleQuotaExceeded() {
        this.warn('Storage quota exceeded, attempting cleanup');

        try {
            // Remove old analytics cache
            this.removeItem(this.storageKeys.ANALYTICS_CACHE);

            // Remove old entries if storage is still full
            const oldEntries = this.getOldEntries();
            oldEntries.forEach(key => {
                this.removeItem(key);
            });

            this.log('Storage cleanup completed');

        } catch (error) {
            this.error('Storage cleanup failed:', error);
        }
    }

    /**
     * Get old entries for cleanup
     * @returns {array} - Array of old entry keys
     */
    getOldEntries() {
        const oldEntries = [];
        const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days ago

        Object.values(this.storageKeys).forEach(key => {
            const timestamp = this.getItemTimestamp(key);
            if (timestamp && timestamp < cutoffDate) {
                oldEntries.push(key);
            }
        });

        return oldEntries;
    }

    /**
     * Handle storage change events from other tabs
     * @param {StorageEvent} event - Storage event
     */
    handleStorageChange(event) {
        if (Object.values(this.storageKeys).includes(event.key)) {
            this.log('Storage changed in another tab:', event.key);
            
            // Emit custom event for application to handle
            window.dispatchEvent(new CustomEvent('journifyStorageChange', {
                detail: {
                    key: event.key,
                    oldValue: event.oldValue,
                    newValue: event.newValue
                }
            }));
        }
    }

    /**
     * Simple encryption (base64 + simple cipher)
     * @param {string} data - Data to encrypt
     * @returns {string} - Encrypted data
     */
    encrypt(data) {
        // Simple XOR cipher with base64 encoding
        // In production, use a proper encryption library
        const encrypted = data.split('').map((char, i) => {
            return String.fromCharCode(char.charCodeAt(0) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
        }).join('');
        
        return btoa(encrypted);
    }

    /**
     * Simple decryption
     * @param {string} encryptedData - Encrypted data
     * @returns {string} - Decrypted data
     */
    decrypt(encryptedData) {
        try {
            const decoded = atob(encryptedData);
            return decoded.split('').map((char, i) => {
                return String.fromCharCode(char.charCodeAt(0) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }).join('');
        } catch (error) {
            this.error('Decryption failed:', error);
            return encryptedData;
        }
    }

    /**
     * Simple compression using LZ string algorithm
     * @param {string} data - Data to compress
     * @returns {string} - Compressed data
     */
    compress(data) {
        // Simple run-length encoding for demonstration
        // In production, use a proper compression library like LZ-string
        return data.replace(/(.)\1+/g, (match, char) => {
            return char + match.length;
        });
    }

    /**
     * Simple decompression
     * @param {string} compressedData - Compressed data
     * @returns {string} - Decompressed data
     */
    decompress(compressedData) {
        try {
            return compressedData.replace(/(.)\d+/g, (match) => {
                const char = match[0];
                const count = parseInt(match.slice(1));
                return char.repeat(count);
            });
        } catch (error) {
            this.error('Decompression failed:', error);
            return compressedData;
        }
    }

    /**
     * Memory storage fallback (when localStorage not available)
     */
    memoryStorage = {};

    setMemoryItem(key, value) {
        this.memoryStorage[key] = {
            value: value,
            timestamp: Date.now()
        };
        return true;
    }

    getMemoryItem(key) {
        return this.memoryStorage[key]?.value || null;
    }

    removeMemoryItem(key) {
        delete this.memoryStorage[key];
        return true;
    }

    clearMemoryStorage() {
        this.memoryStorage = {};
    }

    /**
     * Handle storage errors
     * @param {string} operation - Operation that failed
     * @param {string} key - Storage key
     * @param {Error} error - Error object
     */
    handleStorageError(operation, key, error) {
        this.error(`Storage ${operation} failed for key "${key}":`, error);
        
        // Emit error event
        window.dispatchEvent(new CustomEvent('journifyStorageError', {
            detail: {
                operation,
                key,
                error: error.message
            }
        }));
    }

    /**
     * Get default storage keys if constants not loaded
     * @returns {object} - Default storage keys
     */
    getDefaultKeys() {
        return {
            USER_TOKEN: 'journify_user_token',
            USER_DATA: 'journify_user_data',
            REMEMBERED_EMAIL: 'journify_remembered_email',
            THEME: 'journify_theme',
            MOOD_ENTRIES: 'journify_mood_entries',
            JOURNAL_ENTRIES: 'journify_journal_entries',
            APP_VERSION: 'journify_app_version'
        };
    }

    /**
     * Logging methods
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[StorageService]', ...args);
        }
    }

    warn(...args) {
        console.warn('[StorageService]', ...args);
    }

    error(...args) {
        console.error('[StorageService]', ...args);
    }
}

// Create singleton instance
const storageService = new StorageService();

// Export for global use
window.StorageService = storageService;

// Export individual methods for convenience
window.setStorageItem = (key, value, encrypt) => storageService.setItem(key, value, encrypt);
window.getStorageItem = (key, expectEncrypted) => storageService.getItem(key, expectEncrypted);
window.removeStorageItem = (key) => storageService.removeItem(key);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}

// Development helper
if (window.Constants?.DEV_CONFIG?.DEBUG_MODE) {
    console.log('💾 Storage Service Loaded:', window.StorageService);
    console.log('📊 Storage Info:', storageService.getStorageInfo());
}