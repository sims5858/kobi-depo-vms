module.exports = (req, res) => {
  const { koli_no } = req.query;
  
  // Vercel'de örnek koli ürünleri
  res.json([
    {
      urun_barkod: '123456789',
      urun_adi: 'Örnek Ürün 1',
      adet: 5,
      beden: 'M',
      ana_blok: 'A'
    },
    {
      urun_barkod: '987654321',
      urun_adi: 'Örnek Ürün 2',
      adet: 3,
      beden: 'L',
      ana_blok: 'B'
    }
  ]);
};
