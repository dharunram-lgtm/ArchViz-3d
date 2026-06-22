const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User, ActivityLog } = require('../models/sqlite');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: 'local',
      isVerified: true,
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    ActivityLog.create({
      user: user._id,
      action: 'user.register',
      details: { email: user.email },
    });

    setTokenCookie(res, token);

    res.status(201).json({
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({
        message: `This account uses ${user.authProvider} login. Please sign in with ${user.authProvider}.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    ActivityLog.create({
      user: user._id,
      action: 'user.login',
      details: { email: user.email },
    });

    setTokenCookie(res, token);

    res.json({
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = User.findOne({ authProvider: 'google', authProviderId: sub });
    if (!user) {
      user = User.findOne({ email });
      if (user) {
        user.authProvider = 'google';
        user.authProviderId = sub;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          authProvider: 'google',
          authProviderId: sub,
          avatar: picture,
          isVerified: true,
        });
      }
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookie(res, token);

    res.json({ token, refreshToken, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

exports.googlePassportCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    req.user.refreshToken = refreshToken;
    await req.user.save();

    const userData = encodeURIComponent(JSON.stringify(req.user.toJSON()));
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&user=${userData}`
    );
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

exports.githubAuth = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    req.user.refreshToken = refreshToken;
    await req.user.save();

    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

exports.githubCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    req.user.refreshToken = refreshToken;
    await req.user.save();

    const userData = encodeURIComponent(JSON.stringify(req.user.toJSON()));
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&user=${userData}`
    );
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = User.findById(req.user._id);
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.devGoogleLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        authProvider: 'google',
        authProviderId: `dev_${Date.now()}`,
        avatar: '',
        isVerified: true,
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookie(res, token);
    res.json({ token, refreshToken, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
      ActivityLog.create({
        user: user._id,
        action: 'user.logout',
      });
    }
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
