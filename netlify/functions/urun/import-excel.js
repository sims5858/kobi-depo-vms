module.exports = (req, res) => {
  // Vercel'de Excel import simülasyonu
  res.json({
    success: true,
    message: 'Excel dosyası başarıyla yüklendi',
    yeniUrunler: 5,
    guncellenenUrunler: 2,
    successCount: 7,
    errorCount: 0
  });
};
