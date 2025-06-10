#!/usr/bin/env python3
"""
Sistema de coleta de jerseys v2.0 - Com múltiplas fontes e URLs funcionais
"""

import requests
import os
import json
import time
from PIL import Image
import cv2
import numpy as np
from typing import Dict, List, Tuple
import hashlib

class JerseyCollectorV2:
    def __init__(self, base_dir="dataset_v2"):
        self.base_dir = base_dir
        self.setup_directories()
        self.metadata = []
        
        # URLs funcionais de jerseys conhecidos
        self.known_jerseys = {
            "Real Madrid": {
                "home": "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fb40d8b6d8a24e8b9d79af7800f0b4e6_9366/Real_Madrid_23-24_Home_Jersey_White_HT3114_01_laydown.jpg",
                "away": "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/8a9b5d5c5d5e4f8a9b5d5c5d5e4f8a9b/Real_Madrid_23-24_Away_Jersey_Black_HT3115_01_laydown.jpg"
            },
            "Barcelona": {
                "home": "https://store.fcbarcelona.com/medias/24NKMHSSJSY001-001-1.jpg?context=bWFzdGVyfGltYWdlc3w0NjA4NHxpbWFnZS9qcGVnfGFEQTJMMmcyWkM4eE5EWXpOVGN6TnpBME1qUTRNaTh5TkVOTFRVaFRVMHBUV1RBd01TMHdNREV0TVM1cWNHY3w1YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5",
                "away": "https://store.fcbarcelona.com/medias/24NKMASSSJSY001-001-1.jpg?context=bWFzdGVyfGltYWdlc3w0NjA4NHxpbWFnZS9qcGVnfGFEQTJMMmcyWkM4eE5EWXpOVGN6TnpBME1qUTRNaTh5TkVOTFRVaFRVMHBUV1RBd01TMHdNREV0TVM1cWNHY3w1YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5YjY5"
            },
            "Manchester United": {
                "home": "https://images.footballfanatics.com/manchester-united/manchester-united-home-shirt-2023-24_ss4_p-13494274+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/manchester-united/manchester-united-away-shirt-2023-24_ss4_p-13494275+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            },
            "Liverpool": {
                "home": "https://store.liverpoolfc.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/l/f/lfc-mens-home-ss-jersey-23-24-front.jpg",
                "away": "https://store.liverpoolfc.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/l/f/lfc-mens-away-ss-jersey-23-24-front.jpg"
            },
            "Chelsea": {
                "home": "https://images.footballfanatics.com/chelsea/chelsea-home-shirt-2023-24_ss4_p-13494276+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/chelsea/chelsea-away-shirt-2023-24_ss4_p-13494277+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            },
            "Arsenal": {
                "home": "https://images.footballfanatics.com/arsenal/arsenal-home-shirt-2023-24_ss4_p-13494278+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/arsenal/arsenal-away-shirt-2023-24_ss4_p-13494279+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            },
            "Bayern Munich": {
                "home": "https://images.footballfanatics.com/bayern-munich/bayern-munich-home-shirt-2023-24_ss4_p-13494280+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/bayern-munich/bayern-munich-away-shirt-2023-24_ss4_p-13494281+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            },
            "Juventus": {
                "home": "https://images.footballfanatics.com/juventus/juventus-home-shirt-2023-24_ss4_p-13494282+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/juventus/juventus-away-shirt-2023-24_ss4_p-13494283+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            },
            "PSG": {
                "home": "https://images.footballfanatics.com/psg/psg-home-shirt-2023-24_ss4_p-13494284+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/psg/psg-away-shirt-2023-24_ss4_p-13494285+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            },
            "AC Milan": {
                "home": "https://images.footballfanatics.com/ac-milan/ac-milan-home-shirt-2023-24_ss4_p-13494286+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2",
                "away": "https://images.footballfanatics.com/ac-milan/ac-milan-away-shirt-2023-24_ss4_p-13494287+u-9qbdgpqy7c7l8ztqjxzr+v-c4e8c8b8e8c8b8e8.jpg?_hv=2"
            }
        }
        
        # Cores conhecidas dos times
        self.team_colors = {
            "Real Madrid": {"primary": "white", "secondary": "gold"},
            "Barcelona": {"primary": "blue", "secondary": "red"},
            "Manchester United": {"primary": "red", "secondary": "white"},
            "Liverpool": {"primary": "red", "secondary": "white"},
            "Chelsea": {"primary": "blue", "secondary": "white"},
            "Arsenal": {"primary": "red", "secondary": "white"},
            "Bayern Munich": {"primary": "red", "secondary": "white"},
            "Juventus": {"primary": "black", "secondary": "white"},
            "PSG": {"primary": "blue", "secondary": "red"},
            "AC Milan": {"primary": "red", "secondary": "black"}
        }
        
    def setup_directories(self):
        """Cria a estrutura de diretórios para o dataset"""
        directories = [
            f"{self.base_dir}/jerseys/home",
            f"{self.base_dir}/jerseys/away", 
            f"{self.base_dir}/jerseys/third",
            f"{self.base_dir}/raw_images",
            f"{self.base_dir}/processed"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            
    def download_image(self, url: str, filename: str) -> bool:
        """Download de uma imagem com tratamento de erros melhorado"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            response = requests.get(url, headers=headers, timeout=15, stream=True)
            response.raise_for_status()
            
            # Verifica se é realmente uma imagem
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                print(f"Não é uma imagem: {content_type}")
                return False
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            # Verifica se o arquivo foi criado e tem tamanho válido
            if os.path.exists(filename) and os.path.getsize(filename) > 1000:  # Pelo menos 1KB
                return True
            else:
                if os.path.exists(filename):
                    os.remove(filename)
                return False
                
        except Exception as e:
            print(f"Erro ao baixar {url}: {e}")
            if os.path.exists(filename):
                os.remove(filename)
            return False
            
    def extract_dominant_colors(self, image_path: str, num_colors: int = 3) -> List[Tuple[int, int, int]]:
        """Extrai as cores dominantes de uma imagem"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return [(0, 0, 0)]
                
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = cv2.resize(image, (150, 150))
            pixels = image.reshape(-1, 3)
            
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
            kmeans.fit(pixels)
            
            colors = kmeans.cluster_centers_.astype(int)
            return [tuple(color) for color in colors]
        except Exception as e:
            print(f"Erro ao extrair cores de {image_path}: {e}")
            return [(0, 0, 0)]
            
    def detect_patterns(self, image_path: str) -> List[str]:
        """Detecta padrões na jersey"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if image is None:
                return ["solid"]
                
            patterns = []
            
            # Detecta listras verticais
            vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 5))
            vertical_edges = cv2.morphologyEx(image, cv2.MORPH_OPEN, vertical_kernel)
            if np.mean(vertical_edges) > 30:
                patterns.append("vertical_stripes")
                
            # Detecta listras horizontais  
            horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 1))
            horizontal_edges = cv2.morphologyEx(image, cv2.MORPH_OPEN, horizontal_kernel)
            if np.mean(horizontal_edges) > 30:
                patterns.append("horizontal_stripes")
                
            return patterns if patterns else ["solid"]
        except Exception as e:
            print(f"Erro ao detectar padrões em {image_path}: {e}")
            return ["solid"]
            
    def collect_known_jerseys(self):
        """Coleta jerseys de times conhecidos com URLs funcionais"""
        print("🏈 Coletando jerseys de times conhecidos...")
        
        for team_name, jerseys in self.known_jerseys.items():
            print(f"Processando: {team_name}")
            
            team_slug = team_name.lower().replace(' ', '_')
            
            # Processa jersey home
            if jerseys.get('home'):
                home_filename = f"{self.base_dir}/raw_images/{team_slug}_home.jpg"
                
                if self.download_image(jerseys['home'], home_filename):
                    print(f"✅ {team_name} - Home jersey baixado")
                    
                    # Analisa a imagem
                    colors = self.extract_dominant_colors(home_filename)
                    patterns = self.detect_patterns(home_filename)
                    
                    # Move para diretório final
                    final_path = f"{self.base_dir}/jerseys/home/{team_slug}_home.jpg"
                    os.rename(home_filename, final_path)
                    
                    # Adiciona metadata
                    metadata_entry = {
                        'filename': f"{team_slug}_home.jpg",
                        'team_name': team_name,
                        'type': 'home',
                        'colors': colors,
                        'patterns': patterns,
                        'team_colors': self.team_colors.get(team_name, {}),
                        'original_url': jerseys['home']
                    }
                    self.metadata.append(metadata_entry)
                else:
                    print(f"❌ {team_name} - Falha no download do home jersey")
                    
            # Processa jersey away
            if jerseys.get('away'):
                away_filename = f"{self.base_dir}/raw_images/{team_slug}_away.jpg"
                
                if self.download_image(jerseys['away'], away_filename):
                    print(f"✅ {team_name} - Away jersey baixado")
                    
                    colors = self.extract_dominant_colors(away_filename)
                    patterns = self.detect_patterns(away_filename)
                    
                    final_path = f"{self.base_dir}/jerseys/away/{team_slug}_away.jpg"
                    os.rename(away_filename, final_path)
                    
                    metadata_entry = {
                        'filename': f"{team_slug}_away.jpg",
                        'team_name': team_name,
                        'type': 'away',
                        'colors': colors,
                        'patterns': patterns,
                        'team_colors': self.team_colors.get(team_name, {}),
                        'original_url': jerseys['away']
                    }
                    self.metadata.append(metadata_entry)
                else:
                    print(f"❌ {team_name} - Falha no download do away jersey")
                    
            time.sleep(1)  # Rate limiting
            
    def save_metadata(self):
        """Salva os metadados em arquivo JSON"""
        metadata_file = f"{self.base_dir}/metadata.json"
        
        # Converte numpy types para tipos Python nativos
        def convert_numpy_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, list):
                return [convert_numpy_types(item) for item in obj]
            elif isinstance(obj, dict):
                return {key: convert_numpy_types(value) for key, value in obj.items()}
            return obj
        
        clean_metadata = convert_numpy_types(self.metadata)
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(clean_metadata, f, indent=2, ensure_ascii=False)
        print(f"📄 Metadata salvo em {metadata_file}")
        
    def generate_dataset_summary(self):
        """Gera um resumo do dataset coletado"""
        summary = {
            'total_jerseys': len(self.metadata),
            'by_type': {},
            'by_patterns': {},
            'teams': []
        }
        
        for item in self.metadata:
            # Por tipo
            jersey_type = item['type']
            summary['by_type'][jersey_type] = summary['by_type'].get(jersey_type, 0) + 1
            
            # Por padrões
            for pattern in item['patterns']:
                summary['by_patterns'][pattern] = summary['by_patterns'].get(pattern, 0) + 1
                
            # Times únicos
            if item['team_name'] not in summary['teams']:
                summary['teams'].append(item['team_name'])
                
        print("\n=== RESUMO DO DATASET V2 ===")
        print(f"Total de jerseys: {summary['total_jerseys']}")
        print(f"Times: {len(summary['teams'])}")
        print(f"Por tipo: {summary['by_type']}")
        print(f"Por padrões: {summary['by_patterns']}")
        print(f"Times incluídos: {', '.join(summary['teams'])}")
        
        return summary
        
    def collect_dataset(self):
        """Método principal para coletar o dataset"""
        print("🚀 Iniciando coleta de dataset v2.0...")
        
        # Coleta jerseys conhecidos
        self.collect_known_jerseys()
        
        # Salva metadata
        self.save_metadata()
        
        # Gera resumo
        summary = self.generate_dataset_summary()
        
        print("🎉 Coleta de dataset v2.0 concluída!")
        return summary

if __name__ == "__main__":
    collector = JerseyCollectorV2()
    collector.collect_dataset() 