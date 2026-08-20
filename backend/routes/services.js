const express =
  require('express');

const {
  query
} = require('../config/database');


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| GET /api/services
|--------------------------------------------------------------------------
|
| Returns all active services.
|
|--------------------------------------------------------------------------
*/

router.get(
  '/',
  async (req, res, next) => {

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
            turnaround_text
          FROM services
          WHERE is_active = TRUE
          ORDER BY sort_order ASC, id ASC
          `
        );


      res.json({

        success: true,

        services:
          result.rows

      });

    } catch (error) {

      next(error);

    }

  }
);


module.exports =
  router;
