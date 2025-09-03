#!/bin/bash

# Docker Test Script - Não interfere no funcionamento atual
echo "🧪 Docker Test Mode - Não interfere no funcionamento atual"

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

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Testar apenas Thirdweb Engine (mais seguro)
echo "🚀 Testando apenas Thirdweb Engine..."
docker-compose -f docker-compose.dev.yml up engine postgres redis -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status
echo "📊 Status dos serviços:"
docker-compose -f docker-compose.dev.yml ps

# Testar conectividade
echo "🔍 Testando conectividade..."

# Testar Thirdweb Engine
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Thirdweb Engine: OK (http://localhost:3005)"
else
    echo "❌ Thirdweb Engine: Erro"
fi

# Testar PostgreSQL
if docker exec $(docker-compose -f docker-compose.dev.yml ps -q postgres) pg_isready -U engine > /dev/null 2>&1; then
    echo "✅ PostgreSQL: OK (localhost:5432)"
else
    echo "❌ PostgreSQL: Erro"
fi

# Testar Redis
if docker exec $(docker-compose -f docker-compose.dev.yml ps -q redis) redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: OK (localhost:6379)"
else
    echo "❌ Redis: Erro"
fi

echo ""
echo "🎯 Teste concluído!"
echo ""
echo "📝 O que foi testado:"
echo "  - Thirdweb Engine: http://localhost:3005"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "📝 O que NÃO foi testado (para não interferir):"
echo "  - Frontend Next.js (continua rodando normalmente)"
echo "  - Backend Python (continua rodando normalmente)"
echo "  - MongoDB Atlas (continua sendo usado)"
echo ""
echo "🔄 Para testar frontend/backend com Docker:"
echo "  docker-compose -f docker-compose.dev.yml --profile optional up frontend backend"
echo ""
echo "🛑 Para parar todos os containers:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""
echo "✅ Seu projeto atual continua funcionando normalmente!"
