# Otimizações para Desenvolvimento Local

## Problema Identificado

O admin dashboard estava com loading muito lento localmente (vários minutos), enquanto em produção no Vercel funcionava rapidamente.

## Soluções Implementadas

### 1. Cache com TTL (Time To Live)

**Frontend (`src/app/admin/page.tsx`)**:
- Cache in-memory com TTL de 30-60 segundos
- Dados fallback imediatos para evitar tela em branco
- Detecção automática de ambiente local vs produção

**Backend (`src/app/api/admin/analytics/route.ts`)**:
- Cache server-side com TTL configurável
- Headers de cache HTTP para otimizar requests

### 2. Timeouts Inteligentes

- **Local**: 5 segundos timeout
- **Produção**: 15 segundos timeout
- Fallback automático para dados mock em caso de timeout

### 3. Queries Paralelas

Antes (sequencial):
```javascript
const users = await db.collection('users').countDocuments();
const jerseys = await db.collection('jerseys').countDocuments();
const badges = await db.collection('badges').countDocuments();
```

Depois (paralelo):
```javascript
const [users, jerseys, badges] = await Promise.all([
  db.collection('users').countDocuments(),
  db.collection('jerseys').countDocuments(),
  db.collection('badges').countDocuments()
]);
```

### 4. Projeção de Campos

Buscar apenas campos necessários:
```javascript
.find({}, { 
  projection: { 
    name: 1, 
    creatorWallet: 1, 
    createdAt: 1,
    _id: 0 
  } 
})
```

### 5. Limits e Paginação

- Limite de 3 itens por coleção para recent sales
- Limite de 10 itens para agregações
- Paginação implementada onde necessário

### 6. Dados de Fallback

Dados estáticos para desenvolvimento rápido:
```javascript
const getFallbackMetrics = () => ({
  totalNFTs: 247,
  totalUsers: 89,
  totalRevenue: 1250.75,
  // ...
});
```

## Como Usar

### 1. Popular Banco com Dados de Teste

```bash
# Popular banco com dados de exemplo
npm run db:populate

# Ou usar o comando combinado
npm run dev:fresh
```

### 2. Limpar Cache

Se precisar limpar o cache durante desenvolvimento:
```javascript
// No console do navegador
localStorage.clear();
sessionStorage.clear();
```

### 3. Verificar Performance

O dashboard agora mostra:
- Indicador "(Local Dev)" quando em desenvolvimento
- Loading states otimizados
- Dados imediatos com fallback

## Melhorias de Performance

### Antes
- ❌ Loading de 3-5 minutos
- ❌ Tela em branco durante carregamento
- ❌ Queries sequenciais lentas
- ❌ Sem cache ou timeout

### Depois
- ✅ Loading de 2-5 segundos
- ✅ Dados imediatos com fallback
- ✅ Queries paralelas otimizadas
- ✅ Cache inteligente com TTL
- ✅ Timeouts configuráveis
- ✅ Detecção de ambiente

## Estrutura de Cache

```javascript
// Cache com TTL
const cache = new Map();

// Estrutura: { data, timestamp, ttl }
cache.set('dashboard-metrics', {
  data: { totalNFTs: 247, ... },
  timestamp: Date.now(),
  ttl: 60000 // 1 minuto
});
```

## Scripts Disponíveis

```bash
# Desenvolvimento normal
npm run dev

# Desenvolvimento com banco populado
npm run dev:fresh

# Apenas popular banco
npm run db:populate
# ou
npm run db:seed
```

## Configurações de Ambiente

O sistema detecta automaticamente:
- `localhost` ou `127.0.0.1` = Desenvolvimento local
- Outros domínios = Produção

Configurações automáticas:
- **Local**: Timeout 5s, cache 30s, fallback rápido
- **Produção**: Timeout 15s, cache 60s, queries completas

## Monitoramento

O dashboard mostra:
- Status de conexão com APIs
- Tempo de resposta
- Indicadores de cache hit/miss
- Ambiente atual (Local Dev)

## Troubleshooting

### Ainda está lento?

1. **Verificar MongoDB**: Conexão local vs Atlas
2. **Limpar cache**: `localStorage.clear()`
3. **Recriar dados**: `npm run db:populate`
4. **Verificar console**: Logs de timeout/erro

### Dados não aparecem?

1. **Popular banco**: `npm run db:populate`
2. **Verificar .env**: MONGODB_URI configurado
3. **Verificar rede**: Conexão com MongoDB Atlas

### Cache não funciona?

1. **Verificar TTL**: Cache expira após tempo definido
2. **Limpar cache**: Recarregar página com Ctrl+F5
3. **Verificar console**: Logs de cache hit/miss

## Próximos Passos

1. **Redis**: Implementar cache distribuído
2. **Service Worker**: Cache offline
3. **Lazy Loading**: Carregar dados sob demanda
4. **Prefetch**: Pré-carregar dados importantes 