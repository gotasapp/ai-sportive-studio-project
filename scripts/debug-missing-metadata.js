#!/usr/bin/env node

const fetch = require('node-fetch');

// CONFIGURE AQUI:
const USER_WALLET = "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56"; // Seu endereço real
const PRODUCTION_URL = "SUA_URL_VERCEL_AQUI"; // URL do Vercel (opcional, pode testar local)

async function debugMissingMetadata() {
  console.log('🔍 DEBUGGING METADATA AUSENTE');
  console.log('==============================\n');
  
  try {
    // Testar local primeiro
    const apiUrl = PRODUCTION_URL && !PRODUCTION_URL.includes('SUA_URL') 
      ? `${PRODUCTION_URL}/api/profile/user-nfts?address=${USER_WALLET}`
      : `http://localhost:3000/api/profile/user-nfts?address=${USER_WALLET}`;
    
    console.log('📋 API URL:', apiUrl);
    console.log('👤 User Wallet:', USER_WALLET, '\n');
    
    // 1. BUSCAR NFTs DO USUÁRIO
    console.log('🔄 STEP 1: Buscando NFTs do usuário...');
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API falhou:', result.error);
      return;
    }
    
    const nfts = result.data.nfts || [];
    console.log(`✅ Total NFTs: ${nfts.length}`);
    console.log(`✅ Source: ${result.source}\n`);
    
    // 2. ANALISAR METADATA DE CADA NFT
    console.log('🔍 STEP 2: Analisando metadata individual...');
    console.log('=============================================\n');
    
    const nftsWithImages = [];
    const nftsWithoutImages = [];
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      
      console.log(`🎯 NFT #${i + 1}: ${nft.name}`);
      console.log(`   🆔 Token ID: ${nft.tokenId}`);
      console.log(`   📂 Collection: ${nft.collection}`);
      console.log(`   🏷️  Status: ${nft.status}`);
      console.log(`   🖼️  Image URL: ${nft.imageUrl || 'VAZIO/AUSENTE'}`);
      
      if (nft.imageUrl && nft.imageUrl.trim() !== '') {
        nftsWithImages.push(nft);
        console.log(`   ✅ HAS IMAGE`);
        
        // Testar se a URL da imagem é acessível
        const imageAccessible = await testImageUrl(nft.imageUrl);
        console.log(`   🌐 Image accessible: ${imageAccessible ? '✅ YES' : '❌ NO'}`);
        
        if (!imageAccessible) {
          console.log(`   🚨 IMAGE URL EXISTS BUT NOT ACCESSIBLE!`);
        }
      } else {
        nftsWithoutImages.push(nft);
        console.log(`   ❌ NO IMAGE URL`);
        
        // Para NFTs sem imagem, vamos buscar metadata diretamente da blockchain
        console.log(`   🔍 Buscando metadata diretamente da blockchain...`);
        
        try {
          const directMetadata = await fetchDirectMetadata(nft.tokenId);
          if (directMetadata) {
            console.log(`   📋 Direct blockchain metadata:`);
            console.log(`      Name: ${directMetadata.name || 'N/A'}`);
            console.log(`      Description: ${directMetadata.description || 'N/A'}`);
            console.log(`      Image: ${directMetadata.image || 'AUSENTE'}`);
            console.log(`      Attributes: ${directMetadata.attributes ? directMetadata.attributes.length : 0} items`);
            
            if (directMetadata.image) {
              console.log(`   🚨 BLOCKCHAIN TEM IMAGEM MAS API NÃO TROUXE!`);
              const directImageAccessible = await testImageUrl(directMetadata.image);
              console.log(`   🌐 Direct image accessible: ${directImageAccessible ? '✅ YES' : '❌ NO'}`);
            } else {
              console.log(`   ❌ BLOCKCHAIN TAMBÉM NÃO TEM IMAGEM`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Erro ao buscar metadata direta: ${error.message}`);
        }
      }
      
      console.log(''); // Linha em branco
    }
    
    // 3. RESUMO DOS PROBLEMAS
    console.log('📋 STEP 3: Resumo dos Problemas');
    console.log('===============================\n');
    
    console.log(`📊 NFTs com imagem: ${nftsWithImages.length}`);
    console.log(`📊 NFTs sem imagem: ${nftsWithoutImages.length}`);
    
    if (nftsWithoutImages.length > 0) {
      console.log('\n🚨 NFTs SEM IMAGEM (EXATAMENTE ESSAS 3?):');
      nftsWithoutImages.forEach((nft, index) => {
        console.log(`   ${index + 1}. ${nft.name} (Token ID: ${nft.tokenId}, Status: ${nft.status})`);
      });
      
      console.log('\n🔍 PRÓXIMOS PASSOS SUGERIDOS:');
      console.log('1. Verificar se essas NFTs foram mintadas corretamente');
      console.log('2. Verificar se o tokenURI está configurado na blockchain');
      console.log('3. Verificar se o IPFS hash está correto');
      console.log('4. Verificar se houve problema no processo de mint');
    }
    
    // 4. ANÁLISE DE PADRÕES
    console.log('\n📋 STEP 4: Análise de Padrões');
    console.log('=============================\n');
    
    // Agrupar por collection
    const byCollection = nfts.reduce((acc, nft) => {
      if (!acc[nft.collection]) acc[nft.collection] = { total: 0, withImage: 0, withoutImage: 0 };
      acc[nft.collection].total++;
      if (nft.imageUrl) {
        acc[nft.collection].withImage++;
      } else {
        acc[nft.collection].withoutImage++;
      }
      return acc;
    }, {});
    
    console.log('📊 Por Collection:');
    Object.entries(byCollection).forEach(([collection, stats]) => {
      console.log(`   ${collection}: ${stats.total} total, ${stats.withImage} com imagem, ${stats.withoutImage} sem imagem`);
    });
    
    // Agrupar por status
    const byStatus = nfts.reduce((acc, nft) => {
      if (!acc[nft.status]) acc[nft.status] = { total: 0, withImage: 0, withoutImage: 0 };
      acc[nft.status].total++;
      if (nft.imageUrl) {
        acc[nft.status].withImage++;
      } else {
        acc[nft.status].withoutImage++;
      }
      return acc;
    }, {});
    
    console.log('\n📊 Por Status:');
    Object.entries(byStatus).forEach(([status, stats]) => {
      console.log(`   ${status}: ${stats.total} total, ${stats.withImage} com imagem, ${stats.withoutImage} sem imagem`);
    });
    
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

async function fetchDirectMetadata(tokenId) {
  try {
    // Buscar metadata diretamente via API individual
    const metadataUrl = PRODUCTION_URL && !PRODUCTION_URL.includes('SUA_URL')
      ? `${PRODUCTION_URL}/api/nft/${tokenId}`
      : `http://localhost:3000/api/nft/${tokenId}`;
    
    const response = await fetch(metadataUrl);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    throw new Error(`Falha ao buscar metadata: ${error.message}`);
  }
}

// Executar diagnóstico
if (!USER_WALLET.includes('SEU_ENDERECO')) {
  debugMissingMetadata();
} else {
  console.log('❌ CONFIGURE PRIMEIRO:');
  console.log('1. Substitua USER_WALLET pelo seu endereço real');
  console.log('2. (Opcional) Substitua PRODUCTION_URL pela URL do Vercel');
  console.log('3. Execute: node scripts/debug-missing-metadata.js');
} 