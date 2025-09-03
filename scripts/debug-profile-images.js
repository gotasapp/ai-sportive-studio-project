#!/usr/bin/env node

const fetch = require('node-fetch');

// ALTERE AQUI: Coloque seu endereço de carteira real
const USER_WALLET = "SEU_ENDERECO_AQUI"; // MUDE PARA SEU ENDEREÇO

async function debugProfileImages() {
  console.log('🔍 DEBUGGING PROFILE IMAGES');
  console.log('============================\n');
  
  try {
    // 1. Buscar NFTs do usuário
    console.log('📋 Step 1: Fetching NFTs from API...');
    const apiUrl = `http://localhost:3000/api/profile/user-nfts?address=${USER_WALLET}`;
    console.log(`API URL: ${apiUrl}\n`);
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API Error:', result.error);
      return;
    }
    
    const nfts = result.data.nfts || [];
    console.log(`✅ Found ${nfts.length} NFTs total`);
    console.log(`📊 Source: ${result.source || 'unknown'}\n`);
    
    // 2. Analisar cada NFT
    console.log('📋 Step 2: Analyzing each NFT...');
    console.log('=====================================\n');
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      console.log(`🎯 NFT #${i + 1}: ${nft.name}`);
      console.log(`   Token ID: ${nft.tokenId}`);
      console.log(`   Status: ${nft.status}`);
      console.log(`   Collection: ${nft.collection}`);
      console.log(`   Image URL: ${nft.imageUrl}`);
      
      // Verificar se é IPFS
      const isIpfs = nft.imageUrl && nft.imageUrl.includes('ipfs');
      console.log(`   Is IPFS: ${isIpfs}`);
      
      if (nft.imageUrl) {
        // Testar acessibilidade da imagem
        console.log(`   Testing image accessibility...`);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const imgResponse = await fetch(nft.imageUrl, {
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (imgResponse.ok) {
            console.log(`   ✅ Image accessible (${imgResponse.status})`);
            console.log(`   📄 Content-Type: ${imgResponse.headers.get('content-type')}`);
            console.log(`   📏 Content-Length: ${imgResponse.headers.get('content-length')}`);
          } else {
            console.log(`   ❌ Image not accessible (${imgResponse.status})`);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log(`   ⏰ Image request timeout (>10s)`);
          } else {
            console.log(`   ❌ Image request failed: ${error.message}`);
          }
        }
      } else {
        console.log(`   ⚠️  No image URL`);
      }
      
      console.log(''); // Linha em branco
    }
    
    // 3. Resumo dos problemas
    console.log('📋 Step 3: Problem Summary');
    console.log('===========================\n');
    
    const nftsWithImages = nfts.filter(nft => nft.imageUrl);
    const nftsWithoutImages = nfts.filter(nft => !nft.imageUrl);
    const ipfsImages = nfts.filter(nft => nft.imageUrl && nft.imageUrl.includes('ipfs'));
    
    console.log(`📊 Total NFTs: ${nfts.length}`);
    console.log(`📊 With image URLs: ${nftsWithImages.length}`);
    console.log(`📊 Without image URLs: ${nftsWithoutImages.length}`);
    console.log(`📊 IPFS images: ${ipfsImages.length}`);
    console.log(`📊 HTTP images: ${nftsWithImages.length - ipfsImages.length}`);
    
    if (nftsWithoutImages.length > 0) {
      console.log('\n🚨 NFTs WITHOUT image URLs:');
      nftsWithoutImages.forEach(nft => {
        console.log(`   - ${nft.name} (Token ID: ${nft.tokenId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Executar debug
debugProfileImages(); 