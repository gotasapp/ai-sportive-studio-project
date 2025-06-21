# Especificação Completa: Painel de Administração AI Sports NFT

## 🎯 Visão Geral

O painel de administração será o **centro de controle neural** do sistema de geração de NFTs esportivos, permitindo controle granular sobre todos os aspectos da criação de IA, qualidade, moderação e experiência do usuário. Inspirado no poder do Midjourney combinado com a flexibilidade de um CMS enterprise.

---

## 🏗️ Arquitetura do Sistema Admin

### **Estrutura Organizacional**
```
/admin
├── Dashboard Principal (Analytics + Overview)
├── Gerenciamento de Geração IA
│   ├── Jerseys/Camisas
│   ├── Logos & Badges  
│   ├── Estádios
│   └── Configurações Globais
├── Moderação & Qualidade
├── Usuários & Permissões
├── Analytics & Insights
├── Configurações do Sistema
└── Logs & Auditoria
```

---

## 📊 1. Dashboard Principal

### **Métricas em Tempo Real**
- **Cards de Status** (Shadcn Cards):
  - NFTs gerados hoje/semana/mês
  - Taxa de sucesso de geração (%)
  - Usuários ativos
  - Receita/Gas fees consumidos
  - Tempo médio de geração
  - Storage IPFS utilizado

### **Alertas e Monitoramento**
- **Sistema de Notificações**:
  - Falhas consecutivas de geração
  - Uso excessivo de APIs
  - Conteúdo flagrado por moderação
  - Usuários suspeitos (spam)
  - Problemas de conectividade blockchain

### **Quick Actions**
- Pausar/Reativar sistema de geração
- Modo manutenção
- Limpeza de cache
- Backup de configurações

---

## 🎨 2. Gerenciamento de Geração IA

### **2.1 Configurações por Categoria**

#### **🏈 JERSEYS/CAMISAS**

**Prompt Engineering Avançado:**
```typescript
interface JerseyConfig {
  // Prompts Base
  basePrompt: string // "professional football jersey, high quality fabric"
  suffixPrompt: string // "studio lighting, clean background, HD"
  
  // Negative Prompts por Contexto
  negativePrompts: {
    global: string[] // ["cartoon", "anime", "blurry", "text"]
    style: {
      modern: string[] // ["vintage", "retro"]
      retro: string[] // ["futuristic", "neon"]
      classic: string[] // ["modern", "tech"]
    }
    quality: string[] // ["low quality", "amateur", "fake"]
  }
  
  // Parâmetros de Geração
  parameters: {
    guidance_scale: number // 7.5 (slider 1-20)
    steps: number // 50 (slider 10-100)  
    style_strength: number // 0.8 (slider 0-1)
    creativity: number // 0.7 (slider 0-1)
  }
  
  // Filtros de Conteúdo
  contentFilters: {
    allowCustomImages: boolean
    maxImageSize: number // MB
    allowedFormats: string[] // ["jpg", "png", "webp"]
    requireTeamContext: boolean
    
    // Filtros de Moderação
    blockOffensiveContent: boolean
    blockCopyrightedElements: boolean
    blockCompetitorBrands: boolean
  }
  
  // Validações de Input do Usuário
  userInputValidation: {
    maxPromptLength: number
    blockedWords: string[]
    requiredElements: string[] // ["team name", "primary color"]
    allowedTeams: string[]
  }
  
  // Templates por Time
  teamTemplates: {
    [teamId: string]: {
      colorPalette: string[]
      mandatoryElements: string[]
      specificNegatives: string[]
      historicalContext: string
    }
  }
}
```

**Interface Admin - Jerseys:**
- **Constructor de Prompt Visual**:
  - Editor de texto com highlight de syntax
  - Preview em tempo real do prompt final
  - Sistema de variáveis: `{team_name}`, `{primary_color}`, `{style}`
  - Histórico de versões de prompts

- **Gerenciador de Negative Prompts**:
  - Sistema de tags arrastar-e-soltar
  - Categorização (Qualidade, Estilo, Conteúdo)
  - Pré-sets por contexto (Times brasileiros vs. internacionais)

- **Configuração de Times**:
  - Upload de paleta de cores oficial
  - Elementos obrigatórios (logos, padrões específicos)
  - Contexto histórico personalizado
  - Negative prompts específicos por time

#### **🏆 LOGOS & BADGES**

```typescript
interface LogoConfig {
  // Configurações Específicas de Logo
  logoParameters: {
    vectorStyle: boolean // Priorizar estilo vetorial
    minimalism: number // 0-1 (slider)
    symbolism: number // 0-1 (slider) 
    textIntegration: boolean
  }
  
  // Templates por Categoria
  categoryTemplates: {
    football: {
      commonElements: string[] // ["shield", "ball", "crown"]
      forbiddenElements: string[] // ["basketball", "baseball"]
      colorSchemes: string[][]
    }
    basketball: { /* ... */ }
    generic: { /* ... */ }
  }
  
  // Aspectos Técnicos
  outputSpecs: {
    minResolution: [number, number]
    aspectRatios: string[] // ["1:1", "16:9", "4:3"]
    formatRequirements: {
      transparentBackground: boolean
      vectorOutput: boolean
      colorModes: string[] // ["RGB", "CMYK"]
    }
  }
  
  // Validação de Marca
  brandProtection: {
    checkSimilarity: boolean
    blockedLogos: string[] // Base64 ou URLs de logos protegidos
    aiSimilarityThreshold: number // 0-1
  }
}
```

**Interface Admin - Logos:**
- **Editor de Elementos**:
  - Biblioteca de elementos permitidos/proibidos
  - Sistema de combinações (águia + escudo + coroa = brasão clássico)
  - Gerador de paletas de cores harmônicas

- **Proteção de Marca**:
  - Upload de logos protegidos
  - Sistema de similaridade visual
  - Whitelist/Blacklist automática

#### **🏟️ ESTÁDIOS**

```typescript
interface StadiumConfig {
  // Parâmetros Arquitetônicos
  architecturalStyles: {
    modern: {
      elements: string[]
      materials: string[]
      negatives: string[]
    }
    classic: { /* ... */ }
    futuristic: { /* ... */ }
  }
  
  // Configurações Ambientais
  environmentalContext: {
    allowedLocations: string[] // ["urban", "coastal", "mountain"]
    weatherConditions: string[]
    timeOfDay: string[]
    seasonality: boolean
  }
  
  // Capacidade e Escala
  capacityRanges: {
    small: { min: number, max: number, context: string }
    medium: { min: number, max: number, context: string }
    large: { min: number, max: number, context: string }
  }
  
  // Elementos de Branding
  teamBranding: {
    allowColorIntegration: boolean
    allowLogoProjection: boolean
    allowCustomNaming: boolean
    brandingIntensity: number // 0-1
  }
}
```

### **2.2 Sistema de Templates Global**

**Gerenciador de Presets:**
- **Templates Salvos**: Conjuntos completos de configuração
- **Versionamento**: Histórico de mudanças com rollback
- **A/B Testing**: Comparação automática de performance
- **Clonagem**: Duplicar configs entre categorias

---

## 🔍 3. Moderação & Qualidade

### **3.1 Sistema de Moderação Automática**

```typescript
interface ModerationConfig {
  // Filtros de Conteúdo IA
  aiContentFilters: {
    nsfwDetection: {
      enabled: boolean
      threshold: number // 0-1
      autoReject: boolean
    }
    
    violenceDetection: {
      enabled: boolean
      threshold: number
      categories: string[] // ["weapons", "violence", "gore"]
    }
    
    copyrightDetection: {
      enabled: boolean
      databaseSources: string[]
      similarityThreshold: number
    }
    
    qualityAssurance: {
      minResolution: [number, number]
      blurDetection: boolean
      artifactDetection: boolean
      anatomyValidation: boolean // Para jerseys
    }
  }
  
  // Filtros de Texto
  textModerationConfig: {
    profanityFilter: boolean
    blockedPhrases: string[]
    languageDetection: boolean
    allowedLanguages: string[]
    spamDetection: {
      enabled: boolean
      repeatThreshold: number
      similarityThreshold: number
    }
  }
  
  // Ações Automáticas
  automatedActions: {
    flagForReview: string[] // Condições que trigam review
    autoReject: string[] // Condições para rejeição automática
    autoApprove: string[] // Condições para aprovação automática
    quarantine: string[] // Condições para quarentena
  }
}
```

### **3.2 Queue de Moderação Manual**

**Interface de Revisão:**
- **Dashboard de Pendências**:
  - Fila priorizada por risco
  - Preview lado-a-lado com original
  - Histórico do usuário
  - Ferramentas de anotação

- **Ações Disponíveis**:
  - Aprovar/Rejeitar
  - Aprovar com modificações
  - Banir usuário temporário/permanente
  - Adicionar à blacklist automática
  - Escalar para admin sênior

---

## 👥 4. Gerenciamento de Usuários

### **4.1 Sistema de Permissões**

```typescript
interface UserManagement {
  // Roles e Permissões
  roles: {
    superAdmin: {
      permissions: string[] // Acesso total
    }
    moderator: {
      permissions: string[] // ["review_content", "ban_users"]
      limitations: {
        maxBansPerDay: number
        requireApprovalFor: string[]
      }
    }
    analyst: {
      permissions: string[] // ["view_analytics", "export_data"]
    }
  }
  
  // Gestão de Usuários Finais
  userControls: {
    suspensionSystem: {
      reasons: string[]
      durations: number[] // Em dias
      appealProcess: boolean
    }
    
    rateLimiting: {
      generationsPerHour: number
      generationsPerDay: number
      premiumMultiplier: number
    }
    
    userSegmentation: {
      newUsers: { restrictions: string[] }
      verified: { benefits: string[] }
      premium: { privileges: string[] }
      vip: { specialAccess: string[] }
    }
  }
  
  // Sistema de Reputação
  reputationSystem: {
    enabled: boolean
    factors: {
      successfulGenerations: number
      reportedContent: number
      communityVotes: number
      timeSinceJoin: number
    }
    
    consequences: {
      lowReputation: string[] // Restrições
      highReputation: string[] // Benefícios
    }
  }
}
```

### **4.2 Interface de Gestão**

- **Lista de Usuários Avançada**:
  - Filtros por status, data, atividade
  - Busca por email, wallet, ID
  - Ações em lote
  - Exportação de dados

- **Perfil Detalhado do Usuário**:
  - Histórico completo de atividades
  - NFTs gerados (com previews)
  - Estatísticas de uso
  - Timeline de ações/penalidades

---

## 📈 5. Analytics & Business Intelligence

### **5.1 Dashboards Analíticos**

```typescript
interface AnalyticsConfig {
  // Métricas de Performance
  performanceMetrics: {
    generationSuccessRate: {
      overall: number
      byCategory: Record<string, number>
      byTimeframe: Record<string, number>
    }
    
    userEngagement: {
      dailyActiveUsers: number
      retentionRates: number[]
      sessionDuration: number
      bounceRate: number
    }
    
    contentQuality: {
      moderationAccuracy: number
      falsePositiveRate: number
      appealSuccessRate: number
      qualityScores: number[]
    }
  }
  
  // Análise de Tendências
  trendAnalysis: {
    popularTeams: Array<{team: string, count: number}>
    popularStyles: Array<{style: string, usage: number}>
    emergingKeywords: string[]
    seasonalTrends: Record<string, any>
  }
  
  // Insights de Negócio
  businessInsights: {
    revenueMetrics: {
      totalRevenue: number
      revenueByCategory: Record<string, number>
      projectedGrowth: number
    }
    
    costAnalysis: {
      aiGenerationCosts: number
      infrastructureCosts: number
      moderationCosts: number
      profitMargins: number
    }
    
    userAcquisition: {
      acquisitionCost: number
      lifetimeValue: number
      churnRate: number
      growthRate: number
    }
  }
}
```

### **5.2 Relatórios Personalizados**

- **Gerador de Relatórios**:
  - Seleção de métricas customizável
  - Filtros de data/categoria
  - Agendamento automático
  - Exportação (PDF, Excel, CSV)

- **Alertas Inteligentes**:
  - Configuração de thresholds
  - Notificações por email/Slack
  - Escalamento automático

---

## ⚙️ 6. Configurações do Sistema

### **6.1 Configurações de IA e APIs**

```typescript
interface SystemConfig {
  // Configurações de IA
  aiProviderConfig: {
    primaryProvider: string // "openai" | "replicate" | "midjourney"
    fallbackProviders: string[]
    
    openai: {
      apiKey: string
      model: string
      organization: string
      rateLimit: number
    }
    
    replicate: {
      apiKey: string
      defaultModel: string
      customModels: Array<{
        name: string
        version: string
        category: string
      }>
    }
    
    midjourney: {
      apiKey: string
      plan: string
      queueManagement: boolean
    }
  }
  
  // Configurações de Storage
  storageConfig: {
    ipfsProvider: string // "pinata" | "infura" | "web3storage"
    backupStrategy: string
    retentionPolicy: number // dias
    compressionEnabled: boolean
  }
  
  // Configurações de Blockchain
  blockchainConfig: {
    networks: Array<{
      name: string
      rpcUrl: string
      contractAddresses: Record<string, string>
    }>
    gasOptimization: boolean
    batchTransactions: boolean
  }
  
  // Rate Limiting Global
  rateLimiting: {
    globalLimits: {
      requestsPerMinute: number
      requestsPerHour: number
      requestsPerDay: number
    }
    
    userLimits: {
      free: { generations: number, period: string }
      premium: { generations: number, period: string }
      vip: { generations: number, period: string }
    }
  }
}
```

### **6.2 Configurações de Notificações**

- **Canais de Comunicação**:
  - Email SMTP
  - Slack webhooks
  - Discord bots
  - SMS (para alertas críticos)

- **Templates de Mensagens**:
  - Emails transacionais
  - Notificações push
  - Alertas de sistema

---

## 🔒 7. Segurança e Auditoria

### **7.1 Sistema de Logs Avançado**

```typescript
interface AuditSystem {
  // Categorias de Logs
  logCategories: {
    userActions: {
      login: boolean
      generation: boolean
      mint: boolean
      profile: boolean
    }
    
    adminActions: {
      configChanges: boolean
      userManagement: boolean
      moderationActions: boolean
      systemChanges: boolean
    }
    
    systemEvents: {
      apiCalls: boolean
      errors: boolean
      performance: boolean
      security: boolean
    }
  }
  
  // Retenção e Compliance
  retentionPolicy: {
    duration: number // dias
    archiveAfter: number // dias
    compressionEnabled: boolean
    encryptionEnabled: boolean
  }
  
  // Alertas de Segurança
  securityAlerts: {
    suspiciousActivity: boolean
    multipleFailedLogins: boolean
    unusualApiUsage: boolean
    dataExfiltration: boolean
  }
}
```

### **7.2 Backup e Recuperação**

- **Backup Automático**:
  - Configurações do sistema
  - Dados de usuários
  - Logs de auditoria
  - Assets gerados

- **Plano de Recuperação**:
  - RTO (Recovery Time Objective)
  - RPO (Recovery Point Objective)
  - Procedimentos de rollback

---

## 🎛️ 8. Interface de Administração

### **8.1 Design System**

**Tecnologias:**
- **Framework**: Next.js 14 + TypeScript
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod

**Layout Responsivo:**
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo + User Menu + Notifications + Search      │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────────────┐ │
│ │ Sidebar │ │ Main Content Area                       │ │
│ │         │ │ ┌─────────────────────────────────────┐ │ │
│ │ Nav     │ │ │ Breadcrumbs                         │ │ │
│ │ Menu    │ │ ├─────────────────────────────────────┤ │ │
│ │         │ │ │ Page Header + Actions               │ │ │
│ │         │ │ ├─────────────────────────────────────┤ │ │
│ │         │ │ │ Content Tabs/Sections               │ │ │
│ │         │ │ │                                     │ │ │
│ │         │ │ │ Forms/Tables/Charts                 │ │ │
│ │         │ │ │                                     │ │ │
│ └─────────┘ │ └─────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────┘
```

### **8.2 Componentes Reutilizáveis**

**Componentes Especializados:**
- `PromptEditor` - Editor com syntax highlighting
- `ImageModerationCard` - Card para revisão de conteúdo
- `MetricsCard` - Cartões de métricas com gráficos
- `UserProfile` - Perfil completo do usuário
- `ConfigurationForm` - Formulários de configuração
- `LogViewer` - Visualizador de logs em tempo real

**Hooks Customizados:**
- `useAdminAuth` - Autenticação e permissões
- `useRealTimeMetrics` - Métricas em tempo real
- `useConfigManager` - Gerenciamento de configurações
- `useModerationQueue` - Fila de moderação
- `useAuditLog` - Sistema de auditoria

---

## 🚀 9. Implementação e Roadmap

### **Fase 1: Core Foundation (Semanas 1-2)**
- [ ] Estrutura base do admin panel
- [ ] Sistema de autenticação e permissões
- [ ] Dashboard principal com métricas básicas
- [ ] Configuração básica de prompts por categoria

### **Fase 2: Content Management (Semanas 3-4)**
- [ ] Sistema completo de moderação
- [ ] Gerenciamento avançado de prompts
- [ ] Templates e presets
- [ ] Sistema de usuários

### **Fase 3: Analytics & Intelligence (Semanas 5-6)**
- [ ] Dashboards analíticos completos
- [ ] Sistema de relatórios
- [ ] Alertas inteligentes
- [ ] A/B testing para prompts

### **Fase 4: Advanced Features (Semanas 7-8)**
- [ ] Sistema de auditoria completo
- [ ] Ferramentas de backup/recovery
- [ ] Otimizações de performance
- [ ] Documentação e treinamento

---

## 🎯 Conclusão

Este painel de administração transformará seu AI Sports NFT Generator em uma plataforma **enterprise-grade**, oferecendo controle total sobre qualidade, moderação, performance e experiência do usuário. 

**Principais Diferenciais:**
- 🎨 **Controle Criativo Total** - Como um diretor de arte de IA
- 🛡️ **Moderação Inteligente** - IA + supervisão humana
- 📊 **Business Intelligence** - Insights acionáveis
- 🔒 **Enterprise Security** - Auditoria e compliance
- ⚡ **Performance Optimization** - Monitoring em tempo real

O resultado será uma plataforma que não apenas gera NFTs, mas oferece uma experiência profissional completa, desde a criação até a moderação e análise de negócio 