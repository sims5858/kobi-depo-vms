module.exports = (req, res) => {
  // Vercel'de Excel import simülasyonu
  res.json({
    success: true,
    message: 'Excel dosyası başarıyla yüklendi',
    imported: 10,
    errors: 0
  });
};
