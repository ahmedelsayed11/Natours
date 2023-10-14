const express = require('express');
const authController = require('../controllers/authControllers');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router
  .route('/checkout-session/:tourId')
  .get(authController.protect, bookingController.getStripeSession);

router
  .route('/')
  .get(authController.protect, bookingController.getAllBooking)
  .post(authController.protect, bookingController.createBookingUsingRoute);

router
  .route('/:id')
  .get(authController.protect, bookingController.getBookingById)
  .patch(authController.protect, bookingController.updateBooking)
  .delete(authController.protect, bookingController.deleteBooking);

module.exports = router;
