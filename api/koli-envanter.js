module.exports = (req, res) => {
  const { koli_no } = req.query;
  
  if (koli_no) {
    // Belirli bir koli için ürünler
    res.json([
      {
        koli_no: koli_no,
        urun_barkod: '123456789',
        urun_adi: 'Örnek Ürün',
        adet: 5,
        beden: 'M',
        ana_blok: 'A'
      }
    ]);
  } else {
    // Tüm koliler için ürünler
    res.json([
      {
        koli_no: 'K001',
        urun_barkod: '123456789',
        urun_adi: 'Örnek Ürün 1',
        adet: 10,
        beden: 'M',
        ana_blok: 'A'
      },
      {
        koli_no: 'K002',
        urun_barkod: '987654321',
        urun_adi: 'Örnek Ürün 2',
        adet: 8,
        beden: 'L',
        ana_blok: 'B'
      }
    ]);
  }
};
