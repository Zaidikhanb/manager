// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

let items = [];
let currentSection = 'all';
let collapsedSections = {};

async function fetchItems() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.classList.remove('hidden');
  
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Network error');
    items = await res.json();
  } catch (e) {
    console.error('Failed to fetch items:', e);
    items = [];
  } finally {
    if (spinner) spinner.classList.add('hidden');
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
  
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  
  grid.innerHTML = [
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
  const searchInput = document.getElementById('searchInput');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const container = document.getElementById('sectionsContainer');
  
  if (!container) return;

  let sectionsToShow = sections;
  if (currentSection !== 'all') {
    sectionsToShow = {};
    if (sections[currentSection]) {
      sectionsToShow[currentSection] = sections[currentSection];
    }
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
        <div class="section-body ${isCollapsed ? 'collapsed' : ''}" style="max-height: ${isCollapsed ? '0' : '2000px'};">
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

function toggleSection(key) {
  collapsedSections[key] = !collapsedSections[key];
  renderSections(); // Re-render all sections to update toggle states
}

function setSection(key) {
  currentSection = key;
  
  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${key}"]`);
  if (navItem) navItem.classList.add('active');
  
  renderAll();
}

function esc(s) { 
  const d = document.createElement('div'); 
  d.textContent = s || ''; 
  return d.innerHTML; 
}

function capitalize(s) { 
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1); 
}

function renderAll() { 
  renderStats(); 
  renderSections(); 
}

// Initialize event listeners when DOM is ready
function init() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderAll);
  }
  
  document.querySelectorAll('.nav-item[data-section]').forEach(n => {
    n.addEventListener('click', () => setSection(n.dataset.section));
  });
  
  // Load items
  fetchItems();
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}