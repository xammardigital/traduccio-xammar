# traduccio-Xammar

A local, AI-powered translation tool optimized for Catalan, Spanish, and English.

## Features
- **Local-First**: Runs entirely on your machine via Ollama.
- **Salamandra Engine**: Uses the `Salamandra-7b-instruct` model optimized for translation.
- **Markdown Preservation**: Ensures `#`, `**`, and links are kept intact.
- **Memory Optimized**: Automatically unloads the model from VRAM when the app is minimized.

## Setup

### 1. Ollama
Ensure [Ollama](https://ollama.com) is installed and running.

### 2. Import the Model
Run the following command to create the model with our custom parameters:
```bash
ollama create salamandra-ta-7b -f Modelfile
```

### 3. Backend (Python)
Ensure you have Python 3.9+ installed.
```bash
# Activate virtual environment
source .venv/bin/activate
# Run the FastAPI server
python3 -m src-backend.main
```

### 4. Frontend (Tauri/Next.js)
```bash
# Install dependencies
npm install
# Run in development mode
npm run tauri dev
```

## Security
- API communication restricted to `127.0.0.1`.
- Built-in Markdown guardrails to prevent format escaping.
