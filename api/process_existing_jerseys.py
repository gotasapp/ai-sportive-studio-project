#!/usr/bin/env python3
"""
Script para processar jerseys já baixados e gerar metadata
"""

import os
import glob
import json
import cv2
import numpy as np
from sklearn.cluster import KMeans
from typing import List, Tuple

def extract_dominant_colors(image_path: str, num_colors: int = 3) -> List[Tuple[int, int, int]]:
    """Extrai as cores dominantes de uma imagem"""
    try:
        image = cv2.imread(image_path)
        if image is None:
            return [(0, 0, 0)]
            
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (150, 150))
        pixels = image.reshape(-1, 3)
        
        kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
        kmeans.fit(pixels)
        
        colors = kmeans.cluster_centers_.astype(int)
        return [tuple(color) for color in colors]
    except Exception as e:
        print(f"Erro ao extrair cores de {image_path}: {e}")
        return [(0, 0, 0)]

def detect_patterns(image_path: str) -> List[str]:
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

def convert_numpy_types(obj):
    """Converte tipos numpy para tipos Python nativos"""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, tuple):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    return obj

def process_existing_jerseys():
    """Processa jerseys já baixados"""
    print("🔄 Processando jerseys existentes...")
    
    base_dir = "dataset_v2"
    metadata = []
    
    # Cores conhecidas dos times
    team_colors = {
        "manchester_united": {"primary": "red", "secondary": "white"},
        "liverpool": {"primary": "red", "secondary": "white"},
        "chelsea": {"primary": "blue", "secondary": "white"},
        "arsenal": {"primary": "red", "secondary": "white"},
        "bayern_munich": {"primary": "red", "secondary": "white"},
        "juventus": {"primary": "black", "secondary": "white"},
        "psg": {"primary": "blue", "secondary": "red"},
        "ac_milan": {"primary": "red", "secondary": "black"}
    }
    
    # Processa jerseys home
    home_files = glob.glob(f"{base_dir}/jerseys/home/*.jpg")
    print(f"Encontrados {len(home_files)} jerseys home")
    
    for home_file in home_files:
        filename = os.path.basename(home_file)
        team_slug = filename.replace('_home.jpg', '')
        team_name = team_slug.replace('_', ' ').title()
        
        print(f"Processando: {team_name} (Home)")
        
        colors = extract_dominant_colors(home_file)
        patterns = detect_patterns(home_file)
        
        metadata_entry = {
            'filename': filename,
            'team_name': team_name,
            'type': 'home',
            'colors': colors,
            'patterns': patterns,
            'team_colors': team_colors.get(team_slug, {}),
            'file_path': home_file
        }
        metadata.append(metadata_entry)
    
    # Processa jerseys away
    away_files = glob.glob(f"{base_dir}/jerseys/away/*.jpg")
    print(f"Encontrados {len(away_files)} jerseys away")
    
    for away_file in away_files:
        filename = os.path.basename(away_file)
        team_slug = filename.replace('_away.jpg', '')
        team_name = team_slug.replace('_', ' ').title()
        
        print(f"Processando: {team_name} (Away)")
        
        colors = extract_dominant_colors(away_file)
        patterns = detect_patterns(away_file)
        
        metadata_entry = {
            'filename': filename,
            'team_name': team_name,
            'type': 'away',
            'colors': colors,
            'patterns': patterns,
            'team_colors': team_colors.get(team_slug, {}),
            'file_path': away_file
        }
        metadata.append(metadata_entry)
    
    # Converte tipos numpy e salva metadata
    clean_metadata = convert_numpy_types(metadata)
    
    metadata_file = f"{base_dir}/metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(clean_metadata, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Metadata salvo em {metadata_file}")
    
    # Gera resumo
    summary = {
        'total_jerseys': len(metadata),
        'by_type': {},
        'by_patterns': {},
        'teams': []
    }
    
    for item in metadata:
        # Por tipo
        jersey_type = item['type']
        summary['by_type'][jersey_type] = summary['by_type'].get(jersey_type, 0) + 1
        
        # Por padrões
        for pattern in item['patterns']:
            summary['by_patterns'][pattern] = summary['by_patterns'].get(pattern, 0) + 1
            
        # Times únicos
        if item['team_name'] not in summary['teams']:
            summary['teams'].append(item['team_name'])
    
    print("\n=== RESUMO DO DATASET ===")
    print(f"Total de jerseys: {summary['total_jerseys']}")
    print(f"Times: {len(summary['teams'])}")
    print(f"Por tipo: {summary['by_type']}")
    print(f"Por padrões: {summary['by_patterns']}")
    print(f"Times incluídos: {', '.join(summary['teams'])}")
    
    return summary

if __name__ == "__main__":
    summary = process_existing_jerseys()
    print("\n🎉 Processamento concluído!")
    print("Dataset pronto para treinamento!") 