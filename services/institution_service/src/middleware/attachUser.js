function attachUserFromHeader(req, res, next) {
  const userHeader = req.headers['x-user'];
  if (userHeader) {
    try {
      req.user = JSON.parse(userHeader);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid user header' });
    }
  }
  next();
}

module.exports = attachUserFromHeader;