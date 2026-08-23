const express =
  require('express');

const {
  query
} =
  require('../config/database');


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

function requireAdmin(
  req,
  res,
  next
) {

  const authorization =
    String(
      req.headers.authorization || ''
    );


  const token =
    authorization.startsWith(
      'Bearer '
    )
      ? authorization
          .slice(7)
          .trim()
      : '';


  const adminKey =
    String(
      process.env.ADMIN_API_KEY || ''
    ).trim();


  if (!adminKey) {

    return res.status(500).json({

      success: false,

      message:
        'Admin authentication is not configured.'

    });

  }


  if (
    !token ||
    token !== adminKey
  ) {

    return res.status(401).json({

      success: false,

      message:
        'Invalid admin access key.'

    });

  }


  next();

}


/*
|--------------------------------------------------------------------------
| ADMIN ACCESS CHECK
|--------------------------------------------------------------------------
*/

router.get(
  '/check',

  requireAdmin,

  (req, res) => {

    res.json({

      success: true,

      message:
        'Admin access granted.'

    });

  }
);


/*
|--------------------------------------------------------------------------
| VALID STATUSES
|--------------------------------------------------------------------------
*/

const VALID_STATUSES = [

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
| GET ALL ORDERS
|--------------------------------------------------------------------------
*/

router.get(
  '/orders',

  requireAdmin,

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
            o.completed_at,
            o.created_at,
            o.updated_at,
            s.name AS service_name

          FROM orders o

          INNER JOIN services s
            ON s.id = o.service_id

          ORDER BY o.created_at DESC
          `
        );


      return res.json({

        success: true,

        orders: result.rows

      });

    } catch (error) {

      next(error);

    }

  }
);


/*
|--------------------------------------------------------------------------
| UPDATE ORDER
|--------------------------------------------------------------------------
*/

router.patch(
  '/orders/:orderNumber',

  requireAdmin,

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


      const status =
        String(
          req.body.status || ''
        )
          .trim();


      const adminNote =
        String(
          req.body.admin_note || ''
        )
          .trim()
          .slice(
            0,
            5000
          );


      /*
      |--------------------------------------------------------------------------
      | VALIDATE ORDER NUMBER
      |--------------------------------------------------------------------------
      */

      if (
        !/^TMF-\d{4}-\d{6}$/.test(
          orderNumber
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid order number.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE STATUS
      |--------------------------------------------------------------------------
      */

      if (
        !VALID_STATUSES.includes(
          status
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid order status.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | GET CURRENT ORDER
      |--------------------------------------------------------------------------
      */

      const currentOrderResult =
        await query(
          `
          SELECT
            id,
            status
          FROM orders
          WHERE order_number = $1
          LIMIT 1
          `,
          [
            orderNumber
          ]
        );


      if (
        currentOrderResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Order not found.'

        });

      }


      const currentOrder =
        currentOrderResult.rows[0];


      /*
      |--------------------------------------------------------------------------
      | UPDATE ORDER
      |--------------------------------------------------------------------------
      */

      const updateResult =
        await query(
          `
          UPDATE orders
          SET
            status = $1,
            admin_note = $2,
            completed_at =
              CASE
                WHEN $1 = 'completed'
                THEN NOW()
                ELSE NULL
              END,
            updated_at = NOW()

          WHERE
            order_number = $3

          RETURNING
            id,
            order_number,
            status,
            admin_note,
            completed_at,
            created_at,
            updated_at
          `,
          [
            status,
            adminNote || null,
            orderNumber
          ]
        );


      if (
        updateResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Unable to update order.'

        });

      }


      const updatedOrder =
        updateResult.rows[0];


      /*
      |--------------------------------------------------------------------------
      | SAVE STATUS HISTORY
      |--------------------------------------------------------------------------
      */

      if (
        currentOrder.status !== status
      ) {

        await query(
          `
          INSERT INTO order_status_history (
            order_id,
            old_status,
            new_status,
            note
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          `,
          [
            currentOrder.id,
            currentOrder.status,
            status,
            adminNote ||
              `Order status changed to ${status}.`
          ]
        );

      }


      /*
      |--------------------------------------------------------------------------
      | SUCCESS RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({

        success: true,

        message:
          'Order updated successfully.',

        order: updatedOrder

      });

    } catch (error) {

      console.error(
        'ADMIN ORDER UPDATE ERROR:',
        error
      );

      next(error);

    }

  }
);


module.exports =
  router;
