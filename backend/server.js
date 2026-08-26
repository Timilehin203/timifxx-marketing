// ============================================================
// TIMI FXX MARKETING - BACKEND SERVER
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

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
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// ============================================================
// ⭐⭐ FORCE RESET ADMIN - RUN THIS ONCE!
// Visit: /api/force-reset-admin
// ============================================================
app.get('/api/force-reset-admin', async (req, res) => {
    try {
        const { query } = require('./config/database');
        
        console.log('🔧 FORCE RESETTING ADMIN...');

        // 1. Delete all existing admins
        await query('DELETE FROM admins;');
        console.log('✅ All admins deleted');

        // 2. Create new admin with CORRECT password
        // Password: Admin2034462
        const hashedPassword = await bcrypt.hash('Admin2034462', 10);
        console.log('🔐 New password hash created');

        // 3. Insert the admin
        await query(
            `INSERT INTO admins (email, password_hash, is_active) 
             VALUES ($1, $2, true)`,
            ['timinii156@gmail.com', hashedPassword]
        );
        console.log('✅ Admin created: timinii156@gmail.com');

        // 4. Verify it worked
        const result = await query('SELECT id, email, is_active FROM admins;');
        
        // 5. Verify password works
        const verifyResult = await query('SELECT password_hash FROM admins WHERE email = $1', ['timinii156@gmail.com']);
        const storedHash = verifyResult.rows[0].password_hash;
        const passwordWorks = await bcrypt.compare('Admin2034462', storedHash);

        console.log('📋 Admin in DB:', result.rows);
        console.log('🔐 Password verification:', passwordWorks ? '✅ WORKS!' : '❌ FAILED');

        res.json({
            success: true,
            message: 'Admin force reset complete!',
            admin: result.rows[0],
            password_verified: passwordWorks,
            credentials: {
                email: 'timinii156@gmail.com',
                password: 'Admin2034462'
            },
            instruction: 'Now go to https://timilehin203.github.io/timifxx-marketing/admin.html and login!'
        });

    } catch (error) {
        console.error('❌ Reset failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================================
// ⭐⭐ CHECK ADMIN - DEBUG ROUTE
// ============================================================
app.get('/api/check-admin', async (req, res) => {
    try {
        const { query } = require('./config/database');
        
        const result = await query('SELECT id, email, is_active FROM admins;');
        console.log('📋 Current admins:', result.rows);

        res.json({
            admins: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// ⭐⭐ FIXED ADMIN LOGIN
// ============================================================
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { query } = require('./config/database');

        console.log('🔑 Login attempt:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get admin from database
        const result = await query(
            'SELECT id, email, password_hash FROM admins WHERE email = $1 AND is_active = true',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ Admin not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = result.rows[0];

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        console.log('🔐 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Login successful:', email);

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ============================================================
// TEST TELEGRAM
// ============================================================
app.get('/api/test-telegram', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

        if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
            return res.json({
                success: false,
                message: 'Telegram not configured',
                bot_token_set: !!BOT_TOKEN,
                chat_id_set: !!ADMIN_CHAT_ID
            });
        }

        const message = '✅ Test message from TimiFxx Marketing Bot!';
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message })
        });

        const result = await response.json();
        res.json({ success: result.ok, result });

    } catch (error) {
        res.json({ success: false, error: error.message });
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
