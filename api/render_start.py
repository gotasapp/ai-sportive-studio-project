"""
Arquivo de inicialização para Vision Test API
Sistema separado para testes de GPT-4 Vision
"""
import os
import uvicorn
from vision_test_api import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8002))
    print(f"🚀 Starting Vision Test API on port {port}")
    uvicorn.run(
        "vision_test_api:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    ) 