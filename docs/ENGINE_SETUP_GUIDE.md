# 🚀 Thirdweb Engine Setup Guide

## 📋 Quick Setup para Teste

### 1. **Instalar Docker Desktop**
1. Baixe: https://www.docker.com/products/docker-desktop/
2. Instale e reinicie o computador
3. Abra Docker Desktop

### 2. **Instalar Dependência Engine**
```bash
npm install @thirdweb-dev/engine
```

### 3. **Configurar Environment Variables**
Adicione no seu `.env.local`:

```env
# Thirdweb Engine Configuration
ENGINE_URL=http://localhost:3005
ENGINE_ACCESS_TOKEN=your_engine_access_token_here
ADMIN_WALLET_ADDRESS=your_admin_wallet_address
ADMIN_WALLET_PRIVATE_KEY=your_admin_private_key

# Backend Wallet (for gasless mints)
BACKEND_WALLET_ADDRESS=your_backend_wallet_address
BACKEND_WALLET_PRIVATE_KEY=your_backend_private_key
```

### 4. **Iniciar Engine (Docker)**
```bash
# Primeira vez
docker-compose up -d

# Ver logs
docker-compose logs -f engine

# Parar
docker-compose down
```

### 5. **Alternativa: Engine Cloud (Mais Fácil)**
1. Acesse: https://thirdweb.com/dashboard/engine
2. Crie uma instância cloud
3. Pegue a URL e Access Token
4. Configure no `.env.local`:

```env
ENGINE_URL=https://your-engine-instance.thirdweb.com
ENGINE_ACCESS_TOKEN=your_cloud_token
```

## 🧪 **Teste no App**

### Interface de Teste:
- **🚀 Mint via Engine (New)** - Testa Engine API
- **🎯 Legacy Mint (Fallback)** - Método antigo

### Como Testar:
1. **Conecte wallet** (Polygon Amoy)
2. **Gere um jersey** (qualquer time/estilo)
3. **Clique "🚀 Mint via Engine"**
4. **Verifique console** para logs do Engine

### Expected Output (Success):
```
🚀 ENGINE: Starting user mint process...
✅ IPFS upload completed: ipfs://...
🎯 Engine Hook: User mint request
✅ Engine Hook: User mint successful
🚀 ENGINE mint successful! Queue ID: xxx
```

### Expected Output (Error):
```
❌ Engine API error: 500 - Engine not running
❌ Engine Hook: User mint failed: User mint failed: Engine API error...
```

## 🔧 **Troubleshooting**

### Engine não inicia (Docker):
```bash
# Verificar se Docker está rodando
docker --version

# Verificar containers
docker ps

# Ver logs de erro
docker-compose logs engine
```

### Engine API Error:
- ✅ Verificar se `ENGINE_URL` está correto
- ✅ Verificar se `ENGINE_ACCESS_TOKEN` está configurado
- ✅ Verificar se Engine está rodando (Docker ou Cloud)

### Network Issues:
- ✅ Certificar que está em Polygon Amoy (80002)
- ✅ Verificar se contrato `0xfF973a4aFc5A96DEc81366461A461824c4f80254` está correto

## 📊 **Next Steps**

Se Engine funcionar:
1. ✅ **Admin Panel** - Interface para gifts
2. ✅ **Bulk Minting** - Envio em massa
3. ✅ **Status Monitoring** - Acompanhar transações
4. ✅ **Webhooks** - Notificações automáticas

Se Engine não funcionar:
1. 🔄 **Debug logs** - Investigar erro específico
2. 🔄 **Fallback Legacy** - Continuar com método antigo
3. 🔄 **Cloud Alternative** - Usar Engine Cloud

---

**Teste primeiro o botão Engine e reporte o resultado!** 🚀 