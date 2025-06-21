# 🏟️ STADIUM SYSTEM - Implementação Detalhada

## 📋 **SEGUINDO PADRÃO DOS JERSEYS**

Baseado na análise do sistema atual, vamos replicar **exatamente** a mesma estrutura para stadiums.

---

## 🗂️ **ESTRUTURA DE DIRETÓRIOS**

```
api/stadium_references/
├── maracana/
│   ├── metadata.json
│   ├── maracana_day_packed.jpg
│   ├── maracana_night_packed.jpg
│   ├── maracana_sunset_packed.jpg
│   ├── maracana_day_empty.jpg
│   └── maracana_final_atmosphere.jpg
├── allianz_parque/
│   ├── metadata.json
│   ├── allianz_night_green_sea.jpg
│   ├── allianz_day_match.jpg
│   └── allianz_derby_atmosphere.jpg
├── neo_quimica_arena/
│   ├── metadata.json
│   ├── neo_quimica_night_white.jpg
│   └── neo_quimica_day_crowd.jpg
└── camp_nou/
    ├── metadata.json
    ├── camp_nou_classic_view.jpg
    └── camp_nou_champions_night.jpg
```

---

## 📋 **METADATA STRUCTURE - STADIUMS**

```json
// api/stadium_references/maracana/metadata.json
{
  "day_match": {
    "STADIUM_NAME": "Estádio Jornalista Mário Filho (Maracanã)",
    "LOCATION": "Rio de Janeiro, Brasil",
    "CAPACITY": "78838",
    "ARCHITECTURE_STYLE": "concreto branco icônico com estrutura curva",
    "ATMOSPHERE_DESCRIPTION": "luz natural dourada, torcida vibrante em vermelho e preto",
    "CROWD_COLORS": "vermelho vibrante e preto profundo",
    "BACKGROUND_ELEMENTS": "montanhas do Rio de Janeiro ao fundo",
    "LIGHTING_TYPE": "natural daylight",
    "CAMERA_ANGLE": "wide-angle cinematic view"
  },
  "night_match": {
    "STADIUM_NAME": "Estádio Jornalista Mário Filho (Maracanã)",
    "LOCATION": "Rio de Janeiro, Brasil", 
    "CAPACITY": "78838",
    "ARCHITECTURE_STYLE": "concreto branco iluminado por refletores",
    "ATMOSPHERE_DESCRIPTION": "atmosfera noturna dramática, refletores intensos",
    "CROWD_COLORS": "vermelho e preto sob iluminação artificial",
    "BACKGROUND_ELEMENTS": "skyline noturno do Rio de Janeiro",
    "LIGHTING_TYPE": "stadium floodlights",
    "CAMERA_ANGLE": "low-angle dramatic shot"
  },
  "derby_atmosphere": {
    "STADIUM_NAME": "Estádio Jornalista Mário Filho (Maracanã)",
    "ATMOSPHERE_DESCRIPTION": "atmosfera elétrica de clássico, mosaicos gigantes",
    "CROWD_COLORS": "dividida entre vermelho/preto e outras cores",
    "SPECIAL_ELEMENTS": "fogos de artifício, bandeiras gigantes, tifo displays",
    "LIGHTING_TYPE": "dramatic mixed lighting",
    "INTENSITY": "maximum"
  }
}
```

---

## 🔧 **STADIUM COLLECTOR**

```python
# api/stadium_collector.py
import requests
import os
import json
import cv2
import numpy as np
from PIL import Image
from typing import Dict, List

class StadiumCollector:
    def __init__(self, base_dir="stadium_dataset"):
        self.base_dir = base_dir
        self.setup_directories()
        self.metadata = []
        
    def setup_directories(self):
        """Cria estrutura de diretórios para stadiums"""
        directories = [
            f"{self.base_dir}/stadiums/day_matches",
            f"{self.base_dir}/stadiums/night_matches", 
            f"{self.base_dir}/stadiums/derby_atmosphere",
            f"{self.base_dir}/stadiums/empty_training",
            f"{self.base_dir}/raw_images",
            f"{self.base_dir}/processed"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            
    def analyze_stadium_atmosphere(self, image_path: str) -> Dict:
        """Analisa atmosfera do estádio na imagem"""
        try:
            image = cv2.imread(image_path)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detecta se é dia ou noite baseado no brilho geral
            brightness = np.mean(image_rgb)
            time_of_day = "day" if brightness > 100 else "night"
            
            # Detecta densidade da torcida (áreas coloridas vs. vazias)
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Máscara para detectar assentos ocupados (cores variadas)
            lower_bound = np.array([0, 30, 30])
            upper_bound = np.array([179, 255, 255])
            crowd_mask = cv2.inRange(hsv, lower_bound, upper_bound)
            crowd_density = np.sum(crowd_mask) / crowd_mask.size
            
            # Classifica densidade
            if crowd_density > 0.6:
                density_level = "packed"
            elif crowd_density > 0.3:
                density_level = "half_full"
            else:
                density_level = "empty"
                
            return {
                "time_of_day": time_of_day,
                "crowd_density": density_level,
                "brightness_level": float(brightness),
                "crowd_coverage": float(crowd_density)
            }
            
        except Exception as e:
            print(f"Erro ao analisar atmosfera: {e}")
            return {"time_of_day": "unknown", "crowd_density": "unknown"}
    
    def detect_stadium_architecture(self, image_path: str) -> List[str]:
        """Detecta características arquitetônicas"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            
            features = []
            
            # Detecta estruturas curvas (estádios modernos)
            circles = cv2.HoughCircles(image, cv2.HOUGH_GRADIENT, 1, 20,
                                     param1=50, param2=30, minRadius=0, maxRadius=0)
            if circles is not None:
                features.append("curved_architecture")
            
            # Detecta linhas retas (estádios tradicionais)
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            if lines is not None and len(lines) > 20:
                features.append("linear_architecture")
                
            # Detecta padrões de telhado
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            large_contours = [c for c in contours if cv2.contourArea(c) > 1000]
            if len(large_contours) > 5:
                features.append("complex_roof_structure")
                
            return features if features else ["standard_architecture"]
            
        except Exception as e:
            print(f"Erro ao detectar arquitetura: {e}")
            return ["unknown_architecture"]
    
    def process_stadium_references(self):
        """Processa imagens de referência dos estádios"""
        stadium_dirs = [d for d in os.listdir("stadium_references") 
                       if os.path.isdir(f"stadium_references/{d}")]
        
        for stadium_name in stadium_dirs:
            print(f"Processando estádio: {stadium_name}")
            
            stadium_path = f"stadium_references/{stadium_name}"
            metadata_file = f"{stadium_path}/metadata.json"
            
            # Carrega metadata se existir
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    stadium_metadata = json.load(f)
            else:
                stadium_metadata = {}
            
            # Processa cada imagem no diretório
            image_files = [f for f in os.listdir(stadium_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            for image_file in image_files:
                image_path = f"{stadium_path}/{image_file}"
                
                # Analisa a imagem
                atmosphere = self.analyze_stadium_atmosphere(image_path)
                architecture = self.detect_stadium_architecture(image_path)
                
                # Cria entrada de metadata
                metadata_entry = {
                    'filename': image_file,
                    'stadium_name': stadium_name.replace('_', ' ').title(),
                    'atmosphere': atmosphere,
                    'architecture_features': architecture,
                    'reference_metadata': stadium_metadata,
                    'file_path': image_path
                }
                
                self.metadata.append(metadata_entry)
        
        # Salva metadata processada
        self.save_metadata()
        
    def save_metadata(self):
        """Salva metadata processada"""
        metadata_file = f"{self.base_dir}/stadium_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Stadium metadata salvo em {metadata_file}")

if __name__ == "__main__":
    collector = StadiumCollector()
    collector.process_stadium_references()
```

---

## 🎨 **STADIUM API GENERATOR**

```python
# api/stadium_api_dalle3.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json
import os
from typing import Optional

class StadiumGenerationRequest(BaseModel):
    stadium_id: str
    atmosphere_type: str  # "day_match", "night_match", "derby_atmosphere"
    crowd_density: str = "packed"  # "packed", "half_full", "empty"
    weather: str = "clear"  # "clear", "dramatic", "sunset"
    quality: str = "standard"

class StadiumGenerator:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=self.api_key)
        self.load_stadium_references()
        self.setup_stadium_prompts()
    
    def load_stadium_references(self):
        """Carrega referências dos estádios"""
        self.stadium_references = {}
        
        # Carrega metadata de cada estádio
        stadium_dirs = ['maracana', 'allianz_parque', 'neo_quimica_arena', 'camp_nou']
        
        for stadium_name in stadium_dirs:
            metadata_path = f"stadium_references/{stadium_name}/metadata.json"
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    self.stadium_references[stadium_name] = json.load(f)
    
    def setup_stadium_prompts(self):
        """Define prompts baseados nas referências"""
        self.stadium_prompts = {
            "maracana": {
                "day_match": """
                Cinematic wide-angle photograph of the iconic Maracanã stadium during a day match,
                {ARCHITECTURE_STYLE}, packed with passionate fans in {CROWD_COLORS},
                {ATMOSPHERE_DESCRIPTION}, vibrant green pitch in perfect condition,
                {BACKGROUND_ELEMENTS}, professional sports photography,
                Canon EOS R5, 24-70mm lens, {LIGHTING_TYPE}, 8K resolution, HDR
                """,
                
                "night_match": """
                Dramatic night shot of Maracanã stadium under floodlights,
                {ARCHITECTURE_STYLE}, sea of fans in {CROWD_COLORS},
                {ATMOSPHERE_DESCRIPTION}, perfectly illuminated green pitch,
                {BACKGROUND_ELEMENTS}, professional stadium photography,
                low-angle dramatic composition, 8K resolution, cinematic lighting
                """,
                
                "derby_atmosphere": """
                Electric atmosphere at Maracanã during a classic derby match,
                {SPECIAL_ELEMENTS}, {CROWD_COLORS}, {ATMOSPHERE_DESCRIPTION},
                maximum intensity crowd, professional sports photography,
                dramatic lighting, 8K resolution, epic composition
                """
            }
            # Adicionar outros estádios...
        }
    
    def generate_stadium_scene(self, request: StadiumGenerationRequest) -> str:
        """Gera cena do estádio baseada nas referências"""
        stadium_name = request.stadium_id.lower()
        atmosphere_type = request.atmosphere_type
        
        if stadium_name not in self.stadium_prompts:
            raise ValueError(f"Stadium '{stadium_name}' not configured")
        
        if atmosphere_type not in self.stadium_prompts[stadium_name]:
            raise ValueError(f"Atmosphere '{atmosphere_type}' not available")
        
        # Pega template do prompt
        prompt_template = self.stadium_prompts[stadium_name][atmosphere_type]
        
        # Pega metadata de referência
        stadium_metadata = self.stadium_references.get(stadium_name, {})
        atmosphere_metadata = stadium_metadata.get(atmosphere_type, {})
        
        # Substitui placeholders com dados reais
        final_prompt = prompt_template.format(
            ARCHITECTURE_STYLE=atmosphere_metadata.get('ARCHITECTURE_STYLE', 'modern stadium architecture'),
            CROWD_COLORS=atmosphere_metadata.get('CROWD_COLORS', 'colorful crowd'),
            ATMOSPHERE_DESCRIPTION=atmosphere_metadata.get('ATMOSPHERE_DESCRIPTION', 'vibrant atmosphere'),
            BACKGROUND_ELEMENTS=atmosphere_metadata.get('BACKGROUND_ELEMENTS', 'city skyline'),
            LIGHTING_TYPE=atmosphere_metadata.get('LIGHTING_TYPE', 'professional lighting'),
            SPECIAL_ELEMENTS=atmosphere_metadata.get('SPECIAL_ELEMENTS', 'passionate crowd')
        )
        
        # Ajusta baseado em parâmetros adicionais
        if request.crowd_density == "empty":
            final_prompt = final_prompt.replace("packed with", "empty stadium with")
        elif request.crowd_density == "half_full":
            final_prompt = final_prompt.replace("packed with", "half-filled with")
        
        if request.weather == "dramatic":
            final_prompt += ", dramatic cloudy sky, moody atmosphere"
        elif request.weather == "sunset":
            final_prompt += ", golden hour lighting, warm sunset colors"
        
        print(f"INFO: Generating {stadium_name} - {atmosphere_type}")
        print(f"INFO: Prompt: {final_prompt[:100]}...")
        
        # Gera com DALL-E 3
        generation_response = self.client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1024x1024",
            quality=request.quality,
            n=1
        )
        
        # Processa e retorna imagem
        image_url = generation_response.data[0].url
        # ... resto do processamento igual aos jerseys
        
        return image_base64

# API FastAPI
app = FastAPI(title="Stadium Generator API", version="1.0.0")
generator = StadiumGenerator()

@app.post("/generate-stadium")
async def generate_stadium_endpoint(request: StadiumGenerationRequest):
    try:
        image_base64 = generator.generate_stadium_scene(request)
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

1. **Criar estrutura de diretórios**: `api/stadium_references/`
2. **Coletar imagens de referência**: Maracanã, Allianz Parque, etc.
3. **Criar metadata.json** para cada estádio
4. **Implementar stadium_collector.py**
5. **Implementar stadium_api_dalle3.py**
6. **Integrar com frontend** (stadium-service.ts)
7. **Expandir admin panel**

**Quer que eu comece criando a estrutura base e coletando algumas imagens de referência?** 🏟️ 