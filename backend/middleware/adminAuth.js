const crypto =
  require('crypto');


function adminAuth(
  req,
  res,
  next
) {

  const configuredKey =
    String(
      process.env.ADMIN_API_KEY || ''
    ).trim();


  if (!configuredKey) {

    return res.status(500).json({

      success: false,

      message:
        'Admin authentication is not configured.'

    });

  }


  const authorization =
    String(
      req.headers.authorization || ''
    );


  if (
    !authorization.startsWith(
      'Bearer '
    )
  ) {

    return res.status(401).json({

      success: false,

      message:
        'Admin authentication is required.'

    });

  }


  const providedKey =
    authorization
      .slice(7)
      .trim();


  const configuredBuffer =
    Buffer.from(
      configuredKey
    );


  const providedBuffer =
    Buffer.from(
      providedKey
    );


  if (
    configuredBuffer.length !==
    providedBuffer.length
  ) {

    return res.status(401).json({

      success: false,

      message:
        'Invalid admin credentials.'

    });

  }


  const isValid =
    crypto.timingSafeEqual(
      configuredBuffer,
      providedBuffer
    );


  if (!isValid) {

    return res.status(401).json({

      success: false,

      message:
        'Invalid admin credentials.'

    });

  }


  next();

}


module.exports =
  adminAuth;
