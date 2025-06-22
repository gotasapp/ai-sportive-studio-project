"""
Arquivo de inicialização para deploy no Render
Unified API - Jersey + Stadium
"""
import os
import uvicorn
from jersey_api_dalle3 import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "jersey_api_dalle3:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    ) 