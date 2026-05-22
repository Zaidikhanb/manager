const token = sessionStorage.getItem('adminToken');
if (!token) window.location.href = 'admin.html';

async function loadHistory() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.classList.remove('hidden');
  try {
    const res = await fetch('/api/history', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Unauthorized');
    const history = await res.json();
    renderHistory(history);
  } catch (e) {
    document.getElementById('historyList').innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px;">⚠ Could not load history.</p>';
  } finally {
    spinner.classList.add('hidden');
  }
}

function renderHistory(entries) {
  const container = document.getElementById('historyList');
  if (!entries.length) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text3);">No history recorded yet.</p>';
    return;
  }
  container.innerHTML = entries.map(e => `
    <div class="history-entry">
      <div class="history-time">${new Date(e.timestamp).toLocaleString()}</div>
      <div class="history-action">${e.action} — <strong>${esc(e.itemName)}</strong></div>
      ${e.details ? `<div class="history-details">${esc(e.details)}</div>` : ''}
    </div>
  `).join('');
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
loadHistory();