# 🎨 LOGO/BADGE SYSTEM - Implementação Detalhada

## 📋 **SEGUINDO PADRÃO DOS JERSEYS**

Com os direitos licenciados, podemos implementar logos oficiais seguindo **exatamente** a mesma estrutura dos jerseys.

---

## 🗂️ **ESTRUTURA DE DIRETÓRIOS**

```
api/logo_references/
├── flamengo/
│   ├── metadata.json
│   ├── flamengo_official_logo.png
│   ├── flamengo_shield_variant.png
│   ├── flamengo_minimalist.png
│   └── flamengo_retro_badge.png
├── palmeiras/
│   ├── metadata.json
│   ├── palmeiras_official_shield.png
│   ├── palmeiras_modern_badge.png
│   └── palmeiras_championship_logo.png
├── corinthians/
│   ├── metadata.json
│   ├── corinthians_classic_logo.png
│   └── corinthians_modern_badge.png
├── sponsors/
│   ├── nike/
│   │   ├── metadata.json
│   │   ├── nike_swoosh_variants.png
│   │   └── nike_text_logo.png
│   └── adidas/
│       ├── metadata.json
│       └── adidas_three_stripes.png
└── generic_elements/
    ├── shields/
    ├── crowns/
    ├── stars/
    └── geometric/
```

---

## 📋 **METADATA STRUCTURE - LOGOS**

```json
// api/logo_references/flamengo/metadata.json
{
  "official_logo": {
    "LOGO_NAME": "Clube de Regatas do Flamengo - Escudo Oficial",
    "LOGO_TYPE": "team_official",
    "COLORS": ["#DC143C", "#000000", "#FFFFFF"],
    "DESIGN_ELEMENTS": ["escudo tradicional", "coroa imperial", "remos cruzados"],
    "STYLE_DESCRIPTION": "escudo clássico com coroa dourada e remos cruzados",
    "BACKGROUND_TYPE": "transparent",
    "USAGE_CONTEXT": "oficial, jerseys, merchandise",
    "RESOLUTION": "high_definition",
    "FORMAT": "vector_ready"
  },
  "minimalist_variant": {
    "LOGO_NAME": "Flamengo - Versão Minimalista",
    "LOGO_TYPE": "simplified",
    "COLORS": ["#DC143C", "#000000"],
    "DESIGN_ELEMENTS": ["escudo simplificado", "linhas limpas"],
    "STYLE_DESCRIPTION": "versão moderna e minimalista do escudo tradicional",
    "BACKGROUND_TYPE": "transparent",
    "USAGE_CONTEXT": "digital, apps, modern applications"
  },
  "retro_badge": {
    "LOGO_NAME": "Flamengo - Badge Retrô",
    "LOGO_TYPE": "vintage",
    "COLORS": ["#DC143C", "#000000", "#FFD700"],
    "DESIGN_ELEMENTS": ["estilo vintage", "bordas ornamentadas", "tipografia clássica"],
    "STYLE_DESCRIPTION": "badge inspirado nos anos 80 com elementos decorativos",
    "USAGE_CONTEXT": "coleções especiais, edições limitadas"
  }
}
```

---

## 🔧 **LOGO COLLECTOR**

```python
# api/logo_collector.py
import cv2
import numpy as np
from PIL import Image
import json
import os
from typing import Dict, List, Tuple

class LogoCollector:
    def __init__(self, base_dir="logo_dataset"):
        self.base_dir = base_dir
        self.setup_directories()
        self.metadata = []
        
    def setup_directories(self):
        """Cria estrutura para logos"""
        directories = [
            f"{self.base_dir}/logos/team_official",
            f"{self.base_dir}/logos/team_variants", 
            f"{self.base_dir}/logos/sponsors",
            f"{self.base_dir}/logos/generic_elements",
            f"{self.base_dir}/logos/custom_badges",
            f"{self.base_dir}/raw_images",
            f"{self.base_dir}/processed"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def analyze_logo_characteristics(self, image_path: str) -> Dict:
        """Analisa características do logo"""
        try:
            # Carrega imagem
            image = cv2.imread(image_path)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detecta se tem fundo transparente
            if image.shape[2] == 4:  # RGBA
                has_transparency = True
                alpha_channel = image[:, :, 3]
                transparency_ratio = np.sum(alpha_channel == 0) / alpha_channel.size
            else:
                has_transparency = False
                transparency_ratio = 0
            
            # Analisa complexidade (número de contornos)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            complexity_level = len(contours)
            
            # Classifica complexidade
            if complexity_level < 5:
                complexity = "simple"
            elif complexity_level < 15:
                complexity = "moderate"
            else:
                complexity = "complex"
            
            # Detecta forma predominante
            shape_type = self.detect_logo_shape(gray)
            
            # Extrai cores dominantes
            colors = self.extract_logo_colors(image_rgb)
            
            return {
                "has_transparency": has_transparency,
                "transparency_ratio": float(transparency_ratio),
                "complexity": complexity,
                "complexity_score": complexity_level,
                "shape_type": shape_type,
                "dominant_colors": colors,
                "dimensions": image.shape[:2]
            }
            
        except Exception as e:
            print(f"Erro ao analisar logo: {e}")
            return {"error": str(e)}
    
    def detect_logo_shape(self, gray_image) -> str:
        """Detecta forma predominante do logo"""
        contours, _ = cv2.findContours(gray_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return "unknown"
        
        # Pega o maior contorno
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Aproxima o contorno
        epsilon = 0.02 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        # Classifica baseado no número de vértices
        vertices = len(approx)
        
        if vertices == 3:
            return "triangle"
        elif vertices == 4:
            # Verifica se é quadrado ou retângulo
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h
            if 0.95 <= aspect_ratio <= 1.05:
                return "square"
            else:
                return "rectangle"
        elif vertices > 8:
            # Verifica se é circular
            area = cv2.contourArea(largest_contour)
            perimeter = cv2.arcLength(largest_contour, True)
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            
            if circularity > 0.7:
                return "circle"
            else:
                return "complex_polygon"
        else:
            return "shield"  # Forma típica de escudos de times
    
    def extract_logo_colors(self, image_rgb) -> List[str]:
        """Extrai cores do logo em formato hex"""
        from sklearn.cluster import KMeans
        
        try:
            # Reshape para lista de pixels
            pixels = image_rgb.reshape(-1, 3)
            
            # Remove pixels muito escuros ou muito claros (fundo)
            pixels_filtered = pixels[
                (pixels.sum(axis=1) > 30) & (pixels.sum(axis=1) < 720)
            ]
            
            if len(pixels_filtered) == 0:
                return ["#000000"]
            
            # K-means para encontrar cores dominantes
            n_colors = min(5, len(np.unique(pixels_filtered, axis=0)))
            kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
            kmeans.fit(pixels_filtered)
            
            # Converte para hex
            colors_hex = []
            for color in kmeans.cluster_centers_.astype(int):
                hex_color = "#{:02x}{:02x}{:02x}".format(color[0], color[1], color[2])
                colors_hex.append(hex_color)
            
            return colors_hex
            
        except Exception as e:
            print(f"Erro ao extrair cores: {e}")
            return ["#000000"]
    
    def classify_logo_style(self, characteristics: Dict, metadata: Dict) -> str:
        """Classifica estilo do logo baseado nas características"""
        
        # Baseado na complexidade
        if characteristics["complexity"] == "simple":
            if "minimalist" in metadata.get("STYLE_DESCRIPTION", "").lower():
                return "minimalist"
            else:
                return "simple_modern"
        
        elif characteristics["complexity"] == "complex":
            if "vintage" in metadata.get("STYLE_DESCRIPTION", "").lower():
                return "vintage_detailed"
            else:
                return "complex_modern"
        
        else:  # moderate
            if "classic" in metadata.get("STYLE_DESCRIPTION", "").lower():
                return "classic_traditional"
            else:
                return "balanced_modern"
    
    def process_logo_references(self):
        """Processa logos de referência"""
        logo_dirs = [d for d in os.listdir("logo_references") 
                    if os.path.isdir(f"logo_references/{d}")]
        
        for logo_category in logo_dirs:
            print(f"Processando categoria: {logo_category}")
            
            category_path = f"logo_references/{logo_category}"
            
            # Se é um time ou sponsor, tem subdiretórios
            if logo_category in ['flamengo', 'palmeiras', 'corinthians', 'sponsors']:
                self.process_team_or_sponsor_logos(category_path, logo_category)
            else:
                self.process_generic_logos(category_path, logo_category)
        
        self.save_metadata()
    
    def process_team_or_sponsor_logos(self, category_path: str, category_name: str):
        """Processa logos de times ou sponsors"""
        metadata_file = f"{category_path}/metadata.json"
        
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r', encoding='utf-8') as f:
                logo_metadata = json.load(f)
        else:
            logo_metadata = {}
        
        # Processa cada imagem
        image_files = [f for f in os.listdir(category_path) 
                      if f.lower().endswith(('.png', '.jpg', '.jpeg', '.svg'))]
        
        for image_file in image_files:
            image_path = f"{category_path}/{image_file}"
            
            # Analisa características
            characteristics = self.analyze_logo_characteristics(image_path)
            
            # Tenta encontrar metadata específica
            file_key = image_file.replace('.png', '').replace('.jpg', '').replace('.jpeg', '')
            specific_metadata = logo_metadata.get(file_key, {})
            
            # Classifica estilo
            style = self.classify_logo_style(characteristics, specific_metadata)
            
            # Cria entrada
            metadata_entry = {
                'filename': image_file,
                'category': category_name,
                'logo_type': specific_metadata.get('LOGO_TYPE', 'unknown'),
                'characteristics': characteristics,
                'style_classification': style,
                'reference_metadata': specific_metadata,
                'file_path': image_path
            }
            
            self.metadata.append(metadata_entry)
    
    def save_metadata(self):
        """Salva metadata processada"""
        metadata_file = f"{self.base_dir}/logo_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Logo metadata salvo em {metadata_file}")

if __name__ == "__main__":
    collector = LogoCollector()
    collector.process_logo_references()
```

---

## 🎨 **LOGO API GENERATOR**

```python
# api/logo_api_dalle3.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json
import os
from typing import Optional, List

class LogoGenerationRequest(BaseModel):
    logo_category: str  # "team_official", "team_variant", "sponsor", "custom"
    team_or_brand: str  # "flamengo", "nike", etc.
    style_variant: str  # "official", "minimalist", "retro", "modern"
    colors: Optional[List[str]] = None  # Cores customizadas
    background: str = "transparent"  # "transparent", "white", "dark"
    quality: str = "standard"

class LogoGenerator:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=self.api_key)
        self.load_logo_references()
        self.setup_logo_prompts()
    
    def load_logo_references(self):
        """Carrega referências dos logos"""
        self.logo_references = {}
        
        # Carrega metadata de cada categoria
        categories = ['flamengo', 'palmeiras', 'corinthians']
        
        for category in categories:
            metadata_path = f"logo_references/{category}/metadata.json"
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    self.logo_references[category] = json.load(f)
    
    def setup_logo_prompts(self):
        """Define prompts baseados nas referências"""
        self.logo_prompts = {
            "flamengo": {
                "official": """
                Professional vector logo of Clube de Regatas do Flamengo official emblem,
                {DESIGN_ELEMENTS}, {STYLE_DESCRIPTION},
                colors: {COLORS}, {BACKGROUND_TYPE} background,
                high-definition vector art, clean lines, official team logo,
                suitable for {USAGE_CONTEXT}, SVG-ready design, 4K resolution
                """,
                
                "minimalist": """
                Minimalist interpretation of Flamengo logo,
                {DESIGN_ELEMENTS}, simplified modern design,
                {STYLE_DESCRIPTION}, colors: {COLORS},
                clean vector art, {BACKGROUND_TYPE} background,
                contemporary logo design, high contrast, scalable
                """,
                
                "retro": """
                Vintage-style Flamengo badge design,
                {DESIGN_ELEMENTS}, {STYLE_DESCRIPTION},
                retro color palette: {COLORS}, classic typography,
                {BACKGROUND_TYPE} background, nostalgic design,
                high-quality vector art, vintage sports logo
                """
            }
            # Adicionar outros times e categorias...
        }
    
    def generate_logo(self, request: LogoGenerationRequest) -> str:
        """Gera logo baseado nas referências"""
        team_or_brand = request.team_or_brand.lower()
        style_variant = request.style_variant
        
        if team_or_brand not in self.logo_prompts:
            raise ValueError(f"Team/Brand '{team_or_brand}' not configured")
        
        if style_variant not in self.logo_prompts[team_or_brand]:
            raise ValueError(f"Style '{style_variant}' not available")
        
        # Pega template do prompt
        prompt_template = self.logo_prompts[team_or_brand][style_variant]
        
        # Pega metadata de referência
        logo_metadata = self.logo_references.get(team_or_brand, {})
        style_metadata = logo_metadata.get(style_variant, {})
        
        # Prepara cores
        if request.colors:
            colors_str = ", ".join(request.colors)
        else:
            colors_str = ", ".join(style_metadata.get('COLORS', ['red', 'black']))
        
        # Substitui placeholders
        final_prompt = prompt_template.format(
            DESIGN_ELEMENTS=", ".join(style_metadata.get('DESIGN_ELEMENTS', ['classic emblem'])),
            STYLE_DESCRIPTION=style_metadata.get('STYLE_DESCRIPTION', 'professional logo design'),
            COLORS=colors_str,
            BACKGROUND_TYPE=request.background,
            USAGE_CONTEXT=style_metadata.get('USAGE_CONTEXT', 'general use')
        )
        
        # Ajustes baseados no background
        if request.background == "transparent":
            final_prompt += ", transparent background, PNG format ready"
        elif request.background == "dark":
            final_prompt += ", dark background, high contrast for visibility"
        
        print(f"INFO: Generating {team_or_brand} logo - {style_variant}")
        print(f"INFO: Prompt: {final_prompt[:100]}...")
        
        # Gera com DALL-E 3
        generation_response = self.client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1024x1024",
            quality=request.quality,
            n=1
        )
        
        # Processa e retorna
        image_url = generation_response.data[0].url
        # ... resto do processamento
        
        return image_base64

# API FastAPI
app = FastAPI(title="Logo Generator API", version="1.0.0")
generator = LogoGenerator()

@app.post("/generate-logo")
async def generate_logo_endpoint(request: LogoGenerationRequest):
    try:
        image_base64 = generator.generate_logo(request)
        return {
            "success": True,
            "image_base64": image_base64,
            "cost_usd": 0.045
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Criar estrutura**: `api/logo_references/`
2. **Coletar logos oficiais** (com direitos licenciados)
3. **Criar metadata.json** detalhado
4. **Implementar logo_collector.py**
5. **Implementar logo_api_dalle3.py**
6. **Frontend integration**
7. **Admin panel expansion**

**Com os direitos licenciados, podemos trabalhar com logos oficiais sem restrições! Quer começar?** 🎨 