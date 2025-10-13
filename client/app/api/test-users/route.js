// Test API - Kullanıcıları kontrol et
import { loadData } from '../data-store.js';

export async function GET() {
  try {
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];
    
    return Response.json({
      success: true,
      kullanicilar: kullanicilar,
      total: kullanicilar.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
