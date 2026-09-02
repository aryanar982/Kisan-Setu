const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

// Brute-force protection on auth specifically — see architecture doc §18.
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50 });
app.use('/api/v1/auth', authLimiter);

app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));

app.use('/api/v1', routes);

// 404 for anything unmatched
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Must be last — catches errors forwarded by asyncHandler.
app.use(errorHandler);

module.exports = app;
