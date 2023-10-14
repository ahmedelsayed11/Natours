const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const catchAsync = require('./catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
// const APIFeatures = require('../utils/APIFeatures');
const { updateOne, deleteOne, getAll, getOne } = require('./handleFactory');

// const users = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/users.json`)
// );

// This is for store image directly to storage

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   }
// });

// This is to edit on the image in memory as buffer
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

exports.uploadUserImage = uploader.single('photo');
exports.resizeUserImage = catchAsync(async (req, res, next) => {
  // 1) If there is not a file then go to next middleware
  if (!req.file) return next();

  // 2) Resize image
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  // 3) Go to next middleware
  next();
});

const filterObj = (object, ...allowedParams) => {
  const updatedObj = {};
  Object.keys(object).forEach(el => {
    if (allowedParams.includes(el)) updatedObj[el] = object[el];
  });

  return updatedObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.getAllUsers = getAll(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
exports.getUserById = getOne(User);

exports.updateCurrentUser = catchAsync(async (req, res, next) => {
  // 1) if password is exists then will throw an error
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You cannot change your password here if you need to change it use /updatePassword',
        400
      )
    );
  }

  // 2) Filter object
  const filteredBody = filterObj(req.body, 'email', 'name');

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // 3) send updated user
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false
  });

  res.status(201).json({
    status: 'success',
    data: null
  });
});
