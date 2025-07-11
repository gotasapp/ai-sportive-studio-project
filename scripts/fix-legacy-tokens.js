const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'chz-app-db';

async function fixLegacyTokens() {
  console.log('🔧 CORREÇÃO DE TOKENS LEGADOS - 0 e 1');
  console.log('====================================\n');

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // URLs de imagem que podemos usar para esses tokens legados
    // Você pode substituir por URLs reais se tiver as imagens originais
    const legacyFixes = {
      0: {
        name: "Flamengo JEFF #10",
        // Usando uma imagem placeholder ou a real se você tiver
        imageUrl: "https://via.placeholder.com/400x400/A20131/FFFFFF?text=Flamengo+JEFF+%2310",
        imageHttp: "https://via.placeholder.com/400x400/A20131/FFFFFF?text=Flamengo+JEFF+%2310"
      },
      1: {
        name: "Palmeiras KOBE #7", 
        imageUrl: "https://via.placeholder.com/400x400/00FF00/FFFFFF?text=Palmeiras+KOBE+%237",
        imageHttp: "https://via.placeholder.com/400x400/00FF00/FFFFFF?text=Palmeiras+KOBE+%237"
      }
    };

    console.log('📋 Tokens para corrigir:');
    Object.entries(legacyFixes).forEach(([tokenId, data]) => {
      console.log(`   Token ${tokenId}: ${data.name}`);
      console.log(`   Nova imageUrl: ${data.imageUrl}`);
      console.log('   ---');
    });

    const collections = ['jerseys', 'stadiums', 'badges'];
    let updatedCount = 0;

    for (const collectionName of collections) {
      console.log(`\n🔍 Verificando coleção: ${collectionName}`);
      const collection = db.collection(collectionName);

      for (const [tokenId, fixData] of Object.entries(legacyFixes)) {
        try {
          // Buscar NFT por tokenId
          const query = { tokenId: parseInt(tokenId) };
          const nft = await collection.findOne(query);

          if (nft) {
            console.log(`   ✅ Encontrado Token ${tokenId} em ${collectionName}`);
            
            // Verificar se já tem imagem
            if (!nft.imageUrl && !nft.imageHttp && !nft.image) {
              console.log(`   🔧 Adicionando URLs de imagem...`);
              
              const updateResult = await collection.updateOne(
                query,
                { 
                  $set: {
                    imageUrl: fixData.imageUrl,
                    imageHttp: fixData.imageHttp,
                    image: fixData.imageUrl,
                    updatedAt: new Date(),
                    legacyFixed: true
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                console.log(`   ✅ Token ${tokenId} atualizado com sucesso!`);
                updatedCount++;
              } else {
                console.log(`   ⚠️ Token ${tokenId} não foi atualizado`);
              }
            } else {
              console.log(`   ℹ️ Token ${tokenId} já tem imagem`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Erro no Token ${tokenId}: ${error.message}`);
        }
      }
    }

    await client.close();

    console.log(`\n🎉 RESULTADO:`);
    console.log(`   Tokens atualizados: ${updatedCount}`);
    
    if (updatedCount > 0) {
      console.log(`\n🚀 PRÓXIMOS PASSOS:`);
      console.log(`   1. Teste os Tokens 0 e 1 no modal`);
      console.log(`   2. Se funcionarem, substitua por URLs reais`);
      console.log(`   3. Remova as URLs placeholder se necessário`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

console.log('⚠️ AVISO: Este script vai adicionar URLs placeholder para Tokens 0 e 1');
console.log('Você pode substituir por URLs reais das imagens originais\n');

fixLegacyTokens().catch(console.error); 