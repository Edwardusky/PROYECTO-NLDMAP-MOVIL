#!/bin/bash

set -e

echo "======================================"
echo " Mobile Development Environment"
echo "======================================"
echo

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Proyecto:"
echo "$PROJECT_ROOT"
echo

# ------------------------------------------------
# Verificar Docker
# ------------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker no está instalado."
    exit 1
fi

echo "✓ Docker encontrado"

# ------------------------------------------------
# Verificar Docker Compose
# ------------------------------------------------

if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: Docker Compose no está disponible."
    exit 1
fi

echo "✓ Docker Compose encontrado"

# ------------------------------------------------
# Verificar estructura
# ------------------------------------------------

mkdir -p "$PROJECT_ROOT/app"
mkdir -p "$PROJECT_ROOT/docker"
mkdir -p "$PROJECT_ROOT/.devcontainer"

echo "✓ Estructura del proyecto verificada"

# ------------------------------------------------
# Construir contenedor
# ------------------------------------------------

echo
echo "Construyendo entorno de desarrollo..."

cd "$PROJECT_ROOT"

docker compose build

echo
echo "======================================"
echo " Entorno preparado correctamente"
echo "======================================"
echo
echo "Siguiente paso:"
echo
echo "  code ."
echo
echo "Después selecciona:"
echo
echo "  Dev Containers: Reopen in Container"
echo