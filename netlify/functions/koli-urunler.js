// Netlify Function - Koli ürünleri
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

  const { koli_no } = event.queryStringParameters || {};
  
  // Örnek koli ürünleri
  const urunler = [
    {
      urun_barkod: 'BRK123456',
      urun_adi: 'Demo Ürün 1',
      adet: 5,
      beden: 'M',
      ana_blok: 'A'
    },
    {
      urun_barkod: 'BRK789012',
      urun_adi: 'Demo Ürün 2',
      adet: 3,
      beden: 'L',
      ana_blok: 'B'
    }
  ];

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(urunler)
  };
};
