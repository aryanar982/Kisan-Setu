const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.clientOrigin || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Brute-force protection on auth
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });
app.use('/api/v1/auth', authLimiter);

app.get('/health', (req, res) => res.json({ success: true, message: 'Kisan Setu API is healthy', timestamp: new Date() }));

app.use('/api/v1', routes);

// 404 for anything unmatched
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Catches errors forwarded by asyncHandler
app.use(errorHandler);

module.exports = app;
