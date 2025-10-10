// Netlify Function - Çıkış geçmişi
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

  const { tarih } = event.queryStringParameters || {};
  
  // Vercel'de örnek çıkış geçmişi
  const data = [
    {
      koli_no: 'D2-0099',
      urunler: [
        {
          urun_barkod: 'BRK123456',
          urun_adi: 'Demo Ürün 1',
          adet: 5,
          beden: 'M'
        }
      ]
    },
    {
      koli_no: 'D2-0014',
      urunler: [
        {
          urun_barkod: 'BRK789012',
          urun_adi: 'Demo Ürün 2',
          adet: 3,
          beden: 'L'
        }
      ]
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
