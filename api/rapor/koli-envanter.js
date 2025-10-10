module.exports = (req, res) => {
  const { min_adet, max_adet, sadece_bos } = req.query;
  
  // Vercel'de örnek koli envanter raporu
  let data = [
    {
      koli_no: 'K001',
      urun_barkod: '123456789',
      urun_adi: 'Örnek Ürün 1',
      adet: 10,
      beden: 'M',
      ana_blok: 'A'
    },
    {
      koli_no: 'K002',
      urun_barkod: '987654321',
      urun_adi: 'Örnek Ürün 2',
      adet: 5,
      beden: 'L',
      ana_blok: 'B'
    }
  ];
  
  // Filtreleme
  if (min_adet && parseInt(min_adet) > 0) {
    data = data.filter(item => item.adet >= parseInt(min_adet));
  }
  
  if (max_adet && parseInt(max_adet) < 999999) {
    data = data.filter(item => item.adet <= parseInt(max_adet));
  }
  
  if (sadece_bos === 'true') {
    data = data.filter(item => item.adet === 0);
  }
  
  res.json(data);
};
