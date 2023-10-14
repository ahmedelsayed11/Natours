const AppError = require('../utils/AppError');

const handleCastErrorDB = (error, env) => {
  let message = '';
  if (env === 'dev') {
    message = `Tour is not exists!`;
  } else {
    message = `Invalid ${error.path}: ${error.value}`;
  }

  return new AppError(message, 400);
};
const handleDuplicateErrorDB = error => {
  const value = error.keyValue.name;
  const message = `Duplicate field value ${value}. Please try different value`;

  return new AppError(message, 400);
};
const handleValidationErrorDB = error => {
  const errors = Object.values(error.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = () => {
  return new AppError('Invalid token. Please login to access this route', 401);
};
const handelJWTExpireError = () => {
  return new AppError('Token has been expired. Please login again', 401);
};
const sendDevError = (error, req, res) => {
  // A) Api errors handler
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack
    });
  }

  if (error.statusCode === 404) {
    error.message = "This page can't be found";
  }

  if (error.name === 'CastError') error = handleCastErrorDB(error, 'dev');

  // B) Handle error  for website views
  res.status(error.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: error.message
  });
};

const sendProductionError = (error, req, res) => {
  // A) For apis errors on production
  // Operational errors that happened from the system
  if (req.originalUrl.startsWith('/api')) {
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } else {
      // 1) LOG THE ERROR
      console.error(error);

      // 2) SEND GENERIC ERROR
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong !'
      });
    }
  } else {
    // B) for website errors handler

    if (error.isOperational) {
      return res.status(error.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: error.message
      });
    }
    // 1) LOG THE ERROR
    console.error(error);

    // 2) SEND GENERIC ERROR
    return res.status(500).render('error', {
      title: 'Something went wrong!',
      msg: 'Something went very wrong !'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // DEVELOPMENT
  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, req, res);
    // PRODUCTION
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handelJWTExpireError();

    sendProductionError(error, req, res);
  }
};
