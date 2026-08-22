const express =
  require('express');

const {
  query
} = require('../config/database');


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function generateOrderNumber() {

  const year =
    new Date()
      .getFullYear();


  const random =
    Math.floor(
      100000 +
      Math.random() * 900000
    );


  return `TMF-${year}-${random}`;

}


function cleanText(
  value,
  maxLength
) {

  return String(
    value || ''
  )
    .trim()
    .slice(
      0,
      maxLength
    );

}


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
| POST /api/orders
|--------------------------------------------------------------------------
|
| Creates a new customer order.
|
|--------------------------------------------------------------------------
*/

router.post(
  '/',
  async (req, res, next) => {

    try {

      const serviceId =
        Number(
          req.body.serviceId
        );


      const customerName =
        cleanText(
          req.body.name,
          100
        );


      const customerEmail =
        cleanText(
          req.body.email,
          254
        )
          .toLowerCase();


      const telegramUsername =
        cleanText(
          req.body.telegramUsername,
          64
        );


      const whatsapp =
        cleanText(
          req.body.whatsapp,
          32
        );


      const customerMessage =
        cleanText(
          req.body.message,
          5000
        );


      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(
          serviceId
        ) ||
        serviceId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Please select a valid service.'

        });

      }


      if (
        customerName.length < 2
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Please enter your name.'

        });

      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          customerEmail
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Please enter a valid email address.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | GET SERVICE
      |--------------------------------------------------------------------------
      |
      | Price is always taken from the database.
      | The customer cannot choose their own price.
      |
      |--------------------------------------------------------------------------
      */

      const serviceResult =
        await query(
          `
          SELECT
            id,
            name,
            price,
            price_type,
            is_active
          FROM services
          WHERE id = $1
          LIMIT 1
          `,
          [
            serviceId
          ]
        );


      if (
        serviceResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Selected service was not found.'

        });

      }


      const service =
        serviceResult.rows[0];


      if (
        service.is_active !== true
      ) {

        return res.status(400).json({

          success: false,

          message:
            'This service is currently unavailable.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | CREATE UNIQUE ORDER
      |--------------------------------------------------------------------------
      */

      let orderNumber =
        generateOrderNumber();


      let orderCreated =
        false;


      let createdOrder =
        null;


      for (
        let attempt = 0;
        attempt < 10;
        attempt++
      ) {

        orderNumber =
          generateOrderNumber();


        try {

          const orderResult =
            await query(
              `
              INSERT INTO orders (
                order_number,
                service_id,
                customer_name,
                customer_email,
                telegram_username,
                whatsapp,
                message,
                price,
                status
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                'pending'
              )
              RETURNING
                id,
                order_number,
                status,
                price,
                created_at
              `,
              [
                orderNumber,
                service.id,
                customerName,
                customerEmail,
                telegramUsername || null,
                whatsapp || null,
                customerMessage || null,
                service.price
              ]
            );


          createdOrder =
            orderResult.rows[0];


          orderCreated =
            true;


          break;

        } catch (error) {

          /*
          |--------------------------------------------------------------------------
          | PostgreSQL duplicate key error
          |--------------------------------------------------------------------------
          */

          if (
            error.code === '23505'
          ) {

            continue;

          }


          throw error;

        }

      }


      if (
        !orderCreated ||
        !createdOrder
      ) {

        throw new Error(
          'Unable to generate a unique order number.'
        );

      }


      /*
      |--------------------------------------------------------------------------
      | CREATE INITIAL STATUS HISTORY
      |--------------------------------------------------------------------------
      */

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
          NULL,
          'pending',
          'Order created.'
        )
        `,
        [
          createdOrder.id
        ]
      );


      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      res.status(201).json({

        success: true,

        message:
          'Order created successfully.',

        order: {

          orderNumber:
            createdOrder.order_number,

          service:
            service.name,

          price:
            createdOrder.price,

          priceType:
            service.price_type,

          status:
            createdOrder.status,

          createdAt:
            createdOrder.created_at

        },

        telegramUrl:
          `https://t.me/timifxx203?text=${encodeURIComponent(
            `Hello, I just placed an order on TimiFxx Marketing.\n\nOrder Number: ${createdOrder.order_number}\nService: ${service.name}`
          )}`

      });

    } catch (error) {

      next(error);

    }

  }
);


module.exports =
  router;
