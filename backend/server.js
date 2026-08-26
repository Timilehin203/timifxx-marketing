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
// ⭐ ONE-TIME ADMIN SETUP ROUTE - RUN THIS ONCE!
// ============================================================
app.get('/api/setup-admin', async (req, res) => {
    try {
        const { query } = require('./config/database');
        
        console.log('🔧 Running admin setup...');

        // Delete existing admins
        await query('DELETE FROM admins;');
        console.log('✅ Old admins deleted');

        // Insert new admin
        // Email: timinii156@gmail.com
        // Password: Admin2034462
        await query(
            `INSERT INTO admins (email, password_hash, is_active) 
             VALUES ($1, $2, true)`,
            [
                'timinii156@gmail.com',
                '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
            ]
        );
        console.log('✅ Admin created: timinii156@gmail.com');

        // Verify
        const result = await query('SELECT id, email, is_active FROM admins;');
        console.log('📋 Admins in database:', result.rows);

        res.json({
            success: true,
            message: 'Admin setup complete!',
            admins: result.rows,
            credentials: {
                email: 'timinii156@gmail.com',
                password: 'Admin2034462'
            }
        });

    } catch (error) {
        console.error('❌ Setup failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================
// ⭐ ONE-TIME TELEGRAM TEST ROUTE
// ============================================================
app.get('/api/test-telegram', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

        if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
            return res.json({
                success: false,
                message: 'Telegram bot not configured. Please add TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID to environment variables.',
                bot_token_set: !!BOT_TOKEN,
                chat_id_set: !!ADMIN_CHAT_ID
            });
        }

        const message = '✅ Test message from TimiFxx Marketing Bot! Your notifications are working! 🎉';
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message
            })
        });

        const result = await response.json();

        if (result.ok) {
            res.json({
                success: true,
                message: '✅ Telegram test message sent successfully! Check your Telegram!'
            });
        } else {
            res.json({
                success: false,
                error: result.description,
                full_response: result
            });
        }

    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
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
