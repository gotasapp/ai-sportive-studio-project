# AI Sports NFT Generator 🏆⚽

Um gerador de NFTs esportivos alimentado por IA, construído com Next.js, Python FastAPI e integração blockchain.

## 🏆 Conquistas Recentes

🎉 **MILESTONE 2 COMPLETADO!** - Sistema de Mint NFT totalmente funcional  
✅ **Mint Engine** - Gasless e Legacy mint implementados  
✅ **Stadium Generator** - Sistema completo de geração de estádios  
✅ **Web3 Integration** - Thirdweb v5 + Engine API integrados  
✅ **IPFS System** - Upload automático com metadata completa  
✅ **Admin Panel** - Interface completa com mock de dados  
🔄 **EM PROGRESSO:** Conexão do Admin Panel com APIs reais  

## 🚀 Visão Geral

Este projeto permite aos usuários gerar camisas de futebol personalizadas usando IA (DALL-E 3) e mintá-las como NFTs na blockchain. Com foco em times brasileiros e internacionais, oferece uma experiência completa de criação, customização e comercialização de NFTs esportivos.

## 🎯 Status Atual

✅ **MILESTONE 1 COMPLETADO** - AI NFT Generator 100% funcional  
✅ **MILESTONE 2 COMPLETADO** - Sistema de Mint NFT totalmente operacional  
✅ **Jersey Generator** - Geração de camisas com DALL-E 3 + Mint  
✅ **Stadium Generator** - Geração de estádios com DALL-E 3 + Mint  
✅ **Engine Mint** - Sistema gasless (backend paga gás)  
✅ **Legacy Mint** - Sistema tradicional (usuário paga gás)  
✅ **Web3 Integration** - Thirdweb v5 + Engine API  
✅ **IPFS System** - Upload automático de imagem e metadata  
✅ **Admin Panel** - Interface completa com dashboard de analytics  
🔄 **EM PROGRESSO:** Milestone 3 - Conexão Admin Panel com APIs  
🚀 **Próximo:** Milestone 4 - Marketplace + Drop Mechanics

## 📋 Roadmap de Desenvolvimento

### 🔹 Milestone 1 – AI NFT Generator
**📅 Duração: 3 Semanas** ✅ **CONCLUÍDO COM SUCESSO**

**Entregas Realizadas:**
- ✅ **Pipeline de modelo de IA (DALL-E 3)** completo para:
  - ✅ Camisas de futebol personalizadas  
  - ✅ Sistema de prompts otimizado
  - ✅ Qualidade HD e Standard
- ✅ **Interface de geração** (entrada de dados + preview)
- ✅ **Filtros de estilo** (Modern, Retro, National, Urban, Classic)
- ✅ **Upload IPFS/Pinata** - Sistema completo funcional
- ✅ **Web3 Integration** - Reown AppKit + CHZ Chain
- ✅ **Preview em tempo real** com efeitos cyberpunk
- ✅ **Validação de rede** e conexão wallet
- ✅ **Sistema de times** brasileiro e internacional

**Próxima Evolução - Modelo Personalizado:**
- 🎯 **Treinamento de modelo customizado via Replicate**
  - Dataset com camisas de futebol de alta qualidade
  - Fine-tuning para melhor consistência de times brasileiros
  - Maior controle sobre outputs e estilos
  - Melhor qualidade nas gerações de logos e emblemas

**Tecnologias:**
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: Python FastAPI, OpenAI DALL-E 3 → **Replicate Custom Model**
- UI: Shadcn/ui, Lucide Icons, Framer Motion

---

### 🔹 Milestone 2 – Minting Engine + Wallet UX  
**📅 Duração: 3 Semanas** ✅ **COMPLETADO COM SUCESSO**

**Entregas Realizadas:**
- ✅ **Módulo de mintagem NFT completo (ERC-721) via Thirdweb**
- ✅ **Sistema duplo de mint:**
  - ✅ **Engine Mint (Gasless)** - Backend paga gás via Thirdweb Engine
  - ✅ **Legacy Mint** - Usuário paga gás via SDK
- ✅ **Stadium Generator** - Sistema completo de geração de estádios
- ✅ **Web3 Integration** - Thirdweb v5 + AppKit integrados
- ✅ **IPFS System** - Upload automático com metadata NFT
- ✅ **Configuração de edição e royalties**
- ✅ **Transaction monitoring** - Polling automático de status
- ✅ **Validação multi-rede** (CHZ, Polygon Amoy)

**Tecnologias Implementadas:**
- **Thirdweb v5 SDK** - Infraestrutura Web3 completa
- **Thirdweb Engine** - Backend gasless transactions
- **AppKit (Reown)** - Conexão de carteira avançada
- **IPFS via Pinata** - Armazenamento descentralizado
- **Smart Contracts** - ERC-721 deployment via Thirdweb
- **CHZ Chain + Polygon** - Multi-chain support

---

### 🔹 Milestone 3 – Admin Panel Integration  
**📅 Duração: 2 Semanas** 🔄 **EM PROGRESSO**

**Status Atual:**
- ✅ **Admin Panel UI** - Interface completa com design cyberpunk
- ✅ **Dashboard Analytics** - Mock de dados com gráficos e métricas
- ✅ **Gestão de Usuários** - Interface de moderação
- ✅ **Logs do Sistema** - Visualização de atividades
- ✅ **Configurações** - Painel de administração
- 🔄 **Conexão com APIs** - Integração com dados reais (EM PROGRESSO)

**Próximos Passos Imediatos:**
1. **Backend Admin APIs** 🎯
   - Endpoints para dashboard analytics
   - API de gestão de usuários
   - Sistema de logs centralizados
   - Métricas de mint e geração

2. **Integração Frontend-Backend**
   - Substituir mock data por APIs reais
   - Sistema de autenticação admin
   - Real-time updates via WebSocket
   - Filtros e búsca avançada

3. **Funcionalidades Avançadas**
   - Moderação de conteúdo gerado
   - Controle de qualidade de NFTs
   - Analytics em tempo real
   - Exportação de relatórios

**Entregas Planejadas:**
- 🔄 **APIs Admin completas**
- 🔄 **Autenticação e autorização**
- 🔄 **Dashboard em tempo real**
- 🔄 **Sistema de moderação**

---

### 🔹 Milestone 4 – Marketplace + Drop Mechanics
**📅 Duração: 3 Semanas** 📋 **PLANEJADO**

**Entregas:**
- 📋 **Marketplace via Thirdweb Marketplace contract**
- 📋 Página de exploração para listagens (por criador, esporte, time, tag)
- 📋 Fluxo de compra/venda em CHZ + suporte opcional a Fan Token
- 📋 Dashboards do criador: histórico de mint, ganhos, royalties
- 📋 **Launchpad com Thirdweb Drop mechanics**
- 📋 Sistema de votação ou upvote para drops em destaque
- 📋 Opcional: drops com token-gate (ex: apenas detentores de $BAR podem mintar)

**Recursos Avançados (Thirdweb):**
- Marketplace descentralizado via Thirdweb contracts
- Sistema de leilões (English & Dutch auctions)
- Drops temporários com claim conditions
- Integração com Fan Tokens via allowlists
- Analytics via Thirdweb Dashboard
- Gasless transactions para melhor UX

---

### 🔹 Milestone 5 – Logo Generator + Brand Assets
**📅 Duração: 2 Semanas** 🎯 **NOVO OBJETIVO**

**Entregas Planejadas:**
- 🎯 **Logo Generator** - Sistema IA para criação de logos de times
- 🎯 **Brand Asset Library** - Biblioteca de elementos visuais
- 🎯 **Custom Team Creation** - Permitir usuários criarem times personalizados
- 🎯 **Badge Generator** - Criação de emblemas e brasões
- 🎯 **Style Consistency** - Manter identidade visual coerente
- 🎯 **Integration with Existing** - Compatibilidade com jerseys e stadiums

**Tecnologias:**
- DALL-E 3 para geração de logos
- Sistema de prompts especializados
- Biblioteca de referências visuais
- Validação de qualidade automatizada

---

## 🔧 Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Framer Motion** - Animações
- **Shadcn/ui** - Componentes UI

### Backend
- **Python FastAPI** - API REST
- **OpenAI DALL-E 3** - Geração de IA
- **PostgreSQL** - Banco de dados (planejado)

### Blockchain
- **Thirdweb SDK** - Infraestrutura Web3 completa
- **Thirdweb Connect** - Conexão de carteira
- **Thirdweb Storage** - IPFS integrado
- **Thirdweb Contracts** - Smart contracts pré-auditados
- **CHZ Chain** - Blockchain principal
- **Ethereum & Polygon** - Redes adicionais

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Python 3.8+
- OpenAI API Key

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd api
pip install -r requirements.txt
python jersey_api_dalle3.py
```

## 🌟 Próximas Funcionalidades

### Curto Prazo (1-2 semanas)
- 🔄 **Admin Panel APIs** - Conectar interface com backend
- 🔄 **Sistema de Autenticação** - Login e permissões admin
- 🔄 **Analytics em Tempo Real** - Dashboard com dados reais

### Médio Prazo (1-2 meses)
- 📊 **Marketplace Completo via Thirdweb**
- 🎨 **Logo Generator** - Sistema IA para criação de logos
- 🏆 **Sistema de Drops e Leilões**
- 🤖 **Modelo IA Personalizado (Replicate)**

### Longo Prazo (3-6 meses)
- 🌍 **Expansão para outros esportes**
- 🎮 **Gamificação e recompensas**
- 🏅 **Integração com Fan Tokens**
- 🎯 **Mobile App** - Aplicativo nativo

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🔗 Links Úteis

- [CHZ Chain Documentation](https://docs.chiliz.com/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [OpenAI DALL-E API](https://platform.openai.com/docs/guides/images)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Desenvolvido com ❤️ para a comunidade esportiva** 🏆

## 🤖 Roadmap IA - Modelo Personalizado

### Fase 1: Preparação do Dataset
- **Coleta de imagens:** Camisas de alta resolução dos times brasileiros
- **Anotação:** Metadados detalhados (time, ano, tipo, patrocinador)
- **Organização:** Estrutura padronizada para treinamento
- **Qualidade:** Filtros para garantir consistência visual

### Fase 2: Treinamento no Replicate
- **Base model:** SDXL ou Flux como foundation
- **Fine-tuning:** Especialização em camisas esportivas
- **Parâmetros:** Otimização para logos, números e nomes
- **Validação:** Testes de qualidade e consistência

### Fase 3: Integração e Deploy
- **API Integration:** Migração de DALL-E 3 para modelo customizado
- **Performance:** Otimização de velocidade e custo
- **A/B Testing:** Comparação de qualidade entre modelos
- **Rollout:** Deploy gradual para produção

**Vantagens do Modelo Personalizado:**
- ✅ **Maior precisão** nas cores e designs dos times
- ✅ **Consistência** visual entre gerações
- ✅ **Controle total** sobre outputs
- ✅ **Custo otimizado** para alto volume
- ✅ **Especialização** em elementos esportivos brasileiros
