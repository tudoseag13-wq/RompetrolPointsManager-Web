# Rompetrol Points Manager - Web Version

A web-based dashboard for managing multiple Rompetrol GoPlus loyalty accounts and tracking points across devices (iPhone, Android, Desktop).

## Features

✅ **Multi-Account Management** - Add multiple Rompetrol accounts  
✅ **Auto-Refresh** - Updates every 10 seconds automatically  
✅ **Mobile-Responsive** - Works perfectly on iPhone, Android, and Desktop  
✅ **Real-Time Stats** - Total points and Lei value displayed  
✅ **PWA Support** - Install as app on any device  
✅ **Free Forever** - No paid subscriptions needed  

## Tech Stack

- **Backend**: Node.js + Express + Playwright
- **Frontend**: Vanilla JavaScript + HTML/CSS
- **Hosting**: Render, Railway, or your own server

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Backend

```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Open in Browser

Go to `http://localhost:3000` and start adding accounts!

## Deployment

### Option 1: Free Hosting (Recommended)

**Deploy to Render:**
1. Push this repo to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repo
5. Build command: `cd backend && npm install`
6. Start command: `npm start`
7. Add environment: `PORT=3000`

**Deploy to Railway:**
1. Go to [railway.app](https://railway.app)
2. Connect GitHub
3. Select this repo
4. It auto-detects Node.js setup
5. Deploy!

### Option 2: Your Own Server

Replace `backend/` folder content on any Node.js server and run `npm start`

## Usage

1. Click **+ Add Account**
2. Enter:
   - **Nickname** (e.g., "My Card")
   - **Phone Number** (Rompetrol login)
   - **Password**
3. App automatically logs in and scrapes your GoPoints
4. Dashboard updates every 10 seconds
5. On iPhone: Tap Share → Add to Home Screen to "install"

## Point Conversion

**10 GoPoints = 1 Lei**

The app automatically calculates Lei value from your GoPoints.

## Privacy & Security

- Passwords are only stored on your backend
- Your data never leaves your server
- Only you have access (no third parties)

## Support

For issues or feature requests, check the GitHub issues.
