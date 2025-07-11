const { ThirdwebSDK } = require('@thirdweb-dev/sdk');

async function debugMetadataIPFS() {
  console.log('🔍 DEBUG METADATA IPFS - NFTs Problemáticas');
  console.log('=============================================\n');

  const polygonAmoy = {
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology/'
  };

  try {
    console.log('📡 Conectando Thirdweb (Polygon Amoy)...');
    const sdk = new ThirdwebSDK(polygonAmoy);
    const contract = await sdk.getContract('0xfF973a4aFc5A96DEc81366461A461824c4f80254');
    
    const problematicTokens = [0, 1, 3];
    const workingTokens = [2, 4, 5]; // Para comparação
    
    console.log('🔍 STEP 1: Verificando Token URIs da Blockchain');
    console.log('===============================================\n');
    
    for (const tokenId of [...problematicTokens, ...workingTokens]) {
      try {
        console.log(`📋 Token ID ${tokenId}:`);
        
        // Buscar Token URI da blockchain
        const tokenUri = await contract.erc721.tokenURI(tokenId);
        console.log(`   Token URI: ${tokenUri}`);
        
        // Buscar metadata completa
        const nft = await contract.erc721.get(tokenId);
        console.log(`   Nome: ${nft.metadata.name}`);
        console.log(`   Descrição: ${nft.metadata.description}`);
        console.log(`   Image: ${nft.metadata.image || 'AUSENTE ❌'}`);
        
        // Se for IPFS URI, tentar buscar diretamente
        if (tokenUri.startsWith('ipfs://')) {
          const ipfsHash = tokenUri.replace('ipfs://', '');
          const httpUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
          console.log(`   HTTP URL: ${httpUrl}`);
          
          try {
            const response = await fetch(httpUrl);
            const metadata = await response.json();
            console.log(`   Metadata Raw:`, JSON.stringify(metadata, null, 2));
          } catch (error) {
            console.log(`   ❌ Erro ao buscar metadata: ${error.message}`);
          }
        }
        
        console.log('   ---');
      } catch (error) {
        console.log(`   ❌ Erro no Token ID ${tokenId}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 STEP 2: Análise Comparativa');
    console.log('==============================');
    console.log('📊 Comparando NFTs problemáticas vs funcionais...\n');
    
    // Buscar todas para comparação
    const allNFTs = [];
    for (const tokenId of [...problematicTokens, ...workingTokens]) {
      try {
        const nft = await contract.erc721.get(tokenId);
        allNFTs.push({
          tokenId,
          hasImage: !!nft.metadata.image,
          imageUrl: nft.metadata.image,
          name: nft.metadata.name,
          problematic: problematicTokens.includes(tokenId)
        });
      } catch (error) {
        console.log(`❌ Erro ao buscar NFT ${tokenId}: ${error.message}`);
      }
    }
    
    console.log('📈 Resumo:');
    allNFTs.forEach(nft => {
      const status = nft.problematic ? '❌ PROBLEMÁTICA' : '✅ FUNCIONAL';
      const imageStatus = nft.hasImage ? '✅ TEM IMAGEM' : '❌ SEM IMAGEM';
      console.log(`   Token ${nft.tokenId}: ${status} | ${imageStatus} | ${nft.name}`);
    });
    
    console.log('\n🎯 STEP 3: Próximos Passos');
    console.log('==========================');
    console.log('🔧 Baseado nos resultados acima:');
    console.log('1. Se Token URI existe mas metadata não tem "image": Problema no IPFS upload');
    console.log('2. Se Token URI não existe: Problema no mint');
    console.log('3. Se metadata existe mas "image" é diferente: Problema de formato');
    console.log('\n🚀 Soluções possíveis:');
    console.log('- Re-upload da metadata no IPFS com campo "image" correto');
    console.log('- Update do Token URI no contrato (se possível)');
    console.log('- Re-mint das NFTs problemáticas');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugMetadataIPFS().catch(console.error); 