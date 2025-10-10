module.exports = (req, res) => {
  const { koli_nolar } = req.body;
  
  if (!koli_nolar || !Array.isArray(koli_nolar)) {
    return res.status(400).json({ error: 'Koli numarası listesi gerekli' });
  }
  
  res.json({
    success: true,
    message: `${koli_nolar.length} koli silindi`
  });
};
