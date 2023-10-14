const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authControllers');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.isUserLoggedIn);

router.get(
  '/',
  bookingController.createNewBooking,
  authController.isUserLoggedIn,
  viewController.getOverview
);
router.get(
  '/tour/:tourSlug',
  authController.isUserLoggedIn,
  viewController.getTour
);
router.get('/me', authController.protect, viewController.getAccount);

router.get(
  '/my-bookings',
  authController.protect,
  viewController.getMyBookingTours
);

// Auth
router.get('/login', viewController.redirectToLogin);

module.exports = router;
