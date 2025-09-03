const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

// Categorias para organização
const categories = {
  'NEXT_PUBLIC_API_URL': '🌐 NEXT.JS & DEPLOYMENT',
  'NEXT_PUBLIC_THIRDWEB_CLIENT_ID': '🔗 THIRDWEB CONFIGURATION', 
  'THIRDWEB_SECRET_KEY': '🔗 THIRDWEB CONFIGURATION',
  'NEXT_PUBLIC_ENGINE_URL': '🚀 THIRDWEB ENGINE',
  'BACKEND_WALLET_ADDRESS': '🚀 THIRDWEB ENGINE',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID': '🔗 WALLETCONNECT',
  'NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS': '📦 CONTRACT ADDRESSES',
  'NEXT_PUBLIC_POLYGON_AMOY_RPC_URL': '🌐 RPC ENDPOINTS',
  'ADMIN_WALLET_ADDRESS': '🔧 ADMIN & DEBUG',
  'OPENAI_API_KEY': '🎨 AI SERVICES',
  'HUGGING_FACE_API_TOKEN': '🎨 AI SERVICES'
};

function organizeEnvFile() {
  try {
    // Ler arquivo
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Agrupar por categoria
    const grouped = {};
    const uncategorized = [];
    
    lines.forEach(line => {
      if (line.startsWith('#') || !line.includes('=')) {
        return; // Ignorar comentários e linhas inválidas
      }
      
      const varName = line.split('=')[0];
      const category = categories[varName];
      
      if (category) {
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(line);
      } else {
        uncategorized.push(line);
      }
    });
    
    // Montar arquivo organizado
    let organized = '';
    
    Object.keys(grouped).forEach(category => {
      organized += `# ================================\n`;
      organized += `# ${category}\n`;
      organized += `# ================================\n`;
      grouped[category].forEach(line => {
        organized += `${line}\n`;
      });
      organized += `\n`;
    });
    
    // Adicionar não categorizadas
    if (uncategorized.length > 0) {
      organized += `# ================================\n`;
      organized += `# 🔧 OUTRAS VARIÁVEIS\n`;
      organized += `# ================================\n`;
      uncategorized.forEach(line => {
        organized += `${line}\n`;
      });
    }
    
    // Escrever arquivo
    fs.writeFileSync(envPath, organized);
    console.log('✅ .env.local organizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

organizeEnvFile(); 