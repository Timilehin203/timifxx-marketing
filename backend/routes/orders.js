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
| HELPERS
|--------------------------------------------------------------------------
*/

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


function createSlug(
  value
) {

  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    )
    .slice(
      0,
      150
    );

}


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
        cleanText(
          req.body.admin_note,
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

          WHERE
            order_number = $1

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

      next(
        error
      );

    }

  }
);


/*
|--------------------------------------------------------------------------
| GET ALL SERVICES FOR ADMIN
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
            created_at,
            updated_at

          FROM services

          ORDER BY
            id ASC
          `
        );


      return res.json({

        success: true,

        services:
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
        cleanText(
          req.body.name,
          150
        );


      const description =
        cleanText(
          req.body.description,
          3000
        );


      const turnaroundText =
        cleanText(
          req.body.turnaround_text,
          150
        );


      const priceType =
        cleanText(
          req.body.price_type,
          50
        );


      const price =
        Number(
          req.body.price
        );


      const isActive =
        req.body.is_active === true;


      if (
        name.length < 2
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Service name must contain at least 2 characters.'

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
        priceType !== 'contact' &&
        (
          !Number.isFinite(
            price
          ) ||
          price < 0
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Please enter a valid service price.'

        });

      }


      let baseSlug =
        createSlug(
          name
        );


      if (!baseSlug) {

        baseSlug =
          `service-${Date.now()}`;

      }


      let slug =
        baseSlug;


      let suffix =
        1;


      while (true) {

        const slugCheck =
          await query(
            `
            SELECT id

            FROM services

            WHERE slug = $1

            LIMIT 1
            `,
            [
              slug
            ]
          );


        if (
          slugCheck.rows.length === 0
        ) {

          break;

        }


        suffix += 1;


        slug =
          `${baseSlug}-${suffix}`;

      }


      const result =
        await query(
          `
          INSERT INTO services (

            name,

            slug,

            description,

            price,

            price_type,

            turnaround_text,

            is_active,

            created_at,

            updated_at

          )

          VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6,

            $7,

            NOW(),

            NOW()

          )

          RETURNING
            *
          `,
          [

            name,

            slug,

            description || null,

            priceType === 'contact'
              ? null
              : price,

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
  '/services/:id',

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const serviceId =
        Number(
          req.params.id
        );


      const name =
        cleanText(
          req.body.name,
          150
        );


      const description =
        cleanText(
          req.body.description,
          3000
        );


      const turnaroundText =
        cleanText(
          req.body.turnaround_text,
          150
        );


      const priceType =
        cleanText(
          req.body.price_type,
          50
        );


      const price =
        Number(
          req.body.price
        );


      const isActive =
        req.body.is_active === true;


      if (
        !Number.isInteger(
          serviceId
        ) ||
        serviceId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid service.'

        });

      }


      if (
        name.length < 2
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Service name must contain at least 2 characters.'

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
        priceType !== 'contact' &&
        (
          !Number.isFinite(
            price
          ) ||
          price < 0
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Please enter a valid service price.'

        });

      }


      const existingResult =
        await query(
          `
          SELECT
            id,
            slug

          FROM services

          WHERE
            id = $1

          LIMIT 1
          `,
          [
            serviceId
          ]
        );


      if (
        existingResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Service not found.'

        });

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
            *
          `,
          [

            name,

            description || null,

            priceType === 'contact'
              ? null
              : price,

            priceType,

            turnaroundText || null,

            isActive,

            serviceId

          ]
        );


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
  '/services/:id',

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const serviceId =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(
          serviceId
        ) ||
        serviceId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid service.'

        });

      }


      const orderCheck =
        await query(
          `
          SELECT
            COUNT(*)::int AS total

          FROM orders

          WHERE
            service_id = $1
          `,
          [
            serviceId
          ]
        );


      if (
        orderCheck.rows[0].total > 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'This service cannot be deleted because it has existing orders. You can deactivate it instead.'

        });

      }


      const result =
        await query(
          `
          DELETE FROM services

          WHERE
            id = $1

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

      next(
        error
      );

    }

  }
);


module.exports =
  router;
