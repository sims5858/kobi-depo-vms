module.exports = (req, res) => {
  // Vercel'de örnek sistem logları
  res.json([
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      user: 'admin',
      action: 'Giriş',
      details: 'Admin kullanıcısı giriş yaptı',
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'INFO',
      user: 'admin',
      action: 'Ürün Çıkışı',
      details: 'K001 kolisinden ürün çıkarıldı',
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    }
  ]);
};
