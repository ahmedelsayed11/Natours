const express = require('express');
const reviewController = require('../controllers/reviewController');
const authControllers = require('../controllers/authControllers');

// this props will be for the nested routes from api/v1/tours route
const router = express.Router({ mergeParams: true });

router.use(authControllers.protect);

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authControllers.restrictTo('user'),
    reviewController.setUserTourIdNestedRoutes,
    reviewController.restrictCreatingReviewToBookedTourByUser,
    reviewController.createNewReview
  );

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .patch(authControllers.restrictTo('user'), reviewController.updateReview)
  .delete(authControllers.restrictTo('user'), reviewController.deleteReview);

module.exports = router;
