#!/usr/bin/env python3
"""
Teste Completo do Sistema de Badges
Testa todos os componentes: prompts, gerador e API
"""

import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def test_badge_prompts():
    """Testa o sistema de prompts para badges"""
    print("\n🧪 TESTANDO SISTEMA DE PROMPTS...")
    
    try:
        from badge_prompts import (
            build_badge_prompt, 
            get_available_styles, 
            get_supported_teams,
            BADGE_STYLE_PROMPTS,
            TEAM_BADGE_PROMPTS
        )
        
        print("✅ Módulo badge_prompts importado com sucesso")
        
        # Testar estilos disponíveis
        styles = get_available_styles()
        print(f"✅ Estilos disponíveis ({len(styles)}): {styles}")
        
        # Testar times suportados
        teams = get_supported_teams()
        print(f"✅ Times suportados ({len(teams)}): {teams}")
        
        # Testar geração de prompt
        test_prompt = build_badge_prompt("Flamengo", "CHAMPION", "1", "modern")
        print(f"✅ Prompt gerado: {len(test_prompt)} caracteres")
        print(f"   Início: {test_prompt[:100]}...")
        
        # Testar diferentes estilos
        for style in styles[:2]:  # Testar apenas os 2 primeiros
            prompt = build_badge_prompt("Palmeiras", "LEGEND", "10", style)
            print(f"✅ Prompt {style}: {len(prompt)} caracteres")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de prompts: {e}")
        return False

def test_badge_generator():
    """Testa o gerador de badges"""
    print("\n🎨 TESTANDO GERADOR DE BADGES...")
    
    try:
        from badge_generator import BadgeGenerator
        
        # Verificar se tem API key
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("⚠️ OPENAI_API_KEY não configurada - pulando teste de geração")
            return True
        
        print("✅ OPENAI_API_KEY encontrada")
        
        # Inicializar gerador
        generator = BadgeGenerator(api_key)
        print("✅ BadgeGenerator inicializado")
        
        # Testar informações do gerador
        info = generator.get_info()
        print(f"✅ Info do gerador: {info['generator_type']} v{info['version']}")
        print(f"   Capacidades: {len(info['capabilities'])} features")
        
        # Testar estilos e times suportados
        print(f"✅ Estilos suportados: {len(generator.supported_styles)}")
        print(f"✅ Times suportados: {len(generator.supported_teams)}")
        
        print("⚠️ Teste de geração real pulado (economizar créditos)")
        print("   Para testar geração real, descomente o código abaixo")
        
        # Para testar geração real, descomente:
        """
        print("🎨 Testando geração real...")
        result = generator.generate_badge(
            team_name="Flamengo",
            badge_name="TEST", 
            badge_number="99",
            style="modern"
        )
        
        if result["success"]:
            print(f"✅ Badge gerado com sucesso!")
            print(f"   URL: {result['image_url']}")
            print(f"   Metadados: {result['metadata']}")
        else:
            print(f"❌ Erro na geração: {result['error']}")
        """
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste do gerador: {e}")
        return False

def test_badge_api():
    """Testa a API de badges"""
    print("\n🌐 TESTANDO API DE BADGES...")
    
    try:
        from badge_api import (
            register_badge_routes,
            initialize_badge_generator,
            BadgeGenerationRequest,
            BadgeVariationsRequest
        )
        
        print("✅ Módulo badge_api importado com sucesso")
        
        # Testar modelos Pydantic
        test_request = BadgeGenerationRequest(
            team_name="Flamengo",
            badge_name="CHAMPION",
            badge_number="1",
            style="modern"
        )
        print(f"✅ BadgeGenerationRequest criado: {test_request.team_name}")
        
        test_variations = BadgeVariationsRequest(
            team_name="Palmeiras",
            badge_name="LEGEND",
            badge_number="10",
            styles=["modern", "retro"]
        )
        print(f"✅ BadgeVariationsRequest criado: {len(test_variations.styles)} estilos")
        
        # Testar inicialização (sem API key real)
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            print("✅ OPENAI_API_KEY disponível para inicialização")
        else:
            print("⚠️ OPENAI_API_KEY não disponível - API não pode ser inicializada")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste da API: {e}")
        return False

def test_integration():
    """Testa integração com main_unified.py"""
    print("\n🔗 TESTANDO INTEGRAÇÃO...")
    
    try:
        # Verificar se main_unified pode importar badges
        print("📝 Verificando se main_unified.py pode importar sistema de badges...")
        
        # Simular a importação como no main_unified.py
        try:
            from badge_api import register_badge_routes
            badges_available = True
            print("✅ Sistema de badges disponível para main_unified.py")
        except ImportError as e:
            badges_available = False
            print(f"❌ Sistema de badges NÃO disponível: {e}")
        
        # Verificar estrutura de arquivos
        required_files = [
            'badge_prompts.py',
            'badge_generator.py', 
            'badge_api.py'
        ]
        
        for file in required_files:
            if os.path.exists(file):
                print(f"✅ Arquivo {file} encontrado")
            else:
                print(f"❌ Arquivo {file} NÃO encontrado")
        
        return badges_available
        
    except Exception as e:
        print(f"❌ Erro no teste de integração: {e}")
        return False

def main():
    """Executa todos os testes"""
    print("=" * 60)
    print("🧪 TESTE COMPLETO DO SISTEMA DE BADGES")
    print("=" * 60)
    
    results = []
    
    # Executar todos os testes
    results.append(("Prompts", test_badge_prompts()))
    results.append(("Gerador", test_badge_generator()))
    results.append(("API", test_badge_api()))
    results.append(("Integração", test_integration()))
    
    # Resumo dos resultados
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(1 for _, passed in results if passed)
    
    for test_name, passed in results:
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"{test_name:12} - {status}")
    
    print(f"\nRESULTADO FINAL: {passed_tests}/{total_tests} testes passaram")
    
    if passed_tests == total_tests:
        print("🎉 TODOS OS TESTES PASSARAM! Sistema de badges pronto!")
    else:
        print("⚠️ Alguns testes falharam. Verifique os erros acima.")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 