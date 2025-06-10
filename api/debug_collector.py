#!/usr/bin/env python3
"""
Script de debug para verificar problemas na coleta de jerseys
"""

import requests
import json

def debug_thesportsdb():
    """Debug da API do TheSportsDB"""
    print("🔍 Debugando TheSportsDB...")
    
    # Testa uma liga específica
    url = "https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id=4328"
    
    try:
        response = requests.get(url)
        print(f"Status da API: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            teams = data.get('teams', [])
            print(f"Times encontrados: {len(teams)}")
            
            # Verifica os primeiros 3 times
            for i, team in enumerate(teams[:3]):
                print(f"\n--- Time {i+1}: {team.get('strTeam', 'N/A')} ---")
                print(f"Jersey Home: {team.get('strTeamJersey', 'N/A')}")
                print(f"Jersey Away: {team.get('strTeamJerseyAway', 'N/A')}")
                
                # Testa se as URLs das imagens funcionam
                home_url = team.get('strTeamJersey', '')
                away_url = team.get('strTeamJerseyAway', '')
                
                if home_url:
                    try:
                        img_response = requests.head(home_url, timeout=5)
                        print(f"Home URL Status: {img_response.status_code}")
                    except Exception as e:
                        print(f"Home URL Error: {e}")
                        
                if away_url:
                    try:
                        img_response = requests.head(away_url, timeout=5)
                        print(f"Away URL Status: {img_response.status_code}")
                    except Exception as e:
                        print(f"Away URL Error: {e}")
                        
        else:
            print(f"Erro na API: {response.status_code}")
            
    except Exception as e:
        print(f"Erro geral: {e}")

def test_alternative_sources():
    """Testa fontes alternativas de dados"""
    print("\n🔍 Testando fontes alternativas...")
    
    # Teste com API-Football (gratuita)
    print("Testando API-Football...")
    
    # URLs de teste diretas
    test_urls = [
        "https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png",
        "https://logoeps.com/wp-content/uploads/2013/03/barcelona-vector-logo.png"
    ]
    
    for i, url in enumerate(test_urls):
        print(f"\nTestando URL {i+1}: {url}")
        try:
            response = requests.head(url, timeout=10)
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        except Exception as e:
            print(f"Erro: {e}")

def create_sample_dataset():
    """Cria um dataset de exemplo com URLs funcionais"""
    print("\n🎯 Criando dataset de exemplo...")
    
    sample_data = [
        {
            "team_name": "Real Madrid",
            "jersey_home": "https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png",
            "jersey_away": "https://logoeps.com/wp-content/uploads/2013/03/real-madrid-vector-logo.png",
            "colors": "White",
            "league": "La Liga"
        },
        {
            "team_name": "Barcelona", 
            "jersey_home": "https://logoeps.com/wp-content/uploads/2013/03/barcelona-vector-logo.png",
            "jersey_away": "https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png",
            "colors": "Blue/Red",
            "league": "La Liga"
        }
    ]
    
    # Salva o dataset de exemplo
    with open("sample_dataset.json", "w") as f:
        json.dump(sample_data, f, indent=2)
        
    print("✅ Dataset de exemplo criado: sample_dataset.json")
    return sample_data

if __name__ == "__main__":
    print("🚀 Iniciando debug do sistema de coleta...")
    
    # Debug da API principal
    debug_thesportsdb()
    
    # Testa fontes alternativas
    test_alternative_sources()
    
    # Cria dataset de exemplo
    sample_data = create_sample_dataset()
    
    print("\n📋 Próximos passos:")
    print("1. Verificar se as URLs estão funcionando")
    print("2. Ajustar o sistema de coleta se necessário")
    print("3. Testar com o dataset de exemplo") 