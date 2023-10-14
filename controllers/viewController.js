const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

const AppError = require('../utils/AppError');
const catchAsync = require('./catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get All Tours
  const tours = await Tour.find({});
  // 2) Create The Template For Tours

  // 3) Render The Overview Page
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get tour from the slug including guides and reviews
  const { tourSlug } = req.params;

  if (!tourSlug) {
    return;
  }

  const tour = await Tour.findById(tourSlug);

  // 2) building the template

  if (!tour) {
    return next(new AppError('Tour is not exists!', 404));
  }

  // 3) render the template using the data from (1)
  res.status(200).render('tour', {
    title: tour.name,
    tour: tour,
    reviews: tour.reviews,
    guides: tour.guides
  });
});

exports.redirectToLogin = catchAsync(async (req, res) => {
  // 1) When user is logged in he can't access login again

  if (req.cookies.jwt && req.cookies.jwt !== 'loggedOut') {
    return res.redirect('/me');
  }

  // 2) Redirect to login when not authorized
  res.status(200).render('login', {
    title: 'Login'
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  if (!req.user.id) {
    return next(new AppError('Please login to access this page', 401));
  }

  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  );

  res.status(200).render('account', {
    title: 'Account'
  });
});

exports.getMyBookingTours = catchAsync(async (req, res, next) => {
  if (!req.user.id)
    return next(new AppError('You are not logged in please Login first,', 401));

  const bookings = await Booking.find({
    user: req.user.id
  });

  const toursIds = bookings.map(el => el.tour);

  const tours = await Tour.find({
    _id: {
      $in: toursIds
    }
  });

  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  );

  res.status(200).render('overview', {
    title: 'My Bookings',
    tours
  });
});
