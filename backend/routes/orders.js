// ============================================================
// ORDERS ROUTES - COMPLETE FIXED VERSION
// ============================================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { generateOrderNumber } = require('../utils/orderNumber');

// ============================================================
// TELEGRAM NOTIFICATION - FIXED
// ============================================================
async function sendTelegramNotification(orderDetails) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
        console.log('⚠️ Telegram bot not configured. Skipping notification.');
        return;
    }

    try {
        // Clean the message - NO Markdown formatting
        const message = 
`🔔 NEW ORDER RECEIVED!

Order Number: ${orderDetails.order_number}
Customer: ${orderDetails.customer_name}
Email: ${orderDetails.customer_email}
Telegram: ${orderDetails.telegram_username}
WhatsApp: ${orderDetails.whatsapp_number || 'N/A'}
Service: ${orderDetails.service_name}
Price: $${orderDetails.price}
Details: ${orderDetails.details || 'N/A'}

Track Order: https://timilehin203.github.io/timifxx-marketing/order-status.html?order=${orderDetails.order_number}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: ''  // NO Markdown
            })
        });

        const result = await response.json();
        if (result.ok) {
            console.log('✅ Telegram notification sent!');
        } else {
            console.log('❌ Telegram error:', result.description);
        }
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
    }
}

// ============================================================
// VALIDATION
// ============================================================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// CREATE ORDER
// ============================================================
router.post('/', async (req, res) => {
    try {
        const {
            service_id,
            customer_name,
            customer_email,
            telegram_username,
            whatsapp_number,
            details
        } = req.body;

        console.log('📝 New order:', { service_id, customer_name, customer_email, telegram_username });

        // Validate
        if (!service_id || !customer_name || !customer_email || !telegram_username) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!isValidEmail(customer_email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Get service
        const serviceResult = await query(
            `SELECT id, name, price FROM services WHERE id = $1 AND is_active = true`,
            [service_id]
        );

        if (serviceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const service = serviceResult.rows[0];

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Insert order
        const result = await query(
            `INSERT INTO orders (
                order_number, service_id, customer_name, customer_email, 
                telegram_username, whatsapp_number, details, price, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING id, order_number`,
            [
                orderNumber,
                service_id,
                customer_name,
                customer_email,
                telegram_username,
                whatsapp_number || null,
                details || null,
                service.price
            ]
        );

        const order = result.rows[0];

        // Send Telegram notification
        await sendTelegramNotification({
            order_number: order.order_number,
            customer_name: customer_name,
            customer_email: customer_email,
            telegram_username: telegram_username,
            whatsapp_number: whatsapp_number,
            service_name: service.name,
            price: service.price,
            details: details
        });

        console.log('✅ Order created:', order.order_number);

        res.status(201).json({
            success: true,
            orderNumber: order.order_number,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('❌ Order error:', error);
        res.status(500).json({ error: 'Order could not be submitted' });
    }
});

// ============================================================
// GET ORDER STATUS
// ============================================================
router.get('/status/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const result = await query(
            `SELECT 
                o.order_number, o.customer_name, o.customer_email,
                o.telegram_username, o.whatsapp_number, o.details,
                o.price, o.status, o.created_at,
                s.name as service_name
             FROM orders o
             LEFT JOIN services s ON o.service_id = s.id
             WHERE o.order_number = $1`,
            [orderNumber.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('❌ Status error:', error);
        res.status(500).json({ error: 'Unable to retrieve order status' });
    }
});

module.exports = router;
