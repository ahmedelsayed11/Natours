const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('./catchAsync');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.TOKEN_EXPIRE_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookiesOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  res.cookie('jwt', token, cookiesOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role
  } = req.body;

  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
    passwordConfirm: passwordConfirm,
    passwordChangedAt: passwordChangedAt,
    role: role
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  const subject = `Hello ${
    newUser.name.split(' ')[0]
  } , Welcome to our natours family`;
  await new Email(newUser, url).sendWelcome();

  await createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password is passed
  if (!email || !password) {
    return next(new AppError('Please provide an email and password', 400));
  }

  // 2) Check if email is exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password !', 401));
  }

  // 3) Make new token and return success
  createSendToken(user, 200, res);
});

exports.logOut = (req, res) => {
  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  );

  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token from headers;
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === 'loggedOut') {
    return next(new AppError('Please login to access this route', 401));
  }

  // 2) Verification if the token is valid
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  if (!decodedPayload) {
    return next(
      new AppError('Invalid token. Please login to access this route ', 401)
    );
  }

  // 3) Check if the user still exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(
      new AppError('User with the token passed is not exists or deleted', 401)
    );
  }

  // 4) Check if user has not changed his password after token issued
  if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError('User changed password recently. Please login again', 401)
    );
  }

  // Grant access to route
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.isUserLoggedIn = async (req, res, next) => {
  // 1) Getting token from headers;
  try {
    if (req.cookies.jwt) {
      // 2) Verification if the token is valid
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_KEY
      );

      if (!decodedPayload) {
        return next();
      }

      // 3) Check if the user still exists
      const currentUser = await User.findById(decodedPayload.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user has not changed his password after token issued
      if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
        return next();
      }

      // Grant access to route
      res.locals.user = currentUser;

      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles will be ['admin' , 'lead-guide] .. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to do this action", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get Email from POSTED request;
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with provided email.', 404));
  }

  // 2) Generate random reset token;
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email;

  try {
    const requestUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, requestUrl).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    // remove password token and expire
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email, try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user token;
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If the token has not expired and there is a user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or expired'), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) sign a new token and return a new token
  // 3) Make new token and return success

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get User from collection;
  const { email } = req.user;
  const { oldPassword, newPassword, newConfirmPassword } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // 2) Check If Posted current password is correct
  if (!user || !(await user.correctPassword(oldPassword, user.password))) {
    return next(new AppError('Invalid password !', 401));
  }

  // 3) Update the password
  user.password = newPassword;
  user.passwordConfirm = newConfirmPassword;

  await user.save();

  // 4) log user in again and send token
  createSendToken(user, 200, res);
});
