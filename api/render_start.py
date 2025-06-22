"""
Arquivo de inicialização para deploy no Render
Unified API - Jersey + Stadium
"""
import os
import uvicorn
from main_unified import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main_unified:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    ) 