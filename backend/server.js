// ============================================================
// TIMI FXX MARKETING - BACKEND SERVER
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// CORS CONFIGURATION
// ============================================================

const allowedOrigins = [
    'https://timilehin203.github.io',
    'https://timilehin203.github.io/timifxx-marketing',
    'https://timifxx-marketing-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL
].filter(Boolean);

console.log('✅ Allowed origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ Blocked CORS origin:', origin);
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// ============================================================
// LOGGING MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
    next();
});

// ============================================================
// ROUTES
// ============================================================
const servicesRoutes = require('./routes/services');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

app.use('/api/services', servicesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
    const { pool } = require('./config/database');
    let dbStatus = 'disconnected';
    
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        dbStatus = 'connected';
    } catch (error) {
        console.error('Health check DB error:', error);
        dbStatus = 'disconnected';
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Something went wrong. Please try again later.'
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 TimiFxx Marketing Backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Allowed CORS origins:`, allowedOrigins);
});
