const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const walletFile = path.join(dataDir, 'wallet.json');

// Helper to read/write wallet
function readWallet() {
  if (!fs.existsSync(walletFile)) {
    return { balance: 0, transactions: [] };
  }
  return JSON.parse(fs.readFileSync(walletFile, 'utf8'));
}

function writeWallet(data) {
  fs.writeFileSync(walletFile, JSON.stringify(data, null, 2));
}

// GET /api/wallet
app.get('/api/wallet', authenticateToken, (req, res) => {
  const wallet = readWallet();
  res.json(wallet);
});

// POST /api/wallet/transaction
app.post('/api/wallet/transaction', authenticateToken, (req, res) => {
  const { type, description, amount } = req.body;
  if (!['add', 'spend'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description required' });
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const wallet = readWallet();
  const transaction = {
    id: Date.now(),
    type,
    description: description.trim(),
    amount: numAmount,
    timestamp: new Date().toISOString()
  };

  if (type === 'add') {
    wallet.balance += numAmount;
  } else { // spend
    if (wallet.balance < numAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    wallet.balance -= numAmount;
  }
  wallet.transactions.unshift(transaction);
  writeWallet(wallet);
  res.status(201).json({ success: true, balance: wallet.balance });
});