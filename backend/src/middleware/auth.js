const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Verifies the access token and attaches { id, role, centreId? } to req.user.
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = payload; // { id, role, centreId }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

auth.requireAuth = auth;

module.exports = auth;
