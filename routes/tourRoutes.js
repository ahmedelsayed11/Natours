const express = require('express');
const tourController = require('../controllers/tourControllers');
const authControllers = require('../controllers/authControllers');
const reviewRouter = require('./reviewRoute');

const router = express.Router();

// MiddleWare  called when passing id
// router.param('id', tourController.checkIdExists);

// Check Post Request have a valid data
// const createTourMiddleWare = tourController.checkCreateTour;

// this endpoint have a middleware
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopCheapTours, tourController.getAllTours);

router
  .route('/tour-stats')
  .get(
    authControllers.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getToursStats
  );

router
  .route('/get-monthly-plan/:year')
  .get(
    authControllers.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// get tours within distance from your location
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// get distance from location
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authControllers.protect,
    authControllers.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTourById)
  .patch(
    authControllers.protect,
    authControllers.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// router
//   .route('/:tourId/reviews')
//   .post(
//     authControllers.protect,
//     authControllers.restrictTo('user'),
//     createNewReview
//   );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
