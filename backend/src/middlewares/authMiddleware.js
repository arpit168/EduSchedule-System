import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const tryRefreshToken = async (req, res) => {
  if (!req.cookies || !req.cookies.refreshToken) return null;
  try {
    const refreshToken = req.cookies.refreshToken;
    const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforAntigravity987654321');
    const user = await User.findById(decodedRefresh.id).select('+refreshToken').populate('department');
    if (user && user.refreshToken === refreshToken) {
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'supersecretjwtkeyforAntigravity123456789',
        { expiresIn: '15m' }
      );
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
      return user;
    }
  } catch (err) {
    return null;
  }
  return null;
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // Try refresh token before failing
      const refreshedUser = await tryRefreshToken(req, res);
      if (refreshedUser) {
        req.user = refreshedUser;
        return next();
      }
      return res.status(401).json({ success: false, message: 'Not authorized to access this route. Please log in.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforAntigravity123456789');
      req.user = await User.findById(decoded.id).populate('department');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists.' });
      }
      return next();
    } catch (err) {
      // If token expired, try refresh token
      const refreshedUser = await tryRefreshToken(req, res);
      if (refreshedUser) {
        req.user = refreshedUser;
        return next();
      }
      return res.status(401).json({ success: false, message: 'Token is invalid or expired. Please log in again.' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired. Please log in again.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const refreshedUser = await tryRefreshToken(req, res);
      req.user = refreshedUser || null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforAntigravity123456789');
      req.user = await User.findById(decoded.id).populate('department');
      if (!req.user) {
        const refreshedUser = await tryRefreshToken(req, res);
        req.user = refreshedUser || null;
      }
      return next();
    } catch (err) {
      const refreshedUser = await tryRefreshToken(req, res);
      req.user = refreshedUser || null;
      return next();
    }
  } catch (error) {
    req.user = null;
    return next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role (${req.user ? req.user.role : 'None'}) is not authorized to access this route. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

export { protect, optionalAuth, authorize };
