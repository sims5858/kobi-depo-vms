// Vercel API endpoint - Dashboard activities
export default function handler(req, res) {
  const activities = [
    {
      id: 1,
      type: 'koli_ekleme',
      description: 'Yeni koli eklendi: D2-0099',
      timestamp: new Date().toISOString(),
      user: 'admin'
    },
    {
      id: 2,
      type: 'urun_cikis',
      description: 'Ürün çıkışı yapıldı: BRK123456',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'admin'
    },
    {
      id: 3,
      type: 'koli_transfer',
      description: 'Koli transfer edildi: D2-0014 → D2-0015',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'admin'
    }
  ];

  res.status(200).json(activities);
}
