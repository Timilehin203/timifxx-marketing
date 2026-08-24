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
| VALID SERVICE PRICE TYPES
|--------------------------------------------------------------------------
*/

const VALID_PRICE_TYPES = [

  'fixed',

  'starting_from',

  'contact'

];


/*
|--------------------------------------------------------------------------
| CREATE SERVICE SLUG
|--------------------------------------------------------------------------
*/

function createServiceSlug(
  name
) {

  return String(
    name || ''
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
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
        String(
          req.body.admin_note || ''
        )
          .trim()
          .slice(
            0,
            5000
          );


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
          WHERE order_number = $1::text
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

            status =
              $1::varchar,

            admin_note =
              $2::text,

            completed_at =
              CASE

                WHEN $1::text = 'completed'

                THEN NOW()

                ELSE NULL

              END,

            updated_at =
              NOW()

          WHERE
            order_number =
              $3::text

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


      console.log(
        'ORDER UPDATED SUCCESSFULLY:',
        {

          orderNumber:
            updatedOrder.order_number,

          status:
            updatedOrder.status

        }
      );


      /*
      |--------------------------------------------------------------------------
      | SAVE STATUS HISTORY
      |--------------------------------------------------------------------------
      */

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

            $2::varchar,

            $3::varchar,

            $4::text

          )
          `,
          [

            currentOrder.id,

            String(
              currentOrder.status
            ),

            status,

            historyNote

          ]
        );


        console.log(
          'ORDER STATUS HISTORY SAVED:',
          {

            orderId:
              currentOrder.id,

            oldStatus:
              currentOrder.status,

            newStatus:
              status

          }
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
| GET ALL SERVICES
|--------------------------------------------------------------------------
|
| Returns all services, including inactive services.
| This is used by the private admin dashboard.
|
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
            is_active
          FROM services
          ORDER BY
            sort_order ASC,
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
        req.body.is_active === true;


      let price =
        req.body.price;


      /*
      |--------------------------------------------------------------------------
      | VALIDATE NAME
      |--------------------------------------------------------------------------
      */

      if (
        !name
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Service name is required.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE PRICE TYPE
      |--------------------------------------------------------------------------
      */

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


      /*
      |--------------------------------------------------------------------------
      | VALIDATE PRICE
      |--------------------------------------------------------------------------
      */

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
              'A valid service price is required.'

          });

        }

      }


      /*
      |--------------------------------------------------------------------------
      | CREATE SLUG
      |--------------------------------------------------------------------------
      */

      const slug =
        createServiceSlug(
          name
        );


      if (
        !slug
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Unable to create a valid service slug.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | CHECK FOR DUPLICATE SLUG
      |--------------------------------------------------------------------------
      */

      const existingService =
        await query(
          `
          SELECT
            id
          FROM services
          WHERE slug = $1
          LIMIT 1
          `,
          [
            slug
          ]
        );


      if (
        existingService.rows.length > 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'A service with this name already exists.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | CREATE SERVICE
      |--------------------------------------------------------------------------
      */

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

            is_active

          )

          VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6,

            $7

          )

          RETURNING

            id,

            name,

            slug,

            description,

            price,

            price_type,

            turnaround_text,

            is_active
          `,
          [

            name,

            slug,

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
        'ADMIN CREATE SERVICE ERROR:',
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


      /*
      |--------------------------------------------------------------------------
      | VALIDATE SERVICE ID
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
        req.body.is_active === true;


      let price =
        req.body.price;


      /*
      |--------------------------------------------------------------------------
      | VALIDATE NAME
      |--------------------------------------------------------------------------
      */

      if (
        !name
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Service name is required.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE PRICE TYPE
      |--------------------------------------------------------------------------
      */

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


      /*
      |--------------------------------------------------------------------------
      | VALIDATE PRICE
      |--------------------------------------------------------------------------
      */

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
              'A valid service price is required.'

          });

        }

      }


      /*
      |--------------------------------------------------------------------------
      | CREATE SLUG
      |--------------------------------------------------------------------------
      */

      const slug =
        createServiceSlug(
          name
        );


      if (
        !slug
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Unable to create a valid service slug.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | CHECK SERVICE EXISTS
      |--------------------------------------------------------------------------
      */

      const currentService =
        await query(
          `
          SELECT
            id
          FROM services
          WHERE id = $1
          LIMIT 1
          `,
          [
            serviceId
          ]
        );


      if (
        currentService.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Service not found.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | CHECK FOR DUPLICATE SLUG
      |--------------------------------------------------------------------------
      */

      const duplicateService =
        await query(
          `
          SELECT
            id
          FROM services
          WHERE
            slug = $1
            AND id != $2
          LIMIT 1
          `,
          [

            slug,

            serviceId

          ]
        );


      if (
        duplicateService.rows.length > 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Another service with this name already exists.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | UPDATE SERVICE
      |--------------------------------------------------------------------------
      */

      const result =
        await query(
          `
          UPDATE services

          SET

            name =
              $1,

            slug =
              $2,

            description =
              $3,

            price =
              $4,

            price_type =
              $5,

            turnaround_text =
              $6,

            is_active =
              $7

          WHERE
            id =
              $8

          RETURNING

            id,

            name,

            slug,

            description,

            price,

            price_type,

            turnaround_text,

            is_active
          `,
          [

            name,

            slug,

            description || null,

            price,

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

      console.error(
        'ADMIN UPDATE SERVICE ERROR:',
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


      /*
      |--------------------------------------------------------------------------
      | VALIDATE SERVICE ID
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
            'Invalid service ID.'

        });

      }


      /*
      |--------------------------------------------------------------------------
      | DELETE SERVICE
      |--------------------------------------------------------------------------
      */

      const result =
        await query(
          `
          DELETE FROM services

          WHERE
            id = $1

          RETURNING

            id,

            name,

            slug,

            description,

            price,

            price_type,

            turnaround_text,

            is_active
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
        'ADMIN DELETE SERVICE ERROR:',
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
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports =
  router;
