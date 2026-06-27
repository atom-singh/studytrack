/**
 * StudyTrack - Core Application Logic
 * Single-Page Application (SPA) Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. DOM Elements & State
    // -------------------------------------------------------------
    const elements = {
        // Views
        landingView: document.getElementById('landing-view'),
        authView: document.getElementById('auth-view'),
        dashboardView: document.getElementById('dashboard-view'),
        reportView: document.getElementById('report-view'),

        // Navigation & Profile
        logoBtn: document.getElementById('logo-btn'),
        loggedInNav: document.getElementById('logged-in-nav'),
        navDashboardBtn: document.getElementById('nav-dashboard-btn'),
        navReportsBtn: document.getElementById('nav-reports-btn'),
        loggedOutControls: document.getElementById('logged-out-controls'),
        loggedInControls: document.getElementById('logged-in-controls'),
        headerLoginBtn: document.getElementById('header-login-btn'),
        headerRegisterBtn: document.getElementById('header-register-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        userDisplayEmail: document.getElementById('user-display-email'),
        headerStreakCount: document.getElementById('header-streak-count'),
        footerHomeLink: document.getElementById('footer-home-link'),

        // Auth
        loginCard: document.getElementById('login-card'),
        signupCard: document.getElementById('signup-card'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        loginEmail: document.getElementById('login-email'),
        loginPassword: document.getElementById('login-password'),
        signupEmail: document.getElementById('signup-email'),
        signupPassword: document.getElementById('signup-password'),
        signupConfirmPassword: document.getElementById('signup-confirm-password'),
        goToSignup: document.getElementById('go-to-signup'),
        goToLogin: document.getElementById('go-to-login'),
        heroCtaBtn: document.getElementById('hero-cta-btn'),

        // Dashboard
        greetingUsername: document.getElementById('greeting-username'),
        dashboardStreakCount: document.getElementById('dashboard-streak-count'),
        streakTodayProgress: document.getElementById('streak-today-progress'),
        streakProgressText: document.getElementById('streak-progress-text'),

        // Timer
        timerActiveBadge: document.getElementById('timer-active-badge'),
        timerDigits: document.getElementById('timer-digits'),
        timerSubjectDisplay: document.getElementById('timer-subject-display'),
        timerSubjectSelect: document.getElementById('timer-subject-select'),
        timerStartBtn: document.getElementById('timer-start-btn'),
        timerPauseBtn: document.getElementById('timer-pause-btn'),
        timerStopBtn: document.getElementById('timer-stop-btn'),
        timerCard: document.querySelector('.timer-card'),

        // Subjects
        addSubjectForm: document.getElementById('add-subject-form'),
        newSubjectInput: document.getElementById('new-subject-input'),
        subjectChips: document.getElementById('subject-chips'),
        todayTotalStudyTime: document.getElementById('today-total-study-time'),
        todayProgressList: document.getElementById('today-progress-list'),

        // Utilities
        btnExportData: document.getElementById('btn-export-data'),
        btnImportData: document.getElementById('btn-import-data'),
        importFileInput: document.getElementById('import-file-input'),
        btnDemoData: document.getElementById('btn-demo-data'),

        // Analytics
        statsTotalTime: document.getElementById('stats-total-time'),
        statsDailyAverage: document.getElementById('stats-daily-average'),
        statsTopSubject: document.getElementById('stats-top-subject'),
        statsTopSubjectDuration: document.getElementById('stats-top-subject-duration'),
        weeklyStudyChart: document.getElementById('weekly-study-chart'),
        toastContainer: document.getElementById('toast-container'),

        // Premium Elements
        headerPremiumBadge: document.getElementById('header-premium-badge'),
        premiumUpgradeCard: document.getElementById('premium-upgrade-card'),
        themeCustomizerCard: document.getElementById('theme-customizer-card'),
        premiumTargetContainer: document.getElementById('premium-target-container'),
        customTargetInput: document.getElementById('custom-target-input'),
        btnExportReport: document.getElementById('btn-export-report'),
        upgradePremiumBtn: document.getElementById('upgrade-premium-btn')
    };

    // Global application state
    const state = {
        currentUser: null, // email of logged-in user
        subjects: [],      // active subject names
        sessions: [],      // list of completed study sessions
        isPremium: false,  // Premium user status
        dailyTarget: 30,   // Daily study target in minutes
        themeChoice: 'default', // Active theme choice name
        
        // Timer active state
        timer: {
            intervalId: null,
            state: 'idle', // 'idle' | 'running' | 'paused'
            seconds: 0,
            subject: '',
            startTime: null,
            accumulatedSeconds: 0 // seconds from previous paused runs
        },

        // Chart instance pointer
        chart: null
    };

    // Preset configurations for Indian competitive exams
    const subjectPresets = {
        upsc: ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Current Affairs'],
        jee: ['Physics', 'Chemistry', 'Mathematics'],
        neet: ['Physics', 'Chemistry', 'Biology']
    };

    // Daily target for streak (30 minutes in seconds)
    const STREAK_DAILY_TARGET_SECONDS = 1800; // 30 minutes

    // -------------------------------------------------------------
    // 2. Notification System (Toasts)
    // -------------------------------------------------------------
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';
        if (type === 'warning') iconName = 'alert-circle';

        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${message}</span>
        `;
        
        elements.toastContainer.appendChild(toast);
        lucide.createIcons();

        // Trigger reflow to start transition
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // -------------------------------------------------------------
    // 3. Navigation & Views Controller
    // -------------------------------------------------------------
    function navigateTo(viewName) {
        // Hide all views
        elements.landingView.classList.add('hidden');
        elements.authView.classList.add('hidden');
        elements.dashboardView.classList.add('hidden');
        elements.reportView.classList.add('hidden');

        // Remove active navigation states
        elements.navDashboardBtn.classList.remove('active');
        elements.navReportsBtn.classList.remove('active');

        // Show target view
        if (viewName === 'landing') {
            elements.landingView.classList.remove('hidden');
        } else if (viewName === 'auth') {
            elements.authView.classList.remove('hidden');
        } else if (viewName === 'dashboard') {
            if (!state.currentUser) return navigateTo('auth');
            elements.dashboardView.classList.remove('hidden');
            elements.navDashboardBtn.classList.add('active');
            renderDashboard();
        } else if (viewName === 'reports') {
            if (!state.currentUser) return navigateTo('auth');
            elements.reportView.classList.remove('hidden');
            elements.navReportsBtn.classList.add('active');
            renderReports();
        }
        
        // Refresh icons
        lucide.createIcons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Bind Navigation Click Handlers
    elements.logoBtn.addEventListener('click', () => {
        if (state.currentUser) {
            navigateTo('dashboard');
        } else {
            navigateTo('landing');
        }
    });

    elements.footerHomeLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(state.currentUser ? 'dashboard' : 'landing');
    });

    elements.headerLoginBtn.addEventListener('click', () => {
        elements.signupCard.classList.add('hidden');
        elements.loginCard.classList.remove('hidden');
        navigateTo('auth');
    });

    elements.headerRegisterBtn.addEventListener('click', () => {
        elements.loginCard.classList.add('hidden');
        elements.signupCard.classList.remove('hidden');
        navigateTo('auth');
    });

    elements.heroCtaBtn.addEventListener('click', () => {
        elements.loginCard.classList.add('hidden');
        elements.signupCard.classList.remove('hidden');
        navigateTo('auth');
    });

    elements.goToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        elements.loginCard.classList.add('hidden');
        elements.signupCard.classList.remove('hidden');
    });

    elements.goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        elements.signupCard.classList.add('hidden');
        elements.loginCard.classList.remove('hidden');
    });

    elements.navDashboardBtn.addEventListener('click', () => navigateTo('dashboard'));
    elements.navReportsBtn.addEventListener('click', () => navigateTo('reports'));

    // -------------------------------------------------------------
    // 4. Authentication Module (Mock Auth + LocalStorage Scope)
    // -------------------------------------------------------------
    function getUsers() {
        const users = localStorage.getItem('studytrack_users');
        return users ? JSON.parse(users) : {};
    }

    function saveUser(email, password) {
        const users = getUsers();
        users[email.toLowerCase()] = {
            password: password, // simple string password for mock environment
            joined: new Date().toISOString()
        };
        localStorage.setItem('studytrack_users', JSON.stringify(users));
    }

    // Load User Data Scoped by Email
    function loadUserData(email) {
        const key = `studytrack_data_${email.toLowerCase()}`;
        const rawData = localStorage.getItem(key);
        if (rawData) {
            const data = JSON.parse(rawData);
            state.subjects = data.subjects || [];
            state.sessions = data.sessions || [];
            state.isPremium = data.isPremium || false;
            state.dailyTarget = data.dailyTarget || 30;
            state.themeChoice = data.themeChoice || 'default';
        } else {
            // Default subjects for new users
            state.subjects = ['General Study'];
            state.sessions = [];
            state.isPremium = false;
            state.dailyTarget = 30;
            state.themeChoice = 'default';
            saveUserData();
        }
    }

    function saveUserData() {
        if (!state.currentUser) return;
        const key = `studytrack_data_${state.currentUser.toLowerCase()}`;
        const dataToSave = {
            subjects: state.subjects,
            sessions: state.sessions,
            isPremium: state.isPremium,
            dailyTarget: state.dailyTarget,
            themeChoice: state.themeChoice
        };
        localStorage.setItem(key, JSON.stringify(dataToSave));
    }

    // Sign Up Logic
    elements.signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = elements.signupEmail.value.trim();
        const password = elements.signupPassword.value;
        const confirmPassword = elements.signupConfirmPassword.value;

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        const users = getUsers();
        if (users[email.toLowerCase()]) {
            showToast('An account with this email already exists.', 'error');
            return;
        }

        saveUser(email, password);
        showToast('Account created successfully!', 'success');
        
        // Log in newly created user
        performLogin(email);
    });

    // Login Logic
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = elements.loginEmail.value.trim();
        const password = elements.loginPassword.value;

        const users = getUsers();
        const user = users[email.toLowerCase()];

        if (!user || user.password !== password) {
            showToast('Invalid email or password.', 'error');
            return;
        }

        showToast('Logged in successfully!', 'success');
        performLogin(email);
    });

    function performLogin(email) {
        state.currentUser = email;
        localStorage.setItem('studytrack_active_user', email);
        
        // Load settings and data
        loadUserData(email);

        // Adjust UI state
        elements.userDisplayEmail.textContent = email;
        elements.loggedOutControls.classList.add('hidden');
        elements.loggedInControls.classList.remove('hidden');
        elements.loggedInNav.classList.remove('hidden');
        
        elements.loginForm.reset();
        elements.signupForm.reset();

        // Update Premium UI states & themes
        updatePremiumUIState();

        // Restore active timer if any saved in localstorage for this user
        restoreTimerState();

        navigateTo('dashboard');
    }

    // Logout Logic
    elements.logoutBtn.addEventListener('click', () => {
        // If timer is running, warn and stop it
        if (state.timer.state === 'running') {
            const leave = confirm('You have a study timer running. Logging out will pause your timer. Proceed?');
            if (!leave) return;
            pauseTimer();
        }

        state.currentUser = null;
        localStorage.removeItem('studytrack_active_user');
        
        // Clean state
        state.subjects = [];
        state.sessions = [];
        state.timer = {
            intervalId: null,
            state: 'idle',
            seconds: 0,
            subject: '',
            startTime: null,
            accumulatedSeconds: 0
        };

        // Reset UI
        elements.loggedOutControls.classList.remove('hidden');
        elements.loggedInControls.classList.add('hidden');
        elements.loggedInNav.classList.add('hidden');
        
        showToast('Logged out successfully.', 'info');
        navigateTo('landing');
    });

    // Auto Login Check
    function checkAutoLogin() {
        const savedUser = localStorage.getItem('studytrack_active_user');
        if (savedUser) {
            const users = getUsers();
            if (users[savedUser.toLowerCase()]) {
                performLogin(savedUser);
            } else {
                localStorage.removeItem('studytrack_active_user');
                navigateTo('landing');
            }
        } else {
            navigateTo('landing');
        }
    }

    // -------------------------------------------------------------
    // 5. Subject Management Module
    // -------------------------------------------------------------
    function renderSubjectDropdown() {
        const select = elements.timerSubjectSelect;
        const currentSelected = select.value;
        
        select.innerHTML = '<option value="" disabled selected>Choose a subject...</option>';
        state.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });

        // Restore selection if it still exists
        if (state.subjects.includes(currentSelected)) {
            select.value = currentSelected;
            elements.timerStartBtn.disabled = false;
        } else {
            elements.timerStartBtn.disabled = true;
        }
    }

    function renderSubjectChips() {
        const container = elements.subjectChips;
        container.innerHTML = '';

        if (state.subjects.length === 0) {
            container.innerHTML = '<p class="empty-chips-text">No subjects added. Add one above or select a preset!</p>';
            return;
        }

        state.subjects.forEach(subject => {
            const chip = document.createElement('div');
            chip.className = 'subject-chip';
            chip.innerHTML = `
                <span>${escapeHTML(subject)}</span>
                <button class="delete-chip-btn" data-subject="${escapeHTML(subject)}" title="Delete Subject">
                    <i data-lucide="x"></i>
                </button>
            `;
            container.appendChild(chip);
        });

        // Add Delete Click events
        container.querySelectorAll('.delete-chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subToDelete = e.currentTarget.getAttribute('data-subject');
                deleteSubject(subToDelete);
            });
        });

        lucide.createIcons();
    }

    function deleteSubject(subjectName) {
        // If timer is running on this subject, block deletion
        if ((state.timer.state === 'running' || state.timer.state === 'paused') && state.timer.subject === subjectName) {
            showToast(`Cannot delete "${subjectName}" while a timer is active on it.`, 'warning');
            return;
        }

        const confirmDelete = confirm(`Are you sure you want to delete "${subjectName}"? This will remove it from your subjects list (study logs remain in reports).`);
        if (!confirmDelete) return;

        state.subjects = state.subjects.filter(s => s !== subjectName);
        saveUserData();
        showToast(`Deleted subject: ${subjectName}`, 'info');
        
        renderSubjectDropdown();
        renderSubjectChips();
        renderTodayProgress();
    }

    // Add new subject via form
    elements.addSubjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSub = elements.newSubjectInput.value.trim();
        if (!newSub) return;

        // Check duplicates (case-insensitive)
        const exists = state.subjects.some(s => s.toLowerCase() === newSub.toLowerCase());
        if (exists) {
            showToast('Subject already exists.', 'warning');
            return;
        }

        state.subjects.push(newSub);
        saveUserData();
        showToast(`Added subject: ${newSub}`, 'success');

        elements.newSubjectInput.value = '';
        renderSubjectDropdown();
        renderSubjectChips();
    });

    // Preset button clicks
    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const presetType = e.currentTarget.getAttribute('data-preset');
            const subjectsToAdd = subjectPresets[presetType];
            
            if (!subjectsToAdd) return;

            let addedCount = 0;
            subjectsToAdd.forEach(sub => {
                const exists = state.subjects.some(s => s.toLowerCase() === sub.toLowerCase());
                if (!exists) {
                    state.subjects.push(sub);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                saveUserData();
                showToast(`Added ${addedCount} ${presetType.toUpperCase()} preset subjects!`, 'success');
                renderSubjectDropdown();
                renderSubjectChips();
            } else {
                showToast('All preset subjects already exist in your list.', 'info');
            }
        });
    });

    // Dropdown enables/disables start button
    elements.timerSubjectSelect.addEventListener('change', () => {
        elements.timerStartBtn.disabled = !elements.timerSubjectSelect.value;
    });

    // -------------------------------------------------------------
    // 6. Timer Engine (Real-Time + State Recovery)
    // -------------------------------------------------------------
    function updateTimerUI() {
        const hrs = Math.floor(state.timer.seconds / 3600);
        const mins = Math.floor((state.timer.seconds % 3600) / 60);
        const secs = state.timer.seconds % 60;
        
        elements.timerDigits.textContent = `${padZero(hrs)}:${padZero(mins)}:${padZero(secs)}`;
    }

    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    function startTimer() {
        if (state.timer.state === 'running') return;
        
        const selectedSubject = elements.timerSubjectSelect.value;
        if (!selectedSubject) {
            showToast('Please select a subject to study.', 'warning');
            return;
        }

        state.timer.state = 'running';
        state.timer.subject = selectedSubject;
        state.timer.startTime = Date.now();
        
        // UI State Adjustment
        elements.timerActiveBadge.className = 'timer-badge active';
        elements.timerActiveBadge.textContent = 'Studying';
        elements.timerSubjectDisplay.textContent = selectedSubject;
        elements.timerCard.classList.add('active-state');
        elements.timerSubjectSelect.disabled = true;

        elements.timerStartBtn.classList.add('hidden');
        elements.timerPauseBtn.classList.remove('hidden');
        elements.timerStopBtn.classList.remove('hidden');

        saveTimerStateToStorage();

        // Run interval
        state.timer.intervalId = setInterval(() => {
            // Calculate elapsed time precisely to avoid drifting timers
            const elapsed = Math.floor((Date.now() - state.timer.startTime) / 1000);
            state.timer.seconds = state.timer.accumulatedSeconds + elapsed;
            updateTimerUI();
            
            // Periodically save state to local storage in case of crashes
            if (state.timer.seconds % 10 === 0) {
                saveTimerStateToStorage();
            }
        }, 1000);

        showToast(`Timer started for ${selectedSubject}`, 'success');
    }

    function pauseTimer() {
        if (state.timer.state !== 'running') return;

        state.timer.state = 'paused';
        clearInterval(state.timer.intervalId);
        
        // Calculate accrued seconds
        const elapsed = Math.floor((Date.now() - state.timer.startTime) / 1000);
        state.timer.accumulatedSeconds += elapsed;
        state.timer.seconds = state.timer.accumulatedSeconds;

        // UI Adjustments
        elements.timerActiveBadge.className = 'timer-badge paused';
        elements.timerActiveBadge.textContent = 'Paused';
        elements.timerCard.classList.remove('active-state');
        
        elements.timerPauseBtn.classList.add('hidden');
        elements.timerStartBtn.classList.remove('hidden');
        elements.timerStartBtn.innerHTML = '<i data-lucide="play"></i> Resume Study';
        lucide.createIcons();

        saveTimerStateToStorage();
        showToast('Study timer paused.', 'info');
    }

    function stopTimerAndSave() {
        if (state.timer.state === 'idle') return;

        // Clear interval
        clearInterval(state.timer.intervalId);

        // Add last ticking seconds if running
        if (state.timer.state === 'running') {
            const elapsed = Math.floor((Date.now() - state.timer.startTime) / 1000);
            state.timer.accumulatedSeconds += elapsed;
        }

        const totalSeconds = state.timer.accumulatedSeconds;
        const subject = state.timer.subject;

        if (totalSeconds >= 5) { // Log sessions longer than 5 seconds to avoid garbage entries
            const now = new Date();
            const session = {
                id: 'sess_' + Date.now(),
                subject: subject,
                startTime: Date.now() - (totalSeconds * 1000),
                endTime: Date.now(),
                duration: totalSeconds,
                date: now.toLocaleDateString('en-CA') // YYYY-MM-DD local format
            };

            state.sessions.push(session);
            saveUserData();
            
            const minutes = Math.floor(totalSeconds / 60);
            const secondsText = totalSeconds % 60;
            const durationFormatted = minutes > 0 ? `${minutes}m ${secondsText}s` : `${secondsText}s`;
            showToast(`Session saved! Studied ${subject} for ${durationFormatted}.`, 'success');
        } else {
            showToast('Session too short to save (must study at least 5 seconds).', 'warning');
        }

        // Reset timer variables
        state.timer.state = 'idle';
        state.timer.seconds = 0;
        state.timer.accumulatedSeconds = 0;
        state.timer.subject = '';
        state.timer.startTime = null;
        state.timer.intervalId = null;

        // Clear timer storage
        localStorage.removeItem(`studytrack_timer_${state.currentUser}`);

        // Reset Timer UI
        elements.timerActiveBadge.className = 'timer-badge inactive';
        elements.timerActiveBadge.textContent = 'Idle';
        elements.timerDigits.textContent = '00:00:00';
        elements.timerSubjectDisplay.textContent = 'No Subject Selected';
        elements.timerCard.classList.remove('active-state');
        elements.timerSubjectSelect.disabled = false;
        
        elements.timerStartBtn.classList.remove('hidden');
        elements.timerStartBtn.innerHTML = '<i data-lucide="play"></i> Start Studying';
        elements.timerPauseBtn.classList.add('hidden');
        elements.timerStopBtn.classList.add('hidden');
        
        renderSubjectDropdown();
        renderTodayProgress();
        renderStreakWidget();
    }

    // Persistent Timer state management
    function saveTimerStateToStorage() {
        if (!state.currentUser) return;
        const timerData = {
            state: state.timer.state,
            subject: state.timer.subject,
            accumulatedSeconds: state.timer.accumulatedSeconds,
            startTime: state.timer.startTime,
            lastSavedTime: Date.now()
        };
        localStorage.setItem(`studytrack_timer_${state.currentUser}`, JSON.stringify(timerData));
    }

    function restoreTimerState() {
        if (!state.currentUser) return;
        const key = `studytrack_timer_${state.currentUser}`;
        const rawTimer = localStorage.getItem(key);
        if (!rawTimer) return;

        const timerData = JSON.parse(rawTimer);
        
        if (timerData.state === 'running') {
            // Recompute dynamic values based on elapsed time since the browser tab closed/reloaded
            const elapsedSinceSave = Math.floor((Date.now() - timerData.startTime) / 1000);
            state.timer.accumulatedSeconds = timerData.accumulatedSeconds;
            state.timer.seconds = timerData.accumulatedSeconds + elapsedSinceSave;
            state.timer.subject = timerData.subject;
            state.timer.state = 'running';
            state.timer.startTime = timerData.startTime;

            elements.timerSubjectSelect.value = timerData.subject;
            elements.timerSubjectSelect.disabled = true;
            elements.timerActiveBadge.className = 'timer-badge active';
            elements.timerActiveBadge.textContent = 'Studying';
            elements.timerSubjectDisplay.textContent = timerData.subject;
            elements.timerCard.classList.add('active-state');

            elements.timerStartBtn.classList.add('hidden');
            elements.timerPauseBtn.classList.remove('hidden');
            elements.timerStopBtn.classList.remove('hidden');

            updateTimerUI();

            state.timer.intervalId = setInterval(() => {
                const elapsed = Math.floor((Date.now() - state.timer.startTime) / 1000);
                state.timer.seconds = state.timer.accumulatedSeconds + elapsed;
                updateTimerUI();
            }, 1000);

            showToast('Resumed active study session.', 'info');
        } else if (timerData.state === 'paused') {
            state.timer.accumulatedSeconds = timerData.accumulatedSeconds;
            state.timer.seconds = timerData.accumulatedSeconds;
            state.timer.subject = timerData.subject;
            state.timer.state = 'paused';

            elements.timerSubjectSelect.value = timerData.subject;
            elements.timerSubjectSelect.disabled = true;
            elements.timerActiveBadge.className = 'timer-badge paused';
            elements.timerActiveBadge.textContent = 'Paused';
            elements.timerSubjectDisplay.textContent = timerData.subject;

            elements.timerStartBtn.classList.remove('hidden');
            elements.timerStartBtn.innerHTML = '<i data-lucide="play"></i> Resume Study';
            elements.timerPauseBtn.classList.add('hidden');
            elements.timerStopBtn.classList.remove('hidden');

            updateTimerUI();
            showToast('Restored paused study session.', 'info');
        }
    }

    elements.timerStartBtn.addEventListener('click', startTimer);
    elements.timerPauseBtn.addEventListener('click', pauseTimer);
    elements.timerStopBtn.addEventListener('click', stopTimerAndSave);

    // -------------------------------------------------------------
    // 7. Streak Engine
    // -------------------------------------------------------------
    function calculateStreak() {
        if (!state.currentUser || state.sessions.length === 0) {
            return { streak: 0, todaySeconds: 0, progressPct: 0 };
        }

        // Use custom daily target (default to 30 mins)
        const dailyTargetSeconds = (state.dailyTarget || 30) * 60;

        // 1. Group sessions by local date (YYYY-MM-DD)
        const dailyTotals = {};
        state.sessions.forEach(sess => {
            const dateStr = sess.date; // YYYY-MM-DD format
            dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + sess.duration;
        });

        // Get local YYYY-MM-DD for today and yesterday
        const todayStr = new Date().toLocaleDateString('en-CA');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        const todaySeconds = dailyTotals[todayStr] || 0;
        const yesterdaySeconds = dailyTotals[yesterdayStr] || 0;

        // Check if streak is alive
        let streak = 0;
        const isTodayActive = todaySeconds >= dailyTargetSeconds;
        const isYesterdayActive = yesterdaySeconds >= dailyTargetSeconds;

        if (!isTodayActive && !isYesterdayActive) {
            streak = 0;
        } else {
            // Choose our starting date point
            let currentDate = isTodayActive ? new Date() : yesterday;
            
            while (true) {
                const dateKey = currentDate.toLocaleDateString('en-CA');
                const daySeconds = dailyTotals[dateKey] || 0;
                
                if (daySeconds >= dailyTargetSeconds) {
                    streak++;
                    // Look back 1 day
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        const progressPct = Math.min(100, (todaySeconds / dailyTargetSeconds) * 100);

        return {
            streak: streak,
            todaySeconds: todaySeconds,
            progressPct: progressPct
        };
    }

    function renderStreakWidget() {
        const stats = calculateStreak();
        const dailyTargetSeconds = (state.dailyTarget || 30) * 60;
        
        // Update header streak indicators
        elements.headerStreakCount.textContent = stats.streak;
        elements.dashboardStreakCount.textContent = stats.streak;
        
        // Update progress bar
        elements.streakTodayProgress.style.width = `${stats.progressPct}%`;

        // Update progress text
        const targetMins = state.dailyTarget || 30;
        const todayMins = Math.floor(stats.todaySeconds / 60);
        const remainingSeconds = dailyTargetSeconds - stats.todaySeconds;
        const remainingMins = Math.ceil(remainingSeconds / 60);

        if (stats.todaySeconds >= dailyTargetSeconds) {
            elements.streakTodayProgress.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            elements.streakProgressText.innerHTML = `<span style="color: var(--success); font-weight: 700;"><i data-lucide="check" style="width: 12px; height: 12px; display: inline-block;"></i> Daily Target Completed!</span> Keep studying to push your score!`;
        } else {
            elements.streakTodayProgress.style.background = 'linear-gradient(90deg, var(--accent) 0%, #ff7a00 100%)';
            elements.streakProgressText.innerHTML = `Study for <strong>${remainingMins} more mins</strong> today to secure your streak! (${todayMins}/${targetMins} mins studied)`;
        }
        lucide.createIcons();
    }

    // -------------------------------------------------------------
    // 8. Dashboard Renderer (Today's Progress List)
    // -------------------------------------------------------------
    function renderTodayProgress() {
        const todayStr = new Date().toLocaleDateString('en-CA');
        
        // Sum durations by subject for today
        const subjectTodaySeconds = {};
        let totalTodaySeconds = 0;

        state.sessions.forEach(sess => {
            if (sess.date === todayStr) {
                subjectTodaySeconds[sess.subject] = (subjectTodaySeconds[sess.subject] || 0) + sess.duration;
                totalTodaySeconds += sess.duration;
            }
        });

        // Set total hours studied today
        const totHrs = Math.floor(totalTodaySeconds / 3600);
        const totMins = Math.floor((totalTodaySeconds % 3600) / 60);
        elements.todayTotalStudyTime.textContent = `${totHrs}h ${totMins}m studied today`;

        // Render rows
        const container = elements.todayProgressList;
        container.innerHTML = '';

        if (state.subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="book" class="empty-icon"></i>
                    <p>Add subjects in the "My Subjects" panel to start tracking today's progress.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Order subjects: display active subjects, showing logged study durations first
        const sortedSubjects = [...state.subjects].sort((a, b) => {
            const timeA = subjectTodaySeconds[a] || 0;
            const timeB = subjectTodaySeconds[b] || 0;
            return timeB - timeA;
        });

        sortedSubjects.forEach((subject, idx) => {
            const seconds = subjectTodaySeconds[subject] || 0;
            const hours = (seconds / 3600).toFixed(1);
            
            // Daily subject target (e.g. 2 hours target per subject for standard bar UI visualization)
            const targetSeconds = 7200; // 2 hours
            const pct = Math.min(100, (seconds / targetSeconds) * 100);

            // Give different colors to different subjects dynamically using HSL
            const hue = (idx * 137.5) % 360; // Golden ratio color distribution
            const subjectColor = `hsl(${hue}, 70%, 55%)`;

            const row = document.createElement('div');
            row.className = 'subject-progress-row';
            row.innerHTML = `
                <div class="progress-row-header">
                    <span class="progress-subject-name">${escapeHTML(subject)}</span>
                    <span class="progress-time-value">${hours} hrs studied</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${subjectColor}; box-shadow: 0 0 10px rgba(${hue}, 0.25);"></div>
                </div>
            `;
            container.appendChild(row);
        });

        if (totalTodaySeconds === 0) {
            const welcomeText = document.createElement('div');
            welcomeText.className = 'empty-state';
            welcomeText.innerHTML = `
                <i data-lucide="sparkles" class="empty-icon" style="color: var(--primary);"></i>
                <p>Start a timer above to log study hours for today!</p>
            `;
            container.appendChild(welcomeText);
        }
        
        lucide.createIcons();
    }

    function renderDashboard() {
        elements.greetingUsername.textContent = state.currentUser ? state.currentUser.split('@')[0] : 'Aspirant';
        renderSubjectDropdown();
        renderSubjectChips();
        renderTodayProgress();
        renderStreakWidget();
    }

    // -------------------------------------------------------------
    // 9. Analytics Page (Chart.js Renderer)
    // -------------------------------------------------------------
    function renderReports() {
        if (!state.currentUser) return;

        // Get past 7 calendar dates (YYYY-MM-DD local format)
        const dates = [];
        const labelStrings = [];
        const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            dates.push(dateStr);
            
            // Format labels like "Mon (27 Jun)"
            const dayName = weekdayNames[d.getDay()];
            const monthName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labelStrings.push(`${dayName} (${monthName})`);
        }

        // Calculate metrics
        let totalSeconds7Days = 0;
        const subjectTotals = {};
        
        // Group study logs in last 7 days by subject and date
        const subjectDurationByDate = {}; // { subject: { date: seconds } }
        
        state.sessions.forEach(sess => {
            const sessDate = sess.date;
            
            // Is it within the last 7 days dates?
            if (dates.includes(sessDate)) {
                totalSeconds7Days += sess.duration;
                subjectTotals[sess.subject] = (subjectTotals[sess.subject] || 0) + sess.duration;
                
                if (!subjectDurationByDate[sess.subject]) {
                    subjectDurationByDate[sess.subject] = {};
                }
                subjectDurationByDate[sess.subject][sessDate] = (subjectDurationByDate[sess.subject][sessDate] || 0) + sess.duration;
            }
        });

        // 1. Total Time
        const totalHours = (totalSeconds7Days / 3600).toFixed(1);
        elements.statsTotalTime.textContent = `${totalHours} hours`;

        // 2. Daily Average
        const dailyAverageHours = (totalHours / 7).toFixed(1);
        elements.statsDailyAverage.textContent = `${dailyAverageHours} hours`;

        // 3. Most Focused Subject
        let topSubject = 'None';
        let topDurationSeconds = 0;
        
        for (const [sub, duration] of Object.entries(subjectTotals)) {
            if (duration > topDurationSeconds) {
                topDurationSeconds = duration;
                topSubject = sub;
            }
        }

        if (topSubject !== 'None') {
            elements.statsTopSubject.textContent = topSubject;
            elements.statsTopSubjectDuration.textContent = `${(topDurationSeconds / 3600).toFixed(1)} hours logged in past 7 days.`;
        } else {
            elements.statsTopSubject.textContent = 'No Sessions Yet';
            elements.statsTopSubjectDuration.textContent = 'Get studying to see metrics!';
        }

        // 4. Construct Chart.js Datasets
        // We find all unique subjects tracked in these 7 days
        const subjectsIn7Days = Object.keys(subjectDurationByDate);
        
        const datasets = subjectsIn7Days.map((sub, idx) => {
            const hue = (idx * 137.5) % 360; // Golden ratio distribution
            const bgColor = `hsla(${hue}, 70%, 55%, 0.7)`;
            const borderColor = `hsl(${hue}, 70%, 50%)`;

            // Data array contains hours studied on each of the 7 dates
            const dataHours = dates.map(dateKey => {
                const sec = (subjectDurationByDate[sub] && subjectDurationByDate[sub][dateKey]) || 0;
                return parseFloat((sec / 3600).toFixed(2)); // return in hours
            });

            return {
                label: sub,
                data: dataHours,
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
                borderRadius: 4,
                stack: 'stackedGroup' // Stacked bar chart
            };
        });

        // Render Chart.js
        if (state.chart) {
            state.chart.destroy();
        }

        const ctx = elements.weeklyStudyChart.getContext('2d');
        
        // Define clean visual grid styling for Chart
        Chart.defaults.color = '#71717a';
        Chart.defaults.font.family = 'Inter';

        state.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelStrings,
                datasets: datasets.length > 0 ? datasets : [{
                    label: 'No Study Data',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#fafafa',
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        padding: 12,
                        backgroundColor: '#18181b',
                        titleColor: '#fafafa',
                        bodyColor: '#a1a1aa',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.raw !== undefined) {
                                    const decimalHours = context.raw;
                                    const minsTotal = Math.round(decimalHours * 60);
                                    const hrs = Math.floor(minsTotal / 60);
                                    const mins = minsTotal % 60;
                                    label += hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#a1a1aa'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.04)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#a1a1aa',
                            callback: function(value) {
                                return value + ' hrs';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Study Hours',
                            color: '#71717a',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------
    // 10. Utilities & Demo Data Generator
    // -------------------------------------------------------------
    
    // Generate 7-Day Demo Data
    elements.btnDemoData.addEventListener('click', () => {
        if (!state.currentUser) return;
        
        const confirmDemo = confirm('Would you like to populate the last 7 days with realistic study sessions to test the weekly reports and streak tracking? This will add sessions for JEE/NEET/UPSC standard subjects.');
        if (!confirmDemo) return;

        // Reset subjects to a test template if they are empty
        if (state.subjects.length <= 1) {
            state.subjects = ['Physics', 'Chemistry', 'Mathematics', 'Revision'];
        }

        const subjects = state.subjects;
        const newSessions = [];
        
        // Loop back 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');

            // We make sure the user studies on at least 5 out of 7 days to trigger a nice streak
            // On study days, we study between 1 to 4 sessions, each 20 mins to 2 hours
            const studyToday = i !== 2 && i !== 5; // Study on 5 days, skip 2 days to test streak breaking

            if (studyToday) {
                // Ensure at least one day has >30 mins (1800s) to keep a streak going on consecutive study days
                // Let's randomize number of sessions today
                const sessionCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 sessions
                
                for (let s = 0; s < sessionCount; s++) {
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];
                    
                    // Session duration between 1200 seconds (20 mins) and 5400 seconds (1.5 hours)
                    // If we have only 1 session, make it longer to clear the 30-min target easily
                    const duration = sessionCount === 1 
                        ? Math.floor(Math.random() * 2400) + 1900 // 1900s to 4300s (31m to 71m)
                        : Math.floor(Math.random() * 3600) + 900;  // 900s to 4500s (15m to 75m)

                    const sessionStart = d.getTime() - (duration * 1000) - (s * 4000000);
                    newSessions.push({
                        id: 'sess_demo_' + Date.now() + '_' + i + '_' + s,
                        subject: subject,
                        startTime: sessionStart,
                        endTime: sessionStart + (duration * 1000),
                        duration: duration,
                        date: dateStr
                    });
                }
            }
        }

        // Add to state and save
        state.sessions = [...state.sessions, ...newSessions];
        saveUserData();
        showToast('Demo data loaded successfully! 7-day reports and streak updated.', 'success');
        
        // Refresh active views
        if (!elements.dashboardView.classList.contains('hidden')) {
            renderDashboard();
        } else if (!elements.reportView.classList.contains('hidden')) {
            renderReports();
        }
    });

    // Data Export
    elements.btnExportData.addEventListener('click', () => {
        if (!state.currentUser) return;
        const backupData = {
            exporter: 'StudyTrack',
            user: state.currentUser,
            exportedAt: new Date().toISOString(),
            subjects: state.subjects,
            sessions: state.sessions
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `studytrack_backup_${state.currentUser.split('@')[0]}_${new Date().toLocaleDateString('en-CA')}.json`;
        document.body.appendChild(a);
        a.click();
        
        // cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Backup JSON exported successfully.', 'success');
    });

    // Data Import trigger
    elements.btnImportData.addEventListener('click', () => {
        elements.importFileInput.click();
    });

    elements.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (parsed.exporter !== 'StudyTrack' || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.sessions)) {
                    throw new Error('Invalid StudyTrack backup file format.');
                }

                const merge = confirm(`Found backup for user ${parsed.user} containing ${parsed.subjects.length} subjects and ${parsed.sessions.length} sessions. Would you like to MERGE it with your current data? (Click Cancel to OVERWRITE).`);
                
                if (merge) {
                    // Merge subjects uniquely
                    const mergedSubjects = [...state.subjects];
                    parsed.subjects.forEach(sub => {
                        if (!mergedSubjects.includes(sub)) mergedSubjects.push(sub);
                    });
                    
                    // Merge sessions avoiding ID duplicates
                    const existingIds = state.sessions.map(s => s.id);
                    const mergedSessions = [...state.sessions];
                    parsed.sessions.forEach(sess => {
                        if (!existingIds.includes(sess.id)) mergedSessions.push(sess);
                    });

                    state.subjects = mergedSubjects;
                    state.sessions = mergedSessions;
                } else {
                    const overwrite = confirm('Are you sure you want to OVERWRITE your current study logs? This action is irreversible.');
                    if (!overwrite) {
                        elements.importFileInput.value = '';
                        return;
                    }
                    state.subjects = parsed.subjects;
                    state.sessions = parsed.sessions;
                }

                saveUserData();
                showToast('Backup restored successfully!', 'success');
                
                // Refresh dashboard or reports
                if (!elements.dashboardView.classList.contains('hidden')) {
                    renderDashboard();
                } else if (!elements.reportView.classList.contains('hidden')) {
                    renderReports();
                }
            } catch (err) {
                showToast(`Restore failed: ${err.message}`, 'error');
            }
            elements.importFileInput.value = ''; // clear input
        };
        reader.readAsText(file);
    });

    // Helper: Escape HTML
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // =============================================================
    // Premium Features Logic & Event Listeners
    // =============================================================

    function applyTheme(themeName) {
        document.body.classList.remove('theme-ocean', 'theme-forest');
        if (themeName === 'ocean') {
            document.body.classList.add('theme-ocean');
        } else if (themeName === 'forest') {
            document.body.classList.add('theme-forest');
        }
    }

    function updatePremiumUIState() {
        if (!state.currentUser) return;
        
        if (state.isPremium) {
            elements.premiumUpgradeCard.classList.add('hidden');
            elements.headerPremiumBadge.classList.remove('hidden');
            
            elements.premiumTargetContainer.classList.remove('locked');
            elements.customTargetInput.disabled = false;
            elements.customTargetInput.value = state.dailyTarget || 30;
            
            elements.themeCustomizerCard.classList.remove('locked');
            elements.themeCustomizerCard.querySelectorAll('.theme-btn').forEach(btn => {
                btn.disabled = false;
                btn.classList.toggle('active', btn.getAttribute('data-theme') === state.themeChoice);
            });
            
            elements.btnExportReport.classList.remove('locked');
            elements.btnExportReport.disabled = false;
            elements.btnExportReport.title = "Export Report as Text file";
            
            applyTheme(state.themeChoice);
        } else {
            elements.premiumUpgradeCard.classList.remove('hidden');
            elements.headerPremiumBadge.classList.add('hidden');
            
            elements.premiumTargetContainer.classList.add('locked');
            elements.customTargetInput.disabled = true;
            elements.customTargetInput.value = 30;
            
            elements.themeCustomizerCard.classList.add('locked');
            elements.themeCustomizerCard.querySelectorAll('.theme-btn').forEach(btn => {
                btn.disabled = true;
                btn.classList.toggle('active', btn.getAttribute('data-theme') === 'default');
            });
            
            elements.btnExportReport.classList.add('locked');
            elements.btnExportReport.disabled = true;
            elements.btnExportReport.title = "Unlock with StudyTrack Premium";
            
            applyTheme('default');
        }
    }

    // Complete Premium Upgrade Function
    function completePremiumUpgrade(paymentId) {
        state.isPremium = true;
        state.dailyTarget = state.dailyTarget || 30;
        state.themeChoice = state.themeChoice || 'default';
        saveUserData();
        
        updatePremiumUIState();
        renderDashboard();
        
        showToast('Payment Successful! Welcome to StudyTrack Premium.', 'success');
    }

    // Razorpay Integration
    elements.upgradePremiumBtn.addEventListener('click', () => {
        if (!state.currentUser) {
            showToast('Please log in to upgrade.', 'error');
            return;
        }

        const options = {
            key: 'rzp_test_T6gdBjxQdru3lH', // Razorpay Test Key ID
            amount: 9900, // ₹99 in paise
            currency: 'INR',
            name: 'StudyTrack Premium',
            description: 'Unlock advanced customization & daily targets',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
            handler: function (response) {
                completePremiumUpgrade(response.razorpay_payment_id);
            },
            prefill: {
                name: state.currentUser.split('@')[0],
                email: state.currentUser
            },
            notes: {
                purpose: 'StudyTrack Lifetime Premium Upgrade'
            },
            theme: {
                color: '#6366f1' // Indigo
            }
        };

        if (typeof window.Razorpay !== 'undefined') {
            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            // Offline/Network Error Fallback: Simulate sandbox payment for local test review
            showToast('Razorpay SDK offline. Loading Sandbox Simulator...', 'warning');
            setTimeout(() => {
                const simulateSuccess = confirm('Razorpay SDK could not be fetched from checkout.razorpay.com.\n\nWould you like to simulate a successful Razorpay sandbox payment of ₹99 to test the Premium flow?');
                if (simulateSuccess) {
                    const mockPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 11);
                    completePremiumUpgrade(mockPaymentId);
                } else {
                    showToast('Upgrade payment cancelled.', 'info');
                }
            }, 500);
        }
    });

    // Custom Target Change Listener
    elements.customTargetInput.addEventListener('change', (e) => {
        if (!state.isPremium) return;
        const targetVal = parseInt(e.target.value);
        if (isNaN(targetVal)) return;

        state.dailyTarget = targetVal;
        saveUserData();
        showToast(`Daily target set to ${targetVal} minutes.`, 'success');
        
        renderDashboard();
    });

    // Theme Switcher Listeners
    elements.themeCustomizerCard.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!state.isPremium) return;
            const targetTheme = e.currentTarget.getAttribute('data-theme');
            
            state.themeChoice = targetTheme;
            saveUserData();
            
            applyTheme(targetTheme);
            updatePremiumUIState();
            
            showToast(`Theme changed to ${e.currentTarget.querySelector('.theme-name').textContent}!`, 'success');
        });
    });

    // Export Weekly Report (Premium Only)
    elements.btnExportReport.addEventListener('click', () => {
        if (!state.isPremium) {
            showToast('Upgrade to Premium to export reports.', 'warning');
            return;
        }

        // Collect past 7 days logs
        const dates = [];
        const labelStrings = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toLocaleDateString('en-CA'));
            labelStrings.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        }

        const studyLog = {};
        let grandTotalSec = 0;

        state.sessions.forEach(sess => {
            if (dates.includes(sess.date)) {
                grandTotalSec += sess.duration;
                if (!studyLog[sess.subject]) {
                    studyLog[sess.subject] = {};
                }
                studyLog[sess.subject][sess.date] = (studyLog[sess.subject][sess.date] || 0) + sess.duration;
            }
        });

        // Construct formatted text report content
        let content = `========================================================\n`;
        content += `          STUDYTRACK PREMIUM PREPARATION REPORT          \n`;
        content += `========================================================\n\n`;
        content += `User Email: ${state.currentUser}\n`;
        content += `Generated On: ${new Date().toLocaleString()}\n`;
        content += `Reporting Period: Last 7 Days (${labelStrings[0]} to ${labelStrings[6]})\n`;
        content += `Daily Target Goal: ${state.dailyTarget} mins/day\n\n`;
        content += `-------------------- PERFORMANCE OVERVIEW --------------------\n`;
        content += `Total Prep Time: ${(grandTotalSec / 3600).toFixed(2)} hours\n`;
        content += `Daily Average Study: ${(grandTotalSec / (7 * 3600)).toFixed(2)} hours\n`;
        content += `Current Active Streak: ${calculateStreak().streak} days\n\n`;
        content += `-------------------- DAILY PREP MATRIX (Hours) ---------------\n\n`;

        // Row of headers
        content += `Subject`.padEnd(20) + dates.map((d, idx) => labelStrings[idx].split(',')[0].padEnd(10)).join('') + `Total\n`;
        content += `-`.repeat(100) + `\n`;

        Object.keys(studyLog).forEach(sub => {
            let rowStr = sub.padEnd(20);
            let subTotalSec = 0;
            dates.forEach(d => {
                const sec = studyLog[sub][d] || 0;
                subTotalSec += sec;
                const hrs = (sec / 3600).toFixed(2);
                rowStr += hrs.padEnd(10);
            });
            rowStr += `${(subTotalSec / 3600).toFixed(2)}\n`;
            content += rowStr;
        });

        content += `-`.repeat(100) + `\n`;
        content += `Total Hours`.padEnd(20);
        
        let totalByDaySec = dates.map(d => {
            let sum = 0;
            Object.keys(studyLog).forEach(sub => {
                sum += (studyLog[sub][d] || 0);
            });
            return sum;
        });

        content += totalByDaySec.map(sec => (sec / 3600).toFixed(2).padEnd(10)).join('');
        content += `${(grandTotalSec / 3600).toFixed(2)}\n\n`;

        content += `========================================================\n`;
        content += `Keep up the consistency! You've got this.\n`;
        content += `========================================================\n`;

        // Download link
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studytrack_premium_report_${state.currentUser.split('@')[0]}_${new Date().toLocaleDateString('en-CA')}.txt`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Study report downloaded successfully!', 'success');
    });

    // -------------------------------------------------------------
    // 11. Initial Entry Point Checks
    // -------------------------------------------------------------
    checkAutoLogin();
});
