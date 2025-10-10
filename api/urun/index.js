module.exports = (req, res) => {
  if (req.method === 'POST') {
    // Yeni ürün ekleme
    const { barkod, urun_adi, beden, ana_blok, koli_no } = req.body;
    
    if (!barkod || !urun_adi) {
      return res.status(400).json({ error: 'Barkod ve ürün adı gerekli' });
    }
    
    res.json({
      success: true,
      message: 'Ürün başarıyla eklendi',
      urun: {
        barkod,
        urun_adi,
        beden: beden || null,
        ana_blok: ana_blok || null,
        koli_no: koli_no || null,
        toplam_adet: 1
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
