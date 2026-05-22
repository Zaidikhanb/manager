const crypto = require('crypto');

function createToken() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD not set');
  const payload = {
    user: 'admin',
    exp: Date.now() + 86400000
  };
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('hex');
  return `${payloadBase64}.${signature}`;
}

function verifyToken(token) {
  if (!token) return false;
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return false;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('hex');
  if (signature !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    if (payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

module.exports = { createToken, authMiddleware };