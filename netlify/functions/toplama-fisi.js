// Netlify Function - Toplama fişi
exports.handler = async (event, context) => {
  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    // Toplama fişi oluşturma
    const { urunler } = JSON.parse(event.body);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Toplama fişi oluşturuldu',
        fisi_no: 'TF' + Date.now()
      })
    };
  } else if (event.httpMethod === 'GET') {
    // Toplama fişleri listesi
    const data = [
      {
        fisi_no: 'TF001',
        toplama_tarihi: new Date().toISOString(),
        toplam_urun: 5,
        toplam_adet: 15
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
  } else {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
};
