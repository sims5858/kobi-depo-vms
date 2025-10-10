// Netlify Function - Terminal logs
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

  // Vercel'de örnek terminal logları
  const data = [
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Server başlatıldı'
    },
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'INFO',
      message: 'Veritabanı bağlantısı başarılı'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'WARN',
      message: 'Örnek uyarı mesajı'
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
