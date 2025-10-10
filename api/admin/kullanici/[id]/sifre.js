module.exports = (req, res) => {
  const { id } = req.query;
  const { yeni_sifre } = req.body;
  
  if (!yeni_sifre) {
    return res.status(400).json({ error: 'Yeni şifre gerekli' });
  }
  
  res.json({
    success: true,
    message: 'Şifre başarıyla değiştirildi'
  });
};
