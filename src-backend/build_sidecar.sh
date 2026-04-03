#!/bin/bash

# Script de construcció per al Sidecar de traducció-Xammar
# Aquest script genera un executable de Python compatible amb Tauri.

PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/src-backend"
BINARIES_DIR="$PROJECT_ROOT/src-tauri/binaries"
TARGET_TRIPLE="aarch64-apple-darwin"

echo "--------------------------------------------------"
echo "🚀 Generant Sidecar per a $TARGET_TRIPLE..."
echo "--------------------------------------------------"

# Activar entorn virtual
source .venv/bin/activate

# 1. Netejar versions anteriors
rm -rf build dist

# 2. Executar PyInstaller
# --onefile: genera un únic binari
# --name: el nom ha d'incloure el TARGET_TRIPLE per a Tauri
# --collect-all: assegura que FastAPI i les seves dependències s'empaquetin
# --hidden-import: dependències que PyInstaller pot no detectar
./.venv/bin/pyinstaller --onefile \
    --name "main-$TARGET_TRIPLE" \
    --collect-all fastapi \
    --collect-all uvicorn \
    --collect-all httpx \
    --collect-all langgraph \
    --collect-all langchain_ollama \
    --hidden-import pydantic \
    --hidden-import uvicorn.logging \
    --hidden-import uvicorn.loops.auto \
    --hidden-import uvicorn.protocols.http.auto \
    --hidden-import uvicorn.protocols.websockets.auto \
    --hidden-import uvicorn.lifespan.on \
    --workpath build \
    --distpath "$BINARIES_DIR" \
    "$BACKEND_DIR/main.py"

echo "--------------------------------------------------"
echo "✅ Sidecar generat a: $BINARIES_DIR/main-$TARGET_TRIPLE"
echo "--------------------------------------------------"
