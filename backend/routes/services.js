// ============================================================
// SERVICES ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================================
// GET ALL SERVICES (Public)
// ============================================================
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, description, price, price_type, is_active, created_at, updated_at 
             FROM services 
             ORDER BY id ASC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

// ============================================================
// GET SINGLE SERVICE (Public)
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            `SELECT id, name, description, price, price_type, is_active 
             FROM services 
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Failed to load service' });
    }
});

module.exports = router;
