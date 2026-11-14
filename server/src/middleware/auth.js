import jwt from 'jsonwebtoken';

const readUser = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
};

export const requireAuth = (req, res, next) => {
  req.userId = readUser(req);
  if (!req.userId) return res.status(401).json({ message: 'Log in to continue' });
  next();
};

export const optionalAuth = (req, _res, next) => {
  req.userId = readUser(req);
  next();
};

export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
