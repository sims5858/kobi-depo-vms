// Netlify Function - Login
exports.handler = async (event, context) => {
  console.log('Login endpoint çağrıldı:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body
  });

  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password, kullanici_adi, sifre } = JSON.parse(event.body);
    console.log('Login data:', { username, password, kullanici_adi, sifre });

    // Frontend'ten gelen field'ları kontrol et
    const user = username || kullanici_adi;
    const pass = password || sifre;

    console.log('Parsed user data:', { user, pass });

    // Basit test kullanıcısı
    if (user === 'admin' && pass === 'admin123') {
      const token = 'demo-token-' + Date.now();
      console.log('Login başarılı, token:', token);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
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
        })
      };
    }

    console.log('Login başarısız:', { user, pass });
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Sunucu hatası: ' + error.message 
      })
    };
  }
};
