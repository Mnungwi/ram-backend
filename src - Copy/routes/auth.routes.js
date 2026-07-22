const express = require('express');
const authCtrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register',        authCtrl.registerRules, authCtrl.register);
router.post('/login',           authCtrl.loginRules,    authCtrl.login);
router.post('/logout',          authenticate,           authCtrl.logout);
router.post('/refresh',                                 authCtrl.refresh);
router.get( '/me',              authenticate,           authCtrl.getProfile);
router.put( '/me',              authenticate,           authCtrl.updateProfile);
router.put( '/me/password',     authenticate,           authCtrl.changePassword);

module.exports = router;
