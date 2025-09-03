# 🏟️ Stadium References - Folder Structure

## 📁 **WHERE TO PUT YOUR REFERENCE IMAGES**

### **Folder Structure:**
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

## 🎯 **STADIUM NAMES (IDs)**

| Real Stadium | Folder ID | System Name |
|--------------|-----------|-------------|
| **Maracanã** | `maracana` | Maracanã Stadium |
| **Camp Nou** | `camp_nou` | Camp Nou Stadium |
| **Allianz Arena (Bayern)** | `allianz_arena_bayern` | Allianz Arena Munich |
| **Allianz Parque (Palmeiras)** | `allianz_parque_palmeiras` | Allianz Parque São Paulo |
| **São Januário (Vasco)** | `sao_januario_vasco` | São Januário Stadium |

---

## 📸 **IMAGE NOMENCLATURE**

### **Pattern:** `{stadium_id}_{time}_{atmosphere}.jpg`

**Examples for Maracanã:**
- ✅ `maracana_day_crowd.jpg` - Day with crowd
- ✅ `maracana_night_lights.jpg` - Night illuminated
- ✅ `maracana_sunset_packed.jpg` - Sunset packed
- ✅ `maracana_derby_atmosphere.jpg` - Derby atmosphere

**Recommended variations:**
- `{stadium}_day_crowd.jpg` - Day with crowd
- `{stadium}_night_lights.jpg` - Night with lights
- `{stadium}_sunset_packed.jpg` - Sunset packed
- `{stadium}_empty_training.jpg` - Empty for training
- `{stadium}_derby_atmosphere.jpg` - Derby atmosphere

---

## 🎨 **DESIRED CHARACTERISTICS**

### **Standard Atmosphere (Base Prompt):**
- ✅ **Crowd present** - Stadium with spectators
- ✅ **Night illuminated** - Stadium spotlights and lights
- ✅ **Vibrant atmosphere** - Important game energy
- ✅ **Team colors** - Crowd with characteristic colors
- ✅ **Highlighted architecture** - Stadium structure visible

### **Variations by Team/Stadium:**
- **Maracanã**: Red and black (Flamengo) or tricolor (Fluminense)
- **Camp Nou**: Blue and burgundy (Barcelona)
- **Allianz Arena Bayern**: Red (Bayern Munich)
- **Allianz Parque**: Green (Palmeiras)
- **São Januário**: Black and white (Vasco)

---

## 📋 **CHECKLIST FOR YOUR IMAGES**

### **For each stadium, include:**
- [ ] **1 daytime image** with crowd
- [ ] **1 nighttime image** with lights
- [ ] **1 special atmosphere image** (derby, final, etc.)
- [ ] **Minimum resolution**: 800x600
- [ ] **Format**: JPG, PNG or WEBP
- [ ] **Clear view** of stadium architecture

### **Desired quality:**
- ✅ Good lighting
- ✅ Visible crowd
- ✅ Highlighted architecture
- ✅ No view obstructions
- ✅ Vibrant colors

---

## 🚀 **HOW TO USE**

1. **Create the folders** with the exact names above
2. **Place your images** following the nomenclature
3. **Execute the system** - it will process automatically
4. **Metadata will be generated** automatically by GPT-4 Vision

### **Command to create structure:**
```bash
# Create all folders at once
mkdir -p api/stadium_references/{maracana,camp_nou,allianz_arena_bayern,allianz_parque_palmeiras,sao_januario_vasco}
``` 