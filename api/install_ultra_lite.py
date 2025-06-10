#!/usr/bin/env python3
"""
Instala dependências mínimas para Ultra Lite
"""

import subprocess
import sys

def install_package(package):
    """Instala um pacote"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} instalado")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Erro ao instalar {package}")
        return False

def main():
    """Instala dependências mínimas"""
    print("🔧 Instalando dependências Ultra Lite...")
    print("=" * 40)
    
    # Dependências mínimas
    packages = [
        "requests",
        "Pillow",
        "numpy"
    ]
    
    success = True
    for package in packages:
        if not install_package(package):
            success = False
    
    if success:
        print("\n✅ Todas as dependências instaladas!")
        print("Execute: python jersey_trainer_ultra_lite.py")
    else:
        print("\n❌ Algumas dependências falharam")

if __name__ == "__main__":
    main() 