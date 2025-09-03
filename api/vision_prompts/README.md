# Vision Test - Base Prompt System

## 📁 File Structure

```
api/vision_prompts/
├── base_prompts.py      # Organized prompts in Python
├── prompts_config.json  # JSON configuration (easy editing)
├── README.md           # This documentation
```

## 🏆 Supported Sports

### ⚽ **Soccer (Futebol)**
- ✅ Back View
- ✅ Front View
- 🎯 Focus: Stripes, logos, badges, classic design

### 🏀 **Basketball (NBA)**  
- ✅ Back View
- ✅ Front View
- 🎯 Focus: Curved name, large numbers, basketball fabric

### 🏈 **NFL (American Football)**
- ✅ Back View  
- ✅ Front View
- 🎯 Focus: Robust shoulders, thick numbers, NFL style

## 🎨 Available Styles

| Style | Description |
|-------|-------------|
| **Classic** | Classic professional design |
| **Modern** | Clean and modern lines |
| **Retro** | Vintage sports aesthetic |
| **Urban** | Urban street sports style |
| **Premium** | Luxury sports merchandise |
| **Vintage** | Classic sports uniform |

## 🔧 How to Use

### Python (Recommended)
```python
from api.vision_prompts.base_prompts import get_prompt, get_enhanced_prompt

# Basic prompt
prompt = get_prompt("soccer", "back", "MESSI", "10", "classic")

# Enhanced quality prompt  
enhanced = get_enhanced_prompt("basketball", "front", "JORDAN", "23", "retro", "advanced")
```

### JSON (Easy Editing)
```python
import json

with open('api/vision_prompts/prompts_config.json', 'r') as f:
    config = json.load(f)
    
soccer_back = config['sports']['soccer']['views']['back']['prompt']
```

## 🎯 Template Variables

All prompts support these variables:

- `{PLAYER_NAME}` - Player name (will be converted to UPPERCASE)
- `{PLAYER_NUMBER}` - Player number
- `{STYLE}` - Description of chosen style

## ✨ Implemented Improvements

### Based on Current CHZ Code:
1. ✅ **Negative Prompts** - Avoids mannequins, logos, low quality
2. ✅ **Quality Enhancers** - Improves texture, lighting, resolution  
3. ✅ **Style Themes** - Expanded style system
4. ✅ **Multi-Sport** - Support for 3 different sports
5. ✅ **Multi-View** - Front and back for each sport

### New Features:
1. 🆕 **JSON Organization** - Easy editing without touching code
2. 🆕 **Utility Functions** - Helper functions to facilitate use
3. 🆕 **Testing System** - Tests all prompts automatically
4. 🆕 **Enhanced Prompts** - Quality levels (base/advanced)

## 🧪 Testing

```bash
cd api/vision_prompts
python base_prompts.py
```

Expected output:
```
🧪 Testing base prompts...
✅ SOCCER back: 847 chars
✅ SOCCER front: 742 chars  
✅ BASKETBALL back: 789 chars
✅ BASKETBALL front: 681 chars
✅ NFL back: 923 chars
✅ NFL front: 834 chars

✅ Test completed!
```

## 🔄 Next Steps

1. **Integrate with VisionTestEditor.tsx**
2. **Add filter buttons (Sport/Perspective/Style)**
3. **Test prompts with real images**
4. **Adjust prompts based on results**
5. **Expand to other sports as needed**

## 📝 Improvement Suggestions

### Based on Current CHZ Code:

1. **Add to prompts:**
   ```
   QUALITY: premium fabric texture, professional athletic fit, 
   studio lighting, photorealistic rendering, 4K quality, 
   official sports merchandise style
   ```

2. **Improve specificity:**
   - More detailed colors
   - Sport-specific textures
   - More precise element positioning

3. **More robust Negative Prompts:**
   ```
   "blurry, low quality, distorted, amateur, pixelated, 
   watermark, text overlay, logo overlay, multiple jerseys, 
   person wearing, mannequin, human model, body, arms, torso"
   ```

✅ **System ready for implementation in Vision Test!** 