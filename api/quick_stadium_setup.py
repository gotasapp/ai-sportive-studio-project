#!/usr/bin/env python3
"""
Quick Setup Script for Stadium Vision + DALL-E 3 System
Configura o ambiente rapidamente para testes
"""

import os
import subprocess
import sys
from pathlib import Path

def check_python_version():
    """Verifica versão do Python"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def create_directories():
    """Cria diretórios necessários"""
    directories = [
        "test_images",
        "stadium_test_results",
        "api/stadium_logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"📁 Created directory: {directory}")

def install_requirements():
    """Instala dependências"""
    print("\n📦 Installing requirements...")
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "api/requirements_stadium.txt"
        ], check=True)
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def check_env_file():
    """Verifica arquivo .env"""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("⚠️ .env file not found")
        print("Creating .env template...")
        
        env_template = """# Stadium Vision + DALL-E 3 System Environment Variables

# OpenRouter API Key (for GPT-4 Vision)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenAI API Key (for DALL-E 3)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: API Configuration
STADIUM_API_PORT=8001
STADIUM_API_HOST=0.0.0.0

# Optional: Logging
LOG_LEVEL=INFO
"""
        
        with open(env_file, 'w') as f:
            f.write(env_template)
        
        print(f"📝 Created .env template at {env_file}")
        print("⚠️ Please edit .env and add your API keys")
        return False
    
    # Verifica se as chaves estão configuradas
    from dotenv import load_dotenv
    load_dotenv()
    
    required_keys = ['OPENROUTER_API_KEY', 'OPENAI_API_KEY']
    missing_keys = []
    
    for key in required_keys:
        value = os.getenv(key)
        if not value or value == f"your_{key.lower()}_here":
            missing_keys.append(key)
    
    if missing_keys:
        print(f"⚠️ Missing API keys in .env: {', '.join(missing_keys)}")
        return False
    
    print("✅ Environment variables configured")
    return True

def download_sample_images():
    """Sugere onde encontrar imagens de exemplo"""
    print("\n🖼️ Stadium Images Setup")
    print("Add your stadium reference images to the structured folders:")
    print("")
    
    # Verifica estrutura de estádios
    stadium_refs_dir = Path("api/stadium_references")
    if stadium_refs_dir.exists():
        print("📁 Stadium References Structure:")
        stadiums = [
            ("maracana", "Maracanã Stadium"),
            ("camp_nou", "Camp Nou Stadium"), 
            ("allianz_arena_bayern", "Allianz Arena Munich"),
            ("allianz_parque_palmeiras", "Allianz Parque São Paulo"),
            ("sao_januario_vasco", "São Januário Stadium")
        ]
        
        for stadium_id, stadium_name in stadiums:
            stadium_dir = stadium_refs_dir / stadium_id
            if stadium_dir.exists():
                existing_images = list(stadium_dir.glob("*.jpg")) + list(stadium_dir.glob("*.png"))
                status = f"✅ {len(existing_images)} images" if existing_images else "⚠️ No images"
                print(f"   {stadium_name} ({stadium_id}/) - {status}")
                
                # Mostra imagens necessárias
                required = [
                    f"{stadium_id}_day_crowd.jpg",
                    f"{stadium_id}_night_lights.jpg", 
                    f"{stadium_id}_atmosphere.jpg"
                ]
                print(f"      Required: {', '.join(required)}")
        
        print("\n📖 Check api/stadium_references/README.md for detailed instructions")
    else:
        print("⚠️ Stadium references structure not found")
    
    print("\n📸 Image Sources:")
    print("1. Google Images: 'maracana stadium night', 'camp nou packed', etc.")
    print("2. Unsplash.com: search for specific stadiums")
    print("3. Your own stadium photos")
    print("4. Official team websites and social media")
    print("")
    print("🎯 Image Requirements:")
    print("- Format: JPG, PNG, WEBP")
    print("- Resolution: 800x600 minimum (higher preferred)")
    print("- Content: Clear stadium view with crowd/atmosphere")
    print("- Lighting: Various conditions (day, night, sunset)")
    
    # Também verifica test_images para testes rápidos
    test_images_dir = Path("test_images")
    existing_test_images = list(test_images_dir.glob("*.jpg")) + list(test_images_dir.glob("*.png"))
    
    if existing_test_images:
        print(f"\n✅ Quick test images found: {len(existing_test_images)}")
        print("   (These can be used for initial testing)")
    else:
        print(f"\n💡 For quick testing, you can also add any stadium images to test_images/")
        print("   But for best results, use the structured stadium_references/ folders")

def create_run_scripts():
    """Cria scripts de execução"""
    
    # Script para iniciar a API
    api_script = """#!/usr/bin/env python3
import subprocess
import sys
import os

print("🏟️ Starting Stadium Vision + DALL-E 3 API Server")
print("=" * 50)

# Change to API directory
os.chdir("api")

# Start the server
try:
    subprocess.run([sys.executable, "stadium_vision_dalle3.py"], check=True)
except KeyboardInterrupt:
    print("\\n🛑 Server stopped by user")
except Exception as e:
    print(f"❌ Server error: {e}")
"""
    
    with open("run_stadium_api.py", 'w') as f:
        f.write(api_script)
    
    # Script para executar testes
    test_script = """#!/usr/bin/env python3
import subprocess
import sys
import os

print("🧪 Running Stadium System Tests")
print("=" * 50)

# Change to API directory
os.chdir("api")

# Run tests
try:
    subprocess.run([sys.executable, "test_stadium_system.py"], check=True)
except Exception as e:
    print(f"❌ Test error: {e}")
"""
    
    with open("run_stadium_tests.py", 'w') as f:
        f.write(test_script)
    
    print("📜 Created run scripts:")
    print("   - run_stadium_api.py (start API server)")
    print("   - run_stadium_tests.py (run tests)")

def create_stadium_references():
    """Cria estrutura de referências de estádios"""
    print("\n🏟️ Creating stadium references structure...")
    
    try:
        # Executa o script de criação de estrutura
        import subprocess
        result = subprocess.run([
            sys.executable, "api/create_stadium_structure.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Stadium references structure created")
            return True
        else:
            print(f"⚠️ Error creating stadium structure: {result.stderr}")
            return False
    except Exception as e:
        print(f"⚠️ Could not create stadium structure: {e}")
        return False

def main():
    """Função principal do setup"""
    print("🏟️ Stadium Vision + DALL-E 3 System Setup")
    print("=" * 50)
    
    # 1. Verifica Python
    if not check_python_version():
        return
    
    # 2. Cria diretórios
    print("\n📁 Creating directories...")
    create_directories()
    
    # 3. Instala dependências
    if not install_requirements():
        return
    
    # 4. Verifica .env
    print("\n🔧 Checking environment...")
    env_ready = check_env_file()
    
    # 5. Cria estrutura de estádios
    create_stadium_references()
    
    # 6. Setup de imagens
    download_sample_images()
    
    # 7. Cria scripts
    print("\n📜 Creating run scripts...")
    create_run_scripts()
    
    # Resumo final
    print("\n" + "=" * 50)
    print("✅ SETUP COMPLETE!")
    print("=" * 50)
    
    if env_ready:
        print("🚀 Ready to test! Run these commands:")
        print("   1. python run_stadium_api.py     # Start API server")
        print("   2. python run_stadium_tests.py   # Run tests (in another terminal)")
        print("   3. npm run dev                   # Start frontend (in another terminal)")
    else:
        print("⚠️ Next steps:")
        print("   1. Edit .env file and add your API keys")
        print("   2. Add test stadium images to test_images/ folder")
        print("   3. Run: python run_stadium_api.py")
    
    print("\n📊 Cost estimates:")
    print("   - Analysis only: ~$0.01 per image")
    print("   - Full generation: ~$0.05 per image (standard)")
    print("   - Full generation HD: ~$0.09 per image")
    
    print("\n🔗 Useful links:")
    print("   - OpenRouter: https://openrouter.ai/")
    print("   - OpenAI API: https://platform.openai.com/")
    print("   - Test images: https://unsplash.com/s/photos/stadium")

if __name__ == "__main__":
    main() 