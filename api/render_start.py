"""
Arquivo de inicialização para API Principal
Sistema de geração de Jerseys + Stadiums + Teams
"""
import os
import uvicorn
from main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting Main API (Jerseys + Stadiums) on port {port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    ) 