// Vercel API endpoint - Login
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { kullanici_adi, sifre } = req.body;

  // Basit test kullanıcısı
  if (kullanici_adi === 'admin' && sifre === 'admin123') {
    const token = 'demo-token-' + Date.now();
    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: 1,
        kullanici_adi: 'admin',
        ad: 'Admin',
        soyad: 'User',
        email: 'admin@vms.com',
        rol: 'admin',
        aktif: true
      }
    });
  }

  return res.status(401).json({ 
    success: false, 
    error: 'Geçersiz kullanıcı adı veya şifre' 
  });
}
