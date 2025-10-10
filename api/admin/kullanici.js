module.exports = (req, res) => {
  if (req.method === 'GET') {
    // Kullanıcı listesi
    res.json([
      {
        id: 1,
        kullanici_adi: 'admin',
        email: 'admin@vms.com',
        ad_soyad: 'Sistem Yöneticisi',
        rol: 'admin',
        aktif: 1,
        olusturma_tarihi: new Date().toISOString(),
        son_giris: new Date().toISOString()
      },
      {
        id: 2,
        kullanici_adi: 'user1',
        email: 'user1@vms.com',
        ad_soyad: 'Test Kullanıcı',
        rol: 'kullanici',
        aktif: 1,
        olusturma_tarihi: new Date(Date.now() - 86400000).toISOString(),
        son_giris: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  } else if (req.method === 'POST') {
    // Yeni kullanıcı ekleme
    const { kullanici_adi, email, ad_soyad, rol, sifre } = req.body;
    
    if (!kullanici_adi || !email || !ad_soyad || !rol) {
      return res.status(400).json({ error: 'Gerekli alanlar eksik' });
    }
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: Date.now(),
        kullanici_adi,
        email,
        ad_soyad,
        rol,
        aktif: 1,
        olusturma_tarihi: new Date().toISOString()
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
