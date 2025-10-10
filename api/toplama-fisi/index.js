module.exports = (req, res) => {
  if (req.method === 'POST') {
    // Toplama fişi oluşturma
    const { urunler } = req.body;
    
    res.json({
      success: true,
      message: 'Toplama fişi oluşturuldu',
      fisi_no: 'TF' + Date.now()
    });
  } else if (req.method === 'GET') {
    // Toplama fişleri listesi
    res.json([
      {
        fisi_no: 'TF001',
        toplama_tarihi: new Date().toISOString(),
        toplam_urun: 5,
        toplam_adet: 15
      }
    ]);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
