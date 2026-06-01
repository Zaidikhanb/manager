let walletData = { transactions: [], totalReceived: 0, totalUsed: 0 };
let balanceChart = null;

async function fetchWalletData() {
  try {
    const res = await fetch('/api/wallet');
    if (!res.ok) throw new Error('Failed to fetch');
    walletData = await res.json();
    updateUI();
  } catch (err) {
    console.error(err);
    document.getElementById('transactionsBody').innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--red);">⚠️ Could not load wallet data</td></tr>';
  }
}

function updateUI() {
  const received = walletData.totalReceived || 0;
  const used = walletData.totalUsed || 0;
  const balance = received - used;

  // Update stats cards
  document.getElementById('totalReceived').textContent = `${received.toLocaleString()} PKR`;
  document.getElementById('totalUsed').textContent = `${used.toLocaleString()} PKR`;
  const balanceEl = document.getElementById('walletBalance');
  balanceEl.textContent = `${balance.toLocaleString()} PKR`;
  if (balance < 0) {
    balanceEl.style.color = 'var(--red)';
    document.getElementById('balanceTrend').innerHTML = `⚠️ Deficit of ${Math.abs(balance).toLocaleString()} PKR`;
  } else if (balance > 0) {
    balanceEl.style.color = 'var(--green)';
    document.getElementById('balanceTrend').innerHTML = `✅ Positive balance`;
  } else {
    balanceEl.style.color = 'var(--text2)';
    document.getElementById('balanceTrend').innerHTML = `⚖️ Balanced`;
  }

  // Render transactions table
  const tbody = document.getElementById('transactionsBody');
  if (!walletData.transactions || walletData.transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No transactions yet.</td></tr>';
  } else {
    tbody.innerHTML = walletData.transactions.map(t => {
      const date = new Date(t.timestamp);
      const formatted = date.toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const typeClass = t.type === 'received' ? 'received-badge' : 'used-badge';
      const typeIcon = t.type === 'received' ? '💰' : '💸';
      return `
        <tr>
          <td style="white-space:nowrap;">${escapeHtml(formatted)}</td>
          <td><span class="status-badge ${typeClass}">${typeIcon} ${t.type === 'received' ? 'Received' : 'Used'}</span></td>
          <td>${escapeHtml(t.party)}</td>
          <td style="font-weight:600;">${t.amount.toLocaleString()} PKR</td>
        </tr>
      `;
    }).join('');
  }

  // Render chart (balance over time, cumulative)
  renderBalanceChart();
}

function renderBalanceChart() {
  const ctx = document.getElementById('balanceChart').getContext('2d');
  const transactions = [...(walletData.transactions || [])].reverse(); // oldest first for cumulative sum
  let cumulative = 0;
  const labels = [];
  const balancePoints = [];

  for (let t of transactions) {
    const date = new Date(t.timestamp);
    const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    labels.push(label);
    if (t.type === 'received') cumulative += t.amount;
    else cumulative -= t.amount;
    balancePoints.push(cumulative);
  }

  // If we have very few transactions, still show them
  if (balanceChart) balanceChart.destroy();
  balanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cumulative Balance (PKR)',
        data: balancePoints,
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108,92,231,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#6c5ce7',
        pointBorderColor: '#fff',
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: 'var(--text2)' } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toLocaleString()} PKR` } }
      },
      scales: {
        y: { ticks: { color: 'var(--text2)', callback: (val) => val.toLocaleString() + ' PKR' } },
        x: { ticks: { color: 'var(--text2)', maxRotation: 45, autoSkip: true } }
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Load data
fetchWalletData();