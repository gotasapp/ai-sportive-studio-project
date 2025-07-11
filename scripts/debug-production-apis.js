#!/usr/bin/env node

const fetch = require('node-fetch');

// CONFIGURE AQUI:
const USER_WALLET = "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56";
const PRODUCTION_URL = "https://jersey-generator-ai2.vercel.app"; // Sua URL do Vercel

// Os 3 NFTs problemáticos
const PROBLEM_NFTS = [0, 1, 3];

async function debugProductionAPIs() {
  console.log('🔍 DEBUGGING PRODUCTION APIs');
  console.log('============================\n');
  
  if (PRODUCTION_URL.includes('SUA_URL')) {
    console.log('❌ Configure PRODUCTION_URL primeiro!');
    return;
  }
  
  try {
    console.log('🌐 Production URL:', PRODUCTION_URL);
    console.log('👤 User Wallet:', USER_WALLET);
    console.log('🎯 Problem NFTs:', PROBLEM_NFTS.join(', '), '\n');
    
    // 1. TESTAR API DE PROFILE (usada pela página)
    console.log('📋 STEP 1: Testando /api/profile/user-nfts (Profile Page)...');
    console.log('='.repeat(60));
    
    const profileUrl = `${PRODUCTION_URL}/api/profile/user-nfts?address=${USER_WALLET}`;
    console.log('URL:', profileUrl, '\n');
    
    const profileResponse = await fetch(profileUrl);
    const profileResult = await profileResponse.json();
    
    if (!profileResult.success) {
      console.log('❌ Profile API falhou:', profileResult.error);
    } else {
      const profileNFTs = profileResult.data.nfts || [];
      console.log(`✅ Profile API: ${profileNFTs.length} NFTs total`);
      console.log(`📊 Source: ${profileResult.source}\n`);
      
      // Verificar especificamente os 3 NFTs problemáticos
      console.log('🎯 Checando os 3 NFTs problemáticos na Profile API:');
      for (const tokenId of PROBLEM_NFTS) {
        const nft = profileNFTs.find(n => n.tokenId === tokenId.toString());
        if (nft) {
          console.log(`   ✅ Token ID ${tokenId}: ${nft.name}`);
          console.log(`      Image URL: ${nft.imageUrl || 'AUSENTE'}`);
          console.log(`      Status: ${nft.status}`);
        } else {
          console.log(`   ❌ Token ID ${tokenId}: NÃO ENCONTRADO na Profile API`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. TESTAR API INDIVIDUAL (usada pelo modal)
    console.log('📋 STEP 2: Testando /api/nft/{tokenId} (Modal)...');
    console.log('='.repeat(60));
    
    for (const tokenId of PROBLEM_NFTS) {
      console.log(`\n🎯 Testing Token ID ${tokenId}:`);
      
      const nftUrl = `${PRODUCTION_URL}/api/nft/${tokenId}`;
      console.log(`   URL: ${nftUrl}`);
      
      try {
        const nftResponse = await fetch(nftUrl);
        const nftResult = await nftResponse.json();
        
        if (!nftResult.success) {
          console.log(`   ❌ NFT API falhou: ${nftResult.error}`);
        } else {
          const nftData = nftResult.data;
          console.log(`   ✅ NFT API: ${nftData.name}`);
          console.log(`   📊 Source: ${nftResult.source}`);
          console.log(`   🖼️  Original Image: ${nftData.image || 'AUSENTE'}`);
          console.log(`   🖼️  HTTP Image: ${nftData.imageHttp || 'AUSENTE'}`);
          
          // Testar se a imagem é acessível
          if (nftData.imageHttp) {
            console.log(`   🔍 Testando acessibilidade da imagem...`);
            const imageAccessible = await testImageUrl(nftData.imageHttp);
            console.log(`   🌐 Image accessible: ${imageAccessible ? '✅ SIM' : '❌ NÃO'}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro na requisição: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 3. COMPARAÇÃO E CONCLUSÕES
    console.log('📋 STEP 3: Comparação e Conclusões');
    console.log('==================================');
    
    console.log('🔍 Possíveis causas da diferença:');
    console.log('1. Profile API e NFT API usando fontes diferentes');
    console.log('2. Cache desatualizado na Profile API');
    console.log('3. Processamento diferente de imageUrl vs imageHttp');
    console.log('4. Timeout ou erro específico na Profile API');
    
    console.log('\n💡 Próximos passos:');
    console.log('- Se NFT API funciona mas Profile API não: problema no cache/processamento');
    console.log('- Se ambas falham: problema na fonte de dados (blockchain/MongoDB)');
    console.log('- Se imageUrls são diferentes: problema na conversão IPFS');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  }
}

async function testImageUrl(imageUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Executar diagnóstico
if (!PRODUCTION_URL.includes('SUA_URL')) {
  debugProductionAPIs();
} else {
  console.log('❌ CONFIGURE PRIMEIRO:');
  console.log('1. Substitua PRODUCTION_URL pela URL do Vercel');
  console.log('2. Execute: node scripts/debug-production-apis.js');
} 