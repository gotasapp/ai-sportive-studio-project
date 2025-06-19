// Test Engine Configuration
console.log('🔧 Engine Configuration Test');
console.log('==========================');

console.log('ENGINE_URL:', process.env.ENGINE_URL || 'NOT SET (using http://localhost:3005)');
console.log('ENGINE_ADMIN_KEY:', process.env.ENGINE_ADMIN_KEY ? '✅ SET' : '❌ NOT SET');
console.log('VAULT_ACCESS_TOKEN:', process.env.VAULT_ACCESS_TOKEN ? '✅ SET' : '❌ NOT SET');
console.log('BACKEND_WALLET_ADDRESS:', process.env.BACKEND_WALLET_ADDRESS || '❌ NOT SET');

console.log('\n🎯 Para configurar o Engine:');
console.log('1. Crie um arquivo .env.local');
console.log('2. Adicione as variáveis:');
console.log('   ENGINE_URL=https://seu-engine.thirdweb.com');
console.log('   ENGINE_ADMIN_KEY=seu_access_token');
console.log('   VAULT_ACCESS_TOKEN=seu_vault_token');
console.log('   BACKEND_WALLET_ADDRESS=seu_backend_wallet');

console.log('\n🔗 Links úteis:');
console.log('- Thirdweb Engine Dashboard: https://thirdweb.com/dashboard/engine');
console.log('- Engine Documentation: https://portal.thirdweb.com/engine'); 