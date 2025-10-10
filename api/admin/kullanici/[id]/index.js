module.exports = (req, res) => {
  const { id } = req.query;
  
  if (req.method === 'PUT') {
    // Kullanıcı güncelleme
    const { kullanici_adi, email, ad_soyad, rol, aktif } = req.body;
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      user: {
        id: parseInt(id),
        kullanici_adi,
        email,
        ad_soyad,
        rol,
        aktif
      }
    });
  } else if (req.method === 'DELETE') {
    // Kullanıcı silme
    res.json({
      success: true,
      message: `Kullanıcı ${id} silindi`
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
