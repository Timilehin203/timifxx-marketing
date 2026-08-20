const express =
  require('express');

const {
  checkDatabaseConnection
} = require('../config/database');


const router =
  express.Router();


router.get(
  '/',
  async (req, res) => {

    try {

      const database =
        await checkDatabaseConnection();


      res.json({

        success: true,

        status: 'online',

        project:
          'TimiFxx Marketing',

        database:
          'connected',

        time:
          database.now

      });

    } catch (error) {

      console.error(
        'Health check error:',
        error
      );


      res.status(503).json({

        success: false,

        status: 'degraded',

        database:
          'disconnected'

      });

    }

  }
);


module.exports =
  router;
