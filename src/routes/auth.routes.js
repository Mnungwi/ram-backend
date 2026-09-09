const express = require('express');
const authCtrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const avatarUpload = require('../middleware/avatarUpload');

const router = express.Router();

router.post('/register',        authCtrl.registerRules, authCtrl.register);
router.post('/login',           authCtrl.loginRules,    authCtrl.login);
router.post('/verify-otp',                              authCtrl.verifyOtp);
router.post('/resend-otp',                               authCtrl.resendOtp);
router.post('/logout',          authenticate,           authCtrl.logout);
router.post('/refresh',                                 authCtrl.refresh);
router.get( '/me',              authenticate,           authCtrl.getProfile);
router.put( '/me',              authenticate,           authCtrl.updateProfile);
router.put( '/me/avatar',       authenticate, avatarUpload.single('avatar'), authCtrl.uploadAvatar);
router.put( '/me/signature',    authenticate, avatarUpload.single('signature'), authCtrl.uploadSignature);
router.delete('/me/signature',  authenticate, authCtrl.deleteSignature);
router.put( '/me/password',     authenticate,           authCtrl.changePassword);
router.post('/forgot-password',                         authCtrl.forgotPassword);
router.post('/reset-password',                          authCtrl.resetPassword);

module.exports = router;
