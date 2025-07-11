#!/usr/bin/env node

const fetch = require('node-fetch');

// As 3 NFTs problemáticas identificadas
const PROBLEM_NFTS = [
  { tokenId: 0, name: "Flamengo JEFF #10" },
  { tokenId: 1, name: "Palmeiras KOBE #7" }, 
  { tokenId: 3, name: "Vasco DINAMITE #24" }
];

// NFT funcional para comparação
const WORKING_NFT = { tokenId: 2, name: "Palmeiras JEFF #10" };

async function debugIPFSMetadata() {
  console.log('🔍 DEBUGGING METADATA IPFS DIRETA');
  console.log('==================================\n');
  
  try {
    // 1. Verificar NFT funcional primeiro (para comparação)
    console.log('✅ STEP 1: Verificando NFT FUNCIONAL (Token ID 2)...');
    await analyzeNFTMetadata(WORKING_NFT, true);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Verificar as 3 NFTs problemáticas
    console.log('❌ STEP 2: Verificando NFTs PROBLEMÁTICAS...');
    
    for (const nft of PROBLEM_NFTS) {
      console.log(`\n🚨 Analisando Token ID ${nft.tokenId}: ${nft.name}`);
      console.log('-'.repeat(40));
      await analyzeNFTMetadata(nft, false);
    }
    
    console.log('\n📋 STEP 3: Conclusões');
    console.log('====================');
    console.log('Compare as estruturas de metadata acima.');
    console.log('Identifique exatamente o que está diferente nas 3 NFTs problemáticas.');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  }
}

async function analyzeNFTMetadata(nft, isWorking) {
  try {
    // Buscar metadata via nossa API
    const response = await fetch(`http://localhost:3000/api/nft/${nft.tokenId}`);
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ API falhou para Token ID ${nft.tokenId}:`, result.error);
      return;
    }
    
    const metadata = result.data;
    
    console.log(`📊 Metadata da API:`);
    console.log(`   Nome: ${metadata.name || 'N/A'}`);
    console.log(`   Descrição: ${metadata.description || 'N/A'}`);
    console.log(`   Image (original): ${metadata.image || 'AUSENTE'}`);
    console.log(`   Image (HTTP): ${metadata.imageHttp || 'AUSENTE'}`);
    console.log(`   Attributes: ${metadata.attributes ? metadata.attributes.length : 0} items`);
    console.log(`   Source: ${metadata.source || 'unknown'}`);
    console.log(`   Cached: ${metadata.cached || false}`);
    
    // Se tem image original, buscar metadata IPFS direta
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      console.log(`\n🔍 Buscando metadata IPFS direta...`);
      
      const ipfsHash = metadata.image.replace('ipfs://', '');
      const ipfsUrls = [
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://gateway.ipfs.io/ipfs/${ipfsHash}`
      ];
      
      let ipfsMetadata = null;
      for (const url of ipfsUrls) {
        try {
          console.log(`   Tentando: ${url}`);
          const ipfsResponse = await fetch(url, { timeout: 8000 });
          if (ipfsResponse.ok) {
            ipfsMetadata = await ipfsResponse.json();
            console.log(`   ✅ Sucesso!`);
            break;
          }
        } catch (error) {
          console.log(`   ❌ Falhou: ${error.message}`);
        }
      }
      
      if (ipfsMetadata) {
        console.log(`\n📋 Metadata IPFS direta:`);
        console.log(`   Nome: ${ipfsMetadata.name || 'N/A'}`);
        console.log(`   Descrição: ${ipfsMetadata.description || 'N/A'}`);
        console.log(`   Image: ${ipfsMetadata.image || 'AUSENTE!'}`);
        console.log(`   Attributes: ${ipfsMetadata.attributes ? ipfsMetadata.attributes.length : 0} items`);
        
        // Mostrar estrutura completa para NFTs problemáticas
        if (!isWorking) {
          console.log(`\n🔬 ESTRUTURA COMPLETA DA METADATA:`);
          console.log(JSON.stringify(ipfsMetadata, null, 2));
        }
        
        // Verificar se image existe e é válida
        if (ipfsMetadata.image) {
          console.log(`\n🖼️  Testando acessibilidade da imagem...`);
          const imageAccessible = await testImageUrl(ipfsMetadata.image);
          console.log(`   Image acessível: ${imageAccessible ? '✅ SIM' : '❌ NÃO'}`);
        } else {
          console.log(`\n🚨 CAMPO IMAGE AUSENTE NA METADATA IPFS!`);
        }
      } else {
        console.log(`\n❌ Não foi possível acessar metadata IPFS`);
      }
    } else {
      console.log(`\n⚠️  Sem IPFS URL para buscar metadata direta`);
    }
    
  } catch (error) {
    console.log(`❌ Erro analisando Token ID ${nft.tokenId}:`, error.message);
  }
}

async function testImageUrl(imageUrl) {
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

// Executar diagnóstico
debugIPFSMetadata(); 