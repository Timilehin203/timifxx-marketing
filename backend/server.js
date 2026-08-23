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


app.use(
  cors({

    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : true,

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
    ]

  })
);


/*
|--------------------------------------------------------------------------
| REQUEST PARSING
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: '100kb'
  })
);


app.use(
  express.urlencoded({
    extended: false,
    limit: '100kb'
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
  (req, res) => {

    res.json({

      success: true,

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
| CUSTOMER ORDER ROUTES
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
| This connects:
|
| GET   /api/admin/orders
| PATCH /api/admin/orders/:orderNumber
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
| ERROR HANDLER
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

  }
);
