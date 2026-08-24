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
| VALID ORDER STATUSES
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
| VALID PRICE TYPES
|--------------------------------------------------------------------------
*/

const VALID_PRICE_TYPES = [

  'fixed',
  'starting_from',
  'contact'

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
| GET ALL SERVICES
|--------------------------------------------------------------------------
*/

router.get(
  '/services',

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      console.log(
        'ADMIN SERVICES REQUEST RECEIVED'
      );


      const result =
        await query(
          `
          SELECT
            id,
            name,
            slug,
            description,
            price,
            price_type,
            turnaround_text,
            is_active,
            sort_order,
            created_at,
            updated_at
          FROM services
          ORDER BY
            sort_order ASC,
            id ASC
          `
        );


      console.log(
        `ADMIN SERVICES FOUND: ${result.rows.length}`
      );


      return res.json({

        success: true,

        services:
          result.rows

      });

    } catch (
      error
    ) {

      console.error(
        'ADMIN GET SERVICES ERROR:',
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

          FROM orders AS o

          INNER JOIN services AS s
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


      const updatedOrder =
        updateResult.rows[0];


      if (
        currentOrder.status !==
        status
      ) {

        const historyNote =
          adminNote ||
          `Order status changed to ${status}.`;


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

            historyNote

          ]
        );

      }


      return res.json({

        success: true,

        message:
          'Order updated successfully.',

        order:
          updatedOrder

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


/*
|--------------------------------------------------------------------------
| CREATE SERVICE
|--------------------------------------------------------------------------
*/

router.post(
  '/services',

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const name =
        String(
          req.body.name || ''
        )
          .trim()
          .slice(
            0,
            150
          );


      const description =
        String(
          req.body.description || ''
        )
          .trim()
          .slice(
            0,
            3000
          );


      const priceType =
        String(
          req.body.price_type || 'fixed'
        )
          .trim();


      const turnaroundText =
        String(
          req.body.turnaround_text || ''
        )
          .trim()
          .slice(
            0,
            150
          );


      const isActive =
        req.body.is_active !== false;


      let price =
        req.body.price;


      if (!name) {

        return res.status(400).json({

          success: false,

          message:
            'Service name is required.'

        });

      }


      if (
        !VALID_PRICE_TYPES.includes(
          priceType
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid price type.'

        });

      }


      if (
        priceType === 'contact'
      ) {

        price =
          null;

      } else {

        price =
          Number(
            price
          );


        if (
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {

          return res.status(400).json({

            success: false,

            message:
              'Enter a valid service price.'

          });

        }

      }


      const result =
        await query(
          `
          INSERT INTO services (

            name,
            description,
            price,
            price_type,
            turnaround_text,
            is_active,
            sort_order

          )

          VALUES (

            $1,
            $2,
            $3,
            $4,
            $5,
            $6,

            COALESCE(
              (
                SELECT
                  MAX(sort_order) + 1
                FROM services
              ),
              1
            )

          )

          RETURNING
            id,
            name,
            slug,
            description,
            price,
            price_type,
            turnaround_text,
            is_active,
            sort_order,
            created_at,
            updated_at
          `,
          [

            name,
            description || null,
            price,
            priceType,
            turnaroundText || null,
            isActive

          ]
        );


      return res.status(201).json({

        success: true,

        message:
          'Service created successfully.',

        service:
          result.rows[0]

      });

    } catch (
      error
    ) {

      console.error(
        'CREATE SERVICE ERROR:',
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
| UPDATE SERVICE
|--------------------------------------------------------------------------
*/

router.patch(
  '/services/:serviceId',

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const serviceId =
        Number(
          req.params.serviceId
        );


      if (
        !Number.isInteger(
          serviceId
        ) ||
        serviceId < 1
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid service ID.'

        });

      }


      const name =
        String(
          req.body.name || ''
        )
          .trim()
          .slice(
            0,
            150
          );


      const description =
        String(
          req.body.description || ''
        )
          .trim()
          .slice(
            0,
            3000
          );


      const priceType =
        String(
          req.body.price_type || 'fixed'
        )
          .trim();


      const turnaroundText =
        String(
          req.body.turnaround_text || ''
        )
          .trim()
          .slice(
            0,
            150
          );


      const isActive =
        Boolean(
          req.body.is_active
        );


      let price =
        req.body.price;


      if (!name) {

        return res.status(400).json({

          success: false,

          message:
            'Service name is required.'

        });

      }


      if (
        !VALID_PRICE_TYPES.includes(
          priceType
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid price type.'

        });

      }


      if (
        priceType === 'contact'
      ) {

        price =
          null;

      } else {

        price =
          Number(
            price
          );


        if (
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {

          return res.status(400).json({

            success: false,

            message:
              'Enter a valid service price.'

          });

        }

      }


      const result =
        await query(
          `
          UPDATE services

          SET

            name = $1,

            description = $2,

            price = $3,

            price_type = $4,

            turnaround_text = $5,

            is_active = $6,

            updated_at = NOW()

          WHERE
            id = $7

          RETURNING
            id,
            name,
            slug,
            description,
            price,
            price_type,
            turnaround_text,
            is_active,
            sort_order,
            created_at,
            updated_at
          `,
          [

            name,

            description || null,

            price,

            priceType,

            turnaroundText || null,

            isActive,

            serviceId

          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Service not found.'

        });

      }


      return res.json({

        success: true,

        message:
          'Service updated successfully.',

        service:
          result.rows[0]

      });

    } catch (
      error
    ) {

      console.error(
        'UPDATE SERVICE ERROR:',
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
| DELETE SERVICE
|--------------------------------------------------------------------------
*/

router.delete(
  '/services/:serviceId',

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const serviceId =
        Number(
          req.params.serviceId
        );


      if (
        !Number.isInteger(
          serviceId
        ) ||
        serviceId < 1
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid service ID.'

        });

      }


      const result =
        await query(
          `
          DELETE FROM services

          WHERE id = $1

          RETURNING
            id,
            name
          `,
          [
            serviceId
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Service not found.'

        });

      }


      return res.json({

        success: true,

        message:
          'Service deleted successfully.',

        service:
          result.rows[0]

      });

    } catch (
      error
    ) {

      console.error(
        'DELETE SERVICE ERROR:',
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
