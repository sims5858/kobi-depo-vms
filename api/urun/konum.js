module.exports = (req, res) => {
  const { query } = req.query;
  
  // Vercel'de ürün konum arama
  res.json([
    {
      barkod: '123456789',
      urun_adi: 'Örnek Ürün 1',
      koli_no: 'K001',
      adet: 5,
      lokasyon: 'A Blok'
    },
    {
      barkod: '987654321',
      urun_adi: 'Örnek Ürün 2',
      koli_no: 'K002',
      adet: 3,
      lokasyon: 'B Blok'
    }
  ]);
};
