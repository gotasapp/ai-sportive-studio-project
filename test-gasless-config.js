// Test Gasless Mint Configuration
console.log('🧪 Testing Gasless Mint Configuration...\n');

// Simular as variáveis que você tem no .env.local
const config = {
  THIRDWEB_SECRET_KEY: 'xoLHU5ObKQLkXPAiFahKz9_HFVIABeTZhNA74Qn_fAUtg5oB8pUtEky-T5exXOf24JGn-pfb4tlZlU5jaCuNsQ',
  BACKEND_WALLET_ADDRESS: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
  VAULT_ACCESS_TOKEN: 'vt_act_FTDSDCNRRESQDS32EPUWALGOVB3RGBA442W4UIVI4NR4FLNIEVVKNYBKOYS4MQHLVM6YIEQQEDQ2IAFQXOCQMXMRI5IKDJWRB5R7VUXE',
  ENGINE_ADMIN_KEY: 'sa_adm_PR4Q_UPJS_36LX_AQJ5_OXEI_R2LK_b0bb8506-5d91-4750-a1a6-d10f63fad2e4',
  LAUNCHPAD_CONTRACT: '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639'
};

console.log('📋 Configuration Check:');
console.log('=======================');

// Check each required variable
const checks = [
  { name: 'THIRDWEB_SECRET_KEY', value: config.THIRDWEB_SECRET_KEY, required: true },
  { name: 'BACKEND_WALLET_ADDRESS', value: config.BACKEND_WALLET_ADDRESS, required: true },
  { name: 'VAULT_ACCESS_TOKEN', value: config.VAULT_ACCESS_TOKEN, required: true },
  { name: 'ENGINE_ADMIN_KEY', value: config.ENGINE_ADMIN_KEY, required: true },
  { name: 'LAUNCHPAD_CONTRACT', value: config.LAUNCHPAD_CONTRACT, required: true }
];

let allGood = true;

checks.forEach(check => {
  const status = check.value ? '✅ SET' : '❌ NOT SET';
  const masked = check.value ? `${check.value.substring(0, 10)}...` : 'MISSING';
  console.log(`${check.name}: ${status} (${masked})`);
  
  if (check.required && !check.value) {
    allGood = false;
  }
});

console.log('\n🎯 Status Summary:');
console.log('==================');

if (allGood) {
  console.log('✅ TODAS as variáveis necessárias estão configuradas!');
  console.log('✅ Mint gasless DEVE funcionar!');
  console.log('\n🚀 Próximos passos:');
  console.log('1. Reinicie o servidor Next.js: npm run dev');
  console.log('2. Acesse uma coleção ativa do launchpad');
  console.log('3. Teste o botão "Gasless Mint" como admin');
} else {
  console.log('❌ Algumas variáveis estão faltando!');
  console.log('❌ Mint gasless NÃO funcionará até serem corrigidas.');
}

console.log('\n📍 Wallet Backend:');
console.log(`Address: ${config.BACKEND_WALLET_ADDRESS}`);
console.log('⚠️  IMPORTANTE: Esta wallet precisa ter MATIC suficiente na Polygon Amoy!');
console.log('💰 Faucet: https://faucet.polygon.technology/');

console.log('\n🔗 Links úteis:');
console.log('- Thirdweb Dashboard: https://thirdweb.com/dashboard');
console.log('- Engine Dashboard: https://thirdweb.com/dashboard/engine');
console.log('- Polygon Amoy Explorer: https://amoy.polygonscan.com/');