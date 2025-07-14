# Estratégia - Página de Detalhe NFT/Coleção

## Objetivo
Implementar uma página de detalhe para NFTs/coleções no marketplace CHZ Fan Token Studio, seguindo o padrão visual das páginas existentes (profile, marketplace, launchpad) e garantindo dados 100% reais sem mocks.

## Layout Implementado

### Estrutura Visual
```
┌─ Header ──────────────────────────────────────────────────┐
├─ Stats Cards (4 cards horizontais no topo) ──────────────┤
├─ Layout Principal (2 colunas) ────────────────────────────┤
│  ┌─ Coluna Esquerda ─┐  ┌─ Coluna Direita ─────────────┐ │
│  │ • NFT Image      │  │ • Purchase Section           │ │
│  │ • NFT Info       │  │   - Current Price            │ │
│  │ • Price Chart    │  │   - Buy/Connect Button       │ │
│  └─────────────────┘  │ • Traits Grid               │ │
│                        │ • Details Section            │ │
│                        └─────────────────────────────┘ │
├─ Activity/Sales History (full width) ────────────────────┤
└──────────────────────────────────────────────────────────┘
```

### Componentes Shadcn/UI Utilizados
- **Cards**: `Card`, `CardHeader`, `CardContent`, `CardTitle`
- **Botões**: `Button` com variantes (`outline`, `ghost`)
- **Badges**: `Badge` para collection e status
- **Charts**: `ChartContainer` + Recharts para price history
- **Loading**: `Skeleton` para estados de loading
- **Separadores**: `Separator` para divisões
- **Ícones**: Lucide icons para consistência visual

## Padrão Visual Seguido

### Paleta de Cores
- **Background**: Gradiente `from-[#030303] to-[#0b0518]`
- **Cards**: `cyber-card` class (fundo translúcido)
- **Texto**: `#FDFDFD` (branco) com opacidades variadas
- **Accent**: `#A20131` (vermelho) apenas em botões selecionados e ícones
- **Bordas**: `cyber-border` class com bordas metálicas ultra-finas

### Classes CSS Customizadas
- `cyber-card`: Cards com fundo translúcido e bordas sutis
- `cyber-border`: Bordas metálicas finas para botões outline
- Minimalista: sem sombras, cores puras, foco na funcionalidade

## Funcionalidades Implementadas

### 1. Estados de Loading
- Loading skeleton completo
- Estados de erro com fallback para notFound()
- Loading assíncrono de dados

### 2. Responsividade
- Grid responsivo: `grid-cols-1 lg:grid-cols-2`
- Stats cards: `grid-cols-2 lg:grid-cols-4`
- Mobile-first approach

### 3. Dados Reais
- Integração com `/api/nft/[tokenId]` para dados do NFT
- Busca de vendas via `/api/marketplace/sales`
- Stats do marketplace via `/api/marketplace/stats`
- Conversão IPFS para HTTP com `convertIpfsToHttp`

### 4. Interatividade
- Botão condicional: "Connect Wallet" vs "Buy Now"
- Botões secundários (Make Offer, Place Bid) apenas se conectado
- Botões de ação (Heart, Share, External Link)

### 5. Visualização de Dados
- Chart de price history com Recharts
- Grid de traits com raridade
- Activity feed com histórico de vendas
- Stats cards no topo (Floor Price, Volume, Views, Owners)

## Integração com Endpoints Existentes

### APIs Utilizadas
```typescript
// NFT individual
GET /api/nft/[tokenId]

// Vendas/Activity
GET /api/marketplace/sales?collection=${collectionId}&tokenId=${tokenId}

// Stats do marketplace
GET /api/marketplace/stats
```

### Hooks Reutilizados
- `useActiveAccount()` para detecção de wallet conectada
- `convertIpfsToHttp()` para conversão de URLs IPFS

## Próximos Passos

### ✅ Concluído
- [x] Layout responsivo implementado
- [x] Componentes shadcn/ui integrados
- [x] Padrão visual minimalista aplicado
- [x] Estados de loading e erro
- [x] Estrutura de dados definida

### 🔄 Em Andamento
- [ ] Integração com hooks existentes do marketplace
- [ ] Implementação da lógica de compra
- [ ] Chart com dados reais de price history

### 📋 Pendente
- [ ] Testes com dados reais
- [ ] Otimização de performance
- [ ] Validação de responsividade em todos os devices

## Padrão de Qualidade

### Performance
- Client-side rendering com dados assíncronos
- Loading states para melhor UX
- Fallbacks para dados ausentes

### Acessibilidade
- Ícones com labels apropriados
- Contraste adequado (branco sobre preto)
- Estrutura semântica com headings

### Manutenibilidade
- Interfaces TypeScript bem definidas
- Componentes reutilizáveis
- Separação clara de responsabilidades
- Documentação inline

---

**Implementação**: ✅ Layout base concluído  
**Próximo**: Integrar hooks existentes e dados reais do marketplace  
**Meta**: Página funcional e uniforme com resto da aplicação 