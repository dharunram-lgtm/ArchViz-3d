const passport = require('passport');
const { User } = require('../models/sqlite');

const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('your_') && process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_SECRET.startsWith('your_');
const hasGitHubCreds = process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_ID.startsWith('your_') && process.env.GITHUB_CLIENT_SECRET && !process.env.GITHUB_CLIENT_SECRET.startsWith('your_');

if (hasGoogleCreds) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(
    new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = User.findOne({
          authProvider: 'google',
          authProviderId: profile.id,
        });
        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = User.findOne({ email });
          }
          if (user) {
            user.authProvider = 'google';
            user.authProviderId = profile.id;
            if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              email: email || `${profile.id}@google-oauth.com`,
              authProvider: 'google',
              authProviderId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isVerified: true,
            });
          }
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
  );
}

if (hasGitHubCreds) {
  const GitHubStrategy = require('passport-github2').Strategy;
  passport.use(
    new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        }
        let user = User.findOne({
          authProvider: 'github',
          authProviderId: profile.id,
        });
        if (!user) {
          if (email) {
            user = User.findOne({ email });
            if (user) {
              user.authProvider = 'github';
              user.authProviderId = profile.id;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
              await user.save();
            }
          }
          if (!user) {
            user = await User.create({
              name: profile.displayName || profile.username,
              email: email || `${profile.id}@github-oauth.com`,
              authProvider: 'github',
              authProviderId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isVerified: true,
            });
          }
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
