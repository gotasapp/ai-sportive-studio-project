# 🏟️ Stadium Vision + DALL-E 3 - Guia de Teste Rápido

## 📋 **RESUMO DO SISTEMA**

**Pipeline Híbrido Criado:**
```
Imagem de Referência → GPT-4 Vision (OpenRouter) → DALL-E 3 (OpenAI) → Frontend → Mint NFT
```

**Arquivos Criados:**
- ✅ `api/stadium_vision_dalle3.py` - API principal
- ✅ `src/lib/services/stadium-service.ts` - Service frontend
- ✅ `src/app/admin/stadiums/page.tsx` - Interface de teste
- ✅ `api/test_stadium_system.py` - Script de testes
- ✅ `api/quick_stadium_setup.py` - Setup automático
- ✅ `api/requirements_stadium.txt` - Dependências

---

## 🚀 **SETUP RÁPIDO (1 COMANDO)**

### **Passo 1: Execute o Setup Automático**
```bash
python api/quick_stadium_setup.py
```

Este comando vai:
- ✅ Verificar Python 3.8+
- ✅ Instalar todas as dependências
- ✅ Criar diretórios necessários
- ✅ Configurar arquivo .env (template)
- ✅ Criar scripts de execução

---

## 🔑 **CONFIGURAÇÃO DE API KEYS**

### **Passo 2: Configure suas chaves no arquivo `.env`**

```env
# OpenRouter API Key (para GPT-4 Vision)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Key (para DALL-E 3)  
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde conseguir:**
- 🔗 **OpenRouter**: https://openrouter.ai/keys
- 🔗 **OpenAI**: https://platform.openai.com/api-keys

---

## 🖼️ **IMAGENS DE TESTE**

### **Passo 3: Adicione imagens de estádio**

Coloque **3-5 imagens** de estádios na pasta `test_images/`:

```
test_images/
├── maracana.jpg          # Maracanã
├── allianz.jpg           # Allianz Parque  
├── neo_quimica.jpg       # Neo Química Arena
└── stadium_generic.jpg   # Qualquer estádio
```

**Fontes recomendadas:**
- 📸 **Google Images**: "maracana stadium", "allianz parque"
- 🎨 **Unsplash**: https://unsplash.com/s/photos/stadium
- 🏟️ **Suas próprias fotos**

**Requisitos:**
- ✅ Formato: JPG, PNG, WEBP
- ✅ Tamanho: Qualquer (redimensiona automaticamente)
- ✅ Conteúdo: Vista clara do estádio

---

## 🧪 **EXECUTAR TESTES**

### **Passo 4: Inicie a API**
```bash
python run_stadium_api.py
```

**Você deve ver:**
```
🏟️ Starting Stadium Vision + DALL-E 3 API Server
✅ Stadium Vision System initialized
🔍 GPT-4 Vision: OpenRouter
🎨 DALL-E 3: OpenAI Direct
INFO: Uvicorn running on http://0.0.0.0:8001
```

### **Passo 5: Execute os testes (novo terminal)**
```bash
python run_stadium_tests.py
```

**Resultado esperado:**
```
🏟️ Stadium Vision + DALL-E 3 System Tester
==================================================
🔍 Testing API health...
✅ API is healthy
   GPT-4 Vision: openrouter
   DALL-E 3: openai_direct

============================================================
🏟️ TEST: Maracanã Stadium Test
============================================================
✅ Loaded test image: test_images/maracana.jpg
📏 Size: 1024x768

--- Phase 1: Analysis Only ---
🔍 Testing analysis for: maracana_test_analysis
✅ Analysis completed successfully
💰 Cost: $0.010
📊 Analysis Preview:
   Style: Modern iconic stadium
   Features: Distinctive curved roof structure...
   Time: Day
   Crowd: Packed with fans

--- Phase 2: Full Generation ---
🎨 Testing full generation for: maracana_test
⚙️ Parameters:
   generation_style: cinematic
   atmosphere: packed
   time_of_day: night
   weather: clear
🎨 Generating stadium with DALL-E 3...
✅ Stadium image generated successfully
✅ Generation completed successfully
💰 Total cost: $0.050
💾 Saved result: stadium_test_results/maracana_test_generated.png
🎉 Test 'maracana_test' completed successfully!

==================================================
📊 TEST SUITE SUMMARY
==================================================
✅ Successful tests: 3/3
💰 Total cost: $0.180
📁 Results saved in: stadium_test_results
```

---

## 🌐 **TESTE NO FRONTEND**

### **Passo 6: Inicie o frontend (novo terminal)**
```bash
npm run dev
```

### **Passo 7: Acesse o admin panel**
```
http://localhost:3000/admin/stadiums
```

**Interface disponível:**
- ✅ **Upload de imagem**: Drag & drop ou clique
- ✅ **Análise apenas**: GPT-4 Vision
- ✅ **Geração completa**: Pipeline completo
- ✅ **Parâmetros**: Style, atmosphere, time, weather, quality
- ✅ **Estimativa de custo**: Em tempo real
- ✅ **Download**: Imagem gerada

---

## 💰 **CUSTOS ESTIMADOS**

| Operação | Custo (USD) | Descrição |
|----------|-------------|-----------|
| **Análise apenas** | ~$0.01 | GPT-4 Vision |
| **Geração Standard** | ~$0.05 | GPT-4 Vision + DALL-E 3 |
| **Geração HD** | ~$0.09 | GPT-4 Vision + DALL-E 3 HD |

**Exemplo de teste completo (3 imagens):**
- 3 análises: $0.03
- 3 gerações: $0.15
- **Total: ~$0.18**

---

## 📊 **RESULTADOS ESPERADOS**

### **Arquivos gerados em `stadium_test_results/`:**
```
stadium_test_results/
├── maracana_test_analysis.json          # Análise GPT-4 Vision
├── maracana_test_generated.png          # Imagem gerada DALL-E 3
├── maracana_test_full_result.json       # Resultado completo
├── allianz_test_analysis.json
├── allianz_test_generated.png
└── ...
```

### **Exemplo de análise JSON:**
```json
{
  "success": true,
  "analysis": {
    "architecture": {
      "style": "Modern iconic stadium",
      "distinctive_features": "Curved roof structure with distinctive white facade",
      "roof_structure": "Partially covered with modern canopy",
      "seating_configuration": "Multi-tier bowl design"
    },
    "atmosphere": {
      "time_of_day": "Day",
      "crowd_density": "Packed with fans",
      "fan_colors": "Red and black predominant",
      "atmosphere_intensity": "Electric match day atmosphere"
    },
    "dalle3_prompt": "Professional stadium photography of a modern iconic stadium..."
  },
  "cost_usd": 0.01
}
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ Erro: "API Keys not configured"**
```bash
# Verifique se as chaves estão no .env
cat .env | grep API_KEY
```

### **❌ Erro: "No test images found"**
```bash
# Adicione imagens na pasta test_images/
ls test_images/
```

### **❌ Erro: "Connection refused"**
```bash
# Verifique se a API está rodando
curl http://localhost:8001/health
```

### **❌ Erro: "Module not found"**
```bash
# Reinstale dependências
pip install -r api/requirements_stadium.txt
```

---

## 🎯 **PRÓXIMOS PASSOS**

### **Após testes bem-sucedidos:**

1. **✅ Integração com IPFS**
   - Salvar imagens geradas no IPFS
   - Retornar URL para mint

2. **✅ Integração com Engine**
   - Conectar com sistema de mint
   - Metadata automática

3. **✅ Produção**
   - Deploy da API
   - Configurar domínio

4. **✅ Expansão**
   - Adicionar mais estádios de referência
   - Implementar sistema de logos

---

## 📞 **SUPORTE**

**Se encontrar problemas:**
1. Verifique os logs da API
2. Confirme as API keys
3. Teste com imagens menores
4. Verifique conexão com internet

**Arquivos de log:**
- `api/stadium_logs/` (se configurado)
- Terminal da API
- `stadium_test_results/` (resultados)

---

## 🎉 **RESUMO FINAL**

**Sistema criado com sucesso!** 🎊

**Pipeline funcional:**
```
📸 Upload → 🔍 GPT-4 Vision → 🎨 DALL-E 3 → 🖼️ Download → 🎯 Mint NFT
```

**Pronto para:**
- ✅ Análise de estádios com IA
- ✅ Geração de novas imagens
- ✅ Integração com frontend
- ✅ Mint de NFTs

**Quantas imagens de referência você quer usar?**
- **Mínimo**: 3-5 estádios
- **Recomendado**: 8-12 estádios
- **Ideal**: 15+ estádios (máxima variedade) 