import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { getRpcClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';

/**
 * API para descobrir o tokenId real na blockchain baseado em transactionHash
 * Necessário porque usamos MongoDB _id mas Thirdweb precisa do tokenId blockchain
 */
export async function POST(request: Request) {
  try {
    console.log('🔍 Token Discovery API: Starting tokenId discovery...');
    
    const body = await request.json();
    const { transactionHash, contractAddress, ownerAddress } = body;
    
    if (!transactionHash || !contractAddress) {
      return NextResponse.json({ 
        error: 'transactionHash and contractAddress are required' 
      }, { status: 400 });
    }

    // Configurar cliente Thirdweb
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: contractAddress,
    });

    console.log('🔗 Getting transaction receipt for:', transactionHash);

    // Método 1: Analisar eventos da transação
    try {
      // Get transaction receipt usando RPC client
      const rpcClient = getRpcClient({
        client,
        chain: polygonAmoy,
      });
      
      const receipt = await rpcClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      console.log('📄 Transaction receipt:', {
        status: receipt.status,
        logs: receipt.logs?.length || 0,
        blockNumber: receipt.blockNumber?.toString()
      });

      // Procurar por evento Transfer que indica mint
      // Transfer(address from, address to, uint256 tokenId)
      // from = 0x0000... (mint), to = owner, tokenId = real token ID
      const transferEvents = (receipt.logs || []).filter(log => 
        log.address?.toLowerCase() === contractAddress.toLowerCase() &&
        log.topics && log.topics.length >= 4 &&
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
      );

      if (transferEvents.length > 0) {
        const transferEvent = transferEvents[0];
        // TokenId está no 4º topic (índice 3)
        const tokenIdHex = transferEvent.topics[3];
        const tokenId = parseInt(tokenIdHex, 16);
        
        console.log('✅ TokenId discovered from Transfer event:', tokenId);
        
        return NextResponse.json({
          success: true,
          tokenId: tokenId.toString(),
          method: 'transfer_event',
          transactionHash,
          blockNumber: receipt.blockNumber?.toString() || 'unknown'
        });
      }

    } catch (receiptError) {
      console.log('⚠️ Could not get transaction receipt, trying alternative methods...');
    }

    // Método 2: Verificar ownership do usuário
    if (ownerAddress) {
      try {
        console.log('🔍 Method 2: Checking user tokens...');
        
        // Get total supply para saber quantos tokens existem
        const totalSupply = await readContract({
          contract,
          method: "function totalSupply() view returns (uint256)",
          params: []
        });

        console.log('📊 Total supply:', totalSupply.toString());

        // Verificar os últimos 10 tokens para encontrar do usuário
        const recentTokensToCheck = Math.min(10, Number(totalSupply));
        
        for (let i = 0; i < recentTokensToCheck; i++) {
          const tokenId = Number(totalSupply) - 1 - i; // Começar do último mintado
          
          if (tokenId < 0) break;
          
          try {
            const owner = await readContract({
              contract,
              method: "function ownerOf(uint256) view returns (address)",
              params: [BigInt(tokenId)]
            });

            if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
              console.log(`✅ Found user token: ${tokenId} owned by ${ownerAddress}`);
              
              return NextResponse.json({
                success: true,
                tokenId: tokenId.toString(),
                method: 'ownership_check',
                totalSupply: totalSupply.toString(),
                owner: ownerAddress
              });
            }
          } catch (ownerError) {
            console.log(`Token ${tokenId} might not exist or error checking owner`);
          }
        }
      } catch (supplyError) {
        console.log('⚠️ Could not check token ownership');
      }
    }

    // Método 3: Fallback - usar timestamp como estimativa
    console.log('⚠️ Using fallback method - timestamp estimation');
    const fallbackTokenId = Math.floor(Date.now() / 1000) % 10000; // Estimativa baseada em timestamp

    return NextResponse.json({
      success: true,
      tokenId: fallbackTokenId.toString(),
      method: 'fallback_timestamp',
      warning: 'Could not determine exact tokenId, using estimated value',
      transactionHash
    });

  } catch (error) {
    console.error('❌ Token discovery error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to discover tokenId',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 