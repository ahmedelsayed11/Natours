const Stripe = require('stripe');

const stripe = Stripe(
  'sk_test_51NyxVcKxtA5zRsd92L04MJ7CmaXyeeldkJ8eJx47V3Jcx2LmyBApefDWABNT1eeHfCecnovhnErAp56CblqEAEOR0024t9coJz'
);

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

const AppError = require('../utils/AppError');
const catchAsync = require('./catchAsync');
const handleFactory = require('./handleFactory');

exports.getStripeSession = catchAsync(async (req, res, next) => {
  // 1) Get current selected tour and make the validation
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError('Tour is not exists', 400));
  }

  // 2) create a new session with stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.id}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: ['https://www.natours.dev/img/tours/tour-2-cover.jpg'],
            metadata: {
              tourId: tour.id
            }
          }
        },
        quantity: 1
      }
    ]
  });

  // 3) send session as a response
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createNewBooking = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBookingUsingRoute = handleFactory.createOne(Booking, 'BOOKING');
exports.getAllBooking = handleFactory.getAll(Booking);
exports.getBookingById = handleFactory.getOne(Booking);
exports.updateBooking = handleFactory.updateOne(Booking);
exports.deleteBooking = handleFactory.deleteOne(Booking);
