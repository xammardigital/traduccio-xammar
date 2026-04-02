#!/bin/bash

# Script de llançament per a traducció-Xammar
# Aquest script instal·la les dependències i engega tot el sistema.

echo "=========================================="
echo "🚀 Iniciant traducció-Xammar..."
echo "=========================================="

# 1. Comprovar si tenim l'entorn virtual de Python
if [ ! -d ".venv" ]; then
    echo "📦 Creant entorn virtual de Python..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# 2. Instal·lar dependències de Node si no estan
if [ ! -d "node_modules" ]; then
    echo "📦 Instal·lant dependències de Node.js..."
    npm install
fi

# 3. Informar sobre Ollama
echo "🧠 Recorda tenir Ollama obert i el model carregat!"
echo "   Si encara no ho has fet: ollama create salamandra-ta-7b -f Modelfile"

# 4. Engegar amb un sol comando
echo "⚡ Llançant aplicació..."
npm start
