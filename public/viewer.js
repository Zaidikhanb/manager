let items = [];
let currentSection = 'all';
let collapsedSections = {};

const SCROLLABLE_MAX_HEIGHT = "460px";   // each section gets its own vertical scroll

// ---------- Fetch or generate inventory ----------
async function fetchItems() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.classList.remove('hidden');
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Network error');
    items = await res.json();
  } catch (e) {
    console.warn("Using demo inventory data");
    items = generateDemoInventory();
  } finally {
    spinner.classList.add('hidden');
  }
  renderAll();
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
  // extra realistic items
  demo.push({ id: 101, name: "Ergonomic Office Chair", number: "CHAIR-221", quantity: 12, status: "available", displayStatus: "available", isShort: false });
  demo.push({ id: 102, name: "Bluetooth Adapter", number: "BT-5.3", quantity: 2, status: "short", displayStatus: "short", isShort: true });
  demo.push({ id: 103, name: "Graphic Tablet", number: "TAB-M7", quantity: 5, status: "reserved", displayStatus: "reserved", isShort: false });
  demo.push({ id: 104, name: "Broken Screen Device", number: "SCR-001", quantity: 1, status: "defective", displayStatus: "defective", isShort: false });
  return demo;
}

// ---------- Group items by status ----------
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
    const statusKey = item.displayStatus || item.status;
    if (sections[statusKey]) sections[statusKey].items.push(item);
  });
  return sections;
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

function renderStats() {
  const sections = getSections();
  const allCount = items.length;
  const grid = document.getElementById('statsGrid');
  const stats = [
    { key: 'all', label: 'All Items', color: '#6c5ce7', count: allCount, icon: 'all' },
    { key: 'available', label: 'Available', color: 'var(--green)', count: sections.available.items.length, icon: 'available' },
    { key: 'used', label: 'In Use', color: 'var(--blue)', count: sections.used.items.length, icon: 'used' },
    { key: 'installed', label: 'Installed', color: 'var(--purple)', count: sections.installed.items.length, icon: 'installed' },
    { key: 'reserved', label: 'Reserved', color: 'var(--orange)', count: sections.reserved.items.length, icon: 'reserved' },
    { key: 'defective', label: 'Defective', color: 'var(--red)', count: sections.defective.items.length, icon: 'defective' },
    { key: 'short', label: 'Low Stock', color: 'var(--yellow)', count: sections.short.items.length, icon: 'short' }
  ];
  grid.innerHTML = stats.map(c => `
    <div class="stat-card ${currentSection === c.key ? 'active-section' : ''}" onclick="window.setSection('${c.key}')">
      <div class="stat-icon" style="background:${c.color}22;color:${c.color}">${getIcon(c.icon)}</div>
      <div class="stat-value" style="color:${c.color}">${c.count}</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
}

function renderSections() {
  const sections = getSections();
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const container = document.getElementById('sectionsContainer');
  let sectionsToShow = currentSection === 'all' ? sections : { [currentSection]: sections[currentSection] };
  let html = '';

  for (const [key, section] of Object.entries(sectionsToShow)) {
    if (!section) continue;
    let filteredItems = section.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      (item.number || '').toLowerCase().includes(searchTerm)
    );
    const isCollapsed = collapsedSections[key] || false;
    const itemCount = filteredItems.length;
    const maxHeightStyle = isCollapsed ? '0' : SCROLLABLE_MAX_HEIGHT;

    html += `
      <div class="section-card">
        <div class="section-header" onclick="window.toggleSection('${key}')">
          <div class="section-header-left">
            <div class="section-icon" style="background:${section.color}22;color:${section.color}">
              ${getIcon(section.icon)}
            </div>
            <span class="section-title">${section.label}</span>
            <span class="section-count">(${itemCount})</span>
          </div>
          <div class="section-toggle ${isCollapsed ? 'collapsed' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="section-body ${isCollapsed ? 'collapsed' : ''}" id="sectionBody_${key}" style="max-height: ${maxHeightStyle}; overflow-y: auto; overflow-x: auto;">
          ${itemCount === 0 ? `<div class="empty-section">✨ No items match your filter</div>` : `
            <table class="section-table">
              <thead>
                <tr><th>Item Name</th><th>Serial / Number</th><th>Quantity</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${filteredItems.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">
                        <div class="item-avatar" style="background:${section.color}22;color:${section.color}">
                          ${escapeHtml(item.name.charAt(0).toUpperCase())}
                        </div>
                        <strong>${escapeHtml(item.name)}</strong>
                      </div>
                    </td>
                    <td>${escapeHtml(item.number || '—')}</td>
                    <td>
                      <span class="${item.isShort || (item.status === 'short' && item.quantity < 5) ? 'qty-warning' : ''}">
                        ${item.isShort ? '⚠ ' : ''}${item.quantity}
                      </span>
                    </td>
                    <td><span class="status-badge status-${item.displayStatus || item.status}">● ${capitalize(item.displayStatus || item.status)}</span></td>
                  </tr>
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

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

window.toggleSection = function(key) {
  collapsedSections[key] = !collapsedSections[key];
  const bodyDiv = document.getElementById(`sectionBody_${key}`);
  if (bodyDiv) {
    if (collapsedSections[key]) {
      bodyDiv.style.maxHeight = '0';
      bodyDiv.classList.add('collapsed');
    } else {
      bodyDiv.style.maxHeight = SCROLLABLE_MAX_HEIGHT;
      bodyDiv.classList.remove('collapsed');
    }
  }
  renderSections();
};

window.setSection = function(key) {
  currentSection = key;
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-section="${key}"]`);
  if (activeNav) activeNav.classList.add('active');
  renderAll();
};

function renderAll() {
  renderStats();
  renderSections();
}

document.getElementById('searchInput').addEventListener('input', () => renderAll());
document.querySelectorAll('.nav-item[data-section]').forEach(nav => {
  nav.addEventListener('click', () => setSection(nav.dataset.section));
});

fetchItems();