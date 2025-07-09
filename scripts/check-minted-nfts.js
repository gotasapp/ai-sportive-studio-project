/**
 * Script para verificar quais NFTs foram realmente mintados na Polygon Amoy
 * Identifica NFTs que têm transactionHash ou foram mintados com sucesso
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chz-app-db';
const DB_NAME = 'chz-app-db';

async function checkMintedNFTs() {
  console.log('🔍 Verificando NFTs mintados na Polygon Amoy...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar coleções disponíveis
    const collections = await db.listCollections().toArray();
    console.log('📦 Coleções disponíveis:', collections.map(c => c.name));
    
    // Verificar jerseys
    const jerseys = db.collection('jerseys');
    const totalJerseys = await jerseys.countDocuments();
    console.log(`\n👕 Total de jerseys: ${totalJerseys}`);
    
    // Buscar jerseys com possíveis indicadores de mint
    const mintedJerseys = await jerseys.find({
      $or: [
        { transactionHash: { $exists: true, $ne: null } },
        { mintedAt: { $exists: true } },
        { isMinted: true },
        { mintStatus: 'success' },
        { mintStatus: 'mined' },
        { status: 'minted' }
      ]
    }).toArray();
    
    console.log(`✅ Jerseys potencialmente mintados: ${mintedJerseys.length}`);
    
    if (mintedJerseys.length > 0) {
      console.log('\n📋 Detalhes dos jerseys mintados:');
      mintedJerseys.forEach((jersey, index) => {
        console.log(`\n${index + 1}. ${jersey.name || 'Sem nome'}`);
        console.log(`   ID: ${jersey._id}`);
        console.log(`   Criado em: ${jersey.createdAt}`);
        console.log(`   Criador: ${jersey.creator?.wallet || 'N/A'}`);
        console.log(`   Transaction Hash: ${jersey.transactionHash || 'N/A'}`);
        console.log(`   Status: ${jersey.status || jersey.mintStatus || 'N/A'}`);
        console.log(`   Mintado em: ${jersey.mintedAt || 'N/A'}`);
      });
    }
    
    // Verificar stadiums
    const stadiums = db.collection('stadiums');
    const totalStadiums = await stadiums.countDocuments();
    console.log(`\n🏟️ Total de stadiums: ${totalStadiums}`);
    
    if (totalStadiums > 0) {
      const mintedStadiums = await stadiums.find({
        $or: [
          { transactionHash: { $exists: true, $ne: null } },
          { mintedAt: { $exists: true } },
          { isMinted: true },
          { mintStatus: 'success' },
          { mintStatus: 'mined' }
        ]
      }).toArray();
      
      console.log(`✅ Stadiums potencialmente mintados: ${mintedStadiums.length}`);
    }
    
    // Verificar badges
    const badges = db.collection('badges');
    const totalBadges = await badges.countDocuments();
    console.log(`\n🏅 Total de badges: ${totalBadges}`);
    
    if (totalBadges > 0) {
      const mintedBadges = await badges.find({
        $or: [
          { transactionHash: { $exists: true, $ne: null } },
          { mintedAt: { $exists: true } },
          { isMinted: true },
          { mintStatus: 'success' },
          { mintStatus: 'mined' }
        ]
      }).toArray();
      
      console.log(`✅ Badges potencialmente mintados: ${mintedBadges.length}`);
    }
    
    // Verificar se há uma collection de transactions/logs
    const logs = db.collection('jerseys_log');
    const totalLogs = await logs.countDocuments();
    console.log(`\n📝 Total de logs: ${totalLogs}`);
    
    // Buscar todos os jerseys para análise geral
    const allJerseys = await jerseys.find({}).sort({ createdAt: -1 }).limit(20).toArray();
    
    console.log('\n📊 ANÁLISE GERAL (últimos 20 jerseys):');
    console.log('=====================================');
    
    allJerseys.forEach((jersey, index) => {
      const hasTransactionHash = jersey.transactionHash ? '✅' : '❌';
      const status = jersey.status || jersey.mintStatus || 'N/A';
      
      console.log(`${index + 1}. ${jersey.name || 'Sem nome'} ${hasTransactionHash}`);
      console.log(`   Status: ${status} | Criado: ${jersey.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
      console.log(`   Criador: ${jersey.creator?.wallet?.slice(0, 10) || 'N/A'}...`);
      
      if (jersey.transactionHash) {
        console.log(`   🔗 TX: https://amoy.polygonscan.com/tx/${jersey.transactionHash}`);
      }
      console.log('');
    });
    
    // Resumo final
    console.log('\n🎯 RESUMO FINAL:');
    console.log('================');
    console.log(`📦 Total de NFTs no banco: ${totalJerseys + totalStadiums + totalBadges}`);
    console.log(`✅ NFTs potencialmente mintados: ${mintedJerseys.length}`);
    console.log(`❌ NFTs apenas gerados (não mintados): ${totalJerseys - mintedJerseys.length}`);
    
    if (mintedJerseys.length > 0) {
      console.log('\n💡 RECOMENDAÇÃO:');
      console.log('- Use apenas os NFTs com transactionHash para testes do marketplace');
      console.log('- Filtre o marketplace para mostrar apenas NFTs mintados');
      console.log('- Considere adicionar campo "isMinted: true" após mint bem-sucedido');
    } else {
      console.log('\n⚠️ ATENÇÃO:');
      console.log('- Nenhum NFT mintado encontrado no banco de dados');
      console.log('- Precisará mintar alguns NFTs antes de testar o marketplace');
      console.log('- Conecte na Polygon Amoy e faça alguns mints primeiro');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar NFTs:', error);
  } finally {
    await client.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkMintedNFTs()
    .then(() => {
      console.log('\n✅ Verificação concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkMintedNFTs }; 