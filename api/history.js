const { authMiddleware } = require('./_lib/auth');
const { readJSON } = require('./_lib/github');

export default async function handler(req, res) {
  if (!authMiddleware(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const history = await readJSON('data/history.json');
    return res.status(200).json(history.slice(0, 200));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}