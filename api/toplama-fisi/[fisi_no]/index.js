module.exports = (req, res) => {
  const { fisi_no } = req.query;
  
  // Toplama fişi detayları
  res.json({
    fisi_no: fisi_no,
    toplama_tarihi: new Date().toISOString(),
    urunler: [
      {
        urun_barkod: '123456789',
        urun_adi: 'Örnek Ürün 1',
        koli_no: 'K001',
        adet: 5
      }
    ]
  });
};
