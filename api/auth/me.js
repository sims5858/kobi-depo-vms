const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim token\'ı gerekli' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'vms-secret-key-2025', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    res.json({ user });
  });
};
