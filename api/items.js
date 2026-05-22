const { authMiddleware } = require('./_lib/auth');
const { readJSON, writeJSON, getFile } = require('./_lib/github');

const ITEMS_PATH = 'data/items.json';
const HISTORY_PATH = 'data/history.json';

async function logHistory(action, itemId, itemName, details = '') {
  try {
    const histFile = await getFile(HISTORY_PATH);
    let history = histFile ? JSON.parse(Buffer.from(histFile.content, 'base64').toString()) : [];
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      itemId,
      itemName,
      details
    };
    history.unshift(entry);
    if (history.length > 500) history = history.slice(0, 500);
    await writeJSON(HISTORY_PATH, history, histFile?.sha, `Log: ${action} ${itemName}`);
  } catch (e) {
    console.error('History log failed:', e);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    if (!authMiddleware(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const file = await getFile(ITEMS_PATH);
    let items = file ? JSON.parse(Buffer.from(file.content, 'base64').toString()) : [];
    const sha = file?.sha;

    switch (req.method) {
      case 'GET': {
        const enriched = items.map(item => ({
          ...item,
          displayStatus: item.quantity < 5 && item.status !== 'defective' ? 'short' : item.status,
          isShort: item.quantity < 5 && item.status !== 'defective'
        }));
        return res.status(200).json(enriched);
      }

      case 'POST': {
        const { name, number, quantity, status } = req.body;
        if (!name || !quantity) return res.status(400).json({ error: 'Name and quantity required' });
        const newItem = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          name,
          number: number || '',
          quantity: parseInt(quantity, 10),
          status: status || 'available'
        };
        items.unshift(newItem);
        await writeJSON(ITEMS_PATH, items, sha, `Add item "${name}"`);
        await logHistory('added', newItem.id, newItem.name);
        return res.status(201).json(newItem);
      }

      case 'PUT': {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return res.status(404).json({ error: 'not found' });
        const oldItem = { ...items[index] };
        items[index] = { ...items[index], ...updates };
        await writeJSON(ITEMS_PATH, items, sha, `Update item "${items[index].name}"`);
        const changes = Object.keys(updates)
          .filter(k => k !== 'id' && updates[k] !== oldItem[k])
          .map(k => `${k}: "${oldItem[k]}" → "${updates[k]}"`)
          .join(', ');
        await logHistory('updated', items[index].id, items[index].name, changes);
        return res.status(200).json(items[index]);
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return res.status(404).json({ error: 'not found' });
        const removed = items.splice(index, 1)[0];
        await writeJSON(ITEMS_PATH, items, sha, `Delete item "${removed.name}"`);
        await logHistory('deleted', removed.id, removed.name);
        return res.status(200).json({ success: true });
      }

      default:
        res.setHeader('Allow', 'GET, POST, PUT, DELETE');
        return res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}