#!/usr/bin/env node

/**
 * Script para adicionar campos de voting aos NFTs existentes no MongoDB
 * Adiciona os campos: votes (number) e votedBy (array) aos documentos que não os possuem
 */

// Configurar variáveis de ambiente para Next.js
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Carregar configuração do projeto
require('dotenv').config({ path: '.env.local' }); // Frontend env
require('dotenv').config({ path: '.env' }); // Backend env

async function addVotingFields() {
  // Tentar diferentes formas de carregar a conexão
  let client, db;
  
  try {
    // Método 1: Usar a conexão do projeto (Next.js)
    console.log('🔄 Tentando usar conexão do projeto...');
    const { connectToDatabase } = require('../src/lib/mongodb');
    client = await connectToDatabase();
    db = client.db('chz-app-db');
    console.log('✅ Conectado usando configuração do projeto');
  } catch (error) {
    console.log('⚠️ Não foi possível usar conexão do projeto, tentando conexão direta...');
    
    // Método 2: Conexão direta com MongoDB
    const { MongoClient } = require('mongodb');
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Erro: MONGODB_URI não está definida');
      console.log('💡 Verifique o arquivo .env ou .env.local');
      process.exit(1);
    }
    
    console.log('🔗 Conectando diretamente ao MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('chz-app-db');
    console.log('✅ Conectado diretamente ao MongoDB');
  }
  
  try {
    const collection = db.collection('jerseys');
    
    console.log('📊 Verificando documentos existentes...');
    
    // Contar documentos que já possuem os campos de voting
    const docsWithVotes = await collection.countDocuments({ votes: { $exists: true } });
    const totalDocs = await collection.countDocuments({});
    
    console.log(`📈 Total de documentos: ${totalDocs}`);
    console.log(`✅ Com campos de voting: ${docsWithVotes}`);
    console.log(`⚠️ Precisam ser atualizados: ${totalDocs - docsWithVotes}`);
    
    if (totalDocs - docsWithVotes === 0) {
      console.log('🎉 Todos os documentos já possuem os campos de voting!');
      return;
    }
    
    // Atualizar documentos que não possuem os campos de voting
    console.log('🔄 Adicionando campos de voting aos documentos...');
    
    const result = await collection.updateMany(
      { 
        $or: [
          { votes: { $exists: false } },
          { votedBy: { $exists: false } }
        ]
      },
      {
        $set: {
          votes: 0,
          votedBy: [],
          lastVoteUpdate: new Date()
        }
      }
    );
    
    console.log(`✅ Atualização concluída!`);
    console.log(`📝 Documentos modificados: ${result.modifiedCount}`);
    console.log(`🔍 Documentos correspondentes: ${result.matchedCount}`);
    
    // Verificar se a atualização foi bem-sucedida
    const updatedDocsWithVotes = await collection.countDocuments({ votes: { $exists: true } });
    console.log(`🎯 Total de documentos com voting após atualização: ${updatedDocsWithVotes}`);
    
    // Criar índices para otimizar consultas de voting
    console.log('🔍 Criando índices para otimização...');
    
    await collection.createIndex({ votes: -1 }); // Índice decrescente para buscar mais votados
    await collection.createIndex({ votedBy: 1 }); // Índice para verificar se usuário votou
    await collection.createIndex({ lastVoteUpdate: -1 }); // Índice para ordenação por data de voto
    
    console.log('📊 Índices criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
    process.exit(1);
  } finally {
    if (client && client.close) {
      await client.close();
      console.log('🔌 Conexão com MongoDB fechada.');
    }
  }
}

// Executar o script
if (require.main === module) {
  addVotingFields()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { addVotingFields };
