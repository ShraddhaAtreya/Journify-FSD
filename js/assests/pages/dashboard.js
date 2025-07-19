/**
 * Journify Dashboard Page JavaScript
 * Handles dashboard functionality, mood tracking, and user interactions
 */

class DashboardPage {
    constructor() {
        // Core properties
        this.currentUser = null;
        this.todaysEntry = null;
        this.recentEntries = [];
        this.stats = {
            currentStreak: 0,
            totalEntries: 0,
            averageMood: 'neutral'
        };
        
        // DOM elements
        this.elements = {
            // Header elements
            welcomeTitle: document.getElementById('welcomeTitle'),
            welcomeSubtitle: document.getElementById('welcomeSubtitle'),
            dateValue: document.getElementById('dateValue'),
            
            // Stats elements
            currentStreak: document.getElementById('currentStreak'),
            totalEntries: document.getElementById('totalEntries'),
            averageMood: document.getElementById('averageMood'),
            averageMoodEmoji: document.getElementById('averageMoodEmoji'),
            
            // Today's entry elements
            todayEntryContent: document.getElementById('todayEntryContent'),
            noEntryState: document.getElementById('noEntryState'),
            existingEntryState: document.getElementById('existingEntryState'),
            entryMoodEmoji: document.getElementById('entryMoodEmoji'),
            entryMoodName: document.getElementById('entryMoodName'),
            entryMoodTime: document.getElementById('entryMoodTime'),
            entryNote: document.getElementById('entryNote'),
            
            // Mood buttons
            moodButtons: document.getElementById('moodButtons'),
            
            // Quote elements
            quoteText: document.getElementById('quoteText'),
            quoteAuthor: document.getElementById('quoteAuthor'),
            refreshQuote: document.getElementById('refreshQuote'),
            
            // Recent entries
            recentEntriesList: document.getElementById('recentEntriesList'),
            noEntriesMessage: document.getElementById('noEntriesMessage'),
            
            // Quick actions
            addMoodEntry: document.getElementById('addMoodEntry'),
            writeJournal: document.getElementById('writeJournal'),
            viewAnalytics: document.getElementById('viewAnalytics'),
            exportData: document.getElementById('exportData'),
            editTodayEntry: document.getElementById('editTodayEntry'),
            addJournalEntry: document.getElementById('addJournalEntry'),
            
            // Modal elements
            moodModal: document.getElementById('moodModal'),
            closeMoodModal: document.getElementById('closeMoodModal'),
            moodEntryForm: document.getElementById('moodEntryForm'),
            moodGrid: document.getElementById('moodGrid'),
            moodNote: document.getElementById('moodNote'),
            moodNoteCount: document.getElementById('moodNoteCount'),
            voiceInputButton: document.getElementById('voiceInputButton'),
            cancelMoodEntry: document.getElementById('cancelMoodEntry'),
            saveMoodEntry: document.getElementById('saveMoodEntry'),
            moodError: document.getElementById('moodError'),
            
            // Loading overlay
            loadingOverlay: document.getElementById('loadingOverlay')
        };
        
        // State
        this.selectedMood = null;
        this.isSubmitting = false;
        this.voiceRecognition = null;
        
        // Daily quotes
        this.quotes = [
            { text: "The best way to take care of the future is to take care of the present moment.", author: "Thich Nhat Hanh" },
            { text: "You are not your thoughts. You are the observer of your thoughts.", author: "Eckhart Tolle" },
            { text: "The present moment is the only time over which we have dominion.", author: "Thích Nhất Hạnh" },
            { text: "Mindfulness is about being fully awake in our lives.", author: "Jon Kabat-Zinn" },
            { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
            { text: "The only way out is through.", author: "Robert Frost" },
            { text: "You have been assigned this mountain to show others it can be moved.", author: "Mel Robbins" },
            { text: "Progress, not perfection.", author: "Anonymous" },
            { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
            { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" }
        ];
        
        this.init();
    }

    async init() {
        try {
            this.showLoadingOverlay('Loading your dashboard...');
            
            // Check authentication
            if (!AuthService.isAuthenticated()) {
                window.location.href = '/pages/login.html';
                return;
            }
            
            // Get current user
            this.currentUser = AuthService.getCurrentUser();
            
            // Initialize components
            await this.initializePage();
            this.bindEvents();
            
            this.hideLoadingOverlay();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to load dashboard. Please refresh the page.');
            this.hideLoadingOverlay();
        }
    }

    async initializePage() {
        // Update header
        this.updateHeader();
        
        // Load data
        await this.loadDashboardData();
        
        // Update UI components
        this.updateStats();
        this.updateTodaysEntry();
        this.updateRecentEntries();
        this.updateQuote();
        this.setupMoodButtons();
        this.setupMoodModal();
        
        // Setup voice recognition if available
        this.setupVoiceRecognition();
    }

    bindEvents() {
        // Mood buttons in quick selector
        if (this.elements.moodButtons) {
            this.elements.moodButtons.addEventListener('click', (e) => {
                const moodButton = e.target.closest('.mood-button');
                if (moodButton) {
                    const mood = moodButton.dataset.mood;
                    this.quickMoodEntry(mood);
                }
            });
        }
        
        // Quote refresh
        if (this.elements.refreshQuote) {
            this.elements.refreshQuote.addEventListener('click', () => {
                this.updateQuote();
            });
        }
        
        // Quick actions
        if (this.elements.addMoodEntry) {
            this.elements.addMoodEntry.addEventListener('click', () => {
                this.openMoodModal();
            });
        }
        
        if (this.elements.writeJournal) {
            this.elements.writeJournal.addEventListener('click', () => {
                window.location.href = '/pages/journal.html';
            });
        }
        
        if (this.elements.viewAnalytics) {
            this.elements.viewAnalytics.addEventListener('click', () => {
                window.location.href = '/pages/analytics.html';
            });
        }
        
        if (this.elements.exportData) {
            this.elements.exportData.addEventListener('click', () => {
                window.location.href = '/pages/export.html';
            });
        }
        
        if (this.elements.editTodayEntry) {
            this.elements.editTodayEntry.addEventListener('click', () => {
                this.editTodaysEntry();
            });
        }
        
        if (this.elements.addJournalEntry) {
            this.elements.addJournalEntry.addEventListener('click', () => {
                window.location.href = `/pages/journal.html?date=${this.getTodayString()}`;
            });
        }
        
        // Modal events
        this.bindModalEvents();
        
        // Form events
        this.bindFormEvents();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Recent entries clicks
        if (this.elements.recentEntriesList) {
            this.elements.recentEntriesList.addEventListener('click', (e) => {
                const entryItem = e.target.closest('.recent-entry-item');
                if (entryItem) {
                    const date = entryItem.dataset.date;
                    if (date) {
                        window.location.href = `/pages/calendar.html?date=${date}`;
                    }
                }
            });
        }
    }

    bindModalEvents() {
        // Close modal events
        if (this.elements.closeMoodModal) {
            this.elements.closeMoodModal.addEventListener('click', () => {
                this.closeMoodModal();
            });
        }
        
        if (this.elements.cancelMoodEntry) {
            this.elements.cancelMoodEntry.addEventListener('click', () => {
                this.closeMoodModal();
            });
        }
        
        // Click outside to close
        if (this.elements.moodModal) {
            this.elements.moodModal.addEventListener('click', (e) => {
                if (e.target === this.elements.moodModal) {
                    this.closeMoodModal();
                }
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.moodModal.classList.contains('show')) {
                this.closeMoodModal();
            }
        });
    }

    bindFormEvents() {
        // Form submission
        if (this.elements.moodEntryForm) {
            this.elements.moodEntryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMoodSubmission();
            });
        }
        
        // Mood selection in modal
        if (this.elements.moodGrid) {
            this.elements.moodGrid.addEventListener('click', (e) => {
                const moodButton = e.target.closest('.mood-button');
                if (moodButton) {
                    this.selectMood(moodButton.dataset.mood);
                }
            });
        }
        
        // Mood note character count
        if (this.elements.moodNote) {
            this.elements.moodNote.addEventListener('input', () => {
                this.updateCharacterCount();
                this.clearMoodError();
            });
        }
        
        // Voice input
        if (this.elements.voiceInputButton) {
            this.elements.voiceInputButton.addEventListener('click', () => {
                this.startVoiceInput();
            });
        }
    }

    updateHeader() {
        const now = new Date();
        const greeting = this.getGreeting(now);
        const userName = this.currentUser?.name || 'User';
        
        if (this.elements.welcomeTitle) {
            this.elements.welcomeTitle.textContent = `${greeting}, ${userName}!`;
        }
        
        if (this.elements.dateValue) {
            this.elements.dateValue.textContent = formatDate(now, 'full');
        }
    }

    getGreeting(date) {
        const hour = date.getHours();
        
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    async loadDashboardData() {
        try {
            // Load today's entry
            const today = this.getTodayString();
            this.todaysEntry = await DataService.getEntryByDate(today);
            
            // Load recent entries
            this.recentEntries = await DataService.getRecentEntries(5);
            
            // Calculate stats
            const allEntries = await DataService.getAllEntries();
            this.stats = this.calculateStats(allEntries);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load your data. Some information may be missing.');
        }
    }

    calculateStats(entries) {
        if (!entries || entries.length === 0) {
            return {
                currentStreak: 0,
                totalEntries: 0,
                averageMood: 'neutral'
            };
        }
        
        // Calculate streak
        const streakData = Helpers.calculateStreak(entries);
        
        // Calculate average mood
        const moodCounts = {};
        entries.forEach(entry => {
            if (entry.mood) {
                moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            }
        });
        
        const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b, 'neutral'
        );
        
        return {
            currentStreak: streakData.current,
            totalEntries: entries.length,
            averageMood: mostCommonMood
        };
    }

    updateStats() {
        if (this.elements.currentStreak) {
            this.elements.currentStreak.textContent = this.stats.currentStreak;
        }
        
        if (this.elements.totalEntries) {
            this.elements.totalEntries.textContent = this.stats.totalEntries;
        }
        
        if (this.elements.averageMood) {
            this.elements.averageMood.textContent = Helpers.capitalize(this.stats.averageMood);
        }
        
        if (this.elements.averageMoodEmoji) {
            this.elements.averageMoodEmoji.textContent = getMoodEmoji(this.stats.averageMood);
        }
    }

    updateTodaysEntry() {
        if (this.todaysEntry) {
            this.showExistingEntry();
        } else {
            this.showNoEntryState();
        }
    }

    showExistingEntry() {
        if (this.elements.noEntryState) {
            this.elements.noEntryState.classList.add('hidden');
        }
        
        if (this.elements.existingEntryState) {
            this.elements.existingEntryState.classList.remove('hidden');
            
            // Update mood display
            if (this.elements.entryMoodEmoji) {
                this.elements.entryMoodEmoji.textContent = getMoodEmoji(this.todaysEntry.mood);
            }
            
            if (this.elements.entryMoodName) {
                this.elements.entryMoodName.textContent = Helpers.capitalize(this.todaysEntry.mood);
            }
            
            if (this.elements.entryMoodTime) {
                const entryTime = new Date(this.todaysEntry.timestamp);
                this.elements.entryMoodTime.textContent = `Added at ${formatDate(entryTime, 'time')}`;
            }
            
            // Update note
            if (this.elements.entryNote && this.todaysEntry.moodNote) {
                this.elements.entryNote.innerHTML = `<p>${this.sanitizeHtml(this.todaysEntry.moodNote)}</p>`;
            }
        }
    }

    showNoEntryState() {
        if (this.elements.existingEntryState) {
            this.elements.existingEntryState.classList.add('hidden');
        }
        
        if (this.elements.noEntryState) {
            this.elements.noEntryState.classList.remove('hidden');
        }
    }

    updateRecentEntries() {
        if (!this.elements.recentEntriesList) return;
        
        if (this.recentEntries.length === 0) {
            if (this.elements.noEntriesMessage) {
                this.elements.noEntriesMessage.classList.remove('hidden');
            }
            return;
        }
        
        if (this.elements.noEntriesMessage) {
            this.elements.noEntriesMessage.classList.add('hidden');
        }
        
        const entriesHtml = this.recentEntries.map(entry => {
            const entryDate = new Date(entry.date);
            const preview = entry.moodNote ? 
                Helpers.truncateText(entry.moodNote, 50) : 
                'No note added';
            
            return `
                <div class="recent-entry-item" data-date="${entry.date}">
                    <div class="entry-mood-emoji">${getMoodEmoji(entry.mood)}</div>
                    <div class="entry-details">
                        <div class="entry-date">${getRelativeTime(entryDate)}</div>
                        <div class="entry-preview">${this.sanitizeHtml(preview)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.recentEntriesList.innerHTML = entriesHtml;
    }

    updateQuote() {
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        
        if (this.elements.quoteText) {
            this.elements.quoteText.textContent = randomQuote.text;
        }
        
        if (this.elements.quoteAuthor) {
            this.elements.quoteAuthor.textContent = `— ${randomQuote.author}`;
        }
        
        // Add animation
        if (this.elements.refreshQuote) {
            this.elements.refreshQuote.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                this.elements.refreshQuote.style.transform = 'rotate(0deg)';
            }, 300);
        }
    }

    setupMoodButtons() {
        if (!this.elements.moodButtons) return;
        
        const moodTypes = Object.keys(MoodConfig.TYPES || {});
        if (moodTypes.length === 0) {
            // Fallback mood types
            this.setupFallbackMoodButtons();
            return;
        }
        
        const buttonsHtml = moodTypes.map(moodKey => {
            const mood = MoodConfig.TYPES[moodKey];
            return `
                <button class="mood-button" data-mood="${mood.id}" aria-label="${mood.label}">
                    <span class="mood-button-emoji">${mood.emoji}</span>
                    <span class="mood-button-label">${mood.label}</span>
                </button>
            `;
        }).join('');
        
        this.elements.moodButtons.innerHTML = buttonsHtml;
    }

    setupFallbackMoodButtons() {
        const fallbackMoods = [
            { id: 'happy', emoji: '😊', label: 'Happy' },
            { id: 'sad', emoji: '😢', label: 'Sad' },
            { id: 'angry', emoji: '😠', label: 'Angry' },
            { id: 'anxious', emoji: '😰', label: 'Anxious' },
            { id: 'calm', emoji: '😌', label: 'Calm' },
            { id: 'excited', emoji: '🤩', label: 'Excited' },
            { id: 'neutral', emoji: '😐', label: 'Neutral' }
        ];
        
        const buttonsHtml = fallbackMoods.map(mood => `
            <button class="mood-button" data-mood="${mood.id}" aria-label="${mood.label}">
                <span class="mood-button-emoji">${mood.emoji}</span>
                <span class="mood-button-label">${mood.label}</span>
            </button>
        `).join('');
        
        this.elements.moodButtons.innerHTML = buttonsHtml;
    }

    setupMoodModal() {
        if (!this.elements.moodGrid) return;
        
        // Use same setup as mood buttons
        const moodTypes = Object.keys(MoodConfig.TYPES || {});
        const moods = moodTypes.length > 0 ? 
            moodTypes.map(key => MoodConfig.TYPES[key]) : 
            [
                { id: 'happy', emoji: '😊', label: 'Happy' },
                { id: 'sad', emoji: '😢', label: 'Sad' },
                { id: 'angry', emoji: '😠', label: 'Angry' },
                { id: 'anxious', emoji: '😰', label: 'Anxious' },
                { id: 'calm', emoji: '😌', label: 'Calm' },
                { id: 'excited', emoji: '🤩', label: 'Excited' },
                { id: 'neutral', emoji: '😐', label: 'Neutral' }
            ];
        
        const gridHtml = moods.map(mood => `
            <button type="button" class="mood-button" data-mood="${mood.id}" aria-label="${mood.label}">
                <span class="mood-button-emoji">${mood.emoji}</span>
                <span class="mood-button-label">${mood.label}</span>
            </button>
        `).join('');
        
        this.elements.moodGrid.innerHTML = gridHtml;
    }

    async quickMoodEntry(mood) {
        try {
            this.showLoadingOverlay('Saving your mood...');
            
            const entry = {
                mood: mood,
                moodNote: '',
                date: this.getTodayString(),
                timestamp: new Date().toISOString()
            };
            
            await DataService.saveMoodEntry(entry);
            
            // Update local data
            this.todaysEntry = entry;
            
            // Refresh dashboard
            await this.loadDashboardData();
            this.updateStats();
            this.updateTodaysEntry();
            this.updateRecentEntries();
            
            this.hideLoadingOverlay();
            showToast('Mood saved successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save mood:', error);
            this.showError('Failed to save your mood. Please try again.');
            this.hideLoadingOverlay();
        }
    }

    openMoodModal() {
        if (this.elements.moodModal) {
            this.elements.moodModal.classList.add('show');
            
            // Reset form
            this.resetMoodForm();
            
            // Focus first mood button
            const firstMoodButton = this.elements.moodGrid?.querySelector('.mood-button');
            if (firstMoodButton) {
                firstMoodButton.focus();
            }
        }
    }

    closeMoodModal() {
        if (this.elements.moodModal) {
            this.elements.moodModal.classList.remove('show');
            this.resetMoodForm();
        }
    }

    resetMoodForm() {
        this.selectedMood = null;
        
        // Clear mood selection
        const moodButtons = this.elements.moodGrid?.querySelectorAll('.mood-button');
        moodButtons?.forEach(btn => btn.classList.remove('selected'));
        
        // Clear note
        if (this.elements.moodNote) {
            this.elements.moodNote.value = '';
        }
        
        // Reset character count
        this.updateCharacterCount();
        
        // Clear errors
        this.clearMoodError();
        
        // Disable save button
        if (this.elements.saveMoodEntry) {
            this.elements.saveMoodEntry.disabled = true;
        }
    }

    selectMood(mood) {
        this.selectedMood = mood;
        
        // Update button states
        const moodButtons = this.elements.moodGrid?.querySelectorAll('.mood-button');
        moodButtons?.forEach(btn => {
            if (btn.dataset.mood === mood) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        // Enable save button
        if (this.elements.saveMoodEntry) {
            this.elements.saveMoodEntry.disabled = false;
        }
        
        // Clear error
        this.clearMoodError();
    }

    async handleMoodSubmission() {
        if (this.isSubmitting) return;
        
        // Validate mood selection
        if (!this.selectedMood) {
            this.showMoodError('Please select a mood');
            return;
        }
        
        try {
            this.setSubmittingState(true);
            
            const entry = {
                mood: this.selectedMood,
                moodNote: this.elements.moodNote?.value || '',
                date: this.getTodayString(),
                timestamp: new Date().toISOString()
            };
            
            await DataService.saveMoodEntry(entry);
            
            // Update local data
            this.todaysEntry = entry;
            
            // Refresh dashboard
            await this.loadDashboardData();
            this.updateStats();
            this.updateTodaysEntry();
            this.updateRecentEntries();
            
            // Close modal and show success
            this.closeMoodModal();
            showToast('Mood saved successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save mood:', error);
            this.showMoodError('Failed to save your mood. Please try again.');
        } finally {
            this.setSubmittingState(false);
        }
    }

    editTodaysEntry() {
        if (!this.todaysEntry) return;
        
        // Open modal with existing data
        this.openMoodModal();
        
        // Pre-fill with existing data
        this.selectMood(this.todaysEntry.mood);
        
        if (this.elements.moodNote && this.todaysEntry.moodNote) {
            this.elements.moodNote.value = this.todaysEntry.moodNote;
            this.updateCharacterCount();
        }
    }

    updateCharacterCount() {
        if (!this.elements.moodNote || !this.elements.moodNoteCount) return;
        
        const count = this.elements.moodNote.value.length;
        const maxCount = 500;
        
        this.elements.moodNoteCount.textContent = count;
        
        // Update color based on count
        if (count > maxCount * 0.9) {
            this.elements.moodNoteCount.style.color = 'var(--color-warning)';
        } else if (count >= maxCount) {
            this.elements.moodNoteCount.style.color = 'var(--color-error)';
        } else {
            this.elements.moodNoteCount.style.color = 'var(--color-text-secondary)';
        }
    }

    setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            // Voice recognition not available
            if (this.elements.voiceInputButton) {
                this.elements.voiceInputButton.style.display = 'none';
            }
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();
        
        this.voiceRecognition.continuous = false;
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.lang = 'en-US';
        
        this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.elements.moodNote) {
                this.elements.moodNote.value = transcript;
                this.updateCharacterCount();
            }
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            showToast('Voice input failed. Please try again.', 'error');
        };
        
        // Enable voice button
        if (this.elements.voiceInputButton) {
            this.elements.voiceInputButton.disabled = false;
        }
    }

    startVoiceInput() {
        if (!this.voiceRecognition) return;
        
        try {
            this.voiceRecognition.start();
            showToast('Listening... Please speak now.', 'info', 2000);
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            showToast('Failed to start voice input.', 'error');
        }
    }

    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        
        if (this.elements.saveMoodEntry) {
            const btnText = this.elements.saveMoodEntry.querySelector('.btn-text');
            const btnLoader = this.elements.saveMoodEntry.querySelector('.btn-loader');
            
            if (isSubmitting) {
                btnText?.classList.add('hidden');
                btnLoader?.classList.remove('hidden');
                this.elements.saveMoodEntry.disabled = true;
            } else {
                btnText?.classList.remove('hidden');
                btnLoader?.classList.add('hidden');
                this.elements.saveMoodEntry.disabled = !this.selectedMood;
            }
        }
    }

    showMoodError(message) {
        if (this.elements.moodError) {
            this.elements.moodError.textContent = message;
        }
    }

    clearMoodError() {
        if (this.elements.moodError) {
            this.elements.moodError.textContent = '';
        }
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + N - New mood entry
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.openMoodModal();
        }
        
        // Ctrl/Cmd + J - Open journal
        if ((event.ctrlKey || event.metaKey) && event.key === 'j') {
            event.preventDefault();
            window.location.href = '/pages/journal.html';
        }
        
        // Number keys 1-7 for quick mood selection (when modal is open)
        if (this.elements.moodModal?.classList.contains('show')) {
            const num = parseInt(event.key);
            if (num >= 1 && num <= 7) {
                const moodButtons = this.elements.moodGrid?.querySelectorAll('.mood-button');
                const targetButton = moodButtons?.[num - 1];
                if (targetButton) {
                    this.selectMood(targetButton.dataset.mood);
                }
            }
        }
    }

    showLoadingOverlay(message) {
        if (this.elements.loadingOverlay) {
            const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showError(message) {
        showToast(message, 'error');
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    sanitizeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Data Service Mock (placeholder until real DataService is created)
class DataServiceMock {
    constructor() {
        this.storageKey = 'journify_entries';
    }

    async getAllEntries() {
        try {
            const entries = StorageService.getItem(this.storageKey) || [];
            return Array.isArray(entries) ? entries : [];
        } catch (error) {
            console.error('Failed to load entries:', error);
            return [];
        }
    }

    async getEntryByDate(date) {
        try {
            const entries = await this.getAllEntries();
            return entries.find(entry => entry.date === date) || null;
        } catch (error) {
            console.error('Failed to get entry by date:', error);
            return null;
        }
    }

    async getRecentEntries(limit = 5) {
        try {
            const entries = await this.getAllEntries();
            return entries
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent entries:', error);
            return [];
        }
    }

    async saveMoodEntry(entry) {
        try {
            const entries = await this.getAllEntries();
            const existingIndex = entries.findIndex(e => e.date === entry.date);
            
            if (existingIndex >= 0) {
                // Update existing entry
                entries[existingIndex] = { ...entries[existingIndex], ...entry };
            } else {
                // Add new entry
                entries.push(entry);
            }
            
            StorageService.setItem(this.storageKey, entries);
            return true;
        } catch (error) {
            console.error('Failed to save mood entry:', error);
            throw error;
        }
    }

    async deleteEntry(date) {
        try {
            const entries = await this.getAllEntries();
            const filteredEntries = entries.filter(entry => entry.date !== date);
            StorageService.setItem(this.storageKey, filteredEntries);
            return true;
        } catch (error) {
            console.error('Failed to delete entry:', error);
            throw error;
        }
    }
}

// Navbar functionality
class Navbar {
    constructor() {
        this.userButton = document.getElementById('userButton');
        this.dropdownMenu = document.getElementById('dropdownMenu');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.navLinks = document.querySelector('.nav-links');
        this.logoutButton = document.getElementById('logoutButton');
        this.userAvatar = document.getElementById('userAvatar');
        this.userName = document.getElementById('userName');
        this.avatarInitials = document.getElementById('avatarInitials');
        
        this.init();
    }

    init() {
        this.updateUserInfo();
        this.bindEvents();
    }

    bindEvents() {
        // User dropdown toggle
        if (this.userButton && this.dropdownMenu) {
            this.userButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Mobile menu toggle
        if (this.mobileMenuToggle && this.navLinks) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Logout functionality
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.dropdownMenu && !this.userButton?.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Close mobile menu when clicking nav links
        if (this.navLinks) {
            this.navLinks.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    this.closeMobileMenu();
                }
            });
        }
    }

    updateUserInfo() {
        const user = AuthService.getCurrentUser();
        if (!user) return;

        // Update user name
        if (this.userName) {
            this.userName.textContent = user.name || 'User';
        }

        // Update avatar initials
        if (this.avatarInitials) {
            const initials = Helpers.getInitials(user.name || 'User');
            this.avatarInitials.textContent = initials;
        }
    }

    toggleDropdown() {
        if (!this.dropdownMenu) return;

        const isOpen = this.dropdownMenu.classList.contains('show');
        
        if (isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        if (!this.dropdownMenu || !this.userButton) return;

        this.dropdownMenu.classList.add('show');
        this.userButton.setAttribute('aria-expanded', 'true');
    }

    closeDropdown() {
        if (!this.dropdownMenu || !this.userButton) return;

        this.dropdownMenu.classList.remove('show');
        this.userButton.setAttribute('aria-expanded', 'false');
    }

    toggleMobileMenu() {
        if (!this.navLinks || !this.mobileMenuToggle) return;

        const isOpen = this.navLinks.classList.contains('mobile-open');
        
        if (isOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        if (!this.navLinks || !this.mobileMenuToggle) return;

        this.navLinks.classList.add('mobile-open');
        this.mobileMenuToggle.classList.add('active');
        this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
    }

    closeMobileMenu() {
        if (!this.navLinks || !this.mobileMenuToggle) return;

        this.navLinks.classList.remove('mobile-open');
        this.mobileMenuToggle.classList.remove('active');
        this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }

    async handleLogout() {
        try {
            const result = await AuthService.logout();
            
            if (result.success) {
                showToast('Logged out successfully', 'success');
                
                // Brief delay before redirect
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 1000);
            } else {
                showToast(result.message || 'Logout failed', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast('An error occurred during logout', 'error');
        }
    }
}

// Global functions for backward compatibility
window.formatDate = window.formatDate || function(date, format) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
        case 'full':
            return d.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        case 'time':
            return d.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        default:
            return d.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
    }
};

window.getRelativeTime = window.getRelativeTime || function(date) {
    if (!date) return '';
    
    const now = new Date();
    const d = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return formatDate(d, 'default');
};

window.getMoodEmoji = window.getMoodEmoji || function(mood) {
    const moodEmojis = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        anxious: '😰',
        calm: '😌',
        excited: '🤩',
        neutral: '😐'
    };
    
    return moodEmojis[mood?.toLowerCase()] || '😐';
};

window.getMoodColor = window.getMoodColor || function(mood) {
    const moodColors = {
        happy: '#10b981',
        sad: '#3b82f6',
        angry: '#ef4444',
        anxious: '#f59e0b',
        calm: '#8b5cf6',
        excited: '#ec4899',
        neutral: '#6b7280'
    };
    
    return moodColors[mood?.toLowerCase()] || '#6b7280';
};

window.showToast = window.showToast || function(message, type = 'info', duration = 3000) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 1000;
        font-family: var(--font-primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide toast
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if required dependencies are loaded
    if (typeof AuthService === 'undefined' || 
        typeof StorageService === 'undefined') {
        console.error('Required dependencies not loaded');
        return;
    }
    
    // Create global DataService if not available
    if (typeof DataService === 'undefined') {
        window.DataService = new DataServiceMock();
    }
    
    // Create global MoodConfig if not available
    if (typeof MoodConfig === 'undefined') {
        window.MoodConfig = {
            TYPES: {
                HAPPY: { id: 'happy', emoji: '😊', label: 'Happy' },
                SAD: { id: 'sad', emoji: '😢', label: 'Sad' },
                ANGRY: { id: 'angry', emoji: '😠', label: 'Angry' },
                ANXIOUS: { id: 'anxious', emoji: '😰', label: 'Anxious' },
                CALM: { id: 'calm', emoji: '😌', label: 'Calm' },
                EXCITED: { id: 'excited', emoji: '🤩', label: 'Excited' },
                NEUTRAL: { id: 'neutral', emoji: '😐', label: 'Neutral' }
            }
        };
    }
    
    // Create global Helpers if not available
    if (typeof Helpers === 'undefined') {
        window.Helpers = {
            capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
            getInitials: (name) => {
                if (!name) return '?';
                const words = name.trim().split(' ');
                if (words.length === 1) return words[0].charAt(0).toUpperCase();
                return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
            },
            truncateText: (text, maxLength) => {
                if (text.length <= maxLength) return text;
                return text.substr(0, maxLength).trim() + '...';
            },
            calculateStreak: (entries) => {
                if (!entries || entries.length === 0) {
                    return { current: 0, longest: 0, total: 0 };
                }
                
                const sortedEntries = entries
                    .map(entry => ({ ...entry, date: new Date(entry.date) }))
                    .sort((a, b) => b.date - a.date);
                
                const uniqueDates = [...new Set(sortedEntries.map(entry => 
                    entry.date.toDateString()
                ))];
                
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
                
                return {
                    current: currentStreak,
                    longest: currentStreak, // Simplified for now
                    total: uniqueDates.length
                };
            }
        };
    }
    
    // Initialize components
    window.navbar = new Navbar();
    window.dashboardPage = new DashboardPage();
});

// Export for testing or external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardPage, Navbar, DataServiceMock };
}