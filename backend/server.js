require('dotenv').config();

const express =
  require('express');

const cors =
  require('cors');

const path =
  require('path');

const fs =
  require('fs');


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
| FRONTEND PATH DETECTION
|--------------------------------------------------------------------------
*/

const frontendFolderPath =
  path.join(
    __dirname,
    '..',
    'frontend'
  );


const projectRootPath =
  path.join(
    __dirname,
    '..'
  );


const FRONTEND_PATH =
  fs.existsSync(
    path.join(
      frontendFolderPath,
      'index.html'
    )
  )
    ? frontendFolderPath
    : projectRootPath;


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
| BODY PARSING
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
| REQUEST LOGGER
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


app.use(
  '/api/admin',
  adminRouter
);


/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/

app.use(
  express.static(
    FRONTEND_PATH,
    {
      maxAge: '1h'
    }
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

    console.log(
      `Admin services API: /api/admin/services`
    );

  }
);
