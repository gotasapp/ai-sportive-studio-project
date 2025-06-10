import requests
import os
import json
import time
from PIL import Image
import cv2
import numpy as np
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import hashlib
from typing import Dict, List, Tuple
import colorsys

class JerseyCollector:
    def __init__(self, base_dir="dataset"):
        self.base_dir = base_dir
        self.setup_directories()
        self.metadata = []
        
    def setup_directories(self):
        """Cria a estrutura de diretórios para o dataset"""
        directories = [
            f"{self.base_dir}/jerseys/home",
            f"{self.base_dir}/jerseys/away", 
            f"{self.base_dir}/jerseys/third",
            f"{self.base_dir}/jerseys/goalkeeper",
            f"{self.base_dir}/raw_images",
            f"{self.base_dir}/processed"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            
    def download_image(self, url: str, filename: str) -> bool:
        """Download de uma imagem com tratamento de erros"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            return True
        except Exception as e:
            print(f"Erro ao baixar {url}: {e}")
            return False
            
    def extract_dominant_colors(self, image_path: str, num_colors: int = 3) -> List[Tuple[int, int, int]]:
        """Extrai as cores dominantes de uma imagem"""
        try:
            image = cv2.imread(image_path)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Redimensiona para acelerar o processamento
            image = cv2.resize(image, (150, 150))
            
            # Reshape para lista de pixels
            pixels = image.reshape(-1, 3)
            
            # K-means clustering para encontrar cores dominantes
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=num_colors, random_state=42)
            kmeans.fit(pixels)
            
            colors = kmeans.cluster_centers_.astype(int)
            return [tuple(color) for color in colors]
        except Exception as e:
            print(f"Erro ao extrair cores de {image_path}: {e}")
            return [(0, 0, 0)]
            
    def classify_jersey_type(self, image_path: str, team_name: str = "") -> str:
        """Classifica o tipo de jersey baseado em heurísticas"""
        colors = self.extract_dominant_colors(image_path)
        
        # Heurísticas simples para classificação
        # Isso pode ser melhorado com ML mais tarde
        dominant_color = colors[0]
        
        # Se é muito escuro, provavelmente é away ou third
        brightness = sum(dominant_color) / 3
        
        if brightness < 50:
            return "away"
        elif brightness > 200:
            return "home"
        else:
            return "third"
            
    def detect_patterns(self, image_path: str) -> List[str]:
        """Detecta padrões na jersey (listras, xadrez, etc.)"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            
            patterns = []
            
            # Detecta listras verticais
            vertical_kernel = np.array([[-1, 2, -1]] * 3)
            vertical_edges = cv2.filter2D(image, -1, vertical_kernel)
            if np.mean(vertical_edges) > 50:
                patterns.append("vertical_stripes")
                
            # Detecta listras horizontais  
            horizontal_kernel = np.array([[-1], [2], [-1]] * 3)
            horizontal_edges = cv2.filter2D(image, -1, horizontal_kernel)
            if np.mean(horizontal_edges) > 50:
                patterns.append("horizontal_stripes")
                
            # Detecta gradientes
            gradient_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
            gradient_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(gradient_x**2 + gradient_y**2)
            
            if np.mean(gradient_magnitude) > 30:
                patterns.append("gradient")
                
            return patterns if patterns else ["solid"]
        except Exception as e:
            print(f"Erro ao detectar padrões em {image_path}: {e}")
            return ["solid"]
            
    def scrape_thesportsdb(self, sport: str = "Soccer") -> List[Dict]:
        """Coleta dados do TheSportsDB"""
        jerseys_data = []
        
        try:
            # Lista de ligas populares
            leagues = [
                "4328",  # English Premier League
                "4335",  # Spanish La Liga  
                "4331",  # German Bundesliga
                "4332",  # Italian Serie A
                "4334",  # French Ligue 1
            ]
            
            for league_id in leagues:
                print(f"Coletando times da liga {league_id}...")
                
                url = f"https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id={league_id}"
                response = requests.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    teams = data.get('teams', [])
                    
                    for team in teams[:5]:  # Limita a 5 times por liga para teste
                        team_data = {
                            'team_name': team.get('strTeam', ''),
                            'jersey_home': team.get('strTeamJersey', ''),
                            'jersey_away': team.get('strTeamJerseyAway', ''),
                            'colors': team.get('strTeamColour', ''),
                            'league': league_id
                        }
                        jerseys_data.append(team_data)
                        
                time.sleep(1)  # Rate limiting
                
        except Exception as e:
            print(f"Erro ao coletar do TheSportsDB: {e}")
            
        return jerseys_data
        
    def process_collected_data(self, jerseys_data: List[Dict]):
        """Processa os dados coletados e organiza o dataset"""
        for i, team_data in enumerate(jerseys_data):
            team_name = team_data['team_name'].replace(' ', '_').lower()
            
            # Processa jersey home
            if team_data['jersey_home']:
                home_filename = f"{self.base_dir}/raw_images/{team_name}_home_{i}.jpg"
                if self.download_image(team_data['jersey_home'], home_filename):
                    
                    # Analisa a imagem
                    colors = self.extract_dominant_colors(home_filename)
                    patterns = self.detect_patterns(home_filename)
                    jersey_type = "home"
                    
                    # Move para diretório apropriado
                    final_path = f"{self.base_dir}/jerseys/{jersey_type}/{team_name}_home_{i}.jpg"
                    os.rename(home_filename, final_path)
                    
                    # Adiciona metadata
                    metadata_entry = {
                        'filename': f"{team_name}_home_{i}.jpg",
                        'team_name': team_data['team_name'],
                        'type': jersey_type,
                        'colors': colors,
                        'patterns': patterns,
                        'original_url': team_data['jersey_home']
                    }
                    self.metadata.append(metadata_entry)
                    
            # Processa jersey away
            if team_data['jersey_away']:
                away_filename = f"{self.base_dir}/raw_images/{team_name}_away_{i}.jpg"
                if self.download_image(team_data['jersey_away'], away_filename):
                    
                    colors = self.extract_dominant_colors(away_filename)
                    patterns = self.detect_patterns(away_filename)
                    jersey_type = "away"
                    
                    final_path = f"{self.base_dir}/jerseys/{jersey_type}/{team_name}_away_{i}.jpg"
                    os.rename(away_filename, final_path)
                    
                    metadata_entry = {
                        'filename': f"{team_name}_away_{i}.jpg",
                        'team_name': team_data['team_name'],
                        'type': jersey_type,
                        'colors': colors,
                        'patterns': patterns,
                        'original_url': team_data['jersey_away']
                    }
                    self.metadata.append(metadata_entry)
                    
            print(f"Processado: {team_data['team_name']}")
            time.sleep(0.5)  # Rate limiting
            
    def save_metadata(self):
        """Salva os metadados em arquivo JSON"""
        metadata_file = f"{self.base_dir}/metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        print(f"Metadata salvo em {metadata_file}")
        
    def generate_dataset_summary(self):
        """Gera um resumo do dataset coletado"""
        summary = {
            'total_jerseys': len(self.metadata),
            'by_type': {},
            'by_patterns': {},
            'color_distribution': {}
        }
        
        for item in self.metadata:
            # Por tipo
            jersey_type = item['type']
            summary['by_type'][jersey_type] = summary['by_type'].get(jersey_type, 0) + 1
            
            # Por padrões
            for pattern in item['patterns']:
                summary['by_patterns'][pattern] = summary['by_patterns'].get(pattern, 0) + 1
                
        print("\n=== RESUMO DO DATASET ===")
        print(f"Total de jerseys: {summary['total_jerseys']}")
        print(f"Por tipo: {summary['by_type']}")
        print(f"Por padrões: {summary['by_patterns']}")
        
        return summary
        
    def collect_dataset(self):
        """Método principal para coletar o dataset completo"""
        print("🚀 Iniciando coleta de dataset de jerseys...")
        
        # Coleta dados do TheSportsDB
        print("📡 Coletando dados do TheSportsDB...")
        jerseys_data = self.scrape_thesportsdb()
        
        print(f"✅ Encontrados {len(jerseys_data)} times")
        
        # Processa os dados
        print("🔄 Processando imagens...")
        self.process_collected_data(jerseys_data)
        
        # Salva metadata
        self.save_metadata()
        
        # Gera resumo
        summary = self.generate_dataset_summary()
        
        print("🎉 Coleta de dataset concluída!")
        return summary

if __name__ == "__main__":
    collector = JerseyCollector()
    collector.collect_dataset() 