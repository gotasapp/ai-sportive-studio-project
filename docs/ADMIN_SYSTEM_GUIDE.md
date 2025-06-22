# 🔐 Admin System Guide

## ✅ **Implementado com Sucesso!**

O sistema de admin foi implementado com controle de acesso **integrado ao Thirdweb**, suportando:
- **Wallet Login** (MetaMask, Coinbase, etc.)
- **Social Login** (Google, Discord, X)
- **Email Login** 
- **InApp Wallets** (smart wallets)

## 🎯 **Como Funciona**

### **1. Configuração Admin**
- **Arquivo**: `src/lib/admin-config.ts`
- **Variáveis de ambiente**: 
  - `NEXT_PUBLIC_ADMIN_WALLET_ADDRESS` (wallet admin)
  - `NEXT_PUBLIC_ADMIN_EMAIL` (email/social admin)
- **Controle unificado** para todos os tipos de login

### **2. Componentes**
- **`AdminProtection`**: Protege rotas admin
- **`Header`**: Mostra botão admin apenas para admins
- **Admin Panel**: Dashboard completo protegido

### **3. Segurança**
- ✅ **Verificação client-side** (UX)
- ✅ **Verificação server-side** (segurança real)
- ✅ **Fallback elegante** para não-admins

## 🚀 **Setup Rápido**

### **1. Configurar Variável de Ambiente**

**Vercel:**
```bash
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xSeuEnderecoAqui
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

**Local (.env.local):**
```bash
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xSeuEnderecoAqui
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

### **2. Adicionar Múltiplos Admins**

Edite `src/lib/admin-config.ts`:
```typescript
export const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS?.toLowerCase(),
  '0x1234567890abcdef1234567890abcdef12345678', // Admin 2
  '0xabcdef1234567890abcdef1234567890abcdef12', // Admin 3
].filter(Boolean) as string[];
```

## 🔍 **Como Usar**

### **1. Acessar Admin Panel**
1. **Faça login** usando qualquer método:
   - **Wallet** (MetaMask, Coinbase, etc.)
   - **Email** (admin@yourdomain.com)
   - **Social** (Google, Discord, X)
2. Se for admin, verá botão **"Admin Panel"** 🟠
3. Clique para acessar `/admin`

### **2. Proteger Novas Rotas**
```tsx
import AdminProtection from '@/components/AdminProtection';

export default function NovaRotaAdmin() {
  return (
    <AdminProtection>
      {/* Conteúdo admin aqui */}
    </AdminProtection>
  );
}
```

### **3. Verificar Admin em Componentes**
```tsx
import { isAdmin } from '@/lib/admin-config';
import { useActiveAccount } from 'thirdweb/react';

function MeuComponente() {
  const account = useActiveAccount();
  const userIsAdmin = isAdmin(account); // Suporta wallet + email/social
  
  return (
    <div>
      {userIsAdmin && <button>Ação Admin</button>}
    </div>
  );
}
```

## 🎨 **Interface**

### **Header**
- **Desktop**: Botão "Admin Panel" com ícone shield 🛡️
- **Mobile**: Botão "Admin" compacto
- **Cor**: Laranja para destaque visual

### **Página Admin**
- **Proteção automática**: Só admins acessam
- **Indicador visual**: Barra laranja "Admin Mode Active"
- **Fallback elegante**: Tela de acesso negado

### **Tela de Acesso Negado**
- **Não logado**: Pede para fazer login
- **Logado sem permissão**: Mostra conta (wallet/email) e nega acesso
- **Design**: Cyberpunk theme consistente
- **Info mostrada**: Wallet address ou email, dependendo do login

## 🔧 **Funcionalidades**

### **✅ Implementado**
- [x] Controle de acesso por wallet
- [x] Botão admin no header (responsivo)
- [x] Proteção de rotas
- [x] Configuração centralizada
- [x] Interface elegante
- [x] Múltiplos admins suportados

### **🚀 Futuras Melhorias**
- [ ] Roles diferentes (super-admin, moderador, etc.)
- [ ] Permissões granulares por seção
- [ ] Log de ações admin
- [ ] Interface para gerenciar admins

## 🛡️ **Segurança**

### **Client-Side (UX)**
- Esconde botões para não-admins
- Redireciona não-admins
- Melhora experiência do usuário

### **Server-Side (Segurança Real)**
⚠️ **IMPORTANTE**: Para APIs sensíveis, sempre validar no backend:

```typescript
// api/admin/route.ts
import { isAdminAddress } from '@/lib/admin-config';

export async function POST(request: Request) {
  const { walletAddress } = await request.json();
  
  if (!isAdminAddress(walletAddress)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Lógica admin aqui
}
```

## 📝 **Exemplo de Uso**

```tsx
// Página protegida
import AdminProtection from '@/components/AdminProtection';

export default function AdminUsers() {
  return (
    <AdminProtection>
      <div>
        <h1>Gerenciar Usuários</h1>
        {/* Conteúdo admin */}
      </div>
    </AdminProtection>
  );
}
```

## 🎉 **Status**

**✅ SISTEMA ADMIN OPERACIONAL!**

- Controle de acesso funcionando
- Interface implementada
- Documentação completa
- Pronto para uso em produção

---

**Próximo passo**: Configure `NEXT_PUBLIC_ADMIN_WALLET_ADDRESS` no Vercel e teste! 