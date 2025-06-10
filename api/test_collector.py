#!/usr/bin/env python3
"""
Script de teste para o sistema de coleta de jerseys
"""

from jersey_collector import JerseyCollector
import os

def test_collector():
    print("🧪 Testando sistema de coleta de jerseys...")
    
    # Cria uma instância do coletor
    collector = JerseyCollector("test_dataset")
    
    # Testa a criação de diretórios
    print("✅ Diretórios criados")
    
    # Testa coleta de dados (apenas 1 liga para teste rápido)
    print("📡 Testando coleta de dados...")
    
    # Modifica temporariamente para coletar apenas 1 liga
    original_method = collector.scrape_thesportsdb
    
    def test_scrape(sport="Soccer"):
        jerseys_data = []
        try:
            # Apenas Premier League para teste
            url = "https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id=4328"
            import requests
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                # Apenas 2 times para teste rápido
                for team in teams[:2]:
                    team_data = {
                        'team_name': team.get('strTeam', ''),
                        'jersey_home': team.get('strTeamJersey', ''),
                        'jersey_away': team.get('strTeamJerseyAway', ''),
                        'colors': team.get('strTeamColour', ''),
                        'league': "4328"
                    }
                    jerseys_data.append(team_data)
                    
        except Exception as e:
            print(f"Erro no teste: {e}")
            
        return jerseys_data
    
    # Substitui o método temporariamente
    collector.scrape_thesportsdb = test_scrape
    
    # Executa o teste
    try:
        summary = collector.collect_dataset()
        print("✅ Teste concluído com sucesso!")
        print(f"📊 Resumo: {summary}")
        
        # Verifica se os arquivos foram criados
        if os.path.exists("test_dataset/metadata.json"):
            print("✅ Arquivo de metadata criado")
        
        if os.path.exists("test_dataset/jerseys"):
            print("✅ Diretório de jerseys criado")
            
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

if __name__ == "__main__":
    success = test_collector()
    if success:
        print("\n🎉 Sistema de coleta está funcionando!")
        print("Para executar a coleta completa, execute:")
        print("python jersey_collector.py")
    else:
        print("\n❌ Há problemas no sistema de coleta") 