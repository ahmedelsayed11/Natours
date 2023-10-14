const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review should have a description']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a tour!']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a user!']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

reviewSchema.statics.calcRatingAverage = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        ratingAvg: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].ratingAvg
    });
  }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function() {
  // this points to current document created;
  // this technique to access current review who create that review
  this.constructor.calcRatingAverage(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  // this refers to current query
  this.r = await this.findOne().clone(); // to access current updated review or deleted

  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //  await this.findOne();  doesn't work here because the query has been already executed
  this.r.constructor.calcRatingAverage(this.r.tour);
});

// reviewSchema.createIndexes();

const Reviews = mongoose.model('Reviews', reviewSchema);
Reviews.createIndexes();

module.exports = Reviews;
