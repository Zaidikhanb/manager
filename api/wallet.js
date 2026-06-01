const { authMiddleware } = require('./_lib/auth');
const { readJSON, writeJSON, getFile } = require('./_lib/github');

const WALLET_PATH = 'data/wallet.json';

export default async function handler(req, res) {
  // GET allowed without auth; POST requires auth
  if (req.method === 'POST' && !authMiddleware(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const file = await getFile(WALLET_PATH);
    let wallet = file ? JSON.parse(Buffer.from(file.content, 'base64').toString()) : { transactions: [] };
    const sha = file?.sha;

    if (req.method === 'GET') {
      const totalReceived = wallet.transactions
        .filter(t => t.type === 'received')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalUsed = wallet.transactions
        .filter(t => t.type === 'used')
        .reduce((sum, t) => sum + t.amount, 0);
      return res.status(200).json({
        transactions: wallet.transactions.slice(-50),
        totalReceived,
        totalUsed,
        balance: totalReceived - totalUsed
      });
    }

    if (req.method === 'POST') {
      const { type, party, amount } = req.body;
      if (!type || !party || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid transaction data' });
      }
      if (type !== 'received' && type !== 'used') {
        return res.status(400).json({ error: 'Type must be "received" or "used"' });
      }
      const transaction = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        type,
        party,
        amount: parseInt(amount, 10)
      };
      wallet.transactions.unshift(transaction);
      await writeJSON(WALLET_PATH, wallet, sha, `Add wallet ${type}: ${party} ${amount} PKR`);
      
      const totalReceived = wallet.transactions.filter(t => t.type === 'received').reduce((s,t) => s + t.amount, 0);
      const totalUsed = wallet.transactions.filter(t => t.type === 'used').reduce((s,t) => s + t.amount, 0);
      return res.status(200).json({
        transactions: wallet.transactions.slice(-50),
        totalReceived,
        totalUsed,
        balance: totalReceived - totalUsed
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}