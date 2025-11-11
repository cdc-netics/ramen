#!/bin/bash
# setup.sh - Script de configuración inicial para Ramen SOC

set -e

echo "🍜 Configurando Ramen SOC..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js 18+ desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION es muy antigua${NC}"
    echo "Por favor actualiza a Node.js 18+"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) instalado${NC}"

# Backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Recuerda configurar las variables en backend/.env${NC}"
fi

npm install
echo -e "${GREEN}✅ Backend configurado${NC}"

# Frontend
echo ""
echo "📦 Instalando dependencias del frontend..."
cd ../frontend

if [ ! -f ".env" ]; then
    echo "Creando archivo .env desde .env.example..."
    cp .env.example .env
fi

npm install
echo -e "${GREEN}✅ Frontend configurado${NC}"

# Crear directorios necesarios
cd ..
echo ""
echo "📁 Creando directorios necesarios..."

mkdir -p modules
mkdir -p storage
mkdir -p storage/_metadata

echo -e "${GREEN}✅ Directorios creados${NC}"

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Configuración completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para iniciar el sistema:"
echo ""
echo "  Backend (modo demo / in-memory):"
echo "    cd backend"
echo "    node simple-server.js"
echo ""
echo "  Backend (con MongoDB opcional):"
echo "    cd backend"
echo "    npm start   # node server.js"
echo ""
echo "  Frontend:"
echo "    cd frontend"
echo "    npm start   # ng serve --host 0.0.0.0 --port 4200"
echo ""
echo "  O usa el script automático (Windows):"
echo "    INICIAR.bat / LEVANTAR_SISTEMA.bat"
echo ""
echo "Credenciales por defecto:"
echo "  Usuario: owner"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Cambia las credenciales en producción${NC}"
echo ""
