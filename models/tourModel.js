const mongoose = require('mongoose');
// const User = require('./userModel');

// We will define a new schema;
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      minlength: 10
    },
    rating: {
      type: Number,
      default: 4.8
    },
    duration: {
      type: Number,
      default: 0
    },
    maxGroupSize: {
      type: Number
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium and difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      set: value => Math.round(value * 10) / 10
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    summary: {
      type: String,
      required: [true, 'a tour must have a summery']
    },
    description: String,
    imageCover: {
      type: String,
      required: [true, 'a tour must have an image']
    },
    images: [String],
    startDates: [Date],
    secret: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationInWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Reviews',
  foreignField: 'tour',
  localField: '_id'
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    // select: 'name role photo -passwordChangedAt',
    select: { _id: 1, name: 1, photo: 1, role: 1 }
  }).populate({
    path: 'reviews'
  });

  next();
});

// Mongoose middleware or hooks;
tourSchema.pre(/^find/, function(next) {
  this.find({ secret: { $ne: true } });

  next();
});

// Aggregation Middleware;
tourSchema.pre('aggregate', function(next) {
  // this.pipeline().unshift({ $match: { secret: { $ne: true } } });
  // console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
// Tour.createIndexes();

module.exports = Tour;
