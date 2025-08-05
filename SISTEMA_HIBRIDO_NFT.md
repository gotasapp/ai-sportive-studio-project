# 🎯 Sistema Híbrido NFT - Documentação Completa

## 📅 Data: 04/08/2025
## 🎯 Objetivo: Implementar sistema que suporta NFTs antigos + Coleções personalizadas

---

## 🚨 PROBLEMAS RESOLVIDOS

### 1️⃣ **Erro de Roteamento Next.js**
**Problema**: `Error: You cannot use different slug names for the same dynamic path ('category' !== 'collectionId')`

**Solução**: 
- Removido diretório vazio `/marketplace/collection/[collectionId]/`
- Unificado roteamento em `/marketplace/collection/[category]/[collectionId]/[tokenId]/`
- Criado middleware para backward compatibility

### 2️⃣ **Duplicatas no Marketplace** 
**Problema**: NFTs das coleções personalizadas apareciam 2x (individual + agrupado)

**Solução**: Filtro na API `/api/marketplace/nfts/route.ts`
```typescript
// 🚫 EXCLUIR NFTs que pertencem a Custom Collections (evitar duplicatas)
$nor: [
  { 'metadata.image': { $regex: 'collection_jerseys' } },
  { name: { $regex: 'Collection #' } }
]
```

### 3️⃣ **NFTs Não Renderizavam**
**Problema**: Páginas ficavam em skeleton/loading infinito

**Solução**: Implementado sistema de detecção automática + APIs específicas

### 4️⃣ **Imagens Não Carregavam**
**Problema**: `normalizeIpfsUri` quebrava URLs do Cloudinary

**Solução**: Detecção de tipo de URL
```typescript
src={displayData.imageUrl.startsWith('http') ? displayData.imageUrl : normalizeIpfsUri(displayData.imageUrl)}
```

---

## 🎯 ARQUITETURA FINAL

### **Sistema de Detecção Automática**

```typescript
// Detecção baseada no formato do ID
const isObjectIdToken = /^[0-9a-fA-F]{24}$/.test(params.tokenId);
const isLaunchpadCollection = params.tokenId === 'collection';
const isNumericToken = !isNaN(Number(params.tokenId));

if (isObjectIdToken) {
  // 🎨 COLEÇÃO PERSONALIZADA
  // → API: /api/custom-collections/[id]
  // → Fonte: MongoDB custom_collections + custom_collection_mints
} else if (isLaunchpadCollection) {
  // 🚀 COLEÇÃO LAUNCHPAD
  // → API: /api/marketplace/nfts (filtrada)
  // → Fonte: MongoDB collections
} else if (isNumericToken) {
  // 🏈 NFT ANTIGO/LEGACY  
  // → API: /api/nft/[tokenId]
  // → Fonte: Thirdweb + fallback MongoDB
}
```

### **Fluxo de Dados**

#### **Coleções Personalizadas (ObjectId)**
1. **Marketplace**: Mostra 1 card por coleção
2. **Link**: `/marketplace/collection/jersey/6890b3c52d2d8b663a8ecffb`
3. **API**: `/api/custom-collections/6890b3c52d2d8b663a8ecffb`
4. **Dados**: MongoDB custom_collections + custom_collection_mints
5. **Imagem**: Cloudinary (HTTP direto)

#### **Coleções Launchpad (tokenId: "collection")**
1. **Marketplace**: Mostra 1 card por coleção
2. **Link**: `/marketplace/collection/launchpad_collection/launchpad_collection/collection`
3. **API**: `/api/marketplace/nfts` (filtrada por tipo e categoria)
4. **Dados**: MongoDB collections
5. **Imagem**: Cloudinary (HTTP direto)

#### **NFTs Antigos (Numérico)**
1. **Marketplace**: Mostra NFTs individuais
2. **Link**: `/marketplace/collection/jersey/jersey/123`
3. **API**: `/api/nft/123`
4. **Dados**: Thirdweb `getThirdwebDataWithFallback()` + fallback MongoDB
5. **Imagem**: IPFS normalizado

---

## 📁 ARQUIVOS MODIFICADOS

### **APIs**

#### `/api/marketplace/nfts/route.ts`
- **Função**: `getCustomCollections()` - Agrupa NFTs por coleção
- **Filtro**: Evita duplicatas com `$nor` 
- **Resultado**: 1 entrada por coleção personalizada

#### `/api/nft/[tokenId]/route.ts` 
- **Restaurado**: do commit `f8eb341` (versão que funcionava)
- **Função**: `fetchNFTFromProductionSystem()`
- **Fonte**: `getThirdwebDataWithFallback()` + cache MongoDB

#### `/api/custom-collections/[id]/route.ts`
- **Mantido**: Funciona perfeitamente para coleções personalizadas
- **Retorna**: Dados da coleção + NFTs mintados

### **Frontend**

#### `/marketplace/collection/[category]/[collectionId]/[tokenId]/page.tsx`
- **Detecção**: `isObjectIdToken` automática
- **APIs**: useQuery customizado vs useNFTData
- **Imagens**: Detecção HTTP vs IPFS
- **Debug**: Logs completos para troubleshooting

#### `/components/marketplace/MarketplaceCard.tsx`
- **Links**: Correção `jerseys` → `jersey`
- **Lógica**: isCustomCollection detection
- **URLs**: Geração correta baseada no tipo

#### `/components/marketplace/NFTGrid.tsx`
- **Props**: `collectionId={item.customCollectionId || item._id}`
- **Detecção**: `isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection'}`

### **Hooks**

#### `/hooks/useNFTData.ts`
- **Mantido**: Para NFTs antigos (tokenId numérico)
- **Interface**: Atualizada para suportar novos sources

---

## 🔧 CONFIGURAÇÃO

### **Environment Variables**
```env
# MongoDB
MONGODB_DB_NAME=chz-app-db

# Thirdweb
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254
NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET=0x723436a84d57150A5109eFC540B2f0b2359Ac76d
```

### **Collections MongoDB**
```javascript
// Coleções usadas
custom_collections       // Dados das coleções personalizadas
custom_collection_mints   // NFTs mintados das coleções
jerseys                   // NFTs antigos (legacy)
stadiums                  // NFTs antigos (legacy) 
badges                    // NFTs antigos (legacy)
```

---

## 🚀 COMO ADICIONAR NOVAS COLEÇÕES

### **Coleções Personalizadas (Recomendado)**
1. Criar entrada em `custom_collections`
2. Mintar NFTs em `custom_collection_mints` 
3. **Automático**: Sistema detecta ObjectId e usa API correta

### **NFTs Legacy**
1. Adicionar à collection `jerseys`/`stadiums`/`badges`
2. **Automático**: Sistema detecta tokenId numérico e usa Thirdweb

---

## 🐛 TROUBLESHOOTING

### **Marketplace mostra duplicatas**
- Verificar filtro `$nor` em `/api/marketplace/nfts/route.ts`
- Conferir se `customCollectionId` exists no MongoDB

### **Página não carrega dados**
- Verificar logs `🔍 NFT Detail Route Detection`
- Confirmar detecção `isObjectIdToken`
- Testar API diretamente: `/api/custom-collections/[id]` ou `/api/nft/[tokenId]`

### **Imagem não aparece**
- Verificar logs `🖼️ ORIGINAL URL` e `🖼️ NORMALIZED URL`
- Confirmar se URL HTTP está sendo usada diretamente
- Testar URL da imagem direto no navegador

### **Links quebrados**
- Verificar geração de URL em `MarketplaceCard.tsx`
- Confirir `isCustomCollection` detection
- Validar props `collectionId` em `NFTGrid.tsx`

---

## 📊 ESTATÍSTICAS DE SUCESSO

### **Antes**
❌ Erro de roteamento Next.js  
❌ NFTs duplicados no marketplace  
❌ Páginas não carregavam  
❌ Imagens não apareciam  

### **Depois**
✅ Roteamento unificado e funcional  
✅ 1 card por coleção no marketplace  
✅ Detecção automática + APIs corretas  
✅ Imagens carregam instantaneamente  
✅ Sistema híbrido 100% funcional  

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### **Performance**
- Implementar cache Redis para APIs
- Otimizar queries MongoDB com indexes
- Lazy loading para imagens

### **Features**
- Sistema de ofertas (bidding)
- Favorites/Wishlist
- Filtros avançados no marketplace

### **UX/UI**
- Loading states mais suaves
- Animações de transição
- Dark/Light mode

---

## 📞 SUPORTE

### **Para problemas relacionados ao sistema híbrido:**
1. Verificar este documento primeiro
2. Testar APIs individualmente
3. Conferir logs de debug no console
4. Validar estrutura de dados no MongoDB

### **IDs de exemplo para teste:**
- **Coleção nova**: `6890b3c52d2d8b663a8ecffb`
- **Coleção launchpad**: `collection` 
- **NFT antigo**: `6871949387240af31fccc2d1`

---

**✅ SISTEMA HÍBRIDO NFT - FUNCIONANDO PERFEITAMENTE**  
**🎯 Suporta: Coleções Personalizadas + Launchpad + NFTs Legacy**  
**🚀 Preparado para: Escalonamento e Novos Recursos**

---
*Documentação criada em 04/08/2025 - Sistema testado e validado*