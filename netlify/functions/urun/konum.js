// Netlify Function - Ürün konum arama
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

  const { query } = event.queryStringParameters || {};
  
  // Vercel'de ürün konum arama
  const results = [
    {
      barkod: 'BRK123456',
      urun_adi: 'Demo Ürün 1',
      koli_no: 'D2-0099',
      adet: 5,
      lokasyon: 'A Blok'
    },
    {
      barkod: 'BRK789012',
      urun_adi: 'Demo Ürün 2',
      koli_no: 'D2-0014',
      adet: 3,
      lokasyon: 'B Blok'
    }
  ];

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(results)
  };
};
