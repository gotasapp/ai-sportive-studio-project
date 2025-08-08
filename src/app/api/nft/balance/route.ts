import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { balanceOf, tokenURI } from 'thirdweb/extensions/erc721';

// Define a chain Amoy
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');
  const contractAddress = searchParams.get('contract');

  if (!walletAddress || !contractAddress) {
    return NextResponse.json({ 
      success: false, 
      error: 'wallet and contract parameters are required' 
    }, { status: 400 });
  }

  if (!THIRDWEB_SECRET_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'THIRDWEB_SECRET_KEY not configured' 
    }, { status: 500 });
  }

  try {
    console.log(`🔍 Checking NFT balance for wallet: ${walletAddress}`);
    console.log(`📄 Contract: ${contractAddress}`);

    // Inicializar cliente Thirdweb
    const thirdwebClient = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });
    
    const contract = getContract({ 
      client: thirdwebClient, 
      chain: amoy, 
      address: contractAddress 
    });

    // Verificar balance
    const balance = await balanceOf({
      contract,
      owner: walletAddress,
    });

    console.log(`💰 NFT Balance: ${balance.toString()}`);

    // Se tem NFTs, vamos tentar pegar alguns detalhes dos últimos
    const nftDetails = [];
    if (balance > BigInt(0)) {
      // Tentar verificar os últimos 3 NFTs (assumindo IDs sequenciais)
      const balanceNumber = Number(balance);
      const startId = Math.max(0, balanceNumber - 3);
      
      for (let i = startId; i < balanceNumber && i < startId + 3; i++) {
        try {
          const uri = await tokenURI({
            contract,
            tokenId: BigInt(i),
          });
          nftDetails.push({
            tokenId: i,
            tokenURI: uri
          });
        } catch (error) {
          console.log(`⚠️ Could not fetch tokenURI for ID ${i}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      walletAddress,
      contractAddress,
      balance: balance.toString(),
      nftDetails
    });

  } catch (error) {
    console.error('❌ NFT Balance check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check NFT balance' 
    }, { status: 500 });
  }
}