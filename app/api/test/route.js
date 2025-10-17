import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== TEST API ÇALIŞIYOR ===');
    console.log('Vercel ortamı:', process.env.VERCEL ? 'Evet' : 'Hayır');
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    
    return NextResponse.json({
      success: true,
      message: 'API çalışıyor',
      environment: process.env.VERCEL ? 'Vercel' : 'Local',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('Test API hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST method da çalışıyor'
  });
}
