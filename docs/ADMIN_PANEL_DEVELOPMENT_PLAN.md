# 🚀 Plano de Desenvolvimento - Admin Panel

## 📁 Arquivos de Referência

- **`docs/ADMIN_PANEL_SPECS_COMPLETE.md`** - Especificações completas do sistema
- **`docs/ADMIN_PANEL_FEATURES.md`** - Funcionalidades básicas
- **`docs/ADMIN_PANEL_ROADMAP.md`** - Roadmap e ideias

---

## 🎯 **Fase 1: MVP Admin Panel (Próximas 2 sessões)**

### **1.1 Estrutura Base**
```
src/app/admin/
├── page.tsx                 # Dashboard principal
├── layout.tsx              # Layout do admin
├── login/
│   └── page.tsx            # Página de login
├── jerseys/
│   └── page.tsx            # Configuração de jerseys
├── analytics/
│   └── page.tsx            # Analytics básicas
└── components/
    ├── AdminSidebar.tsx    # Navegação lateral
    ├── MetricsCard.tsx     # Cards de métricas
    ├── PromptEditor.tsx    # Editor de prompts
    └── AdminAuth.tsx       # Componente de autenticação
```

### **1.2 Componentes Prioritários**

#### **Dashboard Principal** (`/admin`)
- ✅ Cards de métricas (NFTs gerados, usuários ativos)
- ✅ Alertas do sistema
- ✅ Quick actions (pausar sistema, modo manutenção)

#### **Configuração de Jerseys** (`/admin/jerseys`)
- ✅ **Prompt Editor** - Campo para editar prompt base
- ✅ **Negative Prompts Manager** - Tags para palavras proibidas
- ✅ **Preview System** - Mostrar como o prompt final fica
- ✅ **Team Templates** - Configurações por time

#### **Sistema de Login** (`/admin/login`)
- ✅ Login simples (email/senha temporário)
- ✅ Verificação de permissões
- ✅ Redirecionamento pós-login

---

## 🔧 **Tecnologias e Implementação**

### **Stack Tecnológico**
- **Framework**: Next.js 14 + TypeScript ✅ (já temos)
- **UI Components**: Shadcn/ui ✅ (já configurado)
- **Styling**: Tailwind CSS ✅ (já configurado)
- **Forms**: React Hook Form + Zod
- **State**: Context API (para início)

### **Componentes Shadcn Necessários**
```bash
# Instalar componentes necessários
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add separator
```

---

## 📊 **Funcionalidades MVP**

### **1. Dashboard de Métricas**
```typescript
interface DashboardMetrics {
  nftsGenerated: {
    today: number
    week: number
    month: number
  }
  successRate: number
  activeUsers: number
  systemStatus: 'active' | 'maintenance' | 'error'
}
```

### **2. Configuração de Prompts**
```typescript
interface PromptConfig {
  category: 'jerseys' | 'logos' | 'stadiums'
  basePrompt: string
  suffixPrompt: string
  negativePrompts: string[]
  parameters: {
    creativity: number // 0-1
    quality: number   // 0-1
  }
}
```

### **3. Sistema de Autenticação Básico**
```typescript
interface AdminUser {
  email: string
  role: 'admin' | 'moderator'
  permissions: string[]
  lastLogin: Date
}
```

---

## 🎨 **Design System**

### **Layout Responsivo**
```
┌─────────────────────────────────────────────────────────┐
│ Header: AI Sports NFT - Admin Panel                    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────────────┐ │
│ │ Sidebar │ │ Main Content                            │ │
│ │         │ │ ┌─────────────────────────────────────┐ │ │
│ │ 📊 Dash │ │ │ Page Header                         │ │ │
│ │ 👕 Jersey│ │ ├─────────────────────────────────────┤ │ │
│ │ 🏆 Logos │ │ │ Content Area                        │ │ │
│ │ 📈 Analytics│ │                                   │ │ │
│ │ ⚙️ Config│ │ │                                     │ │ │
│ └─────────┘ │ └─────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────┘
```

### **Paleta de Cores**
- **Primary**: Azul escuro (#1e40af)
- **Secondary**: Roxo (#7c3aed)
- **Success**: Verde (#059669)
- **Warning**: Amarelo (#d97706)
- **Error**: Vermelho (#dc2626)

---

## 🚀 **Próximos Passos Imediatos**

### **Sessão Atual**
1. ✅ Criar estrutura de pastas `/admin`
2. ✅ Implementar layout base com sidebar
3. ✅ Dashboard principal com métricas mock
4. ✅ Sistema de autenticação básico

### **Próxima Sessão**
1. ✅ Página de configuração de jerseys
2. ✅ Editor de prompts funcional
3. ✅ Sistema de negative prompts
4. ✅ Integração com DALL-E service

### **Terceira Sessão**
1. ✅ Analytics e métricas reais
2. ✅ Sistema de logs
3. ✅ Configurações avançadas
4. ✅ Testes e refinamentos

---

## 💡 **Notas de Implementação**

### **Integração com Sistema Atual**
- Usar os mesmos services (`dalle3-service.ts`, `ipfs-service.ts`)
- Aproveitar configurações existentes (`config.ts`)
- Manter compatibilidade com sistema de mint

### **Segurança**
- Middleware de autenticação em `/admin`
- Validação de permissões por página
- Logs de todas as ações administrativas

### **Performance**
- Lazy loading de componentes pesados
- Cache de configurações
- Otimização de queries

---

## 🎯 **Resultado Esperado**

Um painel de administração **funcional e profissional** que permita:

1. **👀 Visibilidade Total** - Métricas e status em tempo real
2. **🎨 Controle Criativo** - Ajustar prompts e parâmetros de IA
3. **🛡️ Moderação** - Controlar qualidade e conteúdo
4. **📊 Insights** - Analytics para tomada de decisão

**Meta**: Transformar o admin de "configurador básico" para **"centro de controle neural"** da plataforma! 🚀 