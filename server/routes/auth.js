const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  register, login, googleAuth, googlePassportCallback,
  githubAuth, githubCallback,
  refreshToken, getProfile, updateProfile, logout, devGoogleLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
const checkOAuthConfig = (provider) => (req, res, next) => {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  if (!clientId || clientId.startsWith('your_') || !clientSecret || clientSecret.startsWith('your_')) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${provider}_not_configured`);
  }
  next();
};

router.get('/google', checkOAuthConfig('google'), passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }), googlePassportCallback);
router.get('/github', checkOAuthConfig('github'), passport.authenticate('github', { session: false, scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=github_auth_failed` }), githubCallback);
if (process.env.NODE_ENV !== 'production') {
  router.post('/google/dev', devGoogleLogin);
}

router.post('/refresh', refreshToken);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;
