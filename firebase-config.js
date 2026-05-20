// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Follow these steps to configure Firebase:
//
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or select existing)
// 3. Enable Authentication:
//    - Go to Authentication > Sign-in method
//    - Enable Google and/or GitHub providers
// 4. Enable Firestore:
//    - Go to Firestore Database
//    - Create database (start in test mode)
// 5. Get your config:
//    - Go to Project Settings (gear icon)
//    - Scroll to "Your apps" section
//    - Copy the Firebase SDK configuration
// 6. Replace the config object below with yours
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDWRpcCPoGoUjmq4CgVM5IylpQV1znC45M",
    authDomain: "heaven-or-hell-d3229.firebaseapp.com",
    projectId: "heaven-or-hell-d3229",
    storageBucket: "heaven-or-hell-d3229.firebasestorage.app",
    messagingSenderId: "354739033678",
    appId: "1:354739033678:web:20df03dbf840926fc2951f",
    measurementId: "G-E0G8NLMJLE"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    console.log('[SYSTEM] Firebase initialized successfully');
} catch (error) {
    console.error('[SYSTEM] Firebase initialization error:', error);
}

// ============================================
// AI CONFIGURATION
// ============================================
// Option 1: Use a backend proxy (recommended for production)
// Option 2: Use client-side API key (for testing only - NOT for production)
// Option 3: Use mock/demo mode (no API key needed)
//
// For testing, you can add your OpenAI API key below:
// Get it from: https://platform.openai.com/api-keys

const AI_CONFIG = {
    // Use Vercel serverless function for API calls
    useDirectApi: false,
    useBackendProxy: true,

    // API endpoint (not used when useBackendProxy: true)
    endpoint: 'https://api.openai.com/v1/chat/completions',

    // CORS proxy settings
    useCorsProxy: false,
    corsProxyUrl: '',

    // Model to use
    model: 'gpt-4o-mini',

    // Backend proxy URL - works locally and on Vercel
    proxyUrl: '/api/analyze',

    // Retry configuration
    maxRetries: 2,
    retryDelay: 1000,

    // Timeout in milliseconds
    timeout: 30000
};

// ============================================
// APP CONFIGURATION
// ============================================
const APP_CONFIG = {
    // Total lifespan in days (80 years)
    lifespanDays: 80 * 365, // 29,200 days

    // Starting position (0 = neutral, positive = toward heaven, negative = toward hell)
    startPosition: 0,

    // Maximum position values (for display percentage)
    maxPosition: 10000, // Total steps to reach heaven/hell

    // Step size per confession (AI determines direction and magnitude)
    minStep: 1,
    maxStep: 50
};
