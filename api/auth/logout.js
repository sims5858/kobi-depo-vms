const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  // Vercel'de basit logout - token'ı geçersiz kılmak için
  res.json({ message: 'Başarıyla çıkış yapıldı' });
};
