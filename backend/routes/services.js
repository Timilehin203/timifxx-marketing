const express =
  require('express');


const {
  query
} =
  require(
    '../config/database'
  );


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| GET ALL ACTIVE SERVICES
|--------------------------------------------------------------------------
*/

router.get(
  '/',
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
              sort_order
            FROM services
            WHERE is_active = TRUE
            ORDER BY
              sort_order ASC,
              id ASC
          `
        );


      res.json({

        success:
          true,

        services:
          result.rows

      });

    } catch (
      error
    ) {

      console.error(
        'PUBLIC SERVICES ERROR:',
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
