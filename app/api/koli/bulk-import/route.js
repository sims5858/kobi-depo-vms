import { NextResponse } from 'next/server';
const { koliDB, urunDB, aktiviteDB } = require('../../../lib/persistent-database');

export async function POST(request) {
  try {
    const bulkData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Toplu koli ekleme başarılı'
    });
  } catch (error) {
    console.error('Toplu koli ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}