const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../lib/ApiError');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing or invalid bearer token.'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.userId = payload.sub;
    req.userMobile = payload.mobile;
    next();
  } catch (err) {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Missing or invalid bearer token.'));
  }
}

function requireVerifiedMobile(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing verified-mobile token.'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    if (payload.purpose !== 'profile_creation' || !payload.mobile) {
      throw new Error('wrong token purpose');
    }
    req.verifiedMobile = payload.mobile;
    next();
  } catch (err) {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Missing or invalid verified-mobile token.'));
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id, mobile: user.mobile }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

module.exports = { requireAuth, requireVerifiedMobile, signToken };
