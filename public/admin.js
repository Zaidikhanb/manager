const API = '/api/items';
let items = [];
let token = sessionStorage.getItem('adminToken');
let currentSection = 'all';
let collapsedSections = {};

// ---------- Login ----------
function showLogin() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('adminContent').style.display = 'none';
}

function showAdmin() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminContent').style.display = 'flex';
  fetchItems();
  fetchWallet();
}

if (token) {
  fetch('/api/history', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.ok ? showAdmin() : (sessionStorage.removeItem('adminToken'), showLogin()))
    .catch(() => showLogin());
} else {
  showLogin();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('loginError');
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    token = data.token;
    sessionStorage.setItem('adminToken', token);
    showAdmin();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('adminToken');
  token = null;
  showLogin();
});

// ---------- Data ----------
async function fetchItems() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.classList.remove('hidden');
  try {
    const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Unauthorized');
    items = await res.json();
  } catch (e) {
    console.error(e);
    items = [];
  } finally {
    spinner.classList.add('hidden');
  }
  renderAll();
}

function getSections() {
  const sections = {
    available: { label: 'Available', icon: 'available', color: 'var(--green)', items: [] },
    used: { label: 'In Use', icon: 'used', color: 'var(--blue)', items: [] },
    installed: { label: 'Installed', icon: 'installed', color: 'var(--purple)', items: [] },
    reserved: { label: 'Reserved', icon: 'reserved', color: 'var(--orange)', items: [] },
    defective: { label: 'Defective', icon: 'defective', color: 'var(--red)', items: [] },
    short: { label: 'Low Stock', icon: 'short', color: 'var(--yellow)', items: [] }
  };

  items.forEach(item => {
    const displayStatus = item.displayStatus || item.status;
    if (sections[displayStatus]) {
      sections[displayStatus].items.push(item);
    }
  });

  return sections;
}

function renderStats() {
  const sections = getSections();
  const allCount = items.length;
  
  document.getElementById('statsGrid').innerHTML = [
    { key: 'all', label: 'All Items', color: '#6c5ce7', count: allCount, icon: 'all' },
    { key: 'available', label: 'Available', color: 'var(--green)', count: sections.available.items.length, icon: 'available' },
    { key: 'used', label: 'In Use', color: 'var(--blue)', count: sections.used.items.length, icon: 'used' },
    { key: 'installed', label: 'Installed', color: 'var(--purple)', count: sections.installed.items.length, icon: 'installed' },
    { key: 'reserved', label: 'Reserved', color: 'var(--orange)', count: sections.reserved.items.length, icon: 'reserved' },
    { key: 'defective', label: 'Defective', color: 'var(--red)', count: sections.defective.items.length, icon: 'defective' },
    { key: 'short', label: 'Low Stock', color: 'var(--yellow)', count: sections.short.items.length, icon: 'short' }
  ].map(c => `
    <div class="stat-card ${currentSection === c.key ? 'active-section' : ''}" onclick="setSection('${c.key}')">
      <div class="stat-icon" style="background:${c.color}22;color:${c.color}">
        ${getIcon(c.icon)}
      </div>
      <div class="stat-value" style="color:${c.color}">${c.count}</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
}

function getIcon(type) {
  const svgs = {
    all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>',
    available: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
    used: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    installed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    reserved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
    defective: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    short: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  return svgs[type] || '';
}

function renderSections() {
  const sections = getSections();
  const search = document.getElementById('searchInput').value.toLowerCase();
  const container = document.getElementById('sectionsContainer');

  let sectionsToShow = sections;
  if (currentSection !== 'all') {
    sectionsToShow = {};
    sectionsToShow[currentSection] = sections[currentSection];
  }

  let html = '';

  for (const [key, section] of Object.entries(sectionsToShow)) {
    if (!section) continue;
    
    let displayItems = section.items;
    if (search) {
      displayItems = displayItems.filter(item =>
        item.name.toLowerCase().includes(search) ||
        (item.number || '').toLowerCase().includes(search)
      );
    }

    const isCollapsed = collapsedSections[key] || false;
    const itemCount = displayItems.length;

    html += `
      <div class="section-card">
        <div class="section-header" onclick="toggleSection('${key}')">
          <div class="section-header-left">
            <div class="section-icon" style="background:${section.color}22;color:${section.color}">
              ${getIcon(section.icon)}
            </div>
            <span class="section-title">${section.label}</span>
            <span class="section-count">(${itemCount} items)</span>
          </div>
          <div class="section-toggle ${isCollapsed ? 'collapsed' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
        <div class="section-body ${isCollapsed ? 'collapsed' : ''}" id="sectionBody_${key}" style="max-height: ${isCollapsed ? '0' : '2000px'};">
          ${itemCount === 0 ? `
            <div class="empty-section">No items in this section</div>
          ` : `
            <table class="section-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Number / Serial</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${displayItems.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">
                        <div class="item-avatar" style="background:${section.color}22;color:${section.color}">
                          ${item.name.charAt(0).toUpperCase()}
                        </div>
                        <strong>${esc(item.name)}</strong>
                      </div>
                    </td>
                    <td>${esc(item.number || '—')}</td>
                    <td>
                      <span class="${item.isShort ? 'qty-warning' : ''}">
                        ${item.isShort ? '⚠ ' : ''}${item.quantity}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge status-${item.displayStatus || item.status}" onclick="cycleStatus('${item.id}')">
                        ● ${capitalize(item.displayStatus || item.status)}
                      </span>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button class="action-dot" onclick="changeTag('${item.id}','available')" title="Move to Available">✅</button>
                        <button class="action-dot" onclick="changeTag('${item.id}','used')" title="Move to In Use">🔧</button>
                        <button class="action-dot" onclick="changeTag('${item.id}','installed')" title="Move to Installed">⚡</button>
                        <button class="action-dot" onclick="changeTag('${item.id}','reserved')" title="Move to Reserved">📌</button>
                        <button class="action-dot" onclick="changeTag('${item.id}','defective')" title="Mark as Defective">⚠️</button>
                        <button class="action-dot" onclick="editItem('${item.id}')" title="Edit">✏️</button>
                        <button class="action-dot" onclick="deleteItem('${item.id}')" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </td>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function toggleSection(key) {
  collapsedSections[key] = !collapsedSections[key];
  const body = document.getElementById(`sectionBody_${key}`);
  if (body) {
    if (collapsedSections[key]) {
      body.style.maxHeight = '0';
      body.classList.add('collapsed');
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.classList.remove('collapsed');
    }
  }
  renderSections();
}

async function changeTag(id, newStatus) {
  await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id, status: newStatus })
  });
  await fetchItems();
}

function cycleStatus(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const order = ['available', 'used', 'installed', 'reserved', 'defective'];
  const idx = order.indexOf(item.status);
  const next = order[(idx + 1) % order.length];
  changeTag(id, next);
}

async function editItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  document.getElementById('itemId').value = id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemNumber').value = item.number || '';
  document.getElementById('itemQty').value = item.quantity;
  document.getElementById('itemStatus').value = item.status;
  document.getElementById('modalTitle').textContent = 'Edit Item';
  openModal();
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  await fetch(`${API}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  fetchItems();
}

function openModal() { document.getElementById('modalOverlay').style.display = 'flex'; }
function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
}

document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('itemId').value;
  const payload = {
    name: document.getElementById('itemName').value.trim(),
    number: document.getElementById('itemNumber').value.trim(),
    quantity: parseInt(document.getElementById('itemQty').value, 10),
    status: document.getElementById('itemStatus').value
  };
  if (id) {
    payload.id = id;
    await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  }
  closeModal();
  fetchItems();
});

function setSection(key) {
  currentSection = key;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${key}"]`);
  if (navItem) navItem.classList.add('active');
  renderAll();
}

// ---------- Wallet ----------
let walletData = { balance: 0, transactions: [] };

async function fetchWallet() {
  try {
    const res = await fetch('/api/wallet', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    walletData = await res.json();
    updateWalletUI();
  } catch (err) {
    console.warn('Wallet fetch failed', err);
  }
}

function updateWalletUI() {
  const balance = walletData.balance || 0;
  const balanceChip = document.getElementById('walletBalanceChip');
  if (balanceChip) balanceChip.innerHTML = `Rs. ${balance.toFixed(2)}`;
  const balanceDisplay = document.getElementById('walletBalanceDisplay');
  if (balanceDisplay) balanceDisplay.innerHTML = `Rs. ${balance.toFixed(2)}`;
  const listContainer = document.getElementById('walletTransactionsList');
  if (listContainer) {
    listContainer.innerHTML = walletData.transactions.map(t => `
      <div class="transaction-item ${t.type === 'add' ? 'transaction-add' : 'transaction-spend'}">
        <div class="transaction-icon">
          ${t.type === 'add' 
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
        </div>
        <div class="transaction-details">
          <div class="transaction-desc">${esc(t.description)}</div>
          <div class="transaction-time">${new Date(t.timestamp).toLocaleString()}</div>
        </div>
        <div class="transaction-amount ${t.type === 'add' ? 'amount-positive' : 'amount-negative'}">
          ${t.type === 'add' ? '+' : '-'}Rs. ${Math.abs(t.amount).toFixed(2)}
        </div>
      </div>
    `).join('');
    if (!walletData.transactions.length) {
      listContainer.innerHTML = '<div class="empty-transactions">No transactions yet. Start by adding money.</div>';
    }
  }
}

async function addMoney(description, amount) {
  try {
    const res = await fetch('/api/wallet/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'add', description, amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed');
    }
    await fetchWallet();
    return true;
  } catch (err) {
    alert(err.message || 'Failed to add money');
    return false;
  }
}

async function spendMoney(description, amount) {
  if (amount > walletData.balance) {
    alert('Insufficient balance!');
    return false;
  }
  try {
    const res = await fetch('/api/wallet/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'spend', description, amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed');
    }
    await fetchWallet();
    return true;
  } catch (err) {
    alert(err.message || 'Failed to record expense');
    return false;
  }
}

function openWalletModal() {
  document.getElementById('walletModal').style.display = 'flex';
  updateWalletUI();
}

function closeWalletModal() {
  document.getElementById('walletModal').style.display = 'none';
}

// Attach wallet event listeners
document.getElementById('btnWallet').addEventListener('click', openWalletModal);
document.getElementById('closeWalletModalBtn').addEventListener('click', closeWalletModal);
document.getElementById('doAddMoneyBtn').addEventListener('click', () => {
  const desc = document.getElementById('addMoneyName').value.trim();
  const amount = parseFloat(document.getElementById('addMoneyAmount').value);
  if (!desc) return alert('Please enter a description');
  if (isNaN(amount) || amount <= 0) return alert('Enter a valid positive amount');
  addMoney(desc, amount).then(() => {
    document.getElementById('addMoneyName').value = '';
    document.getElementById('addMoneyAmount').value = '';
  });
});
document.getElementById('doUsedMoneyBtn').addEventListener('click', () => {
  const desc = document.getElementById('usedMoneyDesc').value.trim();
  const amount = parseFloat(document.getElementById('usedMoneyAmount').value);
  if (!desc) return alert('Please enter a "Used In" description');
  if (isNaN(amount) || amount <= 0) return alert('Enter a valid positive amount');
  spendMoney(desc, amount).then(() => {
    document.getElementById('usedMoneyDesc').value = '';
    document.getElementById('usedMoneyAmount').value = '';
  });
});

// Close modal when clicking overlay
document.getElementById('walletModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('walletModal')) closeWalletModal();
});

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function renderAll() { renderStats(); renderSections(); }

document.getElementById('btnAddItem').addEventListener('click', () => { closeModal(); openModal(); });
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('searchInput').addEventListener('input', renderAll);

document.querySelectorAll('.nav-item[data-section]').forEach(n => {
  n.addEventListener('click', () => setSection(n.dataset.section));
});

function logout() { sessionStorage.removeItem('adminToken'); token = null; showLogin(); }