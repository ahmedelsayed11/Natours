"use strict";

var fs = require('fs');

var multer = require('multer');

var catchAsync = require('./catchAsync');

var AppError = require('../utils/AppError');

var User = require('../models/userModel'); // const APIFeatures = require('../utils/APIFeatures');


var _require = require('./handleFactory'),
    updateOne = _require.updateOne,
    deleteOne = _require.deleteOne,
    getAll = _require.getAll,
    getOne = _require.getOne;

var users = JSON.parse(fs.readFileSync("".concat(__dirname, "/../dev-data/users.json")));
var multerStorage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'public/img/users');
  },
  filename: function filename(req, file, cb) {
    var extension = file.mimetype.split('/')[1];
    cb(null, "user-".concat(req.user.id, "-").concat(Date.now(), ".").concat(extension));
  }
});

var multerFilter = function multerFilter(req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file, Please select images only!', 400), false);
  }
};

var uploader = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
exports.uploadUserImage = uploader.single('photo');

var filterObj = function filterObj(object) {
  for (var _len = arguments.length, allowedParams = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    allowedParams[_key - 1] = arguments[_key];
  }

  var updatedObj = {};
  Object.keys(object).forEach(function (el) {
    if (allowedParams.includes(el)) updatedObj[el] = object[el];
  });
  return updatedObj;
};

exports.getMe = function (req, res, next) {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = getAll(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
exports.getUserById = getOne(User);
exports.updateCurrentUser = catchAsync(function _callee(req, res, next) {
  var filteredBody, updatedUser;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.body.password || req.body.passwordConfirm)) {
            _context.next = 2;
            break;
          }

          return _context.abrupt("return", next(new AppError('You cannot change your password here if you need to change it use /updatePassword', 400)));

        case 2:
          // 2) Filter object
          filteredBody = filterObj(req.body, 'email', 'name');
          if (req.file) filteredBody.photo = req.file.filename;
          _context.next = 6;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(req.user.id, filteredBody, {
            "new": true,
            runValidators: true
          }));

        case 6:
          updatedUser = _context.sent;
          // 3) send updated user
          res.status(200).json({
            status: 'success',
            data: {
              user: updatedUser
            }
          });

        case 8:
        case "end":
          return _context.stop();
      }
    }
  });
});
exports.deleteMe = catchAsync(function _callee2(req, res, next) {
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(req.user.id, {
            active: false
          }));

        case 2:
          res.status(201).json({
            status: 'success',
            data: null
          });

        case 3:
        case "end":
          return _context2.stop();
      }
    }
  });
});