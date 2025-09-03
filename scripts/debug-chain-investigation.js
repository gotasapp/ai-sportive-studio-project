#!/usr/bin/env node

const fetch = require('node-fetch');

// NFTs problemáticas e funcionais para comparação
const PROBLEM_NFTS = [0, 1, 3];
const WORKING_NFTS = [2, 4, 5]; // Para comparação

// Possíveis chains onde as NFTs podem estar
const CHAINS_TO_TEST = [
  {
    name: 'Polygon Amoy (atual)',
    chainId: 80002,
    explorer: 'https://amoy.polygonscan.com',
    contract: '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
  },
  {
    name: 'CHZ Testnet',
    chainId: 88882,
    explorer: 'https://spicy.chzscan.com',
    contract: '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
  },
  {
    name: 'CHZ Mainnet', 
    chainId: 88888,
    explorer: 'https://scan.chiliz.com',
    contract: '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
  }
];

async function investigateChains() {
  console.log('🔍 INVESTIGAÇÃO DE CHAINS - NFTs Problemáticas');
  console.log('===============================================\n');
  
  console.log('🎯 NFTs Problemáticas:', PROBLEM_NFTS.join(', '));
  console.log('✅ NFTs Funcionais (comparação):', WORKING_NFTS.join(', '));
  console.log('');
  
  // 1. Verificar contrato na Polygon Amoy via nossa API
  console.log('📋 STEP 1: Verificando contrato atual (Polygon Amoy)...');
  console.log('='.repeat(60));
  
  try {
    // Buscar informações diretas da blockchain via Thirdweb
    const thirdwebResponse = await fetch('https://jersey-generator-ai2.vercel.app/api/debug-thirdweb');
    const thirdwebResult = await thirdwebResponse.json();
    
    if (thirdwebResult.success) {
      console.log('✅ Thirdweb conectou com sucesso');
      console.log(`📊 Chain: ${thirdwebResult.data.chainId} (${thirdwebResult.data.chainName})`);
      console.log(`📊 Contract: ${thirdwebResult.data.contractAddress}`);
      console.log(`📊 Total NFTs: ${thirdwebResult.data.totalNFTs}`);
      
      // Verificar se as NFTs problemáticas existem neste contrato
      console.log('\n🎯 Verificando NFTs problemáticas no contrato atual:');
      for (const tokenId of PROBLEM_NFTS) {
        const nftFound = thirdwebResult.data.nfts?.find(nft => nft.id?.toString() === tokenId.toString());
        if (nftFound) {
          console.log(`   ✅ Token ID ${tokenId}: ${nftFound.metadata?.name || 'Nome não disponível'}`);
          console.log(`      Metadata image: ${nftFound.metadata?.image || 'AUSENTE'}`);
          console.log(`      TokenURI: ${nftFound.tokenURI || 'Não disponível'}`);
        } else {
          console.log(`   ❌ Token ID ${tokenId}: NÃO ENCONTRADO no contrato`);
        }
      }
      
      console.log('\n✅ Verificando NFTs funcionais para comparação:');
      for (const tokenId of WORKING_NFTS) {
        const nftFound = thirdwebResult.data.nfts?.find(nft => nft.id?.toString() === tokenId.toString());
        if (nftFound) {
          console.log(`   ✅ Token ID ${tokenId}: ${nftFound.metadata?.name || 'Nome não disponível'}`);
          console.log(`      Metadata image: ${nftFound.metadata?.image || 'AUSENTE'}`);
        }
      }
      
    } else {
      console.log('❌ Thirdweb falhou:', thirdwebResult.error);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar Thirdweb:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 2. Testar explorers de diferentes chains
  console.log('📋 STEP 2: Testando explorers de diferentes chains...');
  console.log('='.repeat(60));
  
  for (const chain of CHAINS_TO_TEST) {
    console.log(`\n🌐 Testando ${chain.name}:`);
    console.log(`   Chain ID: ${chain.chainId}`);
    console.log(`   Contract: ${chain.contract}`);
    console.log(`   Explorer: ${chain.explorer}`);
    
    // Testar se o contrato existe nesta chain
    try {
      const contractUrl = `${chain.explorer}/address/${chain.contract}`;
      console.log(`   🔍 URL do contrato: ${contractUrl}`);
      
      // Simular teste (não podemos fazer request direto para explorers)
      console.log(`   💡 Para verificar manualmente: abra o URL acima`);
      
      // Testar NFTs específicas se o contrato existir
      for (const tokenId of [...PROBLEM_NFTS, ...WORKING_NFTS.slice(0, 1)]) {
        const tokenUrl = `${chain.explorer}/token/${chain.contract}?a=${tokenId}`;
        console.log(`   🎯 Token ID ${tokenId}: ${tokenUrl}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro testando ${chain.name}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 3. Verificar MongoDB para ver onde as NFTs foram salvas
  console.log('📋 STEP 3: Verificando dados do MongoDB...');
  console.log('='.repeat(60));
  
  try {
    const mongoResponse = await fetch('https://jersey-generator-ai2.vercel.app/api/jerseys/minted');
    const mongoResult = await mongoResponse.json();
    
    if (mongoResult.success) {
      const mongoNFTs = mongoResult.data || [];
      console.log(`✅ MongoDB: ${mongoNFTs.length} NFTs total`);
      
      console.log('\n🎯 Verificando NFTs problemáticas no MongoDB:');
      for (const tokenId of PROBLEM_NFTS) {
        const mongoNFT = mongoNFTs.find(nft => nft.tokenId === tokenId || nft.tokenId === tokenId.toString());
        if (mongoNFT) {
          console.log(`   ✅ Token ID ${tokenId}: ${mongoNFT.name}`);
          console.log(`      Chain ID: ${mongoNFT.chainId || 'Não especificado'}`);
          console.log(`      Contract: ${mongoNFT.contractAddress || 'Não especificado'}`);
          console.log(`      Image URL: ${mongoNFT.imageUrl || 'AUSENTE'}`);
          console.log(`      Token URI: ${mongoNFT.tokenURI || 'Não especificado'}`);
          console.log(`      Minted At: ${mongoNFT.mintedAt || mongoNFT.createdAt || 'Não especificado'}`);
        } else {
          console.log(`   ❌ Token ID ${tokenId}: NÃO ENCONTRADO no MongoDB`);
        }
      }
      
    } else {
      console.log('❌ MongoDB falhou:', mongoResult.error);
    }
  } catch (error) {
    console.log('❌ Erro verificando MongoDB:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 4. Conclusões e recomendações
  console.log('📋 STEP 4: Conclusões e Próximos Passos');
  console.log('======================================');
  
  console.log('🔍 Possíveis cenários:');
  console.log('1. NFTs 0,1,3 foram mintadas em chain diferente (CHZ vs Polygon)');
  console.log('2. NFTs 0,1,3 foram mintadas em contrato diferente'); 
  console.log('3. NFTs 0,1,3 têm metadata corrompida no IPFS');
  console.log('4. NFTs 0,1,3 foram mintadas antes da correção de metadata');
  
  console.log('\n💡 Para confirmar:');
  console.log('1. Abra os URLs dos explorers mostrados acima');
  console.log('2. Verifique se as NFTs 0,1,3 existem em chains diferentes');
  console.log('3. Compare as datas de mint das NFTs problemáticas vs funcionais');
  console.log('4. Verifique o tokenURI de cada NFT nos explorers');
  
  console.log('\n🔧 Possíveis soluções:');
  console.log('1. Se estão em chain diferente: atualizar configuração da chain');
  console.log('2. Se metadata está corrompida: re-upload do metadata no IPFS');
  console.log('3. Se foram mintadas incorretamente: re-mint com metadata correta');
}

// Executar investigação
investigateChains(); 