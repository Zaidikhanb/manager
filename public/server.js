const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const walletFile = path.join(dataDir, 'wallet.json');

if (!fs.existsSync(walletFile)) {
  fs.writeFileSync(walletFile, JSON.stringify({ balance: 0, transactions: [] }, null, 2));
}

function readWallet() {
  return JSON.parse(fs.readFileSync(walletFile, 'utf8'));
}
function writeWallet(data) {
  fs.writeFileSync(walletFile, JSON.stringify(data, null, 2));
}

// GET /api/wallet
app.get('/api/wallet', authenticateToken, (req, res) => {
  try {
    res.json(readWallet());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read wallet' });
  }
});

// POST /api/wallet/transaction
app.post('/api/wallet/transaction', authenticateToken, (req, res) => {
  try {
    const { type, description, amount } = req.body;
    if (!['add', 'spend'].includes(type))
      return res.status(400).json({ error: 'Invalid type' });
    if (!description || description.trim() === '')
      return res.status(400).json({ error: 'Description required' });
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0)
      return res.status(400).json({ error: 'Positive amount required' });

    const wallet = readWallet();
    const transaction = {
      id: Date.now(),
      type,
      description: description.trim(),
      amount: num,
      timestamp: new Date().toISOString()
    };
    if (type === 'add') {
      wallet.balance += num;
    } else {
      if (wallet.balance < num)
        return res.status(400).json({ error: 'Insufficient balance' });
      wallet.balance -= num;
    }
    wallet.transactions.unshift(transaction);
    writeWallet(wallet);
    res.status(201).json({ success: true, balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});