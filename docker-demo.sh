#!/bin/bash

# Docker Demo Script - Demonstração completa sem interferir no deploy atual
echo "🎭 Docker Demo Mode - Demonstração completa do projeto"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Crie o arquivo .env primeiro."
    exit 1
fi

echo "✅ Arquivo .env encontrado"

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.demo.yml down 2>/dev/null || true

# Construir e iniciar demo completo
echo "🚀 Iniciando demo completo..."
docker-compose -f docker-compose.demo.yml up --build -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

# Verificar status
echo "📊 Status dos serviços:"
docker-compose -f docker-compose.demo.yml ps

# Testar conectividade
echo "🔍 Testando conectividade..."

# Testar Frontend Demo
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Demo Frontend: OK (http://localhost:3001)"
else
    echo "❌ Demo Frontend: Erro"
fi

# Testar Backend Demo
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Demo Backend: OK (http://localhost:8001)"
else
    echo "❌ Demo Backend: Erro"
fi

# Testar Thirdweb Engine
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Thirdweb Engine: OK (http://localhost:3005)"
else
    echo "❌ Thirdweb Engine: Erro"
fi

# Testar Nginx Proxy
if curl -s http://localhost > /dev/null 2>&1; then
    echo "✅ Nginx Proxy: OK (http://localhost)"
else
    echo "❌ Nginx Proxy: Erro"
fi

echo ""
echo "🎯 Demo iniciado com sucesso!"
echo ""
echo "📝 URLs do Demo:"
echo "  - Frontend Demo: http://localhost:3001"
echo "  - Backend Demo: http://localhost:8001"
echo "  - Engine: http://localhost:3005"
echo "  - Nginx Proxy: http://localhost"
echo ""
echo "📝 Deploy Atual (continua funcionando):"
echo "  - Frontend: Vercel (produção)"
echo "  - Backend: Render (produção)"
echo "  - MongoDB: Atlas (produção)"
echo ""
echo "🔄 Para parar o demo:"
echo "  docker-compose -f docker-compose.demo.yml down"
echo ""
echo "📊 Para ver logs:"
echo "  docker-compose -f docker-compose.demo.yml logs -f"
echo ""
echo "✅ Seu deploy atual continua funcionando normalmente!"
echo "🎭 Este é apenas um demo local para demonstração."
