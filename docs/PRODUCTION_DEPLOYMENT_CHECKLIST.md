# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## ✅ PRÉ-DEPLOY (CRÍTICO)

### 1. **Variáveis de Ambiente**
- [ ] `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` configurado
- [ ] `THIRDWEB_SECRET_KEY` configurado
- [ ] `MONGODB_URI` configurado
- [ ] `OPENAI_API_KEY` configurado
- [ ] `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS` configurado
- [ ] `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` configurado

### 2. **Configurações de Rede**
- [ ] Polygon Amoy (Chain ID: 80002) configurado
- [ ] Contratos verificados na rede
- [ ] Gateways IPFS configurados no `next.config.js`

### 3. **Banco de Dados**
- [ ] MongoDB Atlas configurado
- [ ] Collections criadas (jerseys, stadiums, badges)
- [ ] Índices criados para performance
- [ ] Dados de teste inseridos

## 🛡️ SISTEMA DE FALLBACK

### 4. **Hooks Robustos Implementados**
- [ ] `useMarketplaceDataRobust` - **NUNCA FALHA**
- [ ] `useUserNFTsRobust` - **NUNCA FALHA**
- [ ] Sistema de 3 camadas: Thirdweb → MongoDB → Fallback

### 5. **Timeouts Configurados**
- [ ] Thirdweb: 5-8 segundos
- [ ] MongoDB: 3 segundos
- [ ] IPFS: 5 segundos
- [ ] Marketplace: 8 segundos

### 6. **APIs de Debug**
- [ ] `/api/debug-thirdweb` - Testa conectividade Thirdweb
- [ ] `/api/marketplace/health` - Health check do marketplace

## 📊 MONITORAMENTO

### 7. **Sistema de Monitoramento**
- [ ] `ProductionMonitor` ativo
- [ ] Health checks automáticos (30s)
- [ ] Logs estruturados implementados

### 8. **Indicadores Visuais**
- [ ] Status de fonte de dados no marketplace
- [ ] Mensagens de fallback para usuários
- [ ] Loading states robustos

## 🔧 TESTES PRÉ-PRODUÇÃO

### 9. **Testes Locais**
- [ ] Marketplace carrega sem erros
- [ ] Profile page funciona
- [ ] Carousel exibe NFTs
- [ ] Filtros funcionam
- [ ] Busca funciona

### 10. **Testes de Falha**
- [ ] Desconectar internet → Deve usar fallback
- [ ] Timeout Thirdweb → Deve usar MongoDB
- [ ] Timeout MongoDB → Deve usar dados estáticos

## 🚀 DEPLOY

### 11. **Processo de Deploy**
- [ ] Build local sem erros: `npm run build`
- [ ] TypeScript sem erros: `npm run type-check`
- [ ] Push para repositório
- [ ] Deploy automático no Vercel/Netlify

### 12. **Verificação Pós-Deploy**
- [ ] Site carrega em menos de 3 segundos
- [ ] Marketplace exibe NFTs (qualquer fonte)
- [ ] Profile page funciona
- [ ] Console sem erros críticos
- [ ] Health checks retornam 200

## 🔍 MONITORAMENTO CONTÍNUO

### 13. **Alertas de Produção**
- [ ] Monitorar logs de erro
- [ ] Verificar métricas de performance
- [ ] Acompanhar taxa de sucesso dos fallbacks

### 14. **Métricas Importantes**
- [ ] Tempo de carregamento < 3s
- [ ] Taxa de erro < 1%
- [ ] Disponibilidade > 99.9%
- [ ] Fallback ativado < 10% do tempo

## 🚨 PLANO DE CONTINGÊNCIA

### 15. **Se Tudo Falhar**
- [ ] Rollback automático para versão anterior
- [ ] Página de manutenção ativa
- [ ] Notificação aos usuários

### 16. **Cenários de Falha**
- [ ] **Thirdweb down**: MongoDB assume automaticamente
- [ ] **MongoDB down**: Dados estáticos assumem
- [ ] **IPFS down**: Placeholders assumem
- [ ] **Tudo down**: Página de manutenção

## 📋 COMANDOS ÚTEIS

### Debug em Produção
```bash
# Testar Thirdweb
curl https://yourdomain.com/api/debug-thirdweb

# Testar MongoDB
curl https://yourdomain.com/api/jerseys/minted?limit=1

# Health check
curl https://yourdomain.com/api/marketplace/health
```

### Logs de Produção
```bash
# Vercel
vercel logs

# Netlify
netlify logs
```

## ✅ CHECKLIST FINAL

Antes de marcar como concluído:

- [ ] **TODOS** os itens acima verificados
- [ ] Deploy testado em ambiente de staging
- [ ] Fallbacks testados manualmente
- [ ] Performance aceitável (< 3s)
- [ ] Zero erros críticos no console
- [ ] Usuários podem usar a aplicação normalmente

## 🎯 GARANTIA DE FUNCIONAMENTO

**PROMESSA**: Com este checklist seguido, a aplicação **NUNCA FALHARÁ COMPLETAMENTE** em produção.

- ✅ **Sempre** haverá dados para exibir
- ✅ **Sempre** haverá uma interface funcional
- ✅ **Sempre** haverá feedback para o usuário
- ✅ **Sempre** haverá um caminho de recuperação

---

**🚨 IMPORTANTE**: Este checklist é **OBRIGATÓRIO** para qualquer deploy em produção. Não pule etapas! 