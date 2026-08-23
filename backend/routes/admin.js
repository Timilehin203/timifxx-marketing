const express =
  require('express');


const {
  query
} =
  require('../config/database');


const adminAuth =
  require('../middleware/adminAuth');


const router =
  express.Router();


const allowedStatuses = [

  'pending',

  'paid',

  'in_progress',

  'waiting_customer',

  'completed',

  'cancelled',

  'declined'

];


/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

router.use(
  adminAuth
);


/*
|--------------------------------------------------------------------------
| GET /api/admin/orders
|--------------------------------------------------------------------------
|
| Returns all orders.
|
|--------------------------------------------------------------------------
*/

router.get(
  '/orders',
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await query(
          `
          SELECT
            o.id,
            o.order_number,
            o.customer_name,
            o.customer_email,
            o.telegram_username,
            o.whatsapp,
            o.message,
            o.price,
            o.status,
            o.admin_note,
            o.created_at,
            o.updated_at,
            o.completed_at,

            s.id AS service_id,
            s.name AS service_name,
            s.slug AS service_slug,
            s.turnaround_text

          FROM orders o

          INNER JOIN services s
            ON s.id = o.service_id

          ORDER BY
            o.created_at DESC
          `
        );


      res.json({

        success: true,

        orders:
          result.rows

      });

    } catch (error) {

      next(error);

    }

  }
);


/*
|--------------------------------------------------------------------------
| GET /api/admin/orders/:orderNumber
|--------------------------------------------------------------------------
|
| Returns one complete order.
|
|--------------------------------------------------------------------------
*/

router.get(
  '/orders/:orderNumber',
  async (
    req,
    res,
    next
  ) => {

    try {

      const orderNumber =
        String(
          req.params.orderNumber || ''
        )
          .trim()
          .toUpperCase();


      const result =
        await query(
          `
          SELECT
            o.id,
            o.order_number,
            o.customer_name,
            o.customer_email,
            o.telegram_username,
            o.whatsapp,
            o.message,
            o.price,
            o.status,
            o.admin_note,
            o.created_at,
            o.updated_at,
            o.completed_at,

            s.id AS service_id,
            s.name AS service_name,
            s.slug AS service_slug,
            s.turnaround_text

          FROM orders o

          INNER JOIN services s
            ON s.id = o.service_id

          WHERE
            o.order_number = $1

          LIMIT 1
          `,
          [
            orderNumber
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Order not found.'

        });

      }


      res.json({

        success: true,

        order:
          result.rows[0]

      });

    } catch (error) {

      next(error);

    }

  }
);


/*
|--------------------------------------------------------------------------
| PATCH /api/admin/orders/:orderNumber
|--------------------------------------------------------------------------
|
| Update order status and admin note.
|
|--------------------------------------------------------------------------
*/

router.patch(
  '/orders/:orderNumber',
  async (
    req,
    res,
    next
  ) => {

    try {

      const orderNumber =
        String(
          req.params.orderNumber || ''
        )
          .trim()
          .toUpperCase();


      const requestedStatus =
        req.body.status !== undefined
          ? String(
              req.body.status
            )
              .trim()
              .toLowerCase()
          : null;


      const requestedNote =
        req.body.admin_note !== undefined
          ? String(
              req.body.admin_note
            )
              .trim()
          : null;


      if (
        requestedStatus !== null &&
        !allowedStatuses.includes(
          requestedStatus
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid order status.'

        });

      }


      if (
        requestedNote !== null &&
        requestedNote.length > 5000
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Admin note is too long.'

        });

      }


      const existingResult =
        await query(
          `
          SELECT
            id,
            status

          FROM orders

          WHERE
            order_number = $1

          LIMIT 1
          `,
          [
            orderNumber
          ]
        );


      if (
        existingResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Order not found.'

        });

      }


      const existingOrder =
        existingResult.rows[0];


      const newStatus =
        requestedStatus !== null
          ? requestedStatus
          : existingOrder.status;


      const updateResult =
        await query(
          `
          UPDATE orders

          SET

            status = $1,

            admin_note = COALESCE(
              $2,
              admin_note
            ),

            completed_at = CASE

              WHEN $1 = 'completed'
              THEN NOW()

              ELSE completed_at

            END

          WHERE
            id = $3

          RETURNING
            id,
            order_number,
            status,
            admin_note,
            updated_at,
            completed_at
          `,
          [

            newStatus,

            requestedNote,

            existingOrder.id

          ]
        );


      if (
        existingOrder.status !==
        newStatus
      ) {

        await query(
          `
          INSERT INTO order_status_history (

            order_id,

            old_status,

            new_status,

            note,

            changed_by

          )

          VALUES (

            $1,

            $2,

            $3,

            $4,

            NULL

          )
          `,
          [

            existingOrder.id,

            existingOrder.status,

            newStatus,

            requestedNote

          ]
        );

      }


      res.json({

        success: true,

        message:
          'Order updated successfully.',

        order:
          updateResult.rows[0]

      });

    } catch (error) {

      next(error);

    }

  }
);


module.exports =
  router;
