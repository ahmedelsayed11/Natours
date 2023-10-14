const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// name, email, photo, password, confirmPassword

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: {
      type: String,
      default: 'default.jpg'
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please enter confirm password'],
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message:
          'Password mismatch, Confirm password and Password are mismatch !'
      }
    },
    passwordChangedAt: {
      type: Date
    },
    passwordResetToken: {
      type: String
    },
    passwordResetExpires: {
      type: Date
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  { strict: false }
);

userSchema.pre('save', async function(next) {
  // If the password is modified then below line will be executed
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre(/^find/, function(next) {
  // will select all active user only
  this.find({
    active: { $ne: false }
  });

  next();
});

userSchema.pre('save', async function(next) {
  // If the password is modified then below line will be executed
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // this for validation of issuing the token

  next();
});

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  if (!candidatePassword || !userPassword) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamps) {
  if (this.passwordChangedAt) {
    const timeStamps = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimeStamps < timeStamps;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
