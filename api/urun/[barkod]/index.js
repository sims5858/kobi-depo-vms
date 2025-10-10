module.exports = (req, res) => {
  const { barkod } = req.query;
  
  if (req.method === 'DELETE') {
    // Ürün silme
    res.json({
      success: true,
      message: `${barkod} barkodlu ürün silindi`
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
