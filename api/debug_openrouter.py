#!/usr/bin/env python3
"""
Debug OpenRouter - Identifica problema com erro 405
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_openrouter_connection():
    """Testa conexão básica com OpenRouter"""
    print("🔍 Debug OpenRouter")
    print("=" * 30)
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    
    if not api_key:
        print("❌ OPENROUTER_API_KEY não encontrada!")
        return
    
    print(f"✅ API Key encontrada: {api_key[:10]}...")
    
    # 1. Teste de modelos disponíveis
    print("\n🔍 Testando lista de modelos...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers=headers,
            timeout=30
        )
        
        print(f"Status modelos: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            models = [m['id'] for m in data['data'] if 'dall-e' in m['id'].lower()]
            print(f"✅ Modelos DALL-E encontrados: {models}")
        else:
            print(f"❌ Erro: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
    
    # 2. Teste simples de geração
    print("\n🔍 Testando geração de imagem...")
    
    # Corrigindo o payload para OpenRouter
    payload = {
        "model": "openai/dall-e-3",
        "prompt": "A simple red soccer jersey, flat lay photography",
        "n": 1,
        "size": "1024x1024",
        "quality": "standard"
    }
    
    print(f"📝 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/images/generations",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        print(f"Status geração: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Geração funcionou!")
            data = response.json()
            if 'data' in data and len(data['data']) > 0:
                image_url = data['data'][0]['url']
                print(f"🖼️ URL da imagem: {image_url[:50]}...")
        else:
            print(f"❌ Erro {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro na geração: {e}")

def test_alternative_endpoints():
    """Testa endpoints alternativos"""
    print("\n🔍 Testando endpoints alternativos...")
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",  # Pode ser necessário
        "X-Title": "Jersey Generator"              # Pode ser necessário
    }
    
    endpoints = [
        "https://openrouter.ai/api/v1/images/generations",
        "https://openrouter.ai/api/v1/chat/completions"  # Para testar se API funciona
    ]
    
    for endpoint in endpoints:
        print(f"\n📡 Testando: {endpoint}")
        
        if "chat" in endpoint:
            # Teste básico de chat para verificar se API funciona
            payload = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": "Hello"}],
                "max_tokens": 5
            }
        else:
            # Teste de imagem
            payload = {
                "model": "openai/dall-e-3",
                "prompt": "Red jersey",
                "size": "1024x1024"
            }
        
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Erro: {response.text}")
            else:
                print("✅ Endpoint funcionando!")
                
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_openrouter_connection()
    test_alternative_endpoints() 