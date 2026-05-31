const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory account storage (in production, use database)
let accounts = [];

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Import PlaywrightManager (simplified version)
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');

class PlaywrightManager {
  constructor() {
    this.browser = null;
    this.contextsDir = path.join(os.homedir(), '.rompetrol-web', 'contexts');
    this.ensureContextsDir();
  }

  ensureContextsDir() {
    if (!fs.existsSync(this.contextsDir)) {
      fs.mkdirSync(this.contextsDir, { recursive: true });
    }
  }

  async loginAndScrape(phone, password, accountId) {
    let context = null;
    let page = null;

    try {
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: true });
      }

      const contextPath = path.join(this.contextsDir, `context-${accountId}`);

      try {
        context = await chromium.launchPersistentContext(contextPath, {
          headless: true,
          locale: 'ro-RO',
          timezoneId: 'Europe/Bucharest',
        });
      } catch (e) {
        console.log(`Context corrupted, creating fresh...`);
        if (fs.existsSync(contextPath)) {
          fs.rmSync(contextPath, { recursive: true, force: true });
        }
        context = await chromium.launchPersistentContext(contextPath, {
          headless: true,
          locale: 'ro-RO',
          timezoneId: 'Europe/Bucharest',
        });
      }

      const pages = context.pages();
      page = pages.length > 0 ? pages[0] : await context.newPage();

      // Check if already logged in
      try {
        await page.goto('https://www.rompetrol.ro/user/sumar', { waitUntil: 'load', timeout: 10000 });
        const data = await this.scrapePoints(page);
        if (data && data.points > 0) {
          const money = data.points / 10;
          await context.close();
          return { success: true, points: data.points, money };
        }
      } catch (e) {
        console.log('Not logged in, proceeding with login...');
      }

      // Login
      await page.goto('https://www.rompetrol.ro/user/login', { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="credentials"]', phone);
      await page.fill('input[name="password"]', password);

      let clicked = false;
      try {
        const btn = await page.$('button[type="submit"]');
        if (btn) { await btn.click(); clicked = true; }
      } catch (e) {}

      if (!clicked) {
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text?.includes('GO')) { await btn.click(); clicked = true; break; }
        }
      }

      try {
        await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 });
      } catch (e) {}

      const url = page.url();
      if (url.includes('/user/login')) {
        await context.close();
        return { success: false, error: 'Login failed' };
      }

      // Scrape
      await page.goto('https://www.rompetrol.ro/user/sumar', { waitUntil: 'load', timeout: 15000 });
      const data = await this.scrapePoints(page);

      if (data) {
        const money = data.points / 10;
        await context.close();
        return { success: true, points: data.points, money };
      }

      await context.close();
      return { success: false, error: 'Could not scrape points' };
    } catch (error) {
      if (context) await context.close().catch(() => {});
      return { success: false, error: error.message };
    }
  }

  async scrapePoints(page) {
    const text = await page.textContent('body');
    const patterns = [
      /(\d+(?:[.,]\d+)?)\s*(?:GoPoints|GO\s*Points)/i,
      /GoPoints[:\s]+(\d+(?:[.,]\d+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return { points: parseFloat(match[1].replace(',', '.')) };
      }
    }
    return null;
  }
}

const pm = new PlaywrightManager();

// API Routes
app.get('/api/accounts', (req, res) => {
  res.json(accounts);
});

app.post('/api/accounts', async (req, res) => {
  const { nickname, phone, password } = req.body;
  const id = Date.now().toString();
  
  accounts.push({ id, nickname, phone, password, points: 0, money: 0, status: 'loading', lastUpdated: null });
  
  // Scrape in background
  pm.loginAndScrape(phone, password, id).then(result => {
    const acc = accounts.find(a => a.id === id);
    if (result.success) {
      acc.points = result.points;
      acc.money = result.money;
      acc.status = 'online';
      acc.lastUpdated = new Date().toISOString();
    } else {
      acc.status = 'error';
      acc.lastUpdated = new Date().toISOString();
    }
  });

  res.json({ success: true, id });
});

app.post('/api/accounts/:id/refresh', async (req, res) => {
  const acc = accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ error: 'Not found' });

  const result = await pm.loginAndScrape(acc.phone, acc.password, acc.id);
  if (result.success) {
    acc.points = result.points;
    acc.money = result.money;
    acc.status = 'online';
    acc.lastUpdated = new Date().toISOString();
  } else {
    acc.status = 'error';
    acc.lastUpdated = new Date().toISOString();
  }

  res.json(result);
});

app.delete('/api/accounts/:id', (req, res) => {
  accounts = accounts.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
