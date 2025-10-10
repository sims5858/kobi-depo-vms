module.exports = (req, res) => {
  const { koli_no } = req.query;
  
  if (req.method === 'DELETE') {
    // Koli silme
    res.json({
      success: true,
      message: `${koli_no} numaralı koli silindi`
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
