# 🏟️ Stadium References - Estrutura de Pastas

## 📁 **ONDE COLOCAR SUAS IMAGENS DE REFERÊNCIA**

### **Estrutura de Pastas:**
```
api/stadium_references/
├── maracana/
│   ├── metadata.json
│   ├── maracana_day_crowd.jpg
│   ├── maracana_night_lights.jpg
│   └── maracana_sunset_packed.jpg
├── camp_nou/
│   ├── metadata.json
│   ├── camp_nou_day_crowd.jpg
│   ├── camp_nou_night_lights.jpg
│   └── camp_nou_sunset_packed.jpg
├── allianz_arena_bayern/
│   ├── metadata.json
│   ├── allianz_bayern_day_crowd.jpg
│   ├── allianz_bayern_night_lights.jpg
│   └── allianz_bayern_red_lights.jpg
├── allianz_parque_palmeiras/
│   ├── metadata.json
│   ├── allianz_palmeiras_day_crowd.jpg
│   ├── allianz_palmeiras_night_lights.jpg
│   └── allianz_palmeiras_green_lights.jpg
└── sao_januario_vasco/
    ├── metadata.json
    ├── sao_januario_day_crowd.jpg
    ├── sao_januario_night_lights.jpg
    └── sao_januario_classic_view.jpg
```

---

## 🎯 **NOMES DOS ESTÁDIOS (IDs)**

| Estádio Real | ID da Pasta | Nome para Sistema |
|--------------|-------------|-------------------|
| **Maracanã** | `maracana` | Maracanã Stadium |
| **Camp Nou** | `camp_nou` | Camp Nou Stadium |
| **Allianz Arena (Bayern)** | `allianz_arena_bayern` | Allianz Arena Munich |
| **Allianz Parque (Palmeiras)** | `allianz_parque_palmeiras` | Allianz Parque São Paulo |
| **São Januário (Vasco)** | `sao_januario_vasco` | São Januário Stadium |

---

## 📸 **NOMENCLATURA DAS IMAGENS**

### **Padrão:** `{stadium_id}_{time}_{atmosphere}.jpg`

**Exemplos para Maracanã:**
- ✅ `maracana_day_crowd.jpg` - Dia com torcida
- ✅ `maracana_night_lights.jpg` - Noite iluminado
- ✅ `maracana_sunset_packed.jpg` - Pôr do sol lotado
- ✅ `maracana_derby_atmosphere.jpg` - Atmosfera de clássico

**Variações recomendadas:**
- `{stadium}_day_crowd.jpg` - Dia com torcida
- `{stadium}_night_lights.jpg` - Noite com luzes
- `{stadium}_sunset_packed.jpg` - Pôr do sol lotado
- `{stadium}_empty_training.jpg` - Vazio para treino
- `{stadium}_derby_atmosphere.jpg` - Atmosfera de clássico

---

## 🎨 **CARACTERÍSTICAS DESEJADAS**

### **Atmosfera Padrão (Base Prompt):**
- ✅ **Torcida presente** - Estádio com torcedores
- ✅ **Noite iluminada** - Refletores e luzes do estádio
- ✅ **Atmosfera vibrante** - Energia de jogo importante
- ✅ **Cores do time** - Torcida com cores características
- ✅ **Arquitetura destacada** - Estrutura do estádio visível

### **Variações por Time/Estádio:**
- **Maracanã**: Vermelho e preto (Flamengo) ou tricolor (Fluminense)
- **Camp Nou**: Azul e grená (Barcelona)
- **Allianz Arena Bayern**: Vermelho (Bayern Munich)
- **Allianz Parque**: Verde (Palmeiras)
- **São Januário**: Preto e branco (Vasco)

---

## 📋 **CHECKLIST PARA SUAS IMAGENS**

### **Para cada estádio, inclua:**
- [ ] **1 imagem diurna** com torcida
- [ ] **1 imagem noturna** com luzes
- [ ] **1 imagem atmosfera especial** (clássico, final, etc.)
- [ ] **Resolução mínima**: 800x600
- [ ] **Formato**: JPG, PNG ou WEBP
- [ ] **Vista clara** da arquitetura do estádio

### **Qualidade desejada:**
- ✅ Boa iluminação
- ✅ Torcida visível
- ✅ Arquitetura destacada
- ✅ Sem obstruções na vista
- ✅ Cores vibrantes

---

## 🚀 **COMO USAR**

1. **Crie as pastas** com os nomes exatos acima
2. **Coloque suas imagens** seguindo a nomenclatura
3. **Execute o sistema** - ele vai processar automaticamente
4. **Metadata será gerada** automaticamente pelo GPT-4 Vision

### **Comando para criar estrutura:**
```bash
# Criar todas as pastas de uma vez
mkdir -p api/stadium_references/{maracana,camp_nou,allianz_arena_bayern,allianz_parque_palmeiras,sao_januario_vasco}
``` 