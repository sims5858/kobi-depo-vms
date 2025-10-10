// Netlify Function - Admin logs
exports.handler = async (event, context) => {
  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  // Vercel'de örnek sistem logları
  const data = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      user: 'admin',
      action: 'Giriş',
      details: 'Admin kullanıcısı giriş yaptı',
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'INFO',
      user: 'admin',
      action: 'Ürün Çıkışı',
      details: 'D2-0099 kolisinden ürün çıkarıldı',
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    }
  ];

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
};
