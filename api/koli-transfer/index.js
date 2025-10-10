module.exports = (req, res) => {
  const { cikan_koli, giren_koli, urunler } = req.body;
  
  if (!cikan_koli || !giren_koli || !urunler) {
    return res.status(400).json({ error: 'Gerekli alanlar eksik' });
  }
  
  res.json({
    success: true,
    message: 'Koli transferi başarılı',
    transfer_no: 'TR' + Date.now()
  });
};
