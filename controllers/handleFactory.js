const catchAsync = require('./catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/APIFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('Document id is not exists in database', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true
    });

    if (!doc) {
      return next(new AppError('Document id is not exists in database', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // this will allow nested routes
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // make the query works
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();

    const docs = await features.query;
    // const docs = await features.query.explain();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (populateOptions) query.populate(populateOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('Document id is not exists in database', 404));
    }
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.createOne = (Model, modelName) =>
  catchAsync(async (req, res) => {
    if (modelName === 'BOOKING') req.body.user = req.user.id;

    const doc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });
