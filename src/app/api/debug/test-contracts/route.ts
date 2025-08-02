import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { generateMintSignature } from 'thirdweb/extensions/erc721';

// Define a chain Amoy com RPC dedicado
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS || "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56";

// Lista de contratos para testar usando variáveis de ambiente
const CONTRACTS_TO_TEST = [
  {
    name: "Launchpad Contract (OpenEditionERC721)",
    address: process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || "0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639",
    description: "Contrato OpenEditionERC721 para Launchpad"
  }
];

export async function GET(request: NextRequest) {
  console.log('🧪 Contract Testing: Starting tests...');

  if (!THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS) {
    return NextResponse.json({
      success: false,
      error: 'Missing required environment variables: THIRDWEB_SECRET_KEY or BACKEND_WALLET_ADDRESS'
    }, { status: 500 });
  }

  try {
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });

    const results = [];

    for (const contractInfo of CONTRACTS_TO_TEST) {
      console.log(`🔍 Testing contract: ${contractInfo.name} (${contractInfo.address})`);
      
      try {
        const contract = getContract({ 
          client, 
          chain: amoy, 
          address: contractInfo.address 
        });

        // Testar se o contrato OpenEditionERC721 responde
        try {
          const name = await contract.read.name();
          const symbol = await contract.read.symbol();
          
          results.push({
            name: contractInfo.name,
            address: contractInfo.address,
            description: contractInfo.description,
            success: true,
            error: null,
            signatureGenerated: false, // OpenEditionERC721 usa claim() direto
            recommendation: "✅ WORKING - OpenEditionERC721 ready for Launchpad",
            contractInfo: { name, symbol }
          });
        } catch (error) {
          results.push({
            name: contractInfo.name,
            address: contractInfo.address,
            description: contractInfo.description,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            signatureGenerated: false,
            recommendation: "❌ NOT WORKING - Check contract deployment or permissions"
          });
        }
      } catch (error) {
        results.push({
          name: contractInfo.name,
          address: contractInfo.address,
          description: contractInfo.description,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          signatureGenerated: false,
          recommendation: "❌ NOT WORKING - Check contract address or network"
        });
      }
    }

    // Encontrar o melhor contrato
    const workingContracts = results.filter(r => r.success);
    const bestContract = workingContracts.length > 0 ? workingContracts[0] : null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalContracts: CONTRACTS_TO_TEST.length,
      workingContracts: workingContracts.length,
      bestContract: bestContract ? {
        name: bestContract.name,
        address: bestContract.address,
        recommendation: bestContract.recommendation
      } : null,
      allResults: results,
      recommendations: [
        workingContracts.length > 0 
          ? `✅ Use contract: ${bestContract?.name} (${bestContract?.address})`
          : "❌ OpenEditionERC721 contract not working. Check deployment.",
        "🎯 For Launchpad: Use NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS",
        "🔧 OpenEditionERC721 uses claim() function, not signature minting",
        "📝 Make sure contract is deployed on Polygon Amoy testnet"
      ]
    });

  } catch (error) {
    console.error('❌ Contract Testing Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}