// Netlify Function - Login
exports.handler = async (event, context) => {
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

  const { kullanici_adi, sifre } = JSON.parse(event.body);

  // Basit test kullanıcısı
  if (kullanici_adi === 'admin' && sifre === 'admin123') {
    const token = 'demo-token-' + Date.now();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
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
      })
    };
  }

  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      success: false, 
      error: 'Geçersiz kullanıcı adı veya şifre' 
    })
  };
};
