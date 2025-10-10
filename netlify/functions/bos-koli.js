// Netlify Function - Boş koli listesi
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

  // Vercel'de örnek boş koli listesi
  const data = [
    {
      koli_no: 'D2-0030',
      lokasyon: 'A Blok',
      kapasite: 100,
      mevcut_adet: 0
    },
    {
      koli_no: 'D2-0031',
      lokasyon: 'B Blok',
      kapasite: 100,
      mevcut_adet: 0
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
