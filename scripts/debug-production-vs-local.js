#!/usr/bin/env node

const fetch = require('node-fetch');

// COLOQUE AQUI:
const USER_WALLET = "SEU_ENDERECO_AQUI"; // Seu endereço real
const PRODUCTION_URL = "SUA_URL_VERCEL_AQUI"; // URL do Vercel

async function compareLocalVsProduction() {
  console.log('🔍 COMPARANDO LOCAL vs PRODUÇÃO');
  console.log('=================================\n');
  
  try {
    console.log('📋 Testando com endereço:', USER_WALLET);
    console.log('🌐 URL Produção:', PRODUCTION_URL);
    console.log('🏠 URL Local: http://localhost:3000\n');
    
    // 1. BUSCAR DADOS LOCAL
    console.log('🏠 STEP 1: Buscando dados LOCAL...');
    const localResponse = await fetch(`http://localhost:3000/api/profile/user-nfts?address=${USER_WALLET}`);
    const localResult = await localResponse.json();
    
    console.log(`✅ Local Status: ${localResponse.status}`);
    console.log(`✅ Local Success: ${localResult.success}`);
    console.log(`✅ Local Source: ${localResult.source}`);
    
    const localNFTs = localResult.success ? (localResult.data.nfts || []) : [];
    console.log(`✅ Local NFTs Count: ${localNFTs.length}\n`);
    
    // 2. BUSCAR DADOS PRODUÇÃO
    console.log('🌐 STEP 2: Buscando dados PRODUÇÃO...');
    const prodResponse = await fetch(`${PRODUCTION_URL}/api/profile/user-nfts?address=${USER_WALLET}`);
    const prodResult = await prodResponse.json();
    
    console.log(`✅ Prod Status: ${prodResponse.status}`);
    console.log(`✅ Prod Success: ${prodResult.success}`);
    console.log(`✅ Prod Source: ${prodResult.source}`);
    
    const prodNFTs = prodResult.success ? (prodResult.data.nfts || []) : [];
    console.log(`✅ Prod NFTs Count: ${prodNFTs.length}\n`);
    
    // 3. COMPARAR NFT POR NFT
    console.log('🔍 STEP 3: Comparando NFT por NFT...');
    console.log('=====================================\n');
    
    const maxLength = Math.max(localNFTs.length, prodNFTs.length);
    
    for (let i = 0; i < maxLength; i++) {
      const localNFT = localNFTs[i];
      const prodNFT = prodNFTs[i];
      
      console.log(`🎯 NFT #${i + 1}:`);
      
      if (localNFT && prodNFT) {
        // Ambos existem - comparar
        console.log(`   📛 Nome: ${localNFT.name} | ${prodNFT.name}`);
        console.log(`   🆔 Token ID: ${localNFT.tokenId} | ${prodNFT.tokenId}`);
        console.log(`   🖼️  Image URL:`);
        console.log(`      🏠 Local:  ${localNFT.imageUrl || 'VAZIO'}`);
        console.log(`      🌐 Prod:   ${prodNFT.imageUrl || 'VAZIO'}`);
        
        const imageMatch = localNFT.imageUrl === prodNFT.imageUrl;
        console.log(`   ✅ Image URLs Match: ${imageMatch ? 'SIM' : 'NÃO'}`);
        
        if (!imageMatch) {
          console.log(`   🚨 DIFERENÇA DETECTADA!`);
        }
        
        // Testar acessibilidade das imagens
        if (localNFT.imageUrl) {
          const localImageTest = await testImageAccess(localNFT.imageUrl, 'Local');
          console.log(`   🏠 Local Image Access: ${localImageTest ? '✅' : '❌'}`);
        }
        
        if (prodNFT.imageUrl && prodNFT.imageUrl !== localNFT.imageUrl) {
          const prodImageTest = await testImageAccess(prodNFT.imageUrl, 'Prod');
          console.log(`   🌐 Prod Image Access: ${prodImageTest ? '✅' : '❌'}`);
        }
        
      } else if (localNFT && !prodNFT) {
        console.log(`   🏠 Existe apenas LOCAL: ${localNFT.name}`);
        console.log(`   🚨 FALTANDO EM PRODUÇÃO!`);
      } else if (!localNFT && prodNFT) {
        console.log(`   🌐 Existe apenas PRODUÇÃO: ${prodNFT.name}`);
        console.log(`   🚨 FALTANDO EM LOCAL!`);
      }
      
      console.log(''); // Linha em branco
    }
    
    // 4. RESUMO DAS DIFERENÇAS
    console.log('📋 STEP 4: Resumo das Diferenças');
    console.log('================================\n');
    
    const localWithImages = localNFTs.filter(nft => nft.imageUrl);
    const localWithoutImages = localNFTs.filter(nft => !nft.imageUrl);
    const prodWithImages = prodNFTs.filter(nft => nft.imageUrl);
    const prodWithoutImages = prodNFTs.filter(nft => !nft.imageUrl);
    
    console.log(`📊 LOCAL: ${localNFTs.length} total, ${localWithImages.length} com imagem, ${localWithoutImages.length} sem imagem`);
    console.log(`📊 PROD:  ${prodNFTs.length} total, ${prodWithImages.length} com imagem, ${prodWithoutImages.length} sem imagem`);
    
    if (localWithoutImages.length > 0) {
      console.log('\n🚨 NFTs SEM IMAGEM em LOCAL:');
      localWithoutImages.forEach(nft => {
        console.log(`   - ${nft.name} (Token ID: ${nft.tokenId})`);
      });
    }
    
    if (prodWithoutImages.length > 0) {
      console.log('\n🚨 NFTs SEM IMAGEM em PRODUÇÃO:');
      prodWithoutImages.forEach(nft => {
        console.log(`   - ${nft.name} (Token ID: ${nft.tokenId})`);
      });
    }
    
    // 5. ANÁLISE DOS SOURCES
    console.log('\n📋 STEP 5: Análise dos Sources');
    console.log('==============================\n');
    
    console.log(`🏠 Local Data Source: ${localResult.source || 'unknown'}`);
    console.log(`🌐 Prod Data Source: ${prodResult.source || 'unknown'}`);
    
    if (localResult.source !== prodResult.source) {
      console.log('🚨 SOURCES DIFERENTES! Este pode ser o problema.');
      console.log('   Local está usando:', localResult.source);
      console.log('   Produção está usando:', prodResult.source);
    }
    
  } catch (error) {
    console.error('❌ Erro na comparação:', error.message);
  }
}

async function testImageAccess(imageUrl, label) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
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

// Executar comparação
if (!USER_WALLET.includes('SEU_ENDERECO') && !PRODUCTION_URL.includes('SUA_URL')) {
  compareLocalVsProduction();
} else {
  console.log('❌ CONFIGURE PRIMEIRO:');
  console.log('1. Substitua USER_WALLET pelo seu endereço real');
  console.log('2. Substitua PRODUCTION_URL pela URL do Vercel');
  console.log('3. Execute: node scripts/debug-production-vs-local.js');
} 