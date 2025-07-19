/**
 * Journify Data Service
 * Comprehensive data management service for mood entries, journal entries, and user data
 */

class DataService {
    constructor() {
        this.storageKeys = window.StorageKeys || this.getDefaultKeys();
        this.constants = window.Constants || {};
        this.debugMode = this.constants.DEV_CONFIG?.DEBUG_MODE || false;
        
        // Cache for performance
        this.cache = {
            entries: null,
            journalEntries: null,
            analytics: null,
            lastUpdate: null
        };
        
        // Cache duration (5 minutes)
        this.cacheTimeout = 5 * 60 * 1000;
        
        this.init();
    }

    init() {
        this.log('Data Service initialized');
        this.setupEventListeners();
        this.migrateOldData();
    }

    setupEventListeners() {
        // Listen for storage changes from other tabs
        window.addEventListener('journifyStorageChange', (event) => {
            this.handleStorageChange(event);
        });
        
        // Clear cache when user logs out
        window.addEventListener('journifyAuthChange', (event) => {
            if (!event.detail.isAuthenticated) {
                this.clearCache();
            }
        });
    }

    /**
     * Migrate old data format to new structure
     */
    migrateOldData() {
        try {
            const oldEntries = StorageService.getItem('journify_entries');
            
            if (oldEntries && Array.isArray(oldEntries)) {
                // Migrate to new format
                oldEntries.forEach(entry => {
                    if (!entry.id) {
                        entry.id = this.generateEntryId();
                    }
                    if (!entry.version) {
                        entry.version = '1.0.0';
                    }
                });
                
                StorageService.setItem(this.storageKeys.MOOD_ENTRIES, oldEntries);
                StorageService.removeItem('journify_entries');
                
                this.log('Migrated old data format');
            }
        } catch (error) {
            this.error('Failed to migrate old data:', error);
        }
    }

    // ================================
    // MOOD ENTRIES METHODS
    // ================================

    /**
     * Get all mood entries
     * @returns {Promise<Array>} - Array of mood entries
     */
    async getAllEntries() {
        try {
            // Check cache first
            if (this.isValidCache('entries')) {
                this.log('Returning cached entries');
                return this.cache.entries;
            }

            const entries = StorageService.getItem(this.storageKeys.MOOD_ENTRIES) || [];
            const validEntries = this.validateEntries(entries);
            
            // Update cache
            this.updateCache('entries', validEntries);
            
            this.log(`Loaded ${validEntries.length} mood entries`);
            return validEntries;
            
        } catch (error) {
            this.error('Failed to get all entries:', error);
            return [];
        }
    }

    /**
     * Get mood entry by date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Object|null>} - Mood entry or null
     */
    async getEntryByDate(date) {
        try {
            if (!this.isValidDate(date)) {
                throw new Error('Invalid date format');
            }

            const entries = await this.getAllEntries();
            const entry = entries.find(e => e.date === date);
            
            this.log(`Entry for ${date}:`, entry ? 'found' : 'not found');
            return entry || null;
            
        } catch (error) {
            this.error('Failed to get entry by date:', error);
            return null;
        }
    }

    /**
     * Get entries within date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} - Array of entries in range
     */
    async getEntriesInRange(startDate, endDate) {
        try {
            if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
                throw new Error('Invalid date format');
            }

            const entries = await this.getAllEntries();
            const filtered = entries.filter(entry => {
                return entry.date >= startDate && entry.date <= endDate;
            });
            
            // Sort by date (newest first)
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.log(`Found ${filtered.length} entries between ${startDate} and ${endDate}`);
            return filtered;
            
        } catch (error) {
            this.error('Failed to get entries in range:', error);
            return [];
        }
    }

    /**
     * Get recent mood entries
     * @param {number} limit - Number of entries to return
     * @returns {Promise<Array>} - Array of recent entries
     */
    async getRecentEntries(limit = 10) {
        try {
            const entries = await this.getAllEntries();
            const recent = entries
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, limit);
            
            this.log(`Retrieved ${recent.length} recent entries`);
            return recent;
            
        } catch (error) {
            this.error('Failed to get recent entries:', error);
            return [];
        }
    }

    /**
     * Save mood entry
     * @param {Object} entryData - Mood entry data
     * @returns {Promise<Object>} - Saved entry with metadata
     */
    async saveMoodEntry(entryData) {
        try {
            // Validate entry data
            const validatedEntry = this.validateMoodEntry(entryData);
            
            const entries = await this.getAllEntries();
            const existingIndex = entries.findIndex(e => e.date === validatedEntry.date);
            
            let savedEntry;
            
            if (existingIndex >= 0) {
                // Update existing entry
                savedEntry = {
                    ...entries[existingIndex],
                    ...validatedEntry,
                    updatedAt: new Date().toISOString()
                };
                entries[existingIndex] = savedEntry;
                this.log(`Updated mood entry for ${validatedEntry.date}`);
            } else {
                // Create new entry
                savedEntry = {
                    id: this.generateEntryId(),
                    ...validatedEntry,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    version: '1.0.0'
                };
                entries.push(savedEntry);
                this.log(`Created new mood entry for ${validatedEntry.date}`);
            }
            
            // Save to storage
            StorageService.setItem(this.storageKeys.MOOD_ENTRIES, entries);
            
            // Clear cache to force refresh
            this.clearCache();
            
            // Emit data change event
            this.emitDataChange('moodEntry', 'save', savedEntry);
            
            return savedEntry;
            
        } catch (error) {
            this.error('Failed to save mood entry:', error);
            throw error;
        }
    }

    /**
     * Delete mood entry
     * @param {string} date - Date to delete (YYYY-MM-DD)
     * @returns {Promise<boolean>} - Success status
     */
    async deleteMoodEntry(date) {
        try {
            if (!this.isValidDate(date)) {
                throw new Error('Invalid date format');
            }

            const entries = await this.getAllEntries();
            const filteredEntries = entries.filter(entry => entry.date !== date);
            
            if (entries.length === filteredEntries.length) {
                this.log(`No entry found to delete for ${date}`);
                return false;
            }
            
            StorageService.setItem(this.storageKeys.MOOD_ENTRIES, filteredEntries);
            
            // Clear cache
            this.clearCache();
            
            // Emit data change event
            this.emitDataChange('moodEntry', 'delete', { date });
            
            this.log(`Deleted mood entry for ${date}`);
            return true;
            
        } catch (error) {
            this.error('Failed to delete mood entry:', error);
            throw error;
        }
    }

    // ================================
    // JOURNAL ENTRIES METHODS
    // ================================

    /**
     * Get all journal entries
     * @returns {Promise<Array>} - Array of journal entries
     */
    async getAllJournalEntries() {
        try {
            // Check cache first
            if (this.isValidCache('journalEntries')) {
                return this.cache.journalEntries;
            }

            const entries = StorageService.getItem(this.storageKeys.JOURNAL_ENTRIES) || [];
            const validEntries = this.validateJournalEntries(entries);
            
            // Update cache
            this.updateCache('journalEntries', validEntries);
            
            this.log(`Loaded ${validEntries.length} journal entries`);
            return validEntries;
            
        } catch (error) {
            this.error('Failed to get journal entries:', error);
            return [];
        }
    }

    /**
     * Get journal entry by date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Object|null>} - Journal entry or null
     */
    async getJournalEntryByDate(date) {
        try {
            if (!this.isValidDate(date)) {
                throw new Error('Invalid date format');
            }

            const entries = await this.getAllJournalEntries();
            const entry = entries.find(e => e.date === date);
            
            this.log(`Journal entry for ${date}:`, entry ? 'found' : 'not found');
            return entry || null;
            
        } catch (error) {
            this.error('Failed to get journal entry by date:', error);
            return null;
        }
    }

    /**
     * Save journal entry
     * @param {Object} entryData - Journal entry data
     * @returns {Promise<Object>} - Saved entry
     */
    async saveJournalEntry(entryData) {
        try {
            const validatedEntry = this.validateJournalEntry(entryData);
            
            const entries = await this.getAllJournalEntries();
            const existingIndex = entries.findIndex(e => e.date === validatedEntry.date);
            
            let savedEntry;
            
            if (existingIndex >= 0) {
                // Update existing entry
                savedEntry = {
                    ...entries[existingIndex],
                    ...validatedEntry,
                    updatedAt: new Date().toISOString()
                };
                entries[existingIndex] = savedEntry;
                this.log(`Updated journal entry for ${validatedEntry.date}`);
            } else {
                // Create new entry
                savedEntry = {
                    id: this.generateEntryId(),
                    ...validatedEntry,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    version: '1.0.0'
                };
                entries.push(savedEntry);
                this.log(`Created new journal entry for ${validatedEntry.date}`);
            }
            
            StorageService.setItem(this.storageKeys.JOURNAL_ENTRIES, entries);
            
            // Clear cache
            this.clearCache();
            
            // Emit data change event
            this.emitDataChange('journalEntry', 'save', savedEntry);
            
            return savedEntry;
            
        } catch (error) {
            this.error('Failed to save journal entry:', error);
            throw error;
        }
    }

    /**
     * Delete journal entry
     * @param {string} date - Date to delete
     * @returns {Promise<boolean>} - Success status
     */
    async deleteJournalEntry(date) {
        try {
            if (!this.isValidDate(date)) {
                throw new Error('Invalid date format');
            }

            const entries = await this.getAllJournalEntries();
            const filteredEntries = entries.filter(entry => entry.date !== date);
            
            if (entries.length === filteredEntries.length) {
                return false;
            }
            
            StorageService.setItem(this.storageKeys.JOURNAL_ENTRIES, filteredEntries);
            
            // Clear cache
            this.clearCache();
            
            // Emit data change event
            this.emitDataChange('journalEntry', 'delete', { date });
            
            this.log(`Deleted journal entry for ${date}`);
            return true;
            
        } catch (error) {
            this.error('Failed to delete journal entry:', error);
            throw error;
        }
    }

    // ================================
    // COMBINED ENTRIES METHODS
    // ================================

    /**
     * Get combined entry (mood + journal) for a date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Object>} - Combined entry data
     */
    async getCombinedEntry(date) {
        try {
            const [moodEntry, journalEntry] = await Promise.all([
                this.getEntryByDate(date),
                this.getJournalEntryByDate(date)
            ]);
            
            return {
                date,
                mood: moodEntry,
                journal: journalEntry,
                hasEntry: !!(moodEntry || journalEntry)
            };
            
        } catch (error) {
            this.error('Failed to get combined entry:', error);
            return { date, mood: null, journal: null, hasEntry: false };
        }
    }

    /**
     * Save combined entry (mood + journal)
     * @param {Object} entryData - Combined entry data
     * @returns {Promise<Object>} - Saved entries
     */
    async saveCombinedEntry(entryData) {
        try {
            const results = {};
            
            // Save mood entry if provided
            if (entryData.mood) {
                results.mood = await this.saveMoodEntry({
                    ...entryData.mood,
                    date: entryData.date
                });
            }
            
            // Save journal entry if provided
            if (entryData.journal) {
                results.journal = await this.saveJournalEntry({
                    ...entryData.journal,
                    date: entryData.date
                });
            }
            
            this.log(`Saved combined entry for ${entryData.date}`);
            return results;
            
        } catch (error) {
            this.error('Failed to save combined entry:', error);
            throw error;
        }
    }

    // ================================
    // ANALYTICS & STATISTICS
    // ================================

    /**
     * Calculate user statistics
     * @returns {Promise<Object>} - Statistics object
     */
    async calculateStatistics() {
        try {
            // Check cache first
            if (this.isValidCache('analytics')) {
                return this.cache.analytics;
            }

            const moodEntries = await this.getAllEntries();
            const journalEntries = await this.getAllJournalEntries();
            
            const stats = {
                mood: this.calculateMoodStats(moodEntries),
                journal: this.calculateJournalStats(journalEntries),
                streaks: this.calculateStreaks(moodEntries),
                overall: this.calculateOverallStats(moodEntries, journalEntries)
            };
            
            // Update cache
            this.updateCache('analytics', stats);
            
            this.log('Calculated statistics:', stats);
            return stats;
            
        } catch (error) {
            this.error('Failed to calculate statistics:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Calculate mood statistics
     * @param {Array} entries - Mood entries
     * @returns {Object} - Mood statistics
     */
    calculateMoodStats(entries) {
        if (!entries || entries.length === 0) {
            return {
                totalEntries: 0,
                averageMood: 'neutral',
                moodDistribution: {},
                weeklyAverage: 0,
                monthlyAverage: 0
            };
        }
        
        // Count mood distribution
        const moodCounts = {};
        entries.forEach(entry => {
            if (entry.mood) {
                moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            }
        });
        
        // Find most common mood
        const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b, 'neutral'
        );
        
        // Calculate weekly and monthly averages
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const weeklyEntries = entries.filter(e => new Date(e.date) >= weekAgo);
        const monthlyEntries = entries.filter(e => new Date(e.date) >= monthAgo);
        
        return {
            totalEntries: entries.length,
            averageMood: mostCommonMood,
            moodDistribution: moodCounts,
            weeklyAverage: weeklyEntries.length,
            monthlyAverage: monthlyEntries.length
        };
    }

    /**
     * Calculate journal statistics
     * @param {Array} entries - Journal entries
     * @returns {Object} - Journal statistics
     */
    calculateJournalStats(entries) {
        if (!entries || entries.length === 0) {
            return {
                totalEntries: 0,
                averageWordCount: 0,
                totalWords: 0,
                weeklyEntries: 0,
                monthlyEntries: 0
            };
        }
        
        let totalWords = 0;
        entries.forEach(entry => {
            if (entry.journalEntry) {
                const words = Object.values(entry.journalEntry)
                    .filter(text => typeof text === 'string')
                    .join(' ')
                    .split(' ')
                    .filter(word => word.trim().length > 0);
                totalWords += words.length;
            }
        });
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const weeklyEntries = entries.filter(e => new Date(e.date) >= weekAgo).length;
        const monthlyEntries = entries.filter(e => new Date(e.date) >= monthAgo).length;
        
        return {
            totalEntries: entries.length,
            averageWordCount: Math.round(totalWords / entries.length) || 0,
            totalWords,
            weeklyEntries,
            monthlyEntries
        };
    }

    /**
     * Calculate streak statistics
     * @param {Array} entries - Mood entries
     * @returns {Object} - Streak statistics
     */
    calculateStreaks(entries) {
        if (!entries || entries.length === 0) {
            return {
                current: 0,
                longest: 0,
                total: 0
            };
        }
        
        // Sort entries by date
        const sortedEntries = entries
            .map(entry => ({ ...entry, date: new Date(entry.date) }))
            .sort((a, b) => b.date - a.date);
        
        // Get unique dates
        const uniqueDates = [...new Set(sortedEntries.map(entry => 
            entry.date.toDateString()
        ))];
        
        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
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
        let longestStreak = 0;
        let tempStreak = 0;
        
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
     * Calculate overall statistics
     * @param {Array} moodEntries - Mood entries
     * @param {Array} journalEntries - Journal entries
     * @returns {Object} - Overall statistics
     */
    calculateOverallStats(moodEntries, journalEntries) {
        const totalDays = Math.max(moodEntries.length, journalEntries.length);
        const completeDays = moodEntries.filter(mood => 
            journalEntries.some(journal => journal.date === mood.date)
        ).length;
        
        return {
            totalDays,
            completeDays,
            completionRate: totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0,
            moodOnlyDays: moodEntries.length - completeDays,
            journalOnlyDays: journalEntries.length - completeDays
        };
    }

    // ================================
    // SEARCH & FILTERING
    // ================================

    /**
     * Search entries by text
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Search results
     */
    async searchEntries(query, options = {}) {
        try {
            if (!query || query.trim().length === 0) {
                return [];
            }
            
            const {
                searchMood = true,
                searchJournal = true,
                caseSensitive = false,
                dateRange = null
            } = options;
            
            const results = [];
            const searchTerm = caseSensitive ? query : query.toLowerCase();
            
            if (searchMood) {
                const moodEntries = await this.getAllEntries();
                const moodResults = moodEntries.filter(entry => {
                    if (dateRange && (entry.date < dateRange.start || entry.date > dateRange.end)) {
                        return false;
                    }
                    
                    const searchText = caseSensitive ? 
                        (entry.moodNote || '') : 
                        (entry.moodNote || '').toLowerCase();
                    
                    return searchText.includes(searchTerm) || 
                           (caseSensitive ? entry.mood : entry.mood.toLowerCase()).includes(searchTerm);
                });
                
                results.push(...moodResults.map(entry => ({ ...entry, type: 'mood' })));
            }
            
            if (searchJournal) {
                const journalEntries = await this.getAllJournalEntries();
                const journalResults = journalEntries.filter(entry => {
                    if (dateRange && (entry.date < dateRange.start || entry.date > dateRange.end)) {
                        return false;
                    }
                    
                    if (!entry.journalEntry) return false;
                    
                    const searchText = caseSensitive ? 
                        Object.values(entry.journalEntry).join(' ') :
                        Object.values(entry.journalEntry).join(' ').toLowerCase();
                    
                    return searchText.includes(searchTerm);
                });
                
                results.push(...journalResults.map(entry => ({ ...entry, type: 'journal' })));
            }
            
            // Sort by date (newest first)
            results.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.log(`Search for "${query}" returned ${results.length} results`);
            return results;
            
        } catch (error) {
            this.error('Search failed:', error);
            return [];
        }
    }

    // ================================
    // DATA EXPORT & IMPORT
    // ================================

    /**
     * Export all user data
     * @returns {Promise<Object>} - Exported data
     */
    async exportAllData() {
        try {
            const [moodEntries, journalEntries] = await Promise.all([
                this.getAllEntries(),
                this.getAllJournalEntries()
            ]);
            
            const stats = await this.calculateStatistics();
            const user = AuthService.getCurrentUser();
            
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                user: {
                    id: user?.id,
                    name: user?.name,
                    email: user?.email
                },
                data: {
                    moodEntries,
                    journalEntries,
                    statistics: stats
                },
                metadata: {
                    totalMoodEntries: moodEntries.length,
                    totalJournalEntries: journalEntries.length,
                    dateRange: {
                        earliest: moodEntries.length > 0 ? 
                            Math.min(...moodEntries.map(e => e.date)) : null,
                        latest: moodEntries.length > 0 ? 
                            Math.max(...moodEntries.map(e => e.date)) : null
                    }
                }
            };
            
            this.log('Data exported successfully');
            return exportData;
            
        } catch (error) {
            this.error('Export failed:', error);
            throw error;
        }
    }

    /**
     * Import user data
     * @param {Object} importData - Data to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>} - Import result
     */
    async importData(importData, options = {}) {
        try {
            const { merge = false, overwrite = false } = options;
            
            if (!importData || !importData.data) {
                throw new Error('Invalid import data format');
            }
            
            const results = {
                moodEntries: { imported: 0, skipped: 0, errors: 0 },
                journalEntries: { imported: 0, skipped: 0, errors: 0 }
            };
            
            // Import mood entries
            if (importData.data.moodEntries) {
                for (const entry of importData.data.moodEntries) {
                    try {
                        if (merge) {
                            const existing = await this.getEntryByDate(entry.date);
                            if (existing && !overwrite) {
                                results.moodEntries.skipped++;
                                continue;
                            }
                        }
                        
                        await this.saveMoodEntry(entry);
                        results.moodEntries.imported++;
                    } catch (error) {
                        results.moodEntries.errors++;
                        this.error(`Failed to import mood entry for ${entry.date}:`, error);
                    }
                }
            }
            
            // Import journal entries
            if (importData.data.journalEntries) {
                for (const entry of importData.data.journalEntries) {
                    try {
                        if (merge) {
                            const existing = await this.getJournalEntryByDate(entry.date);
                            if (existing && !overwrite) {
                                results.journalEntries.skipped++;
                                continue;
                            }
                        }
                        
                        await this.saveJournalEntry(entry);
                        results.journalEntries.imported++;
                    } catch (error) {
                        results.journalEntries.errors++;
                        this.error(`Failed to import journal entry for ${entry.date}:`, error);
                    }
                }
            }
            
            this.log('Data imported successfully:', results);
            return results;
            
        } catch (error) {
            this.error('Import failed:', error);
            throw error;
        }
    }

    // ================================
    // VALIDATION METHODS
    // ================================

    /**
     * Validate mood entry data
     * @param {Object} entryData - Entry data to validate
     * @returns {Object} - Validated entry data
     */
    validateMoodEntry(entryData) {
        if (!entryData || typeof entryData !== 'object') {
            throw new Error('Invalid entry data');
        }
        
        const { date, mood, moodNote, timestamp } = entryData;
        
        // Validate required fields
        if (!date || !this.isValidDate(date)) {
            throw new Error('Valid date is required');
        }
        
        if (!mood || typeof mood !== 'string') {
            throw new Error('Valid mood is required');
        }
        
        // Validate mood note length
        if (moodNote && typeof moodNote === 'string' && moodNote.length > 500) {
            throw new Error('Mood note cannot exceed 500 characters');
        }
        
        return {
            date,
            mood: mood.toLowerCase(),
            moodNote: moodNote ? moodNote.trim() : '',
            timestamp: timestamp || new Date().toISOString()
        };
    }

    /**
     * Validate journal entry data
     * @param {Object} entryData - Entry data to validate
     * @returns {Object} - Validated entry data
     */
    validateJournalEntry(entryData) {
        if (!entryData || typeof entryData !== 'object') {
            throw new Error('Invalid entry data');
        }
        
        const { date, journalEntry } = entryData;
        
        // Validate required fields
        if (!date || !this.isValidDate(date)) {
            throw new Error('Valid date is required');
        }
        
        if (!journalEntry || typeof journalEntry !== 'object') {
            throw new Error('Valid journal entry is required');
        }
        
        // Validate journal entry fields
        const validatedJournal = {};
        const requiredFields = ['wentWell', 'couldImprove', 'tomorrowGoal'];
        
        requiredFields.forEach(field => {
            const value = journalEntry[field];
            if (value && typeof value === 'string') {
                if (value.length > 2000) {
                    throw new Error(`${field} cannot exceed 2000 characters`);
                }
                validatedJournal[field] = value.trim();
            } else {
                validatedJournal[field] = '';
            }
        });
        
        return {
            date,
            journalEntry: validatedJournal,
            timestamp: entryData.timestamp || new Date().toISOString()
        };
    }

    /**
     * Validate array of entries
     * @param {Array} entries - Entries to validate
     * @returns {Array} - Valid entries
     */
    validateEntries(entries) {
        if (!Array.isArray(entries)) {
            return [];
        }
        
        return entries.filter(entry => {
            try {
                return entry && 
                       typeof entry === 'object' && 
                       entry.date && 
                       this.isValidDate(entry.date);
            } catch (error) {
                this.error('Invalid entry found:', entry, error);
                return false;
            }
        });
    }

    /**
     * Validate journal entries array
     * @param {Array} entries - Journal entries to validate
     * @returns {Array} - Valid entries
     */
    validateJournalEntries(entries) {
        if (!Array.isArray(entries)) {
            return [];
        }
        
        return entries.filter(entry => {
            try {
                return entry && 
                       typeof entry === 'object' && 
                       entry.date && 
                       this.isValidDate(entry.date) &&
                       entry.journalEntry &&
                       typeof entry.journalEntry === 'object';
            } catch (error) {
                this.error('Invalid journal entry found:', entry, error);
                return false;
            }
        });
    }

    // ================================
    // UTILITY METHODS
    // ================================

    /**
     * Check if date string is valid
     * @param {string} dateString - Date to validate
     * @returns {boolean} - True if valid
     */
    isValidDate(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            return false;
        }
        
        // Check YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        
        // Check if date is actually valid
        const date = new Date(dateString);
        return date.toISOString().slice(0, 10) === dateString;
    }

    /**
     * Generate unique entry ID
     * @returns {string} - Unique ID
     */
    generateEntryId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 9);
        return `entry_${timestamp}_${randomStr}`;
    }

    /**
     * Get today's date string
     * @returns {string} - Today in YYYY-MM-DD format
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get date string for days ago
     * @param {number} daysAgo - Number of days ago
     * @returns {string} - Date string
     */
    getDateString(daysAgo = 0) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    }

    /**
     * Check if cache is valid
     * @param {string} key - Cache key
     * @returns {boolean} - True if valid
     */
    isValidCache(key) {
        if (!this.cache[key] || !this.cache.lastUpdate) {
            return false;
        }
        
        const now = Date.now();
        return (now - this.cache.lastUpdate) < this.cacheTimeout;
    }

    /**
     * Update cache
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     */
    updateCache(key, data) {
        this.cache[key] = data;
        this.cache.lastUpdate = Date.now();
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache = {
            entries: null,
            journalEntries: null,
            analytics: null,
            lastUpdate: null
        };
        this.log('Cache cleared');
    }

    /**
     * Handle storage changes from other tabs
     * @param {CustomEvent} event - Storage change event
     */
    handleStorageChange(event) {
        const { key } = event.detail;
        
        if (key === this.storageKeys.MOOD_ENTRIES) {
            this.cache.entries = null;
            this.cache.analytics = null;
            this.log('Mood entries cache invalidated due to external change');
        } else if (key === this.storageKeys.JOURNAL_ENTRIES) {
            this.cache.journalEntries = null;
            this.cache.analytics = null;
            this.log('Journal entries cache invalidated due to external change');
        }
    }

    /**
     * Emit data change event
     * @param {string} type - Data type (moodEntry, journalEntry)
     * @param {string} action - Action (save, delete)
     * @param {Object} data - Changed data
     */
    emitDataChange(type, action, data) {
        window.dispatchEvent(new CustomEvent('journifyDataChange', {
            detail: { type, action, data, timestamp: Date.now() }
        }));
    }

    /**
     * Get default statistics
     * @returns {Object} - Default stats
     */
    getDefaultStats() {
        return {
            mood: {
                totalEntries: 0,
                averageMood: 'neutral',
                moodDistribution: {},
                weeklyAverage: 0,
                monthlyAverage: 0
            },
            journal: {
                totalEntries: 0,
                averageWordCount: 0,
                totalWords: 0,
                weeklyEntries: 0,
                monthlyEntries: 0
            },
            streaks: {
                current: 0,
                longest: 0,
                total: 0
            },
            overall: {
                totalDays: 0,
                completeDays: 0,
                completionRate: 0,
                moodOnlyDays: 0,
                journalOnlyDays: 0
            }
        };
    }

    /**
     * Get default storage keys
     * @returns {Object} - Default storage keys
     */
    getDefaultKeys() {
        return {
            MOOD_ENTRIES: 'journify_mood_entries',
            JOURNAL_ENTRIES: 'journify_journal_entries',
            USER_STREAKS: 'journify_user_streaks',
            ANALYTICS_CACHE: 'journify_analytics_cache'
        };
    }

    // ================================
    // BULK OPERATIONS
    // ================================

    /**
     * Bulk save entries
     * @param {Array} entries - Entries to save
     * @param {string} type - Entry type ('mood' or 'journal')
     * @returns {Promise<Object>} - Results
     */
    async bulkSaveEntries(entries, type = 'mood') {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        
        try {
            for (const entry of entries) {
                try {
                    if (type === 'mood') {
                        await this.saveMoodEntry(entry);
                    } else {
                        await this.saveJournalEntry(entry);
                    }
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        entry: entry.date,
                        error: error.message
                    });
                }
            }
            
            this.log(`Bulk save completed: ${results.success} success, ${results.failed} failed`);
            return results;
            
        } catch (error) {
            this.error('Bulk save failed:', error);
            throw error;
        }
    }

    /**
     * Bulk delete entries
     * @param {Array} dates - Dates to delete
     * @param {string} type - Entry type ('mood' or 'journal')
     * @returns {Promise<Object>} - Results
     */
    async bulkDeleteEntries(dates, type = 'mood') {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        
        try {
            for (const date of dates) {
                try {
                    const deleted = type === 'mood' ? 
                        await this.deleteMoodEntry(date) :
                        await this.deleteJournalEntry(date);
                    
                    if (deleted) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push({
                            date,
                            error: 'Entry not found'
                        });
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        date,
                        error: error.message
                    });
                }
            }
            
            this.log(`Bulk delete completed: ${results.success} success, ${results.failed} failed`);
            return results;
            
        } catch (error) {
            this.error('Bulk delete failed:', error);
            throw error;
        }
    }

    // ================================
    // DATA INTEGRITY
    // ================================

    /**
     * Verify data integrity
     * @returns {Promise<Object>} - Integrity report
     */
    async verifyDataIntegrity() {
        try {
            const report = {
                isValid: true,
                issues: [],
                statistics: {},
                recommendations: []
            };
            
            // Check mood entries
            const moodEntries = StorageService.getItem(this.storageKeys.MOOD_ENTRIES) || [];
            const validMoodEntries = this.validateEntries(moodEntries);
            
            if (moodEntries.length !== validMoodEntries.length) {
                report.isValid = false;
                report.issues.push({
                    type: 'invalid_mood_entries',
                    count: moodEntries.length - validMoodEntries.length,
                    message: 'Found invalid mood entries'
                });
                report.recommendations.push('Run data cleanup to remove invalid entries');
            }
            
            // Check journal entries
            const journalEntries = StorageService.getItem(this.storageKeys.JOURNAL_ENTRIES) || [];
            const validJournalEntries = this.validateJournalEntries(journalEntries);
            
            if (journalEntries.length !== validJournalEntries.length) {
                report.isValid = false;
                report.issues.push({
                    type: 'invalid_journal_entries',
                    count: journalEntries.length - validJournalEntries.length,
                    message: 'Found invalid journal entries'
                });
            }
            
            // Check for duplicate dates
            const moodDates = validMoodEntries.map(e => e.date);
            const uniqueMoodDates = [...new Set(moodDates)];
            
            if (moodDates.length !== uniqueMoodDates.length) {
                report.isValid = false;
                report.issues.push({
                    type: 'duplicate_mood_dates',
                    count: moodDates.length - uniqueMoodDates.length,
                    message: 'Found duplicate mood entries for same date'
                });
                report.recommendations.push('Remove duplicate entries');
            }
            
            report.statistics = {
                totalMoodEntries: validMoodEntries.length,
                totalJournalEntries: validJournalEntries.length,
                dateRange: this.getDateRange(validMoodEntries),
                storageSize: this.calculateStorageSize()
            };
            
            this.log('Data integrity check completed:', report);
            return report;
            
        } catch (error) {
            this.error('Data integrity check failed:', error);
            return {
                isValid: false,
                issues: [{ type: 'check_failed', message: error.message }],
                statistics: {},
                recommendations: ['Retry integrity check']
            };
        }
    }

    /**
     * Clean up invalid data
     * @returns {Promise<Object>} - Cleanup results
     */
    async cleanupData() {
        try {
            const results = {
                moodEntriesRemoved: 0,
                journalEntriesRemoved: 0,
                duplicatesRemoved: 0
            };
            
            // Clean mood entries
            const moodEntries = StorageService.getItem(this.storageKeys.MOOD_ENTRIES) || [];
            const validMoodEntries = this.validateEntries(moodEntries);
            results.moodEntriesRemoved = moodEntries.length - validMoodEntries.length;
            
            // Remove duplicates from mood entries
            const uniqueMoodEntries = [];
            const seenDates = new Set();
            
            validMoodEntries.forEach(entry => {
                if (!seenDates.has(entry.date)) {
                    seenDates.add(entry.date);
                    uniqueMoodEntries.push(entry);
                } else {
                    results.duplicatesRemoved++;
                }
            });
            
            // Clean journal entries
            const journalEntries = StorageService.getItem(this.storageKeys.JOURNAL_ENTRIES) || [];
            const validJournalEntries = this.validateJournalEntries(journalEntries);
            results.journalEntriesRemoved = journalEntries.length - validJournalEntries.length;
            
            // Save cleaned data
            StorageService.setItem(this.storageKeys.MOOD_ENTRIES, uniqueMoodEntries);
            StorageService.setItem(this.storageKeys.JOURNAL_ENTRIES, validJournalEntries);
            
            // Clear cache
            this.clearCache();
            
            this.log('Data cleanup completed:', results);
            return results;
            
        } catch (error) {
            this.error('Data cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Get date range from entries
     * @param {Array} entries - Entries to analyze
     * @returns {Object} - Date range
     */
    getDateRange(entries) {
        if (!entries || entries.length === 0) {
            return { earliest: null, latest: null };
        }
        
        const dates = entries.map(e => e.date).sort();
        return {
            earliest: dates[0],
            latest: dates[dates.length - 1]
        };
    }

    /**
     * Calculate storage size
     * @returns {number} - Storage size in bytes
     */
    calculateStorageSize() {
        try {
            const moodEntries = StorageService.getItem(this.storageKeys.MOOD_ENTRIES) || [];
            const journalEntries = StorageService.getItem(this.storageKeys.JOURNAL_ENTRIES) || [];
            
            const moodSize = JSON.stringify(moodEntries).length;
            const journalSize = JSON.stringify(journalEntries).length;
            
            return moodSize + journalSize;
        } catch (error) {
            this.error('Failed to calculate storage size:', error);
            return 0;
        }
    }

    // ================================
    // LOGGING METHODS
    // ================================

    /**
     * Log debug information
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[DataService]', ...args);
        }
    }

    /**
     * Log error information
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        console.error('[DataService]', ...args);
    }

    /**
     * Log warning information
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        console.warn('[DataService]', ...args);
    }
}

// Create singleton instance
const dataService = new DataService();

// Export for global use
window.DataService = dataService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}

// Development helper
if (window.Constants?.DEV_CONFIG?.DEBUG_MODE) {
    console.log('💾 Data Service Loaded:', window.DataService);
    
    // Add some sample data for development
    window.DataService.addSampleData = async function() {
        const sampleMoodEntries = [
            {
                date: new Date().toISOString().split('T')[0],
                mood: 'happy',
                moodNote: 'Had a great day today!',
                timestamp: new Date().toISOString()
            },
            {
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                mood: 'calm',
                moodNote: 'Feeling peaceful and relaxed.',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const entry of sampleMoodEntries) {
            await this.saveMoodEntry(entry);
        }
        
        console.log('Sample data added to DataService');
    };
}