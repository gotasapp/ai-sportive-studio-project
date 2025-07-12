const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'chz-app-db';

async function migrateReferencesToSeparateCollections() {
  console.log('🚀 Iniciando migração de referências para coleções separadas...');
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    const db = client.db(DB_NAME);

    // Coleção original
    const teamReferences = db.collection('team_references');
    // Novas coleções
    const stadiumReferences = db.collection('stadium_references');
    const badgeReferences = db.collection('badge_references');

    // 1. Stadiums
    const stadiums = await teamReferences.find({ category: 'stadium' }).toArray();
    if (stadiums.length) {
      await stadiumReferences.insertMany(stadiums);
      await teamReferences.deleteMany({ category: 'stadium' });
      console.log(`✅ Migrados ${stadiums.length} stadium(s) para stadium_references.`);
    } else {
      console.log('ℹ️ Nenhum stadium para migrar.');
    }

    // 2. Badges
    const badges = await teamReferences.find({ category: 'badge' }).toArray();
    if (badges.length) {
      await badgeReferences.insertMany(badges);
      await teamReferences.deleteMany({ category: 'badge' });
      console.log(`✅ Migrados ${badges.length} badge(s) para badge_references.`);
    } else {
      console.log('ℹ️ Nenhum badge para migrar.');
    }

    // 3. Criar índices básicos nas novas coleções
    await stadiumReferences.createIndex({ teamName: 1, category: 1 }, { unique: true });
    await badgeReferences.createIndex({ teamName: 1, category: 1 }, { unique: true });
    console.log('🔍 Índices criados nas novas coleções.');

    // 4. Verificação final
    const countStadiums = await stadiumReferences.countDocuments();
    const countBadges = await badgeReferences.countDocuments();
    const countJerseys = await teamReferences.countDocuments({ category: 'jersey' });
    console.log(`\n📊 Resumo final:`);
    console.log(`  Stadiums em stadium_references: ${countStadiums}`);
    console.log(`  Badges em badge_references: ${countBadges}`);
    console.log(`  Jerseys restantes em team_references: ${countJerseys}`);

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await client.close();
  }
}

migrateReferencesToSeparateCollections(); 