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
| PATHS
|--------------------------------------------------------------------------
|
| Your project structure should be:
|
| project/
| ├── backend/
| |   ├── server.js
| |   ├── routes/
| |   ├── config/
| |   └── middleware/
| |
| ├── index.html
| ├── admin.html
| |
| ├── css/
| |   └── admin.css
| |
| └── js/
|     └── admin.js
|
|--------------------------------------------------------------------------
*/

const FRONTEND_PATH =
  path.join(
    __dirname,
    '..'
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
| ADMIN API ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/admin',
  adminRouter
);


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
|
| This makes the dashboard available at:
|
| https://timifxx-marketing-production.up.railway.app/admin
|
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
| ADMIN HTML DIRECT ACCESS
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
| STATIC FILES
|--------------------------------------------------------------------------
|
| Serves:
|
| /css/admin.css
| /js/admin.js
| /images/...
|
|--------------------------------------------------------------------------
*/

app.use(
  express.static(
    FRONTEND_PATH
  )
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
      `Admin dashboard available at /admin`
    );

  }
);
