const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL;


if (!connectionString) {

  throw new Error(
    'DATABASE_URL is not configured.'
  );

}


const pool = new Pool({

  connectionString,

  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false
        }
      : false,

  max: 10,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000

});


pool.on(
  'error',
  (error) => {

    console.error(
      'Unexpected PostgreSQL pool error:',
      error
    );

  }
);


async function query(
  text,
  params = []
) {

  return pool.query(
    text,
    params
  );

}


async function checkDatabaseConnection() {

  const result =
    await pool.query(
      'SELECT NOW() AS now'
    );


  return result.rows[0];

}


async function closeDatabase() {

  await pool.end();

}


module.exports = {

  pool,

  query,

  checkDatabaseConnection,

  closeDatabase

};
