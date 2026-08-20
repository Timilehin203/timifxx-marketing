const express =
  require('express');

const {
  query
} = require('../config/database');


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| GET /api/orders/status/:orderNumber
|--------------------------------------------------------------------------
|
| Public order tracking endpoint.
|
| Only non-sensitive order information is returned.
|
|--------------------------------------------------------------------------
*/

router.get(
  '/status/:orderNumber',
  async (req, res, next) => {

    try {

      const orderNumber =
        String(
          req.params.orderNumber || ''
        )
          .trim()
          .toUpperCase();


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


      const result =
        await query(
          `
          SELECT
            o.order_number,
            s.name AS service_name,
            o.status,
            o.price,
            o.created_at
          FROM orders o
          INNER JOIN services s
            ON s.id = o.service_id
          WHERE o.order_number = $1
          LIMIT 1
          `,
          [orderNumber]
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
| POST /api/orders
|--------------------------------------------------------------------------
|
| Order creation will be connected in the next stage.
|
|--------------------------------------------------------------------------
*/

router.post(
  '/',
  async (req, res) => {

    res.status(501).json({

      success: false,

      message:
        'Order creation will be enabled in Stage 2.'

    });

  }
);


module.exports =
  router;
