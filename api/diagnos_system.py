#!/usr/bin/env python3
"""
Diagnóstico do Sistema - Verifica se está usando referências corretamente
"""

import json
import os
from pathlib import Path
import requests

def diagnose_system():
    """Diagnóstica problemas no sistema"""
    print("🔍 Diagnóstico Completo do Sistema")
    print("=" * 40)
    
    issues = []
    
    # 1. Verifica se dataset limpo existe
    print("\n1️⃣ Verificando Dataset Limpo...")
    dataset_dir = Path("dataset_clean")
    metadata_path = dataset_dir / "metadata_clean.json"
    
    if not dataset_dir.exists():
        issues.append("❌ Pasta dataset_clean não existe")
        print("❌ Pasta dataset_clean não encontrada!")
        return
    
    if not metadata_path.exists():
        issues.append("❌ metadata_clean.json não existe")
        print("❌ metadata_clean.json não encontrado!")
        return
    
    # Carrega metadados
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    print(f"✅ Dataset encontrado: {len(metadata)} times")
    
    # 2. Verifica imagens de referência
    print("\n2️⃣ Verificando Imagens de Referência...")
    ref_dir = dataset_dir / "jerseys" / "reference"
    
    if not ref_dir.exists():
        issues.append("❌ Pasta de referências não existe")
        print("❌ Pasta de referências não encontrada!")
        return
    
    ref_images = list(ref_dir.glob("*.png")) + list(ref_dir.glob("*.jpg"))
    print(f"📁 Imagens encontradas: {len(ref_images)}")
    
    for img in ref_images:
        print(f"   📸 {img.name} ({img.stat().st_size // 1024} KB)")
    
    if len(ref_images) == 0:
        issues.append("❌ Nenhuma imagem de referência encontrada")
    
    # 3. Verifica se metadados apontam para imagens corretas
    print("\n3️⃣ Verificando Consistência dos Metadados...")
    for item in metadata:
        image_path = dataset_dir / "jerseys" / item['type'] / item['filename']
        if image_path.exists():
            print(f"✅ {item['team_name']}: {item['filename']}")
        else:
            issues.append(f"❌ Imagem não encontrada: {item['filename']}")
            print(f"❌ {item['team_name']}: {item['filename']} - ARQUIVO NÃO EXISTE")
    
    # 4. Verifica prompts técnicos
    print("\n4️⃣ Verificando Prompts Técnicos...")
    has_technical = False
    for item in metadata:
        if 'technical_prompt' in item:
            has_technical = True
            print(f"✅ {item['team_name']}: Prompt técnico configurado")
            print(f"   📝 {item['technical_prompt'][:80]}...")
        else:
            issues.append(f"❌ {item['team_name']}: Sem prompt técnico")
            print(f"❌ {item['team_name']}: Prompt técnico AUSENTE")
    
    if not has_technical:
        issues.append("❌ Nenhum prompt técnico configurado")
    
    # 5. Verifica servidor AI
    print("\n5️⃣ Verificando Servidor AI...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Servidor funcionando")
            print(f"   🔧 Status: {data.get('status', 'unknown')}")
            print(f"   🎮 GPU: {data.get('gpu_available', 'unknown')}")
        else:
            issues.append("❌ Servidor retornou erro")
            print(f"❌ Servidor retornou: {response.status_code}")
    except:
        issues.append("❌ Servidor não está rodando")
        print("❌ Servidor não está rodando!")
    
    # 6. Verifica se modelo foi treinado
    print("\n6️⃣ Verificando Modelos Treinados...")
    model_dirs = [
        "jersey_lora_model",
        "jersey_lora_lite", 
        "jersey_lora_clean"
    ]
    
    trained_models = []
    for model_dir in model_dirs:
        if Path(model_dir).exists():
            trained_models.append(model_dir)
            print(f"✅ Modelo encontrado: {model_dir}")
        else:
            print(f"⚠️ Modelo não encontrado: {model_dir}")
    
    if not trained_models:
        issues.append("❌ Nenhum modelo treinado encontrado")
        print("❌ PROBLEMA CRÍTICO: Nenhum modelo foi treinado!")
        print("   O servidor está usando apenas o modelo base Stable Diffusion")
        print("   Suas imagens de referência NÃO estão sendo usadas!")
    
    # 7. Resumo do diagnóstico
    print(f"\n🎯 RESUMO DO DIAGNÓSTICO")
    print("=" * 30)
    
    if not issues:
        print("✅ Sistema está configurado corretamente!")
    else:
        print(f"❌ {len(issues)} problemas encontrados:")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
    
    # 8. Recomendações
    print(f"\n💡 RECOMENDAÇÕES")
    print("=" * 20)
    
    if not trained_models:
        print("🔥 PROBLEMA PRINCIPAL IDENTIFICADO:")
        print("   Você NÃO tem nenhum modelo treinado!")
        print("   O servidor está usando apenas Stable Diffusion base")
        print("   Por isso as imagens não parecem com suas referências")
        print()
        print("🚀 SOLUÇÃO:")
        print("   1. Treine um modelo com suas referências:")
        print("      python jersey_trainer_api.py")
        print("   2. Ou use ControlNet para forçar formato:")
        print("      python controlnet_jersey.py")
    
    elif len(ref_images) < 3:
        print("⚠️ Poucas imagens de referência")
        print("   Adicione mais exemplos para melhor qualidade")
    
    elif not has_technical:
        print("⚠️ Prompts técnicos não configurados")
        print("   Execute: python technical_prompts.py")
    
    else:
        print("✅ Sistema parece estar correto")
        print("   O problema pode ser na qualidade do treinamento")
        print("   Tente re-treinar com mais épocas ou ajustar parâmetros")

def main():
    """Função principal"""
    diagnose_system()

if __name__ == "__main__":
    main() 