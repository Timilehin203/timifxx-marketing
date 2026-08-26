// ============================================================
// ADMIN ROUTES - COMPLETE FIXED
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================================
// ADMIN LOGIN - WITH DEBUGGING
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

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
        console.log('✅ Admin found:', admin.email);

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        console.log('🔐 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
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
// GET DASHBOARD STATS
// ============================================================
router.get('/dashboard', authenticate, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
            FROM orders
        `);

        const recentOrders = await query(`
            SELECT o.id, o.order_number, o.customer_name, o.price, o.status, o.created_at,
                   s.name as service_name
            FROM orders o
            LEFT JOIN services s ON o.service_id = s.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        res.json({
            ...stats.rows[0],
            recentOrders: recentOrders.rows
        });

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// ============================================================
// GET ALL ORDERS
// ============================================================
router.get('/orders', authenticate, async (req, res) => {
    try {
        const result = await query(`
            SELECT o.id, o.order_number, o.customer_name, o.price, o.status, o.created_at,
                   s.name as service_name
            FROM orders o
            LEFT JOIN services s ON o.service_id = s.id
            ORDER BY o.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Orders error:', error);
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

// ============================================================
// GET SINGLE ORDER
// ============================================================
router.get('/orders/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT o.*, s.name as service_name
            FROM orders o
            LEFT JOIN services s ON o.service_id = s.id
            WHERE o.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Order detail error:', error);
        res.status(500).json({ error: 'Failed to load order details' });
    }
});

// ============================================================
// UPDATE ORDER STATUS
// ============================================================
router.patch('/orders/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await query(
            `UPDATE orders 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, order_number, status`,
            [status.toLowerCase(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            success: true,
            order: result.rows[0],
            message: 'Order status updated'
        });

    } catch (error) {
        console.error('❌ Status update error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// ============================================================
// UPDATE ORDER NOTES
// ============================================================
router.patch('/orders/:id/notes', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const result = await query(
            `UPDATE orders 
             SET admin_notes = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, order_number, admin_notes`,
            [notes || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            success: true,
            order: result.rows[0],
            message: 'Notes saved'
        });

    } catch (error) {
        console.error('❌ Notes error:', error);
        res.status(500).json({ error: 'Failed to save notes' });
    }
});

// ============================================================
// GET ALL SERVICES (Admin)
// ============================================================
router.get('/services', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, description, price, price_type, is_active, created_at, updated_at 
             FROM services 
             ORDER BY id ASC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Services error:', error);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

// ============================================================
// UPDATE SERVICE PRICE
// ============================================================
router.patch('/services/:id/price', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        if (price === undefined || price === null || price < 0) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        const result = await query(
            `UPDATE services 
             SET price = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, name, price`,
            [price, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json({
            success: true,
            service: result.rows[0],
            message: 'Price updated successfully'
        });

    } catch (error) {
        console.error('❌ Price update error:', error);
        res.status(500).json({ error: 'Failed to update price' });
    }
});

// ============================================================
// UPDATE SERVICE STATUS
// ============================================================
router.patch('/services/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const result = await query(
            `UPDATE services 
             SET is_active = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, name, is_active`,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json({
            success: true,
            service: result.rows[0],
            message: `Service ${is_active ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('❌ Service status error:', error);
        res.status(500).json({ error: 'Failed to update service status' });
    }
});

// ============================================================
// CHANGE ADMIN PASSWORD
// ============================================================
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.admin.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const adminResult = await query(
            'SELECT password_hash FROM admins WHERE id = $1',
            [adminId]
        );

        if (adminResult.rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, adminResult.rows[0].password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await query(
            'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, adminId]
        );

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('❌ Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;
