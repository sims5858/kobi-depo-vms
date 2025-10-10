// Netlify Function - Ürün CRUD
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
    // Yeni ürün ekleme
    const { barkod, urun_adi, beden, ana_blok, koli_no } = JSON.parse(event.body);
    
    if (!barkod || !urun_adi) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Barkod ve ürün adı gerekli' })
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
        message: 'Ürün başarıyla eklendi',
        urun: {
          barkod,
          urun_adi,
          beden: beden || null,
          ana_blok: ana_blok || null,
          koli_no: koli_no || null,
          toplam_adet: 1
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
