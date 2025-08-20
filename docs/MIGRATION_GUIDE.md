# Guia de Migração para Docker

## 🎯 Objetivo

Este guia permite migrar gradualmente para Docker **sem quebrar** o funcionamento atual do projeto.

## 📋 Situação Atual vs Docker

### **Funcionamento Atual (Preservado)**
```
Frontend (Next.js) → Backend Python (python main.py) → MongoDB Atlas
                    ↓
                Thirdweb Engine (separado)
```

### **Funcionamento com Docker (Opcional)**
```
Frontend (Container) → Backend Python (Container) → MongoDB (Container)
                     ↓
                Thirdweb Engine (Container)
```

## 🚀 Migração Gradual

### **Fase 1: Teste Docker (Recomendado)**
```bash
# Testar Docker sem interferir no funcionamento atual
chmod +x docker-test.sh
./docker-test.sh
```

**O que faz:**
- ✅ Testa apenas Thirdweb Engine com Docker
- ✅ Mantém frontend e backend funcionando normalmente
- ✅ Usa MongoDB Atlas atual
- ✅ Não interfere em nada

### **Fase 2: Migração Parcial**
```bash
# Migrar apenas Thirdweb Engine para Docker
docker-compose -f docker-compose.dev.yml up engine postgres redis -d

# Parar Thirdweb Engine atual (se estiver rodando)
# O frontend e backend continuam funcionando normalmente
```

### **Fase 3: Migração Completa (Opcional)**
```bash
# Migrar tudo para Docker
docker-compose up --build -d
```

## 🔧 Configurações por Fase

### **Fase 1: Configuração Atual (Sem Mudanças)**
```env
# .env atual (mantém funcionando)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENGINE_URL=http://localhost:3005
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
```

### **Fase 2: Docker Parcial**
```env
# .env atual (continua funcionando)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENGINE_URL=http://localhost:3005  # Agora é Docker
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
```

### **Fase 3: Docker Completo**
```env
# .env.docker (novo arquivo)
NEXT_PUBLIC_API_URL=http://backend:8000
NEXT_PUBLIC_ENGINE_URL=http://engine:3005
MONGODB_URI=mongodb://mongodb:27017/chiliz_fan_nft
```

## ⚠️ Possíveis Conflitos e Soluções

### **Conflito 1: Porta 3005 em Uso**
```bash
# Problema: Thirdweb Engine atual usando porta 3005
# Solução: Parar o engine atual primeiro
pkill -f "thirdweb"  # ou parar manualmente
docker-compose -f docker-compose.dev.yml up engine -d
```

### **Conflito 2: Porta 5432 em Uso**
```bash
# Problema: PostgreSQL local usando porta 5432
# Solução: Usar porta diferente
# Editar docker-compose.dev.yml:
# ports: - "5433:5432"  # Usar porta 5433
```

### **Conflito 3: Variáveis de Ambiente**
```bash
# Problema: URLs diferentes entre atual e Docker
# Solução: Manter configuração atual, usar proxy
```

## 📊 Comparação de Performance

| Aspecto | Atual | Docker |
|---------|-------|--------|
| **Setup** | Manual | Automatizado |
| **Consistência** | Depende do sistema | Garantida |
| **Performance** | Nativa | Ligeira overhead |
| **Manutenção** | Manual | Automatizada |
| **Deploy** | Complexo | Simples |

## 🔄 Rollback (Voltar ao Funcionamento Atual)

### **Se algo der errado:**
```bash
# Parar todos os containers Docker
docker-compose -f docker-compose.dev.yml down
docker-compose down

# Voltar ao funcionamento atual
npm run dev  # Frontend
python main.py  # Backend
# Thirdweb Engine (rodar separadamente)
```

## 📝 Checklist de Migração

### **Antes de Começar:**
- [ ] Backup do projeto atual
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Portas livres (3005, 5432, 6379)

### **Fase 1 - Teste:**
- [ ] Executar `./docker-test.sh`
- [ ] Verificar se Thirdweb Engine funciona
- [ ] Confirmar que frontend/backend continuam funcionando

### **Fase 2 - Migração Parcial:**
- [ ] Parar Thirdweb Engine atual
- [ ] Iniciar Thirdweb Engine com Docker
- [ ] Testar funcionalidades de minting
- [ ] Verificar logs e performance

### **Fase 3 - Migração Completa (Opcional):**
- [ ] Criar `.env.docker`
- [ ] Migrar frontend para Docker
- [ ] Migrar backend para Docker
- [ ] Migrar MongoDB para Docker
- [ ] Testar todas as funcionalidades

## 🆘 Suporte

### **Problemas Comuns:**

1. **"Port already in use"**
   ```bash
   # Verificar o que está usando a porta
   lsof -i :3005
   lsof -i :5432
   
   # Parar processo conflitante
   kill -9 <PID>
   ```

2. **"Container failed to start"**
   ```bash
   # Verificar logs
   docker-compose -f docker-compose.dev.yml logs
   
   # Verificar configuração
   docker-compose -f docker-compose.dev.yml config
   ```

3. **"Environment variables not found"**
   ```bash
   # Verificar se .env existe
   ls -la .env
   
   # Verificar variáveis
   cat .env | grep THIRDWEB
   ```

### **Comandos Úteis:**
```bash
# Status dos containers
docker-compose -f docker-compose.dev.yml ps

# Logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Reiniciar serviço específico
docker-compose -f docker-compose.dev.yml restart engine

# Limpar tudo
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
```

## ✅ Conclusão

A migração para Docker é **100% opcional** e **não interfere** no funcionamento atual. Você pode:

1. **Continuar usando** o projeto como está
2. **Testar Docker** gradualmente
3. **Migrar completamente** quando se sentir confortável

O projeto atual **continua funcionando perfeitamente** independente das alterações Docker.
