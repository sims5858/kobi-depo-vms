import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase-database.js';

export async function GET() {
  try {
    console.log('=== SUPABASE TEST API ===');
    
    // Supabase bağlantısını test et
    const { data, error } = await supabase
      .from('kullanicilar')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase bağlantı hatası:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase bağlantı hatası: ' + error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log('Supabase bağlantı başarılı:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase bağlantısı başarılı',
      data: data,
      connection: 'OK'
    });
    
  } catch (error) {
    console.error('Test API hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Test API hatası: ' + error.message
    }, { status: 500 });
  }
}
