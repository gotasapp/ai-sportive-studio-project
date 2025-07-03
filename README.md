# 🏆 CHZ Fan Token Studio

**CHZ Fan Token Studio** é uma plataforma de ponta para a criação de colecionáveis digitais (NFTs) esportivos, utilizando inteligência artificial para gerar camisas de futebol, estádios e logos únicos e de alta qualidade. Construído sobre a robusta infraestrutura da Chiliz Chain, o projeto visa engajar fãs de esportes e criadores de conteúdo no ecossistema Web3.

---

## 📊 Status do Projeto (Julho 2024)

O projeto atingiu um marco significativo de maturidade, com as principais funcionalidades de geração de NFTs e o painel de administração totalmente operacionais e migrados para uma infraestrutura de banco de dados escalável.

-   ✅ **Geração de NFTs:** Módulos de criação de Camisas, Estádios e Badges implementados e funcionais.
-   ✅ **Minting na Blockchain:** Integração com Thirdweb v5 e Engine para transações *gasless* na Polygon Amoy.
-   ✅ **Painel de Admin Completo:** Todas as seções do painel de administração estão funcionais, com APIs conectadas a um banco de dados **MongoDB Atlas**.
-   ✅ **Base de Dados Real:** O sistema abandonou os dados mock e agora utiliza MongoDB Atlas para persistir todos os dados da aplicação (usuários, NFTs, configurações, etc.).

---

## ✨ Funcionalidades Implementadas

### Para Usuários e Criadores
-   **🎨 Gerador de Camisas:** Criação de camisas de futebol personalizadas via prompts de texto com DALL-E 3.
-   **🏟️ Gerador de Estádios:** Geração de estádios únicos com base em imagens e estilos predefinidos.
-   **🛡️ Gerador de Badges:** Ferramenta para criar emblemas e conquistas.
-   **⛽ Minting Gasless:** Experiência de minting sem custos de transação para o usuário final.
-   **🔗 Conexão Web3 Simplificada:** Conecte-se com qualquer carteira (incluindo E-mail e Social Login) via Reown AppKit.
-   **🛒 Marketplace (Vitrine):** Uma galeria profissional para exibir os NFTs em destaque e os mais recentes, com rankings e layout inspirado nos maiores marketplaces.

### Para Administradores (Painel de Admin)
-   **🔐 Acesso Seguro:** Autenticação de administradores baseada em endereço de carteira.
-   **📈 Dashboard de Analytics:** Visão geral das principais métricas da plataforma, como total de usuários e NFTs, com dados lidos em tempo real do banco de dados.
-   **👥 Gestão de Usuários:** Listagem e visualização de todos os usuários da plataforma.
-   **🛍️ Gestão de Conteúdo:** Listagem e gerenciamento de todas as Camisas, Badges, Estádios e Logos criados.
-   **🚦 Fila de Moderação:** Interface unificada para aprovar ou rejeitar conteúdo pendente gerado por usuários.
-   **⚙️ Configurações Globais:** Interface para gerenciar configurações da aplicação, como chaves de API e feature flags, com dados persistidos no banco.
-   **📜 Visualizador de Logs:** Acesso a logs de eventos importantes do sistema.

---

## 🛠️ Tech Stack

-   **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion.
-   **Web3:** Thirdweb v5, Reown AppKit, Ethers.js, wagmi.
-   **Banco de Dados:** MongoDB Atlas.
-   **IA:** DALL-E 3, GPT-4 Vision (via APIs Python/FastAPI).
-   **Infraestrutura & Deploy:** Vercel (Frontend), Render (Backend Python), IPFS (Thirdweb Storage/Pinata).
-   **Blockchain:** Polygon Amoy (Testnet), Chiliz Chain (Produção).

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
-   Node.js v18+
-   Git

### 2. Setup do Projeto
```bash
# 1. Clone o repositório
git clone <URL_DO_SEU_REPOSITORIO>
cd CHZ-Fan-Token-Studio # ou o nome da pasta

# 2. Instale as dependências
npm install
```

### 3. Variáveis de Ambiente
```bash
# 1. Crie uma cópia do arquivo de exemplo
cp env.example .env.local

# 2. Configure a MONGODB_URI
#    - Crie um cluster gratuito no MongoDB Atlas.
#    - Obtenha sua Connection String.
#    - Adicione a variável ao .env.local:
MONGODB_URI="sua-connection-string-do-atlas"

# 3. Configure as outras chaves (Thirdweb, etc.) no .env.local
#    - Siga as chaves presentes no env.example para um funcionamento completo.
```

### 4. Popular o Banco de Dados
```bash
# Execute o script de seeding para popular o MongoDB com dados de teste.
# Este passo é essencial para que o Painel de Admin funcione corretamente.
npm run db:seed
```

### 5. Rodar a Aplicação
```bash
npm run dev

# Abra http://localhost:3000 no seu navegador.
```

---

## 🗺️ Próximos Passos (Roadmap)

Com a base da aplicação e o painel de admin solidificados, o foco agora se volta para a interação do usuário e a economia do marketplace.

1.  **Refatorar Fluxo de Criação (Salvar no DB):**
    -   Modificar as páginas de criação (`/`, `/stadiums`, `/badges`) para que, ao gerar um novo NFT, ele seja salvo no banco de dados com o status `"Pending"`.
    -   Isso alimentará a fila de moderação do admin automaticamente.

2.  **Implementar Ações de Moderação:**
    -   Adicionar a lógica de `Aprovar`/`Rejeitar` na API de moderação.
    -   Aprovar um item mudaria seu status de `"Pending"` para `"Approved"`.
    -   Rejeitar um item poderia mudar seu status para `"Rejected"` ou removê-lo.

3.  **Marketplace Funcional (Fase 2):**
    -   Integrar contratos de marketplace da Thirdweb.
    -   Implementar funcionalidades de Compra, Venda e Ofertas.
    -   Criar um sistema de royalties para os criadores.
- **Desenvolver novas funcionalidades**
- **Melhorar a performance**
- **Corrigir bugs**
