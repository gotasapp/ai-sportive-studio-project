# Vision Test - Sistema de Prompts Base

## 📁 Estrutura dos Arquivos

```
api/vision_prompts/
├── base_prompts.py      # Prompts organizados em Python
├── prompts_config.json  # Configuração em JSON (fácil edição)
├── README.md           # Esta documentação
```

## 🏆 Esportes Suportados

### ⚽ **Soccer (Futebol)**
- ✅ Vista das Costas
- ✅ Vista da Frente
- 🎯 Foco: Listras, logos, badges, design clássico

### 🏀 **Basketball (NBA)**  
- ✅ Vista das Costas
- ✅ Vista da Frente
- 🎯 Foco: Nome curvado, números grandes, tecido de basquete

### 🏈 **NFL (American Football)**
- ✅ Vista das Costas  
- ✅ Vista da Frente
- 🎯 Foco: Ombros robustos, números grossos, estilo NFL

## 🎨 Estilos Disponíveis

| Estilo | Descrição |
|--------|-----------|
| **Classic** | Design profissional clássico |
| **Modern** | Linhas limpas e modernas |
| **Retro** | Estética vintage esportiva |
| **Urban** | Estilo urbano street sports |
| **Premium** | Mercadoria esportiva luxuosa |
| **Vintage** | Uniforme esportivo clássico |

## 🔧 Como Usar

### Python (Recomendado)
```python
from api.vision_prompts.base_prompts import get_prompt, get_enhanced_prompt

# Prompt básico
prompt = get_prompt("soccer", "back", "MESSI", "10", "classic")

# Prompt com qualidade melhorada  
enhanced = get_enhanced_prompt("basketball", "front", "JORDAN", "23", "retro", "advanced")
```

### JSON (Edição Fácil)
```python
import json

with open('api/vision_prompts/prompts_config.json', 'r') as f:
    config = json.load(f)
    
soccer_back = config['sports']['soccer']['views']['back']['prompt']
```

## 🎯 Variáveis do Template

Todos os prompts suportam estas variáveis:

- `{PLAYER_NAME}` - Nome do jogador (será convertido para UPPERCASE)
- `{PLAYER_NUMBER}` - Número do jogador
- `{STYLE}` - Descrição do estilo escolhido

## ✨ Melhorias Implementadas

### Baseado no Código Atual CHZ:
1. ✅ **Negative Prompts** - Evita manequins, logos, baixa qualidade
2. ✅ **Quality Enhancers** - Melhora textura, iluminação, resolução  
3. ✅ **Style Themes** - Sistema de estilos expandido
4. ✅ **Multi-Sport** - Suporte a 3 esportes diferentes
5. ✅ **Multi-View** - Frente e costas para cada esporte

### Novos Recursos:
1. 🆕 **Organização JSON** - Fácil edição sem tocar no código
2. 🆕 **Utility Functions** - Funções helper para facilitar uso
3. 🆕 **Testing System** - Testa todos os prompts automaticamente
4. 🆕 **Enhanced Prompts** - Níveis de qualidade (base/advanced)

## 🧪 Testando

```bash
cd api/vision_prompts
python base_prompts.py
```

Output esperado:
```
🧪 Testando prompts base...
✅ SOCCER back: 847 chars
✅ SOCCER front: 742 chars  
✅ BASKETBALL back: 789 chars
✅ BASKETBALL front: 681 chars
✅ NFL back: 923 chars
✅ NFL front: 834 chars

✅ Teste concluído!
```

## 🔄 Próximos Passos

1. **Integrar com VisionTestEditor.tsx**
2. **Adicionar botões de filtro (Esporte/Perspectiva/Estilo)**
3. **Testar prompts com imagens reais**
4. **Ajustar prompts baseado nos resultados**
5. **Expandir para outros esportes conforme necessário**

## 📝 Sugestões de Melhorias

### Baseado no Código CHZ Atual:

1. **Adicionar aos prompts:**
   ```
   QUALITY: premium fabric texture, professional athletic fit, 
   studio lighting, photorealistic rendering, 4K quality, 
   official sports merchandise style
   ```

2. **Melhorar especificidade:**
   - Cores mais detalhadas
   - Texturas específicas por esporte
   - Posicionamento mais preciso de elementos

3. **Negative Prompts mais robustos:**
   ```
   "blurry, low quality, distorted, amateur, pixelated, 
   watermark, text overlay, logo overlay, multiple jerseys, 
   person wearing, mannequin, human model, body, arms, torso"
   ```

✅ **Sistema pronto para implementação no Vision Test!** 