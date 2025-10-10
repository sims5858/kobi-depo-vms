module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'VMS API çalışıyor!',
    timestamp: new Date().toISOString()
  });
};
