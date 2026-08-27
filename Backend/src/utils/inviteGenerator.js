const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is not defined.');
  }
  return secret;
};

const generateInviteToken = (role, email = '') => {
  return jwt.sign({ role, email, type: 'INVITE' }, getJwtSecret(), { expiresIn: '7d' });
};

const verifyInviteToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.type !== 'INVITE') throw new Error('Invalid token type');
    return decoded;
  } catch (error) {
    return null;
  }
};

const generateUserToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
};

module.exports = {
  generateInviteToken,
  verifyInviteToken,
  generateUserToken,
  getJwtSecret
};
