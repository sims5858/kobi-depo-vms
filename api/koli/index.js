module.exports = (req, res) => {
  if (req.method === 'POST') {
    // Yeni koli ekleme
    const { koli_no, lokasyon, durum } = req.body;
    
    if (!koli_no) {
      return res.status(400).json({ error: 'Koli numarası gerekli' });
    }
    
    res.json({
      success: true,
      message: 'Koli başarıyla eklendi',
      koli: {
        koli_no,
        lokasyon: lokasyon || null,
        durum: durum || 'aktif',
        urun_sayisi: 0,
        toplam_adet: 0,
        doluluk_orani: 0
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
