import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📋 Admin Import Contract API called...');
    
    const { contractAddress, chainId = 80002 } = await request.json();

    if (!contractAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Contract address is required' 
      }, { status: 400 });
    }

    // Importar contrato para dashboard Thirdweb via API
    const importResponse = await fetch('https://api.thirdweb.com/v1/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.THIRDWEB_SECRET_KEY}`,
      },
      body: JSON.stringify({
        contractAddress,
        chainId,
        // Opcional: metadata adicional
        name: `Imported Collection ${contractAddress.slice(0, 8)}`,
        description: 'Auto-imported collection from app',
      }),
    });

    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      console.error('❌ Thirdweb import failed:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: `Import failed: ${errorText}` 
      }, { status: 500 });
    }

    const importResult = await importResponse.json();
    console.log('✅ Contract imported to Thirdweb:', importResult);

    return NextResponse.json({
      success: true,
      message: 'Contract imported successfully to Thirdweb dashboard',
      contractAddress,
      importResult,
    });

  } catch (error: any) {
    console.error('❌ Import failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Import failed' 
    }, { status: 500 });
  }
}