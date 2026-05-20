# Heaven or Hell

A mobile-first web app that uses AI to judge your actions and move your soul toward heaven or hell based on biblical principles.

## Features

- 3D staircase visualization with Three.js
- AI-powered judgment using GPT-4o-mini
- Firebase authentication and Firestore database
- Dark terminal-style UI

## Quick Start (Local Development)

```bash
cd heaven-or-hell

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-..." > .env

# Start Vercel dev server
vercel dev

# Open in browser
open http://localhost:3000
```

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Heaven or Hell app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/REPO.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your `heaven-or-hell` repository
4. Add Environment Variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (from https://platform.openai.com/api-keys)
5. Click **"Deploy"**

### Step 3: Done!

Your app will be live at `https://your-app.vercel.app`

## Project Structure

```
heaven-or-hell/
├── index.html          # Main HTML structure
├── styles.css          # Terminal-style CSS
├── app.js              # App logic and UI
├── firebase-config.js  # Firebase configuration
├── api/
│   └── analyze.py      # Vercel serverless function (OpenAI proxy)
├── vercel.json         # Vercel configuration
├── package.json        # Project metadata
├── .env                # Environment variables (NOT committed)
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Configuration

### Environment Variables

Create a `.env` file for local development:

```
OPENAI_API_KEY=sk-...
```

For Vercel, add `OPENAI_API_KEY` in **Settings → Environment Variables**.

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication (Google, GitHub providers)
4. Enable Firestore Database
5. Copy the config to `firebase-config.js`

### App Configuration

Edit `firebase-config.js` to customize:

```javascript
const APP_CONFIG = {
    lifespanDays: 80 * 365,  // Total lifespan (80 years)
    startPosition: 0,         // 0 = neutral
    maxPosition: 10000,       // Steps to reach heaven/hell
    minStep: 1,
    maxStep: 50
};

const AI_CONFIG = {
    useBackendProxy: true,    // Use Vercel serverless function
    proxyUrl: '/api/analyze', // API endpoint
    model: 'gpt-4o-mini',     // OpenAI model
    maxRetries: 2,            // Retry failed requests
    timeout: 30000            // Request timeout (ms)
};
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve web app |
| `/api/analyze` | POST | Proxy to OpenAI API |

## Troubleshooting

### OpenAI API Issues

**Problem: 401 Invalid API Key**
- Check your API key is correct in Vercel environment variables
- Verify key is active at https://platform.openai.com/api-keys

**Problem: Rate limit (429)**
- Wait before trying again
- Check your OpenAI quota and billing

### Firebase Issues

**Problem: Stuck on loading screen**
- Check browser console for Firebase errors
- Verify your Firebase config is correct
- Click `[SKIP_AUTH_AND_TEST]` to bypass auth

**Problem: Data not saving**
- Ensure Firestore is enabled in Firebase Console
- Check Firestore security rules are configured

## License

MIT License
