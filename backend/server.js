require('dotenv').config();


const express =
  require('express');


const cors =
  require('cors');


const path =
  require('path');


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
| FRONTEND PATH
|--------------------------------------------------------------------------
|
| Your frontend folder is:
|
| project/
| ├── backend/
| └── frontend/
|
|--------------------------------------------------------------------------
*/

const FRONTEND_PATH =
  path.join(
    __dirname,
    '..',
    'frontend'
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
    .filter(
      Boolean
    );


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
| API ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/health',
  healthRouter
);


app.use(
  '/api/services',
  servicesRouter
);


app.use(
  '/api/orders',
  ordersRouter
);


/*
|--------------------------------------------------------------------------
| ADMIN API
|--------------------------------------------------------------------------
*/

app.use(
  '/api/admin',
  adminRouter
);


/*
|--------------------------------------------------------------------------
| STATIC FRONTEND FILES
|--------------------------------------------------------------------------
*/

app.use(
  express.static(
    FRONTEND_PATH
  )
);


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

app.get(
  '/admin',
  (
    req,
    res
  ) => {

    res.sendFile(
      path.join(
        FRONTEND_PATH,
        'admin.html'
      )
    );

  }
);


/*
|--------------------------------------------------------------------------
| ADMIN HTML
|--------------------------------------------------------------------------
*/

app.get(
  '/admin.html',
  (
    req,
    res
  ) => {

    res.sendFile(
      path.join(
        FRONTEND_PATH,
        'admin.html'
      )
    );

  }
);


/*
|--------------------------------------------------------------------------
| MAIN WEBSITE
|--------------------------------------------------------------------------
*/

app.get(
  '/',
  (
    req,
    res
  ) => {

    res.sendFile(
      path.join(
        FRONTEND_PATH,
        'index.html'
      )
    );

  }
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
      `TimiFxx Marketing website and API running on port ${PORT}`
    );

    console.log(
      `Frontend path: ${FRONTEND_PATH}`
    );

    console.log(
      'Admin dashboard available at /admin'
    );

  }
);
