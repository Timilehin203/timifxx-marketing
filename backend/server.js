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
// MIDDLEWARE
// ============================================================
// CORS - Allow only frontend origin
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// ============================================================
// ROUTES
// ============================================================
const servicesRoutes = require('./routes/services');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

app.use('/api/services', servicesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Health check
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
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Something went wrong. Please try again later.'
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`TimiFxx Marketing Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
