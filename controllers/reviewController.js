const Booking = require('../models/bookingModel');
const Reviews = require('../models/reviewModel');
const AppError = require('../utils/AppError');
const catchAsync = require('./catchAsync');
// const APIFeatures = require('../utils/APIFeatures');
// const catchAsync = require('../controllers/catchAsync');
// const AppError = require('../utils/AppError');

const {
  deleteOne,
  updateOne,
  getAll,
  getOne,
  createOne
} = require('./handleFactory');

exports.setUserTourIdNestedRoutes = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.restrictCreatingReviewToBookedTourByUser = catchAsync(
  async (req, res, next) => {
    // 1) Get booked tour by user id and tour id from Booking model
    const bookedTour = await Booking.findOne({
      user: req.user.id,
      tour: req.body.tour
    });
    // 2) Validate if the user has been booked the tour
    if (bookedTour) return next();
    // 3) Handle next or error response

    return next(
      new AppError(
        "User has not booked that tour, Can't make a review on it!",
        400
      )
    );
  }
);

exports.createNewReview = createOne(Reviews);
exports.getAllReview = getAll(Reviews);
exports.updateReview = updateOne(Reviews);
exports.deleteReview = deleteOne(Reviews);
exports.getReviewById = getOne(Reviews, {
  path: 'tour',
  select: 'name'
});
