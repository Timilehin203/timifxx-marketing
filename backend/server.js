require('dotenv').config();


const express =
  require('express');

const cors =
  require('cors');


const healthRouter =
  require('./routes/health');

const servicesRouter =
  require('./routes/services');

const ordersRouter =
  require('./routes/orders');

const adminRouter =
  require('./routes/admin');


const requestLogger =
  require('./middleware/requestLogger');


const {
  notFoundHandler,
  errorHandler
} =
  require('./middleware/errorHandler');


const app =
  express();


const PORT =
  Number(
    process.env.PORT || 3000
  );


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins =
  String(
    process.env.FRONTEND_URL || ''
  )
    .split(',')
    .map(
      origin =>
        origin.trim()
    )
    .filter(Boolean);


/*
|--------------------------------------------------------------------------
| CORS CONFIGURATION
|--------------------------------------------------------------------------
|
| If FRONTEND_URL is configured, only those origins
| are allowed.
|
| Otherwise requests are allowed so the frontend can
| communicate with the Railway API.
|
|--------------------------------------------------------------------------
*/

app.use(
  cors({

    origin(
      origin,
      callback
    ) {

      /*
      |--------------------------------------------------------------------------
      | Allow requests without Origin
      |--------------------------------------------------------------------------
      |
      | This includes direct browser requests,
      | server requests and some development tools.
      |
      |--------------------------------------------------------------------------
      */

      if (!origin) {

        return callback(
          null,
          true
        );

      }


      /*
      |--------------------------------------------------------------------------
      | No specific frontend configured
      |--------------------------------------------------------------------------
      */

      if (
        allowedOrigins.length === 0
      ) {

        return callback(
          null,
          true
        );

      }


      /*
      |--------------------------------------------------------------------------
      | Check allowed frontend origins
      |--------------------------------------------------------------------------
      */

      if (
        allowedOrigins.includes(
          origin
        )
      ) {

        return callback(
          null,
          true
        );

      }


      console.warn(
        `Blocked by CORS: ${origin}`
      );


      return callback(
        new Error(
          'Not allowed by CORS.'
        )
      );

    },


    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],


    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],


    credentials:
      false

  })
);


/*
|--------------------------------------------------------------------------
| REQUEST PARSING
|--------------------------------------------------------------------------
*/

app.use(
  express.json({

    limit:
      '100kb'

  })
);


app.use(
  express.urlencoded({

    extended:
      false,

    limit:
      '100kb'

  })
);


/*
|--------------------------------------------------------------------------
| REQUEST LOGGING
|--------------------------------------------------------------------------
*/

app.use(
  requestLogger
);


/*
|--------------------------------------------------------------------------
| BASIC ROUTE
|--------------------------------------------------------------------------
*/

app.get(
  '/',
  (
    req,
    res
  ) => {

    res.json({

      success:
        true,

      project:
        'TimiFxx Marketing',

      message:
        'TimiFxx Marketing API is running.',

      status:
        'online'

    });

  }
);


/*
|--------------------------------------------------------------------------
| HEALTH ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/health',
  healthRouter
);


/*
|--------------------------------------------------------------------------
| SERVICES ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/services',
  servicesRouter
);


/*
|--------------------------------------------------------------------------
| PUBLIC ORDER ROUTES
|--------------------------------------------------------------------------
|
| Create orders and track orders.
|
|--------------------------------------------------------------------------
*/

app.use(
  '/api/orders',
  ordersRouter
);


/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The admin dashboard sends requests to:
|
| GET   /api/admin/orders
| PATCH /api/admin/orders/:orderNumber
|
| These routes require the admin authorization
| handled inside backend/routes/admin.js
|
|--------------------------------------------------------------------------
*/

app.use(
  '/api/admin',
  adminRouter
);


/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  notFoundHandler
);


/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  errorHandler
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  () => {

    console.log(
      `TimiFxx Marketing API listening on port ${PORT}`
    );


    console.log(
      `Environment: ${
        process.env.NODE_ENV ||
        'development'
      }`
    );


    console.log(
      'Public API: /api/services'
    );


    console.log(
      'Orders API: /api/orders'
    );


    console.log(
      'Admin API: /api/admin/orders'
    );

  }
);
