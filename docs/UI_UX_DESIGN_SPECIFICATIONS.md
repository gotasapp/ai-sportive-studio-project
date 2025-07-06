# 🎨 UI/UX Design Specifications - Jersey Editor
## Documento Técnico para Redesign Profissional

### 📊 **ANÁLISE DO ESTADO ATUAL**

#### **Problemas Identificados:**
1. **Layout Básico**: Grid simples 1/3 - 2/3 sem sofisticação
2. **Falta de Hierarquia Visual**: Todos os elementos têm o mesmo peso
3. **Densidade de Informações**: Muitos controles juntos sem organização
4. **Falta de Fluxo**: Não há guia visual clara do processo
5. **Ausência de Canvas Principal**: Preview pequeno perdido no layout

#### **Funcionalidades Existentes:**
- **Team Selection**: Dropdown com 5 times disponíveis
- **Style Filters**: 5 estilos (Modern, Retro, National, Urban, Classic)
- **Player Details**: Nome (JEFF) e Número (10) editáveis
- **Quality Settings**: Standard/HD
- **Vision AI**: Upload de imagem de referência + análise
- **Generation**: Botão principal para gerar jersey
- **Minting**: Dual system (Legacy + Gasless)
- **Marketplace**: Carousel com NFTs trending
- **Real-time Status**: Loading, errors, success states

#### **Componentes Técnicos:**
- **EditorLayout**: Grid responsivo atual
- **EditorPanel**: Cards com títulos numerados
- **PreviewPanel**: Área de visualização
- **MarketplaceCarousel**: Scroll horizontal
- **StyleButton**: Botões de seleção de estilo
- **Upload System**: Drag & drop para Vision AI

### 🎯 **OBJETIVOS DO REDESIGN**

#### **Inspiração Visual:**
- **Adobe Creative Suite**: Painéis organizados, canvas central
- **Figma**: Sidebar compacto, área de trabalho ampla
- **Midjourney**: Interface limpa, foco no resultado

#### **Princípios de Design:**
1. **Canvas-First**: Resultado visual como protagonista
2. **Hierarquia Clara**: Fluxo linear guiado
3. **Densidade Otimizada**: Informações organizadas em grupos
4. **Responsividade**: Mobile-first approach
5. **Micro-interações**: Feedback visual instantâneo

### 🎨 **PALETA DE CORES ATUAL**
```css
background: #111011
foreground: #FDFDFD
primary: #A20131
gray-light: #ADADAD
gray-medium: #707070
gray-dark: #333333
```

### 📱 **ESTRUTURA DE COMPONENTES**

#### **Componentes Existentes para Reutilizar:**
- `Button` (shadcn/ui)
- `Card` (shadcn/ui)
- `Input` (shadcn/ui)
- `Select` (shadcn/ui)
- `Badge` (shadcn/ui)
- `Progress` (shadcn/ui)
- `Tooltip` (shadcn/ui)

#### **Estados da Aplicação:**
- **Idle**: Aguardando configuração
- **Configuring**: Selecionando opções
- **Analyzing**: Vision AI processando
- **Generating**: AI criando jersey
- **Generated**: Resultado pronto
- **Minting**: Processando NFT
- **Success**: Concluído

### 🔧 **REQUISITOS TÉCNICOS**

#### **Responsividade:**
- **Mobile**: Stack vertical, sidebar colapsável
- **Tablet**: Layout 2-colunas
- **Desktop**: Layout 3-colunas com canvas amplo

#### **Performance:**
- **Lazy Loading**: Imagens e componentes pesados
- **Debounce**: Inputs com delay
- **Skeleton Loading**: Estados intermediários

#### **Acessibilidade:**
- **Keyboard Navigation**: Tab order lógico
- **Screen Readers**: Labels e descrições
- **Contrast**: WCAG AA compliance

### 📐 **ESPECIFICAÇÕES DE LAYOUT**

#### **Dimensões Sugeridas:**
- **Sidebar**: 300-400px (desktop)
- **Canvas**: Área restante (min 600px)
- **Actions Bar**: 60-80px altura
- **Marketplace**: 120-150px altura

#### **Breakpoints:**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 🎭 **ELEMENTOS VISUAIS**

#### **Iconografia:**
- **Lucide Icons**: Consistência visual
- **Tamanhos**: 16px, 20px, 24px
- **Estados**: Default, hover, active, disabled

#### **Tipografia:**
- **Headings**: text-sm, text-base, text-lg
- **Body**: text-sm (padrão)
- **Captions**: text-xs
- **Labels**: text-xs uppercase tracking-wide

#### **Spacing:**
- **Padding**: 12px, 16px, 24px
- **Margins**: 8px, 12px, 16px, 24px
- **Gaps**: 8px, 12px, 16px

### 🚀 **PRÓXIMOS PASSOS**

1. **GPT-4o**: Criar design concept baseado nestas specs
2. **Claude**: Implementar o design tecnicamente
3. **Teste**: Validar usabilidade e performance
4. **Refinamento**: Ajustes baseados no feedback

### 💻 **ESTRUTURA DE ARQUIVOS**
```
src/
├── components/
│   ├── layouts/
│   │   └── ProfessionalEditorLayout.tsx
│   ├── editor/
│   │   ├── Sidebar/
│   │   ├── Canvas/
│   │   ├── ActionBar/
│   │   └── MarketplaceSection/
│   └── ui/
│       └── [shadcn components]
```

### 🎯 **MÉTRICAS DE SUCESSO**
- **Tempo de Primeira Geração**: < 30 segundos
- **Taxa de Conversão**: Visitante → Geração → Mint
- **Satisfação Visual**: Feedback qualitativo
- **Performance**: < 2s loading inicial

---

**Data**: 23 de Janeiro de 2025
**Versão**: 1.0
**Status**: Pronto para Design Concept 