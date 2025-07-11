async function compareTokensSimple() {
  console.log('🔍 COMPARAÇÃO SIMPLES - Tokens 0, 1 vs 3');
  console.log('========================================\n');

  const tokens = [0, 1, 3];
  const results = {};

  console.log('🌐 Testando APIs locais...\n');

  for (const tokenId of tokens) {
    try {
      console.log(`📋 Token ID ${tokenId}:`);
      
      // Testar API do NFT individual
      const response = await fetch(`http://localhost:3000/api/nft/${tokenId}`);
      const result = await response.json();
      
      results[tokenId] = {
        success: result.success,
        source: result.source,
        data: result.data || {}
      };
      
      console.log(`   API Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Source: ${result.source || 'N/A'}`);
      
      if (result.success && result.data) {
        const data = result.data;
        console.log(`   Nome: ${data.name || 'N/A'}`);
        console.log(`   imageHttp: ${data.imageHttp || 'AUSENTE'}`);
        console.log(`   image: ${data.image || 'AUSENTE'}`);
        console.log(`   imageUrl: ${data.imageUrl || 'AUSENTE'}`);
        
        // Verificar qual campo tem valor
        const hasImageHttp = !!data.imageHttp;
        const hasImage = !!data.image;
        const hasImageUrl = !!data.imageUrl;
        
        console.log(`   ✅ Campos com imagem:`);
        console.log(`      imageHttp: ${hasImageHttp ? '✅' : '❌'}`);
        console.log(`      image: ${hasImage ? '✅' : '❌'}`);
        console.log(`      imageUrl: ${hasImageUrl ? '✅' : '❌'}`);
        
        // Identificar qual seria usado no modal
        const finalImage = data.imageHttp || data.image || data.imageUrl;
        console.log(`   🎯 Imagem final (modal): ${finalImage || 'NENHUMA'}`);
        
        if (finalImage) {
          console.log(`   🔗 Tipo de URL: ${
            finalImage.startsWith('ipfs://') ? 'IPFS' :
            finalImage.startsWith('http') ? 'HTTP' :
            finalImage.startsWith('data:') ? 'DATA_URI' :
            'OTHER'
          }`);
        }
      } else {
        console.log(`   ❌ Sem dados válidos`);
      }
      
      console.log('   ---\n');
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      results[tokenId] = { error: error.message };
      console.log('   ---\n');
    }
  }

  console.log('📊 ANÁLISE COMPARATIVA');
  console.log('======================\n');

  // Analisar diferenças
  const working = results[3];
  const broken = [results[0], results[1]];

  console.log('✅ Token 3 (FUNCIONA):');
  if (working.success && working.data) {
    const finalImage = working.data.imageHttp || working.data.image || working.data.imageUrl;
    console.log(`   Tem imagem final: ${!!finalImage ? '✅' : '❌'}`);
    console.log(`   Imagem: ${finalImage || 'NENHUMA'}`);
    console.log(`   Source: ${working.source}`);
  }

  console.log('\n❌ Tokens 0,1 (NÃO FUNCIONAM):');
  broken.forEach((tokenResult, index) => {
    const tokenId = index === 0 ? 0 : 1;
    console.log(`   Token ${tokenId}:`);
    
    if (tokenResult.success && tokenResult.data) {
      const finalImage = tokenResult.data.imageHttp || tokenResult.data.image || tokenResult.data.imageUrl;
      console.log(`     Tem imagem final: ${!!finalImage ? '✅' : '❌'}`);
      console.log(`     Imagem: ${finalImage || 'NENHUMA'}`);
      console.log(`     Source: ${tokenResult.source}`);
    } else {
      console.log(`     ❌ API falhou: ${tokenResult.error || 'Sem dados'}`);
    }
  });

  console.log('\n🎯 DIAGNÓSTICO');
  console.log('==============\n');

  // Verificar se token 3 tem imagem mas 0,1 não têm
  const token3HasImage = working.success && !!(working.data.imageHttp || working.data.image || working.data.imageUrl);
  const token0HasImage = results[0].success && !!(results[0].data?.imageHttp || results[0].data?.image || results[0].data?.imageUrl);
  const token1HasImage = results[1].success && !!(results[1].data?.imageHttp || results[1].data?.image || results[1].data?.imageUrl);

  console.log(`Token 3 tem imagem: ${token3HasImage ? '✅' : '❌'}`);
  console.log(`Token 0 tem imagem: ${token0HasImage ? '✅' : '❌'}`);
  console.log(`Token 1 tem imagem: ${token1HasImage ? '✅' : '❌'}`);

  if (token3HasImage && (!token0HasImage || !token1HasImage)) {
    console.log('\n💡 CONCLUSÃO:');
    console.log('Token 3 tem dados de imagem válidos, Tokens 0,1 não têm.');
    console.log('Isso explica por que Token 3 funciona e os outros não.');
    
    if (!token0HasImage && !token1HasImage) {
      console.log('\n🔧 SOLUÇÃO POSSÍVEL:');
      console.log('Tokens 0,1 precisam ter imageUrl/imageHttp adicionados no banco de dados.');
      console.log('Eles podem ter sido criados antes do sistema de imagens estar completo.');
    }
  }

  console.log('\n🚀 STATUS:');
  console.log('Sistema atual está funcionando corretamente para NFTs com dados válidos.');
  console.log('Tokens legados podem precisar de dados atualizados.');
}

compareTokensSimple().catch(console.error); 