const API = '/api';
let accounts = [];
let refreshInterval = null;

const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('closeBtn');
const form = document.getElementById('form');

addBtn.addEventListener('click', () => modal.classList.add('active'));
closeBtn.addEventListener('click', () => modal.classList.remove('active'));

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('active');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    nickname: document.getElementById('nickname').value,
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value,
  };

  try {
    const res = await fetch(`${API}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (res.ok) {
      form.reset();
      modal.classList.remove('active');
      loadAccounts();
    }
  } catch (err) {
    console.error('Error adding account:', err);
  }
});

async function loadAccounts() {
  try {
    const res = await fetch(`${API}/accounts`);
    accounts = await res.json();
    render();
  } catch (err) {
    console.error('Error loading accounts:', err);
  }
}

function render() {
  const list = document.getElementById('accountsList');
  const totalPoints = accounts.reduce((sum, a) => sum + (a.points || 0), 0);
  const totalMoney = accounts.reduce((sum, a) => sum + (a.money || 0), 0);

  document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();
  document.getElementById('totalMoney').textContent = totalMoney.toFixed(2);

  if (accounts.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No accounts yet. Add one to get started!</p></div>';
    return;
  }

  list.innerHTML = accounts.map(acc => `
    <div class="account-card">
      <div class="account-info">
        <h3>${escapeHtml(acc.nickname)}</h3>
        <div class="account-points">
          <strong>${acc.points.toLocaleString()}</strong> GoPoints = 
          <span class="account-points-value">${acc.money.toFixed(2)} Lei</span>
        </div>
        <span class="status ${acc.status}">${acc.status}</span>
      </div>
      <div class="account-actions">
        <button class="btn-small" onclick="refresh('${acc.id}')">Refresh</button>
        <button class="btn-small delete" onclick="deleteAccount('${acc.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function refresh(id) {
  const acc = accounts.find(a => a.id === id);
  if (acc) acc.status = 'loading';
  render();

  try {
    const res = await fetch(`${API}/accounts/${id}/refresh`, { method: 'POST' });
    if (res.ok) {
      loadAccounts();
    }
  } catch (err) {
    console.error('Error refreshing account:', err);
    loadAccounts();
  }
}

async function deleteAccount(id) {
  if (confirm('Delete this account?')) {
    try {
      const res = await fetch(`${API}/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAccounts();
      }
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh every 10 seconds
setInterval(loadAccounts, 10000);

// Initial load
loadAccounts();

// PWA support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
