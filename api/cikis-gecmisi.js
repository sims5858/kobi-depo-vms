module.exports = (req, res) => {
  const { tarih } = req.query;
  
  // Vercel'de örnek çıkış geçmişi
  res.json([
    {
      koli_no: 'K001',
      urunler: [
        {
          urun_barkod: '123456789',
          urun_adi: 'Örnek Ürün 1',
          adet: 5,
          beden: 'M'
        }
      ]
    },
    {
      koli_no: 'K002',
      urunler: [
        {
          urun_barkod: '987654321',
          urun_adi: 'Örnek Ürün 2',
          adet: 3,
          beden: 'L'
        }
      ]
    }
  ]);
};
