module.exports = (req, res) => {
  // Vercel'de örnek terminal logları
  res.json([
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Server başlatıldı'
    },
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'INFO',
      message: 'Veritabanı bağlantısı başarılı'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'WARN',
      message: 'Örnek uyarı mesajı'
    }
  ]);
};
