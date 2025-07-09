#!/usr/bin/env python3
"""
Arquivo de inicialização para Deploy no Render
Sistema CHZ Fan Token Studio - API Unificada
"""
import os
import uvicorn

# Importar a aplicação principal
from main_unified import app

if __name__ == "__main__":
    # Render fornece a porta via variável de ambiente
    port = int(os.environ.get("PORT", 8000))
    
    print("🚀 CHZ Fan Token Studio - Starting Unified API")
    print(f"📡 Port: {port}")
    print("🎯 Endpoints: Jerseys + Stadiums + Badges + Teams")
    print("🔗 Health Check: /health")
    print("📋 Teams: /teams")
    print("🎨 Generate: /generate")
    
    # Configuração para produção
    uvicorn.run(
        "main_unified:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    ) 