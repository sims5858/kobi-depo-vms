module.exports = (req, res) => {
  const { koli_no, barkod, adet } = req.body;
  
  if (!koli_no || !barkod || !adet) {
    return res.status(400).json({ error: 'Koli numarası, barkod ve adet gerekli' });
  }
  
  // Vercel'de basit çıkış işlemi
  res.json({
    success: true,
    message: 'Ürün çıkışı başarılı',
    kalan_adet: Math.max(0, 10 - adet) // Örnek kalan adet
  });
};
