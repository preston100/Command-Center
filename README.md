# Command Center

Your personal all-in-one dashboard — installable PWA for Macbook + Pixel 8 Pro.

## Features
- Dashboard with tasks, calendar, inbox, notes, drive, AI
- Task manager (tagged: lesson / uni / dev)
- Calendar with event view
- Gmail inbox (connect Google)
- Google Drive recent files (connect Google)
- Lesson Planner for teaching groups
- Notes with local persistence
- AI Assistant (Claude-powered)

## Setup

### 1. Install & run locally
```bash
npm install
npm run dev
```

### 2. Deploy to Vercel (free)
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import your repo
3. Deploy — you'll get a URL like `yourapp.vercel.app`

### 3. Install as PWA
**Macbook:** Open your Vercel URL in Chrome → click the install icon (⊕) in the address bar
**Pixel 8 Pro:** Open URL in Chrome → tap menu → "Add to Home Screen"

### 4. Connect Google (coming in next step)
- Create a Google Cloud project at console.cloud.google.com
- Enable: Gmail API, Google Calendar API, Google Drive API, Google Tasks API
- Create OAuth 2.0 credentials
- Add your client ID to `.env`: `VITE_GOOGLE_CLIENT_ID=your_id_here`

### 5. Add Anthropic API key
- Get your key at console.anthropic.com
- In the app → AI tab → "Add Anthropic API key"
- Key is stored locally on your device only

## Stack
- React + Vite
- PWA (vite-plugin-pwa + Workbox)
- CSS Modules
- localStorage for tasks + notes persistence
- Anthropic API for AI assistant
- Google OAuth (next step)
