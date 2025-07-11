const { ThirdwebSDK } = require('@thirdweb-dev/sdk');

async function compareTokens() {
  console.log('🔍 COMPARAÇÃO DETALHADA - Tokens 0, 1 vs 3');
  console.log('===========================================\n');

  const polygonAmoy = {
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology/'
  };

  try {
    console.log('📡 Conectando Thirdweb...');
    const sdk = new ThirdwebSDK(polygonAmoy);
    const contract = await sdk.getContract('0xfF973a4aFc5A96DEc81366461A461824c4f80254');
    
    const tokens = [0, 1, 3];
    const tokenData = {};
    
    console.log('🔍 STEP 1: Dados da Blockchain');
    console.log('=============================\n');
    
    for (const tokenId of tokens) {
      try {
        console.log(`📋 Token ID ${tokenId}:`);
        
        // Buscar dados da blockchain
        const nft = await contract.erc721.get(tokenId);
        const tokenUri = await contract.erc721.tokenURI(tokenId);
        
        tokenData[tokenId] = {
          blockchain: {
            name: nft.metadata.name,
            description: nft.metadata.description,
            image: nft.metadata.image,
            tokenUri: tokenUri,
            hasImage: !!nft.metadata.image,
            imageLength: nft.metadata.image ? nft.metadata.image.length : 0,
            imageType: nft.metadata.image ? (
              nft.metadata.image.startsWith('ipfs://') ? 'IPFS' :
              nft.metadata.image.startsWith('http') ? 'HTTP' :
              nft.metadata.image.startsWith('data:') ? 'DATA_URI' :
              'OTHER'
            ) : 'NONE'
          }
        };
        
        console.log(`   Nome: ${nft.metadata.name}`);
        console.log(`   Tem Image: ${!!nft.metadata.image ? '✅' : '❌'}`);
        console.log(`   Image URL: ${nft.metadata.image || 'AUSENTE'}`);
        console.log(`   Image Type: ${tokenData[tokenId].blockchain.imageType}`);
        console.log(`   Token URI: ${tokenUri}`);
        console.log('   ---');
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        tokenData[tokenId] = { blockchain: { error: error.message } };
      }
    }
    
    console.log('\n🔍 STEP 2: Teste de APIs');
    console.log('========================\n');
    
    for (const tokenId of tokens) {
      try {
        console.log(`🌐 Token ID ${tokenId} - Testando APIs:`);
        
        // API do NFT individual
        const nftResponse = await fetch(`http://localhost:3000/api/nft/${tokenId}`);
        const nftResult = await nftResponse.json();
        
        tokenData[tokenId].api = {
          success: nftResult.success,
          source: nftResult.source,
          imageHttp: nftResult.data?.imageHttp,
          image: nftResult.data?.image,
          imageUrl: nftResult.data?.imageUrl,
          hasAnyImage: !!(nftResult.data?.imageHttp || nftResult.data?.image || nftResult.data?.imageUrl)
        };
        
        console.log(`   API Success: ${nftResult.success ? '✅' : '❌'}`);
        console.log(`   API Source: ${nftResult.source}`);
        console.log(`   API imageHttp: ${nftResult.data?.imageHttp || 'AUSENTE'}`);
        console.log(`   API image: ${nftResult.data?.image || 'AUSENTE'}`);
        console.log(`   API imageUrl: ${nftResult.data?.imageUrl || 'AUSENTE'}`);
        console.log('   ---');
        
      } catch (error) {
        console.log(`   ❌ Erro na API: ${error.message}`);
        tokenData[tokenId].api = { error: error.message };
      }
    }
    
    console.log('\n🔍 STEP 3: Análise Comparativa');
    console.log('==============================\n');
    
    // Comparar Token 3 (funciona) vs Tokens 0,1 (não funcionam)
    const working = tokenData[3];
    const broken = [tokenData[0], tokenData[1]];
    
    console.log('✅ Token 3 (FUNCIONA):');
    if (working.blockchain) {
      console.log(`   Blockchain image: ${working.blockchain.image || 'AUSENTE'}`);
      console.log(`   Blockchain type: ${working.blockchain.imageType}`);
    }
    if (working.api) {
      console.log(`   API imageHttp: ${working.api.imageHttp || 'AUSENTE'}`);
      console.log(`   API image: ${working.api.image || 'AUSENTE'}`);
      console.log(`   API imageUrl: ${working.api.imageUrl || 'AUSENTE'}`);
    }
    
    console.log('\n❌ Tokens 0,1 (NÃO FUNCIONAM):');
    broken.forEach((tokenInfo, index) => {
      const tokenId = index === 0 ? 0 : 1;
      console.log(`   Token ${tokenId}:`);
      if (tokenInfo.blockchain) {
        console.log(`     Blockchain image: ${tokenInfo.blockchain.image || 'AUSENTE'}`);
        console.log(`     Blockchain type: ${tokenInfo.blockchain.imageType}`);
      }
      if (tokenInfo.api) {
        console.log(`     API imageHttp: ${tokenInfo.api.imageHttp || 'AUSENTE'}`);
        console.log(`     API image: ${tokenInfo.api.image || 'AUSENTE'}`);
        console.log(`     API imageUrl: ${tokenInfo.api.imageUrl || 'AUSENTE'}`);
      }
    });
    
    console.log('\n🎯 STEP 4: Diagnóstico');
    console.log('======================\n');
    
    // Identificar padrões
    const workingHasBlockchainImage = working.blockchain && working.blockchain.hasImage;
    const workingHasApiImage = working.api && working.api.hasAnyImage;
    
    console.log('🔬 Padrões identificados:');
    console.log(`   Token 3 tem imagem na blockchain: ${workingHasBlockchainImage ? '✅' : '❌'}`);
    console.log(`   Token 3 tem imagem na API: ${workingHasApiImage ? '✅' : '❌'}`);
    
    broken.forEach((tokenInfo, index) => {
      const tokenId = index === 0 ? 0 : 1;
      const hasBlockchainImage = tokenInfo.blockchain && tokenInfo.blockchain.hasImage;
      const hasApiImage = tokenInfo.api && tokenInfo.api.hasAnyImage;
      console.log(`   Token ${tokenId} tem imagem na blockchain: ${hasBlockchainImage ? '✅' : '❌'}`);
      console.log(`   Token ${tokenId} tem imagem na API: ${hasApiImage ? '✅' : '❌'}`);
    });
    
    console.log('\n🚀 Possíveis soluções:');
    if (workingHasBlockchainImage && !broken.some(t => t.blockchain?.hasImage)) {
      console.log('💡 Token 3 tem imagem na blockchain, outros não têm');
      console.log('   → Tokens 0,1 podem precisar de re-mint ou metadata fix');
    }
    
    if (workingHasApiImage && !broken.some(t => t.api?.hasAnyImage)) {
      console.log('💡 Token 3 tem imagem na API, outros não têm');
      console.log('   → Tokens 0,1 podem precisar de dados atualizados no MongoDB');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

compareTokens().catch(console.error); 