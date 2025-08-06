import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { generateMintSignature } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';

// Define a chain Amoy com RPC dedicado
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;
const NFT_COLLECTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS;

export async function GET(request: NextRequest) {
  console.log('🔍 Launchpad Config Debug: Starting diagnostic...');

  try {
    // 1. Verificar variáveis de ambiente
    const envCheck = {
      THIRDWEB_SECRET_KEY: {
        exists: !!THIRDWEB_SECRET_KEY,
        value: THIRDWEB_SECRET_KEY ? `...${THIRDWEB_SECRET_KEY.slice(-4)}` : 'MISSING'
      },
      BACKEND_WALLET_ADDRESS: {
        exists: !!BACKEND_WALLET_ADDRESS,
        value: BACKEND_WALLET_ADDRESS || 'MISSING'
      },
      LAUNCHPAD_CONTRACT_ADDRESS: {
        exists: !!LAUNCHPAD_CONTRACT_ADDRESS,
        value: LAUNCHPAD_CONTRACT_ADDRESS || 'MISSING'
      },
      NFT_COLLECTION_CONTRACT_ADDRESS: {
        exists: !!NFT_COLLECTION_CONTRACT_ADDRESS,
        value: NFT_COLLECTION_CONTRACT_ADDRESS || 'MISSING'
      }
    };

    console.log('📋 Environment variables check:', envCheck);

    // 2. Testar conexão com Thirdweb
    let thirdwebTest: { success: boolean; error: string | null } = { success: false, error: null };
    if (THIRDWEB_SECRET_KEY) {
      try {
        const client = createThirdwebClient({ 
          secretKey: THIRDWEB_SECRET_KEY 
        });
        thirdwebTest = { success: true, error: null };
        console.log('✅ Thirdweb client created successfully');
      } catch (error) {
        thirdwebTest = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
        console.error('❌ Thirdweb client creation failed:', error);
      }
    }

    // 3. Testar contrato Launchpad
    let launchpadContractTest: { success: boolean; error: string | null; contractType: string | null } = { success: false, error: null, contractType: null };
    if (LAUNCHPAD_CONTRACT_ADDRESS && THIRDWEB_SECRET_KEY) {
      try {
        const client = createThirdwebClient({ 
          secretKey: THIRDWEB_SECRET_KEY 
        });
        
        const contract = getContract({ 
          client, 
          chain: amoy, 
          address: LAUNCHPAD_CONTRACT_ADDRESS 
        });

        // Tentar gerar uma signature de teste
        if (!BACKEND_WALLET_PRIVATE_KEY) {
          throw new Error('BACKEND_WALLET_PRIVATE_KEY not configured');
        }
        
        const account = privateKeyToAccount({
          client,
          privateKey: BACKEND_WALLET_PRIVATE_KEY,
        });
        
        const mintRequest = {
          to: BACKEND_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
          royaltyRecipient: account.address,
          royaltyBps: 0,
          primarySaleRecipient: account.address,
          metadata: {
            name: "Test NFT",
            description: "Test NFT for configuration check",
            image: "https://example.com/test.png",
          },
          price: "0",
          currency: "0x0000000000000000000000000000000000000000",
          validityStartTimestamp: BigInt(Math.floor(Date.now() / 1000)),
          validityEndTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60),
          uid: `0x${Date.now().toString(16).padStart(64, '0')}`,
        };
        
        const testSignature = await generateMintSignature({
          contract,
          account,
          mintRequest,
        });

        launchpadContractTest = { 
          success: true, 
          error: null,
          contractType: 'SignatureMintERC721 (or compatible)',
          signatureGenerated: true
        };
        console.log('✅ Launchpad contract test successful');
      } catch (error) {
        launchpadContractTest = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          contractType: 'Unknown'
        };
        console.error('❌ Launchpad contract test failed:', error);
      }
    }

    // 4. Testar contrato NFT Collection (fallback)
    let nftCollectionTest: { success: boolean; error: string | null } = { success: false, error: null };
    if (NFT_COLLECTION_CONTRACT_ADDRESS && THIRDWEB_SECRET_KEY) {
      try {
        const client = createThirdwebClient({ 
          secretKey: THIRDWEB_SECRET_KEY 
        });
        
        const contract = getContract({ 
          client, 
          chain: amoy, 
          address: NFT_COLLECTION_CONTRACT_ADDRESS 
        });

        // Tentar gerar uma signature de teste
        if (!BACKEND_WALLET_PRIVATE_KEY) {
          throw new Error('BACKEND_WALLET_PRIVATE_KEY not configured');
        }
        
        const account = privateKeyToAccount({
          client,
          privateKey: BACKEND_WALLET_PRIVATE_KEY,
        });
        
        const mintRequest = {
          to: BACKEND_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
          royaltyRecipient: account.address,
          royaltyBps: 0,
          primarySaleRecipient: account.address,
          metadata: {
            name: "Test NFT",
            description: "Test NFT for configuration check",
            image: "https://example.com/test.png",
          },
          price: "0",
          currency: "0x0000000000000000000000000000000000000000",
          validityStartTimestamp: BigInt(Math.floor(Date.now() / 1000)),
          validityEndTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60),
          uid: `0x${Date.now().toString(16).padStart(64, '0')}`,
        };
        
        const testSignature = await generateMintSignature({
          contract,
          account,
          mintRequest,
        });

        nftCollectionTest = { 
          success: true, 
          error: null,
          contractType: 'NFT Collection (or compatible)',
          signatureGenerated: true
        };
        console.log('✅ NFT Collection contract test successful');
      } catch (error) {
        nftCollectionTest = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          contractType: 'Unknown'
        };
        console.error('❌ NFT Collection contract test failed:', error);
      }
    }

    // 5. Resumo da configuração
    const summary = {
      environment: envCheck,
      thirdweb: thirdwebTest,
      launchpadContract: launchpadContractTest,
      nftCollectionContract: nftCollectionTest,
      recommendations: []
    };

    // Gerar recomendações
    if (!THIRDWEB_SECRET_KEY) {
      summary.recommendations.push('❌ THIRDWEB_SECRET_KEY is missing');
    }
    if (!BACKEND_WALLET_ADDRESS) {
      summary.recommendations.push('❌ BACKEND_WALLET_ADDRESS is missing');
    }
    if (!LAUNCHPAD_CONTRACT_ADDRESS) {
      summary.recommendations.push('❌ NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS is missing');
    }
    if (!launchpadContractTest.success && !nftCollectionTest.success) {
      summary.recommendations.push('❌ No working contract found. Check permissions or deploy new contract.');
    }
    if (launchpadContractTest.success) {
      summary.recommendations.push('✅ Launchpad contract is working!');
    }
    if (nftCollectionTest.success) {
      summary.recommendations.push('✅ NFT Collection contract is working as fallback!');
    }

    console.log('📊 Configuration summary:', summary);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary
    });

  } catch (error) {
    console.error('❌ Launchpad Config Debug Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}