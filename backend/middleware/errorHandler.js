function notFoundHandler(
  req,
  res
) {

  res.status(404).json({

    success: false,

    message: 'Endpoint not found.'

  });

}


function errorHandler(
  error,
  req,
  res,
  next
) {

  console.error(
    error
  );


  if (res.headersSent) {

    return next(error);

  }


  const statusCode =
    Number.isInteger(
      error.statusCode
    )
      ? error.statusCode
      : 500;


  res.status(
    statusCode
  ).json({

    success: false,

    message:
      statusCode === 500
        ? 'Internal server error.'
        : error.message

  });

}


module.exports = {

  notFoundHandler,

  errorHandler

};
