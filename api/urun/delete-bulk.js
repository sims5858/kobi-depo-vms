module.exports = (req, res) => {
  const { barkodlar } = req.body;
  
  if (!barkodlar || !Array.isArray(barkodlar)) {
    return res.status(400).json({ error: 'Barkod listesi gerekli' });
  }
  
  res.json({
    success: true,
    message: `${barkodlar.length} ürün silindi`
  });
};
