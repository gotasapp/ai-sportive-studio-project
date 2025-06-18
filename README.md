# AI Sports NFT Generator 🏆⚽

Um gerador de NFTs esportivos alimentado por IA, construído com Next.js, Python FastAPI e integração blockchain.

## 🏆 Conquistas Recentes

🎉 **MILESTONE 1 COMPLETADO!** - AI NFT Generator totalmente funcional  
✅ Sistema de geração IA com DALL-E 3 operacional  
✅ Upload IPFS via Pinata implementado e testado  
✅ Web3 integration com Reown AppKit + CHZ Chain  
✅ Interface completa com validações e preview em tempo real  

## 🚀 Visão Geral

Este projeto permite aos usuários gerar camisas de futebol personalizadas usando IA (DALL-E 3) e mintá-las como NFTs na blockchain. Com foco em times brasileiros e internacionais, oferece uma experiência completa de criação, customização e comercialização de NFTs esportivos.

## 🎯 Status Atual

✅ **MILESTONE 1 COMPLETADO** - AI NFT Generator 100% funcional  
✅ **Interface Cyberpunk NFT** - Design futurista completo  
✅ **Geração de IA** - Integração com DALL-E 3 para camisas personalizadas  
✅ **Sistema de Times** - Suporte a 9 times (Brasileiros + Internacionais)  
✅ **Filtros de Estilo** - Modern, Retro, National, Urban, Classic  
✅ **Web3 Integration** - Reown AppKit + CHZ Chain validation  
✅ **IPFS Upload** - Sistema completo via Pinata  
✅ **Preview 3D** - Área de visualização com efeitos cyberpunk  
🚀 **Próximo:** Milestone 2 - Minting Engine (Thirdweb)

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
**📅 Duração: 3 Semanas** 🚀 **PRÓXIMO OBJETIVO**

**Entregas:**
- 🔄 **Módulo de mintagem de NFT (ERC-721 & 1155) via Thirdweb**
- 🔄 **Configuração de tamanho de edição e royalties**
- 🔄 **Onboarding de carteira via Thirdweb Connect**
- 🔄 **Suporte à abstração de gas (gasless transactions)**
- 🔄 **Preview de mint em tempo real com formatação de metadados**
- 🔄 **Confirmação de mint e links de compartilhamento pós-mint**

**Próximos Passos Imediatos:**
1. **WalletConnect Integration** 🎯
   - Instalação e configuração do WalletConnect v2
   - Interface de conexão de carteira no Header
   - Gerenciamento de estado da carteira
   - Suporte a múltiplas redes (CHZ Chain, Ethereum, Polygon)

2. **Thirdweb Integration** 
   - Instalação e configuração do Thirdweb SDK
   - Migração para ConnectWallet component (opcional)
   - Deploy de contratos NFT via Thirdweb Dashboard
   - Integração com WalletConnect existente

3. **Smart Contract Development (Thirdweb)**
   - Deploy ERC-721 Drop contract para NFTs únicos
   - Deploy ERC-1155 Edition contract para edições limitadas
   - Configuração de royalties via Thirdweb Dashboard
   - Setup de claim conditions e pricing

4. **IPFS Integration (Thirdweb Storage)**
   - Upload de imagens via Thirdweb Storage
   - Estrutura de metadados NFT padrão
   - Integração automática com contratos

**Tecnologias a Implementar:**
- **WalletConnect v2** - Conexão de carteira (PRIMEIRO)
- **Ethers.js / Viem** - Interação blockchain
- **Thirdweb SDK** - Infraestrutura Web3 completa
- **Thirdweb Storage** - IPFS integrado
- **Thirdweb Contracts** - Smart contracts pré-auditados
- CHZ Chain integration

---

### 🔹 Milestone 3 – Marketplace + Drop Mechanics
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
- 🎯 **Thirdweb Integration**
- 🎯 **IPFS Upload System**
- 🎯 **Smart Contract Development**

### Médio Prazo (1-2 meses)
- 📊 **Marketplace Completo via Thirdweb**
- 🎨 **Editor de NFT Avançado**
- 🏆 **Sistema de Drops e Leilões**
- 🤖 **Modelo IA Personalizado (Replicate)**

### Longo Prazo (3-6 meses)
- 🌍 **Expansão para outros esportes**
- 🎮 **Gamificação e recompensas**
- 🏅 **Integração com Fan Tokens**

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
