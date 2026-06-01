let items = [];
let currentSection = 'all';
let searchTerm = '';
let walletData = { transactions: [] };

// DOM elements
const itemsContainer = document.getElementById('itemsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const walletBalanceSpan = document.getElementById('walletBalance');
const walletDisplay = document.getElementById('walletDisplay');
const walletModal = document.getElementById('walletModal');
const walletTransactionsBody = document.getElementById('walletTransactionsBody');
const closeWalletModal = document.getElementById('closeWalletModal');

// ---------- Fetch items ----------
async function fetchItems() {
  loadingSpinner.classList.remove('hidden');
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Network error');
    items = await res.json();
  } catch (e) {
    console.warn("Using demo inventory data");
    items = generateDemoInventory();
  } finally {
    loadingSpinner.classList.add('hidden');
    renderAll();
  }
}

function generateDemoInventory() {
  const statusList = ['available', 'used', 'installed', 'reserved', 'defective', 'short'];
  const namePool = [
    'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', 'Monitor 24"', 'Laptop Stand',
    'Noise Cancelling Headphones', 'Webcam 4K', 'Docking Station', 'SSD 1TB', 'Power Bank',
    'HDMI Cable', 'Desk Mat', 'Microphone', 'Speakers', 'Charger 65W', 'Graphics Tablet'
  ];
  const demo = [];
  for (let i = 1; i <= 72; i++) {
    let status = statusList[Math.floor(Math.random() * statusList.length)];
    let quantity = Math.floor(Math.random() * 35) + 1;
    let nameIndex = i % namePool.length;
    let name = namePool[nameIndex] + (Math.floor(i / 6) > 0 ? ` Pro` : '');
    demo.push({
      id: i,
      name: `${name} ${Math.floor(i / 3) + 1}`,
      number: `SN-${Math.floor(2000 + i)}`,
      quantity: status === 'short' ? Math.floor(Math.random() * 5) + 1 : quantity,
      status: status,
      displayStatus: status,
      isShort: status === 'short' && quantity < 5
    });
  }
  demo.push({ id: 101, name: "Ergonomic Office Chair", number: "CHAIR-221", quantity: 12, status: "available", displayStatus: "available", isShort: false });
  demo.push({ id: 102, name: "Bluetooth Adapter", number: "BT-5.3", quantity: 2, status: "short", displayStatus: "short", isShort: true });
  demo.push({ id: 103, name: "Graphic Tablet", number: "TAB-M7", quantity: 5, status: "reserved", displayStatus: "reserved", isShort: false });
  demo.push({ id: 104, name: "Broken Screen Device", number: "SCR-001", quantity: 1, status: "defective", displayStatus: "defective", isShort: false });
  return demo;
}

// ---------- Wallet ----------
async function fetchWallet() {
  try {
    const res = await fetch('/api/wallet');
    if (!res.ok) throw new Error();
    walletData = await res.json();
    updateWalletDisplay();
  } catch(e) {
    console.error('Could not load wallet');
    walletBalanceSpan.textContent = '? PKR';
  }
}

function updateWalletDisplay() {
  const received = walletData.totalReceived || 0;
  const used = walletData.totalUsed || 0;
  const balance = received - used;
  walletBalanceSpan.textContent = `${balance.toLocaleString()} PKR`;
  if (balance < 0) {
    walletBalanceSpan.style.color = 'var(--red)';
    walletBalanceSpan.title = `Extra used: ${Math.abs(balance)} PKR`;
  } else if (balance > 0) {
    walletBalanceSpan.style.color = 'var(--green)';
  } else {
    walletBalanceSpan.style.color = 'var(--text2)';
  }
}

function showWalletTransactions() {
  const tbody = walletTransactionsBody;
  if (!walletData.transactions || walletData.transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No transactions recorded.</td></tr>';
  } else {
    tbody.innerHTML = walletData.transactions.map(t => {
      const date = new Date(t.timestamp);
      const formattedDate = date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const typeLabel = t.type === 'received' ? '💰 Received' : '💸 Used';
      const amountClass = t.type === 'received' ? 'status-available' : 'status-defective';
      return `
        <tr>
          <td style="white-space:nowrap;">${escapeHtml(formattedDate)}</td>
          <td><span class="status-badge ${amountClass}" style="background:none;">${typeLabel}</span></td>
          <td>${escapeHtml(t.party)}</td>
          <td style="font-weight:600;">${t.amount.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }
  walletModal.style.display = 'flex';
}

// Close modal handlers
closeWalletModal.addEventListener('click', () => walletModal.style.display = 'none');
walletModal.addEventListener('click', (e) => { if (e.target === walletModal) walletModal.style.display = 'none'; });
walletDisplay.addEventListener('click', showWalletTransactions);

// ---------- Render inventory (single section) ----------
function getFilteredItems() {
  let filtered = [...items];
  // Filter by status (if not 'all')
  if (currentSection !== 'all') {
    filtered = filtered.filter(item => (item.displayStatus || item.status) === currentSection);
  }
  // Filter by search
  if (searchTerm) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      (item.number || '').toLowerCase().includes(searchTerm)
    );
  }
  return filtered;
}

function renderStats() {
  const sectionsCount = {
    all: items.length,
    available: items.filter(i => (i.displayStatus || i.status) === 'available').length,
    used: items.filter(i => (i.displayStatus || i.status) === 'used').length,
    installed: items.filter(i => (i.displayStatus || i.status) === 'installed').length,
    reserved: items.filter(i => (i.displayStatus || i.status) === 'reserved').length,
    defective: items.filter(i => (i.displayStatus || i.status) === 'defective').length,
    short: items.filter(i => (i.displayStatus || i.status) === 'short').length
  };
  const stats = [
    { key: 'all', label: 'All Items', color: '#6c5ce7', count: sectionsCount.all, icon: 'all' },
    { key: 'available', label: 'Available', color: 'var(--green)', count: sectionsCount.available, icon: 'available' },
    { key: 'used', label: 'In Use', color: 'var(--blue)', count: sectionsCount.used, icon: 'used' },
    { key: 'installed', label: 'Installed', color: 'var(--purple)', count: sectionsCount.installed, icon: 'installed' },
    { key: 'reserved', label: 'Reserved', color: 'var(--orange)', count: sectionsCount.reserved, icon: 'reserved' },
    { key: 'defective', label: 'Defective', color: 'var(--red)', count: sectionsCount.defective, icon: 'defective' },
    { key: 'short', label: 'Low Stock', color: 'var(--yellow)', count: sectionsCount.short, icon: 'short' }
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(c => `
    <div class="stat-card ${currentSection === c.key ? 'active-section' : ''}" onclick="setSection('${c.key}')">
      <div class="stat-icon" style="background:${c.color}22;color:${c.color}">${getIcon(c.icon)}</div>
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
  return svgs[type] || svgs.all;
}

function renderItemsTable() {
  const filtered = getFilteredItems();
  if (filtered.length === 0) {
    itemsContainer.innerHTML = '<div class="empty-section">✨ No items match your filter</div>';
    return;
  }

  const sectionColor = currentSection === 'all' ? '#6c5ce7' : getSectionColor(currentSection);
  const html = `
    <div class="section-card">
      <div class="section-header" style="cursor:default;">
        <div class="section-header-left">
          <div class="section-icon" style="background:${sectionColor}22;color:${sectionColor}">
            ${getIcon(currentSection === 'all' ? 'all' : currentSection)}
          </div>
          <span class="section-title">${currentSection === 'all' ? 'All Items' : capitalize(currentSection)}</span>
          <span class="section-count">(${filtered.length} items)</span>
        </div>
      </div>
      <div class="section-body" style="max-height:600px; overflow-y:auto;">
        <table class="section-table">
          <thead>
            <tr><th>Item Name</th><th>Serial / Number</th><th>Quantity</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${filtered.map(item => {
              const statusKey = item.displayStatus || item.status;
              const statusColor = getStatusColor(statusKey);
              return `
                <tr>
                  <td>
                    <div class="item-name">
                      <div class="item-avatar" style="background:${statusColor}22;color:${statusColor}">
                        ${escapeHtml(item.name.charAt(0).toUpperCase())}
                      </div>
                      <strong>${escapeHtml(item.name)}</strong>
                    </div>
                  </td>
                  <td>${escapeHtml(item.number || '—')}</td>
                  <td><span class="${item.isShort ? 'qty-warning' : ''}">${item.isShort ? '⚠ ' : ''}${item.quantity}</span></td>
                  <td><span class="status-badge status-${statusKey}">● ${capitalize(statusKey)}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  itemsContainer.innerHTML = html;
}

function getStatusColor(status) {
  const colors = {
    available: 'var(--green)',
    used: 'var(--blue)',
    installed: 'var(--purple)',
    reserved: 'var(--orange)',
    defective: 'var(--red)',
    short: 'var(--yellow)'
  };
  return colors[status] || 'var(--text2)';
}

function getSectionColor(section) {
  if (section === 'all') return '#6c5ce7';
  return getStatusColor(section);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ---------- Control functions ----------
function setSection(key) {
  currentSection = key;
  categorySelect.value = key;
  renderAll();
}

function renderAll() {
  renderStats();
  renderItemsTable();
}

// Event listeners
searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.toLowerCase();
  renderAll();
});
categorySelect.addEventListener('change', (e) => setSection(e.target.value));

// Make setSection available globally for stat-card onclick
window.setSection = setSection;

// Initial load
fetchItems();
fetchWallet();