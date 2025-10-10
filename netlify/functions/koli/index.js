// Netlify Function - Koli CRUD
exports.handler = async (event, context) => {
  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    // Yeni koli ekleme
    const { koli_no, lokasyon, durum } = JSON.parse(event.body);
    
    if (!koli_no) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Koli numarası gerekli' })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Koli başarıyla eklendi',
        koli: {
          koli_no,
          lokasyon: lokasyon || null,
          durum: durum || 'aktif',
          urun_sayisi: 0,
          toplam_adet: 0,
          doluluk_orani: 0
        }
      })
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
