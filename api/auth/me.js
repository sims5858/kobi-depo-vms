module.exports = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim token\'ı gerekli' });
  }

  // Basit token kontrolü
  if (token.startsWith('demo-token-')) {
    res.json({ 
      user: {
        id: 1,
        kullanici_adi: 'admin',
        email: 'admin@vms.com',
        rol: 'admin',
        aktif: true
      }
    });
  } else {
    res.status(403).json({ error: 'Geçersiz token' });
  }
};
