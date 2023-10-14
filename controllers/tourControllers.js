// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const Tours = require('../models/tourModel');
// const APIFeatures = require('../utils/APIFeatures');
const catchAsync = require('../controllers/catchAsync');
const AppError = require('../utils/AppError');
const {
  deleteOne,
  updateOne,
  getAll,
  getOne,
  createOne
} = require('./handleFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file, Please select images only!', 400), false);
  }
};

const uploader = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = uploader.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = async (req, res, next) => {
  console.log(req.files);

  // 1) Validate on image cover and images
  if (!req.files.imageCover || !req.files.images) return next();

  // 2) Process image cover upload
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 3) Process tour images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
};

exports.aliasTopCheapTours = async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = 'price,rating';
  next();
};

exports.createTour = createOne(Tours);
exports.getAllTours = getAll(Tours);
exports.updateTour = updateOne(Tours);
exports.deleteTour = deleteOne(Tours);
exports.getTourById = getOne(Tours, { path: 'reviews' });

exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tours.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgPrice: -1 } }
    // { $match: { _id: { $ne: 'DIFFICULT' } } } // for making rematch after grouping
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tours.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfToursStart: { $sum: 1 },
        tours: { $push: { name: '$name', _id: '$_id' } }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numOfToursStart: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: plan
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude to get tours around you!',
        400
      )
    );
  }

  // this will get tours near with you
  const tours = await Tours.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude to get distances !',
        400
      )
    );
  }

  const tours = await Tours.aggregate([
    {
      // Must be first stage....
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        name: 1,
        distance: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: tours
    }
  });
});
