const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/AppError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute');
const viewRoute = require('./routes/viewRoutes');
const bookingRoute = require('./routes/bookingRoute');

const errorController = require('./controllers/errorController');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// This to access static files in directories
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
    crossOriginResourcePolicy: {
      allowOrigins: ['*'],
      policy: 'same-site'
    },
    crossOriginEmbedderPolicy: false
  })
);

// This is middleware to accept json body;
app.use(
  express.json({
    limit: '10kb'
  })
);
// This module for parse cookies object
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ['duration']
  })
);

// this middleware for compress app response
app.use(compression());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again later in an hour'
});
app.use('/api', limiter);

dotenv.config({ path: './config.env' });

// if password has @ or # it must be replaced first after pass the password
// let DB_PASS = process.env.DATABASE_PASSWORD.replace('#', '%23');
// DB_PASS = DB_PASS.replace('@', '%40');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
const DB_LOCAL = process.env.DATABASE_LOCAL;

// Connecting to DB
mongoose
  .connect(DB)
  .then(() => console.log('DB CONNECTION SUCCESSFULL !'))
  .catch(error => {
    console.log(`ERROR Connecing to DB ${error}`);
    // mongoose.connect(DB_LOCAL).then(() => {
    //   console.log('LOCAL DB CONNECTION SUCCESSFULL !');
    // }).catch(error => {
    //   console.log(`ERROR Connecing to Local DB ${error}`);
    // })
  });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  // This is for reference

  // res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH');
  // res.header(
  //   'Access-Control-Allow-Headers',
  //   'Accept, Content-Type, Authorization, X-Requested-With'
  // );
  next();
});

// ROUTES
app.use('/', viewRoute);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRoute);

// this will be called if there is no routes find 404 error
app.all('*', (req, res, next) => {
  // Make a new error object and pass it to the next func
  next(new AppError(`Couldn't find ${req.originalUrl} on the server`, 404));
});

app.use(errorController);

const server = app.listen(process.env.PORT, () => {
  // console.log(`Server is Running on port ${process.env.PORT}`);
});

// process.on('unhandledRejection', err => {
//   console.log(`UnhandledRejectionError ${err.message}`);

//   server.close( () => {
//     process.exit(1);
//   });
// });

// process.on('uncaughtException', err => {
//   console.log(`uncaughtException ${err.name} ${err.message}`);

//   server.close(() => {
//     process.exit(1);
//   });
// });
