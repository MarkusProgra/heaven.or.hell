// ============================================
// HEAVEN OR HELL - Main Application
// ============================================

(function() {
    'use strict';

    // ===== STATE =====
    let currentUser = null;
    let userData = null;
    let isProcessing = false;

    // Three.js staircase state
    let staircaseScene = null;
    let staircaseCamera = null;
    let staircaseRenderer = null;
    let staircaseGroup = null;
    let currentSoulPosition = 0;
    let lastPositiveDirection = null; // 'up' or 'down'

    // ===== DOM ELEMENTS =====
    const screens = {
        loading: document.getElementById('loading-screen'),
        login: document.getElementById('login-screen'),
        app: document.getElementById('app-screen')
    };

    const elements = {
        // Login
        bypassBtn: document.getElementById('bypass-btn'),
        googleLoginBtn: document.getElementById('google-login'),
        adminLoginBtn: document.getElementById('admin-login'),

        // Header
        userAvatar: document.getElementById('user-avatar'),
        userName: document.getElementById('user-name'),
        logoutBtn: document.getElementById('logout-btn'),

        // Staircase
        staircaseViewport: document.getElementById('staircase-viewport'),
        positionValue: document.getElementById('position-value'),
        lifespanDisplay: document.getElementById('lifespan-display'),
        daysUsed: document.getElementById('days-used'),
        daysLeft: document.getElementById('days-left'),

        // AI
        confessionInput: document.getElementById('confession-input'),
        submitBtn: document.getElementById('submit-btn'),
        analysisResult: document.getElementById('analysis-result'),
        resultContent: document.getElementById('result-content'),
        resultMovement: document.getElementById('result-movement'),

        // History
        historyList: document.getElementById('history-list'),
        clearHistoryBtn: document.getElementById('clear-history-btn')
    };

    // ===== INITIALIZATION =====
    async function init() {
        console.log('[SYSTEM] Initializing Heaven or Hell...');

        // Show loading screen
        showScreen('loading');

        // Wait for Firebase to be ready
        await waitForFirebase();

        // Set up auth state listener
        setupAuthListener();

        // Check if user is already logged in
        const user = firebase.auth().currentUser;
        if (user) {
            await handleLogin(user);
        } else {
            showScreen('login');
        }

        // Keep loading screen visible for bypass button when Firebase is not configured
        // Only auto-hide if Firebase is properly initialized
        const checkAndHide = () => {
            if (firebase.apps.length > 0 && firebase.auth().currentUser) {
                screens.loading.classList.remove('active');
            }
            // Don't auto-hide if no Firebase - let user click bypass button
        };

        // Check after 3 seconds if Firebase loaded with a user
        setTimeout(checkAndHide, 3000);

        // Create scanlines effect
        createScanlines();

        console.log('[SYSTEM] Initialization complete');
    }

    function waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = setInterval(() => {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkFirebase);
                console.warn('[SYSTEM] Firebase may not be configured correctly');
                resolve();
            }, 5000);
        });
    }

    function setupAuthListener() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                await handleLogin(user);
            } else {
                await handleLogout();
            }
        });
    }

    // ===== SCREEN MANAGEMENT =====
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenName].classList.add('active');
    }

    // ===== AUTHENTICATION =====
    async function handleLogin(user) {
        currentUser = user;
        console.log('[AUTH] User logged in:', user.email);

        // Update UI
        updateUserInfo(user);

        // Load or create user data
        await loadUserData();

        // Show app screen
        showScreen('app');

        // Initialize 3D staircase after a short delay to ensure DOM is laid out
        setTimeout(() => {
            initStaircase();
            updatePathVisualization();
        }, 100);

        // Load history
        loadHistory();
    }

    // ===== BYPASS AUTH (TEST MODE) =====
    function bypassAuth() {
        console.log('[TEST_MODE] Auth bypassed - running without authentication');
        currentUser = {
            uid: 'test-user-' + Date.now(),
            email: 'test@local.dev',
            displayName: 'TestUser'
        };

        // Initialize test user data
        userData = {
            position: APP_CONFIG.startPosition,
            daysUsed: 0,
            history: []
        };

        // Update UI with test user info
        elements.userName.textContent = 'TEST_USER';
        elements.userAvatar.textContent = 'T';

        // Show app screen
        showScreen('app');

        // Initialize 3D staircase after a short delay to ensure DOM is laid out
        setTimeout(() => {
            initStaircase();
            updatePathVisualization();
        }, 100);

        // Show test mode indicator
        console.log('[TEST_MODE] You are now in test mode. Data will not persist.');
        alert('[TEST_MODE] Authentication bypassed.\n\nData will not persist between sessions.\nConfigure Firebase for full functionality.');
    }

    // ===== ADMIN ACCESS =====
    function adminAccess() {
        const password = prompt('[ADMIN_ACCESS] Enter admin password:');

        if (password === 'GodsPlan') {
            console.log('[ADMIN] Admin access granted');
            currentUser = {
                uid: 'admin-user-' + Date.now(),
                email: 'admin@godsplan.divine',
                displayName: 'Admin'
            };

            // Initialize admin user data
            userData = {
                position: APP_CONFIG.startPosition,
                daysUsed: 0,
                history: []
            };

            // Update UI with admin info
            elements.userName.textContent = 'ADMIN';
            elements.userAvatar.textContent = 'A';

            // Show app screen
            showScreen('app');

            // Initialize 3D staircase after a short delay to ensure DOM is laid out
            setTimeout(() => {
                initStaircase();
                updatePathVisualization();
            }, 100);

            console.log('[ADMIN] You are now in admin mode. Data will not persist.');
        } else if (password !== null) {
            alert('[ACCESS_DENIED] Invalid admin password.');
        }
    }

    async function handleLogout() {
        console.log('[AUTH] User logged out');
        currentUser = null;
        userData = null;
        showScreen('login');
    }

    function updateUserInfo(user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const avatar = (displayName[0] || 'U').toUpperCase();

        elements.userName.textContent = displayName.toUpperCase();
        elements.userAvatar.textContent = avatar;
    }

    // ===== FIREBASE AUTH PROVIDERS =====
    function signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .catch((error) => {
                console.error('[AUTH] Google sign-in error:', error);
                alert('AUTH_ERROR: ' + error.message);
            });
    }

    function signOut() {
        firebase.auth().signOut()
            .catch((error) => {
                console.error('[AUTH] Sign-out error:', error);
            });
    }

    // ===== USER DATA MANAGEMENT =====
    async function loadUserData() {
        if (!currentUser) return;

        // Skip Firebase operations in test mode
        if (currentUser.email === 'test@local.dev') {
            console.log('[TEST_MODE] Using local test data');
            return;
        }

        try {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                userData = userDoc.data();
            } else {
                // Create new user data
                userData = {
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    position: APP_CONFIG.startPosition,
                    daysUsed: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                };
                await userRef.set(userData);
            }

            console.log('[DATA] User data loaded:', userData);
        } catch (error) {
            console.error('[DATA] Error loading user data:', error);
            // Use default data if Firestore is not configured
            userData = {
                position: APP_CONFIG.startPosition,
                daysUsed: 0,
                history: []
            };
        }
    }

    async function saveUserData(updates) {
        if (!currentUser) return;

        // Test mode: store locally only
        if (currentUser.email === 'test@local.dev') {
            Object.assign(userData, updates);
            console.log('[TEST_MODE] Data saved locally (will not persist)');
            return;
        }

        try {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(currentUser.uid);

            // Use set with merge to handle both new and existing users
            await userRef.set({
                ...updates,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            Object.assign(userData, updates);
            console.log('[DATA] User data saved successfully');
        } catch (error) {
            console.error('[DATA] Error saving user data:', error);
            alert('[DATA_ERROR] Could not save to Firestore: ' + error.message);
        }
    }

    async function addToHistory(entry) {
        if (!currentUser) return;

        // Test mode: store locally only
        if (currentUser.email === 'test@local.dev') {
            if (!userData.history) userData.history = [];
            userData.history.unshift({
                id: Date.now().toString(),
                ...entry,
                timestamp: { seconds: Date.now() / 1000 }
            });
            console.log('[TEST_MODE] History saved locally (will not persist)');
            return;
        }

        try {
            const db = firebase.firestore();
            const historyRef = db.collection('users').doc(currentUser.uid)
                .collection('history')
                .doc();

            await historyRef.set({
                confession: entry.confession,
                judgment: entry.judgment,
                movement: entry.movement,
                direction: entry.direction,
                previousPosition: entry.previousPosition,
                newPosition: entry.newPosition,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('[DATA] History entry added to Firestore');

            // Add to local userData for immediate display
            if (!userData.history) userData.history = [];
            userData.history.unshift({
                id: historyRef.id,
                ...entry,
                timestamp: { seconds: Date.now() / 1000 }
            });

            // Keep only last 50 entries locally
            if (userData.history.length > 50) {
                userData.history = userData.history.slice(0, 50);
            }
        } catch (error) {
            console.error('[DATA] Error adding to history:', error);
            // Store locally if Firestore fails
            if (!userData.history) userData.history = [];
            userData.history.unshift({ id: Date.now().toString(), ...entry });
        }
    }

    async function loadHistory() {
        if (!currentUser) return;

        try {
            const db = firebase.firestore();
            const historyRef = db.collection('users').doc(currentUser.uid)
                .collection('history')
                .orderBy('timestamp', 'desc')
                .limit(50);

            const snapshot = await historyRef.get();
            userData.history = [];

            snapshot.forEach((doc) => {
                userData.history.push({ id: doc.id, ...doc.data() });
            });

            renderHistory();
        } catch (error) {
            console.error('[DATA] Error loading history:', error);
            // Use local history if available
            if (userData.history) {
                renderHistory();
            }
        }
    }

    async function clearHistory() {
        if (!currentUser) return;

        try {
            const db = firebase.firestore();
            const batch = db.batch();
            const historyRef = db.collection('users').doc(currentUser.uid)
                .collection('history');

            const snapshot = await historyRef.get();
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            userData.history = [];
            renderHistory();
            console.log('[DATA] History cleared');
        } catch (error) {
            console.error('[DATA] Error clearing history:', error);
            userData.history = [];
            renderHistory();
        }
    }

    // ===== 3D STAIRCASE VISUALIZATION =====
    function updatePathVisualization() {
        if (!userData) return;

        const position = userData.position || 0;
        const maxPos = APP_CONFIG.maxPosition;

        // Calculate percentage (-100% to +100%)
        const percentage = (position / maxPos) * 100;

        // Update position display
        elements.positionValue.textContent = `${percentage.toFixed(4)}%`;

        // Update stats
        elements.daysUsed.textContent = userData.daysUsed || 0;
        const daysLeft = APP_CONFIG.lifespanDays - (userData.daysUsed || 0);
        elements.daysLeft.textContent = Math.max(0, daysLeft);

        // Color based on position
        if (percentage > 0) {
            elements.positionValue.style.color = 'var(--white)';
        } else if (percentage < 0) {
            elements.positionValue.style.color = '#8b4545';
        } else {
            elements.positionValue.style.color = 'var(--gray-light)';
        }

        // Update 3D staircase camera
        updateCameraPosition(position);
    }

    // ===== AI ANALYSIS =====
    async function analyzeConfession(text) {
        if (!text.trim() || isProcessing) return null;

        isProcessing = true;
        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = '<span>ANALYZING...</span>';

        try {
            let result;

            // Use backend proxy if configured (recommended)
            if (AI_CONFIG.useBackendProxy) {
                try {
                    result = await callBackendProxy(text);
                } catch (proxyError) {
                    console.warn('[AI] Backend proxy failed, falling back:', proxyError.message);
                    // Fall back to direct API or mock
                    if (AI_CONFIG.useDirectApi) {
                        result = await callOpenAIAPI(text);
                    } else {
                        result = await getMockAnalysis(text, proxyError.message);
                    }
                }
            } else if (AI_CONFIG.useDirectApi) {
                try {
                    result = await callOpenAIAPI(text);
                } catch (apiError) {
                    console.warn('[AI] Direct API failed, falling back to demo mode:', apiError.message);
                    result = await getMockAnalysis(text, apiError.message);
                }
            } else {
                result = await getMockAnalysis(text);
            }

            return result;
        } catch (error) {
            console.error('[AI] Analysis error:', error);
            console.error('[AI] Error details:', error.message);
            // Return a safe fallback instead of throwing
            return {
                judgment: `SYSTEM_ERROR: The divine connection was interrupted. ${error.message}`,
                movement: 0,
                direction: 'neutral'
            };
        } finally {
            isProcessing = false;
            elements.submitBtn.disabled = false;
            elements.submitBtn.innerHTML = '<span>ANALYZE_SOUL</span>';
        }
    }

    async function callBackendProxy(text) {
        const systemPrompt = `You are the Divine Judgment AI for an app called "Heaven or Hell".
A user has described their actions today. Based on biblical principles, analyze whether
their actions move them closer to heaven (good, righteous actions) or closer to hell (sinful, harmful actions).

Biblical principles to consider:
- Love thy neighbor, kindness, forgiveness, humility, honesty = toward HEAVEN
- Hatred, violence, theft, lying, pride, harming others = toward HELL

Respond in this EXACT JSON format only (no other text):
{
    "judgment": "Brief analysis of the actions (2-3 sentences)",
    "movement": 15,
    "direction": "heaven" or "hell" or "neutral"
}

Movement should be between 1-50 steps based on how significant the actions are.
Most daily activities should result in small movements (1-10).
Major moral actions can be 10-30.
Extraordinary actions can be 30-50.`;

        const url = AI_CONFIG.proxyUrl || '/api/analyze';
        console.log('[AI] Calling backend proxy:', url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                max_tokens: 500,
                temperature: 0.7,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `User's confession: "${text}"` }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`Proxy error ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from API');
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.judgment || typeof parsed.movement !== 'number' || !parsed.direction) {
                throw new Error('Invalid response format');
            }
            return parsed;
        }

        throw new Error('Invalid response format: no JSON found');
    }

    async function callOpenAIAPI(text) {
        const systemPrompt = `You are the Divine Judgment AI for an app called "Heaven or Hell".
A user has described their actions today. Based on biblical principles, analyze whether
their actions move them closer to heaven (good, righteous actions) or closer to hell (sinful, harmful actions).

Biblical principles to consider:
- Love thy neighbor, kindness, forgiveness, humility, honesty = toward HEAVEN
- Hatred, violence, theft, lying, pride, harming others = toward HELL

Respond in this EXACT JSON format only (no other text):
{
    "judgment": "Brief analysis of the actions (2-3 sentences)",
    "movement": 15,
    "direction": "heaven" or "hell" or "neutral"
}

Movement should be between 1-50 steps based on how significant the actions are.
Most daily activities should result in small movements (1-10).
Major moral actions can be 10-30.
Extraordinary actions can be 30-50.`;

        // Validate API key before making request
        if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
            throw new Error('OpenAI API key not configured. Set useDirectApi: false for demo mode or add a valid API key.');
        }

        const url = AI_CONFIG.endpoint;
        console.log('[AI] Calling OpenAI API:', url);

        // Prepare request body
        const requestBody = {
            model: AI_CONFIG.model,
            max_tokens: 500,
            temperature: 0.7,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `User's confession: "${text}"`
                }
            ]
        };

        // Retry logic
        let lastError = null;
        for (let attempt = 0; attempt <= AI_CONFIG.maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[AI] Retry attempt ${attempt}/${AI_CONFIG.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, AI_CONFIG.retryDelay * attempt));
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log('[AI] Response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                    const errorMsg = errorData.error?.message || response.statusText;

                    // Handle specific error codes
                    if (response.status === 401) {
                        throw new Error('Invalid API key (401). Check your OpenAI API key configuration.');
                    } else if (response.status === 429) {
                        throw new Error('Rate limit exceeded (429). Please wait before trying again.');
                    } else if (response.status === 503) {
                        throw new Error('OpenAI service unavailable (503). Try again later.');
                    } else {
                        throw new Error(`API error ${response.status}: ${errorMsg}`);
                    }
                }

                const data = await response.json();
                console.log('[AI] API response received');

                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error('Empty response from OpenAI API');
                }

                // Parse JSON from response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    // Validate required fields
                    if (!parsed.judgment || typeof parsed.movement !== 'number' || !parsed.direction) {
                        throw new Error('Invalid response format: missing required fields');
                    }
                    return parsed;
                }

                throw new Error('Invalid response format: no JSON found');

            } catch (error) {
                lastError = error;
                console.error(`[AI] Attempt ${attempt + 1} failed:`, error.message);

                // Don't retry on certain errors
                if (error.message.includes('401') || error.message.includes('Invalid API key')) {
                    throw error;
                }
                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${AI_CONFIG.timeout}ms`);
                }
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('Network error: Cannot connect to OpenAI. Check your internet connection or CORS settings.');
                }
            }
        }

        throw lastError || new Error('Unknown error calling OpenAI API');
    }

    async function getMockAnalysis(text, apiError = null) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simple keyword-based mock analysis
        const positiveWords = ['helped', 'kind', 'good', 'prayed', 'donated', 'volunteered',
                               'love', 'forgave', 'honest', 'truth', 'charity', 'patient'];
        const negativeWords = ['stole', 'lied', 'hurt', 'angry', 'cheated', 'mean',
                               'hate', 'sin', 'bad', 'wrong', 'selfish', 'greedy'];

        const lowerText = text.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) score += 2;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) score -= 2;
        });

        let direction = 'neutral';
        let movement = Math.abs(score) || 1;

        if (score > 0) direction = 'heaven';
        else if (score < 0) direction = 'hell';

        // Build informative message
        let judgmentPrefix = '';
        if (apiError) {
            // Fallback mode - explain why we're using demo mode
            judgmentPrefix = `[FALLBACK_MODE] OpenAI API unavailable (${apiError.split(':')[0]}). Using local analysis: `;
        } else if (!AI_CONFIG.useDirectApi) {
            judgmentPrefix = `[DEMO_MODE] `;
        }

        const judgmentBody = `Your actions today suggest a ${direction === 'heaven' ? 'righteous' : direction === 'hell' ? 'concerning' : 'neutral'} path. ${movement} steps ${direction === 'heaven' ? 'toward HEAVEN' : direction === 'hell' ? 'toward HELL' : 'unchanged'}.`;

        let judgmentSuffix = '';
        if (!AI_CONFIG.useDirectApi) {
            judgmentSuffix = ' Enable useDirectApi in firebase-config.js for real AI judgment.';
        } else if (apiError) {
            judgmentSuffix = ' Configure a valid API key or run via local server to avoid CORS issues.';
        }

        return {
            judgment: judgmentPrefix + judgmentBody + judgmentSuffix,
            movement: Math.min(movement, APP_CONFIG.maxStep),
            direction: direction
        };
    }

    // ===== UI UPDATES =====
    function showAnalysis(result) {
        const { judgment, movement, direction } = result;

        elements.resultContent.textContent = judgment;

        if (direction === 'heaven') {
            elements.resultMovement.innerHTML =
                `<span class="movement-up">[+] SOUL_ASCENDED ${movement} STEPS TOWARD HEAVEN</span>`;
        } else if (direction === 'hell') {
            elements.resultMovement.innerHTML =
                `<span class="movement-down">[-] SOUL_DESCENDED ${movement} STEPS TOWARD HELL</span>`;
        } else {
            elements.resultMovement.innerHTML =
                `<span class="movement-neutral">[=] SOUL_REMAINS_NEUTRAL</span>`;
        }

        elements.analysisResult.classList.remove('hidden');
    }

    function renderHistory() {
        if (!userData.history || userData.history.length === 0) {
            elements.historyList.innerHTML = '<p style="color: var(--gray-light); font-size: 0.75rem; text-align: center;">[NO_ENTRIES_RECORDED]</p>';
            return;
        }

        elements.historyList.innerHTML = userData.history.map(entry => {
            const date = entry.timestamp ?
                new Date(entry.timestamp.seconds * 1000).toLocaleString() :
                new Date().toLocaleString();

            let movementIcon = '=';
            let movementClass = '';
            if (entry.direction === 'heaven') {
                movementIcon = '+';
                movementClass = 'movement-up';
            } else if (entry.direction === 'hell') {
                movementIcon = '-';
                movementClass = 'movement-down';
            }

            return `
                <div class="history-item">
                    <div class="history-date">${date}</div>
                    <div class="history-text">${escapeHtml(entry.confession || '')}</div>
                    <div class="history-movement">
                        <span class="${movementClass}">[${movementIcon}] ${entry.movement} STEPS ${entry.direction?.toUpperCase()}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createScanlines() {
        const scanlines = document.createElement('div');
        scanlines.className = 'scanlines';
        document.body.appendChild(scanlines);
    }

    // ===== 3D STAIRCASE VISUALIZATION =====
    let isBlinking = false;
    let blinkIntensity = 0;
    let targetCameraY = 1.6;
    let targetCameraZ = 2.5;
    let targetLookY = 1.6;
    let targetLookZ = -3;

    function initStaircase() {
        const viewport = document.getElementById('staircase-viewport');
        if (!viewport) return;

        if (typeof THREE === 'undefined') {
            console.error('[STAIRCASE] Three.js not loaded');
            return;
        }

        const width = viewport.clientWidth || 400;
        const height = viewport.clientHeight || 300;

        // Scene
        staircaseScene = new THREE.Scene();
        staircaseScene.background = new THREE.Color(0x050505);
        staircaseScene.fog = new THREE.Fog(0x050505, 3, 20);

        // Camera
        staircaseCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);

        // Renderer
        staircaseRenderer = new THREE.WebGLRenderer({ antialias: true });
        staircaseRenderer.setSize(width, height);
        staircaseRenderer.setClearColor(0x050505, 1);
        viewport.innerHTML = '';
        viewport.appendChild(staircaseRenderer.domElement);

        // Staircase
        staircaseGroup = new THREE.Group();
        const stepMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.1 });

        // Build stairs - positive Y goes UP (heaven), negative Y goes DOWN (hell)
        for (let i = -25; i <= 25; i++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.6), stepMat);
            step.position.set(0, i * 0.2, i * -0.6);
            staircaseGroup.add(step);
        }
        staircaseScene.add(staircaseGroup);

        // Lights - ambient (dim white)
        staircaseScene.add(new THREE.AmbientLight(0x444444, 0.4));

        // White light from above (heaven direction)
        const heavenLight = new THREE.PointLight(0xffffff, 0.8, 40);
        heavenLight.position.set(0, 15, -10);
        staircaseScene.add(heavenLight);

        // White light from below (hell direction)
        const hellLight = new THREE.PointLight(0xffffff, 0.6, 40);
        hellLight.position.set(0, -15, 10);
        staircaseScene.add(hellLight);

        // Initial view - at bottom of stairs, looking UP toward heaven
        staircaseCamera.position.set(0, 0.5, 8);
        staircaseCamera.lookAt(0, 3, -5);

        // Animate
        const animate = () => {
            requestAnimationFrame(animate);

            // Smooth camera movement toward target
            if (staircaseCamera) {
                staircaseCamera.position.y += (targetCameraY - staircaseCamera.position.y) * 0.05;
                staircaseCamera.position.z += (targetCameraZ - staircaseCamera.position.z) * 0.05;

                // Calculate lookAt target based on camera position
                const lookY = targetLookY;
                const lookZ = targetLookZ;
                staircaseCamera.lookAt(0, lookY, lookZ);
            }

            // Blink effect
            if (isBlinking) {
                blinkIntensity -= 0.05;
                if (blinkIntensity <= 0) {
                    isBlinking = false;
                    blinkIntensity = 0;
                }
            }

            if (staircaseRenderer && staircaseScene && staircaseCamera) {
                staircaseRenderer.render(staircaseScene, staircaseCamera);
            }
        };
        animate();

        // Resize
        window.addEventListener('resize', () => {
            const w = viewport.clientWidth || 400;
            const h = viewport.clientHeight || 300;
            staircaseCamera.aspect = w / h;
            staircaseCamera.updateProjectionMatrix();
            staircaseRenderer.setSize(w, h);
        });
    }

    function triggerBlinkTransition() {
        isBlinking = true;
        blinkIntensity = 1;

        // Create blink overlay
        const viewport = document.getElementById('staircase-viewport');
        if (viewport) {
            const blink = document.createElement('div');
            blink.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: white;
                z-index: 100;
                animation: blinkFlash 0.3s ease-out;
                pointer-events: none;
            `;
            viewport.appendChild(blink);

            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes blinkFlash {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);

            setTimeout(() => {
                blink.remove();
                style.remove();
            }, 300);
        }
    }

    function updateCameraPosition(position) {
        if (!staircaseCamera) return;

        const maxPos = APP_CONFIG.maxPosition;
        const normalizedPos = position / maxPos;
        const indicator = document.getElementById('direction-indicator');

        // Determine direction and set camera targets
        if (lastPositiveDirection === 'up' || (lastPositiveDirection === null && position >= 0)) {
            // ASCENDING - looking UP toward heaven (positive Y, negative Z in our setup)
            // Camera moves UP the stairs
            const progress = Math.min(Math.abs(normalizedPos), 1);
            targetCameraY = 0.5 + progress * 4;  // Move from 0.5 to 4.5 (up)
            targetCameraZ = 8 - progress * 6;     // Move from 8 to 2 (forward toward heaven)
            targetLookY = targetCameraY + 2;      // Look up
            targetLookZ = -5;                     // Look toward heaven (negative Z)
            indicator.textContent = 'ASCENDING_TOWARD_HEAVEN';
        } else {
            // DESCENDING - looking DOWN toward hell (negative Y, positive Z in our setup)
            // Camera moves DOWN the stairs
            const progress = Math.min(Math.abs(normalizedPos), 1);
            targetCameraY = 0.5 - progress * 3;   // Move from 0.5 down to -2.5
            targetCameraZ = 8 + progress * 5;     // Move from 8 to 13 (backward toward hell)
            targetLookY = targetCameraY - 2;      // Look down
            targetLookZ = 10;                     // Look toward hell (positive Z)
            indicator.textContent = 'DESCENDING_TOWARD_HELL';
        }

        indicator.classList.remove('positive', 'negative');
        if (position > 0) indicator.classList.add('positive');
        else if (position < 0) indicator.classList.add('negative');
        else indicator.textContent = 'NEUTRAL_REALM';
    }

    function updateStaircaseForMovement(previousPosition, newPosition, direction) {
        const prevDirection = lastPositiveDirection;

        // Track the last positive direction for camera rotation logic
        if (direction === 'heaven') {
            lastPositiveDirection = 'up';
        } else if (direction === 'hell') {
            lastPositiveDirection = 'down';
        }

        // Trigger blink transition when changing direction
        if (prevDirection !== null && prevDirection !== lastPositiveDirection) {
            triggerBlinkTransition();
        }

        updateCameraPosition(newPosition);
    }

    function updateStaircaseForMovement(previousPosition, newPosition, direction) {
        // Track the last positive direction for camera rotation logic
        // When switching from positive to negative, camera rotates to look down
        if (direction === 'heaven') {
            lastPositiveDirection = 'up';
        } else if (direction === 'hell') {
            lastPositiveDirection = 'down';
        }

        currentSoulPosition = newPosition;
        updateCameraPosition(newPosition);
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Bypass button (test mode)
        elements.bypassBtn.addEventListener('click', bypassAuth);

        // Login buttons
        elements.googleLoginBtn.addEventListener('click', signInWithGoogle);

        // Admin login button
        elements.adminLoginBtn.addEventListener('click', adminAccess);

        // Logout button
        elements.logoutBtn.addEventListener('click', signOut);

        // Submit confession
        elements.submitBtn.addEventListener('click', async () => {
            const text = elements.confessionInput.value.trim();
            if (!text) return;

            // Analyze
            const result = await analyzeConfession(text);
            if (!result) return;

            // Update user data
            let newPosition = userData.position;
            if (result.direction === 'heaven') {
                newPosition += result.movement;
            } else if (result.direction === 'hell') {
                newPosition -= result.movement;
            }

            // Clamp position
            newPosition = Math.max(-APP_CONFIG.maxPosition, Math.min(APP_CONFIG.maxPosition, newPosition));

            // Increment days used (once per submission)
            const newDaysUsed = (userData.daysUsed || 0) + 1;

            await saveUserData({
                position: newPosition,
                daysUsed: newDaysUsed
            });

            // Add to history
            await addToHistory({
                confession: text,
                judgment: result.judgment,
                movement: result.movement,
                direction: result.direction,
                previousPosition: userData.position,
                newPosition: newPosition
            });

            // Update UI
            updatePathVisualization();
            updateStaircaseForMovement(userData.position, newPosition, result.direction);
            showAnalysis(result);
            renderHistory();

            // Clear input
            elements.confessionInput.value = '';
        });

        // Clear history
        elements.clearHistoryBtn.addEventListener('click', async () => {
            if (confirm('[CONFIRM] CLEAR_ALL_HISTORY?')) {
                await clearHistory();
            }
        });

        // Allow Enter to submit (Shift+Enter for new line)
        elements.confessionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                elements.submitBtn.click();
            }
        });
    }

    // ===== DEBUG UTILS =====
    function showDebugInfo() {
        console.log(`
╔════════════════════════════════════════════════╗
║     HEAVEN OR HELL - DEBUG INFO               ║
╠════════════════════════════════════════════════╣
║  Firebase: ${typeof firebase !== 'undefined' ? 'Loaded' : 'Not loaded'}                                    ║
║  Auth: ${firebase.auth().currentUser ? 'Logged in' : 'Not logged in'}                                      ║
║  AI Config:                                     ║
║    - useDirectApi: ${AI_CONFIG.useDirectApi}                          ║
║    - useBackendProxy: ${AI_CONFIG.useBackendProxy}                        ║
║    - apiKey set: ${AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'YOUR_OPENAI_API_KEY_HERE' ? 'Yes' : 'No'}                  ║
║    - model: ${AI_CONFIG.model}                              ║
║  User Data:                                     ║
║    - position: ${userData?.position || 'N/A'}                               ║
║    - daysUsed: ${userData?.daysUsed || 'N/A'}                                 ║
║    - history: ${userData?.history?.length || 0} items                         ║
╚════════════════════════════════════════════════╝
        `);
    }

    // Expose debug function globally
    window.HeavenOrHell = {
        debug: showDebugInfo,
        resetUserData: async () => {
            userData = { position: 0, daysUsed: 0, history: [] };
            updatePathVisualization();
            renderHistory();
            console.log('[DEBUG] User data reset');
        },
        forceSync: async () => {
            await loadUserData();
            updatePathVisualization();
            renderHistory();
            console.log('[DEBUG] Data synced');
        }
    };

    // Add keyboard shortcut for debug (Ctrl+Shift+D)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            showDebugInfo();
        }
    });

    // ===== START APP =====
    setupEventListeners();
    init();

})();
