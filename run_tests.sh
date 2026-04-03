#!/bin/bash

# Script de verificació automatitzada per a traducció-Xammar
# Aquest script executa la suite de tests per a garantir la qualitat 10/10.

PROJECT_ROOT=$(pwd)
VENV_BIN="$PROJECT_ROOT/.venv/bin"

echo "--------------------------------------------------"
echo "🚀 Iniciant Suite de Tests Automatitzada..."
echo "--------------------------------------------------"

# 1. Verificar dependències
if [ ! -f "$VENV_BIN/pytest" ]; then
    echo "❌ Error: Pytest no trobat a .venv. Instal·lant..."
    $VENV_BIN/pip install pytest pytest-asyncio pytest-mock httpx
fi

# 2. Executar Tests de Seguretat i Integració (Mocked)
echo "🛡️ Executant tests de Seguretat (CORS) i Endpoints..."
$VENV_BIN/pytest src-backend/tests/test_cors.py src-backend/tests/test_endpoints.py -v

# 3. Executar Load Test (Requereix servidor actiu o test unitari)
echo "⚡ Executant micro-test de càrrega asíncrona..."
$VENV_BIN/pytest src-backend/tests/test_load.py -v

echo "--------------------------------------------------"
echo "✅ Protocol de Verificació Finalitzat."
echo "--------------------------------------------------"
