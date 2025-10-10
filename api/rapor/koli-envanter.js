module.exports = (req, res) => {
  const { min_adet, max_adet, sadece_bos } = req.query;
  
  // Vercel'de örnek koli envanter raporu
  let data = [
    {
      koli_no: 'D2-0099',
      urun_barkod: 'BRK123456',
      urun_adi: 'Demo Ürün 1',
      adet: 10,
      beden: 'M',
      ana_blok: 'A'
    },
    {
      koli_no: 'D2-0014',
      urun_barkod: 'BRK789012',
      urun_adi: 'Demo Ürün 2',
      adet: 5,
      beden: 'L',
      ana_blok: 'B'
    },
    {
      koli_no: 'D2-0015',
      urun_barkod: 'BRK345678',
      urun_adi: 'Demo Ürün 3',
      adet: 0,
      beden: 'XL',
      ana_blok: 'C'
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
