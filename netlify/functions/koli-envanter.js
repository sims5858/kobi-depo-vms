module.exports = (req, res) => {
  const { koli_no } = req.query;
  
  if (koli_no) {
    // Belirli bir koli için ürünler
    res.json([
      {
        koli_no: koli_no,
        urun_barkod: 'BRK123456',
        urun_adi: 'Demo Ürün 1',
        adet: 5,
        beden: 'M',
        ana_blok: 'A'
      }
    ]);
  } else {
    // Tüm koliler için ürünler
    res.json([
      {
        koli_no: 'D2-0099',
        urun_barkod: 'BRK123456',
        urun_adi: 'Demo Ürün 1',
        adet: 10,
        beden: 'M',
        ana_blok: 'A'
      },
      {
        koli_no: 'D2-0014',
        urun_barkod: 'BRK789012',
        urun_adi: 'Demo Ürün 2',
        adet: 8,
        beden: 'L',
        ana_blok: 'B'
      }
    ]);
  }
};
