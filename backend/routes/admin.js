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
| ADMIN ACCESS CHECK
|--------------------------------------------------------------------------
*/

router.get(
  '/check',

  requireAdmin,

  (
    req,
    res
  ) => {

    return res.json({

      success: true,

      message:
        'Admin access granted.'

    });

  }
);


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

          LEFT JOIN services s
            ON s.id = o.service_id

          ORDER BY
            o.created_at DESC
          `
        );


      return res.json({

        success: true,

        orders:
          result.rows

      });

    } catch (
      error
    ) {

      console.error(
        'ADMIN GET ORDERS ERROR:',
        error
      );


      next(
        error
      );

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

      /*
      |--------------------------------------------------------------------------
      | GET AND CLEAN DATA
      |--------------------------------------------------------------------------
      */

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
          .trim()
          .toLowerCase();


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
      | DEBUG LOG
      |--------------------------------------------------------------------------
      */

      console.log(
        'ADMIN UPDATE REQUEST:',
        {

          orderNumber,

          status,

          adminNote

        }
      );


      /*
      |--------------------------------------------------------------------------
      | VALIDATE ORDER NUMBER
      |--------------------------------------------------------------------------
      */

      if (
        !orderNumber
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Order number is required.'

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
            `Invalid order status: ${status}`

        });

      }


      /*
      |--------------------------------------------------------------------------
      | FIND CURRENT ORDER
      |--------------------------------------------------------------------------
      */

      const currentOrderResult =
        await query(
          `
          SELECT
            id,
            order_number,
            status,
            admin_note

          FROM orders

          WHERE
            UPPER(
              TRIM(order_number)
            ) = $1

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
            `Order "${orderNumber}" was not found.`

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
            id = $3

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

            currentOrder.id

          ]
        );


      /*
      |--------------------------------------------------------------------------
      | CHECK UPDATE
      |--------------------------------------------------------------------------
      */

      if (
        updateResult.rows.length === 0
      ) {

        return res.status(500).json({

          success: false,

          message:
            'The database did not return the updated order.'

        });

      }


      const updatedOrder =
        updateResult.rows[0];


      /*
      |--------------------------------------------------------------------------
      | DEBUG UPDATED RESULT
      |--------------------------------------------------------------------------
      */

      console.log(
        'ADMIN UPDATE SUCCESS:',
        updatedOrder
      );


      /*
      |--------------------------------------------------------------------------
      | SAVE STATUS HISTORY
      |--------------------------------------------------------------------------
      */

      if (
        currentOrder.status !==
        updatedOrder.status
      ) {

        try {

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

              updatedOrder.status,

              adminNote ||
                `Order status changed from ${currentOrder.status} to ${updatedOrder.status}.`

            ]
          );

        } catch (
          historyError
        ) {

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT:
          |
          | Do not fail the whole order update if the history table
          | has a problem.
          |--------------------------------------------------------------------------
          */

          console.error(
            'ORDER HISTORY ERROR:',
            historyError
          );

        }

      }


      /*
      |--------------------------------------------------------------------------
      | VERIFY DATABASE SAVED THE NEW STATUS
      |--------------------------------------------------------------------------
      */

      const verifyResult =
        await query(
          `
          SELECT
            id,
            order_number,
            status,
            admin_note,
            completed_at,
            created_at,
            updated_at

          FROM orders

          WHERE id = $1

          LIMIT 1
          `,
          [
            currentOrder.id
          ]
        );


      if (
        verifyResult.rows.length === 0
      ) {

        return res.status(500).json({

          success: false,

          message:
            'Order was updated but could not be verified.'

        });

      }


      const verifiedOrder =
        verifyResult.rows[0];


      /*
      |--------------------------------------------------------------------------
      | FINAL VERIFICATION
      |--------------------------------------------------------------------------
      */

      if (
        verifiedOrder.status !==
        status
      ) {

        console.error(
          'STATUS VERIFICATION FAILED:',
          {

            requestedStatus:
              status,

            databaseStatus:
              verifiedOrder.status

          }
        );


        return res.status(500).json({

          success: false,

          message:
            `Status was not saved correctly. Database returned "${verifiedOrder.status}".`

        });

      }


      /*
      |--------------------------------------------------------------------------
      | SUCCESS RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({

        success: true,

        message:
          `Order updated to ${verifiedOrder.status}.`,

        order:
          verifiedOrder

      });

    } catch (
      error
    ) {

      console.error(
        'ADMIN ORDER UPDATE ERROR:',
        error
      );


      next(
        error
      );

    }

  }
);


module.exports =
  router;
