const express = require('express');

const userController = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

const router = express.Router();

router.post('/signup', authControllers.signUp);
router.post('/login', authControllers.login);
router.get('/logOut', authControllers.logOut);

router.post('/forgotPassword', authControllers.forgotPassword);
router.patch('/resetPassword/:token', authControllers.resetPassword);

// Protect all below routes in one middleware
router.use(authControllers.protect);

router.get('/me', userController.getMe, userController.getUserById);
router.patch(
  '/updateCurrentUser',
  userController.uploadUserImage,
  userController.resizeUserImage,
  userController.updateCurrentUser
);
router.patch('/updatePassword', authControllers.updatePassword);

router.delete('/deleteMe', userController.deleteMe);
router
  .route('/')
  .get(
    authControllers.restrictTo('admin', 'lead-guide'),
    userController.getAllUsers
  );
router
  .route('/:id')
  .get(
    authControllers.restrictTo('admin', 'lead-guide'),
    userController.getUserById
  );

module.exports = router;
