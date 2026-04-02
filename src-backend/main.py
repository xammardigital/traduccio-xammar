from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph import app_graph
import httpx

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to 127.0.0.1 in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import httpx

class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    mode: str = "NATURAL"
    model: str = "salamandra-ta-7b"
    use_reasoning: bool = True

class TranslationResponse(BaseModel):
    translated_text: str
    detected_format: str
    status: str

# Startup hook to check dependencies
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print("🚀 truducción-Xammar Backend")
    print("="*50)
    
    # Check Ollama
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://127.0.0.1:11434/api/tags", timeout=2.0)
            if response.status_code == 200:
                print("✅ [Ollama] Connectat correctament")
            else:
                print("⚠️ [Ollama] Resposta inesperada: {response.status_code}")
        except Exception:
            print("\n❌ [ERROR] No s'ha pogut connectar amb Ollama!")
            print("👉 Assegura't que Ollama està instal·lat i OBERT.")
            print("👉 Descarrega'l a: https://ollama.com\n")

@app.get("/models")
async def get_models():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://127.0.0.1:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m['name'] for m in data.get('models', [])]
                print(f"--- [Ollama] Models detectats: {len(models)} ---")
                for m in models: print(f"  > {m}")
                return models
            return ["salamandra-ta-7b:latest"]
    except Exception as e:
        print(f"--- [Ollama] Error al detectar models: {e} ---")
        return ["salamandra-ta-7b:latest"]

import json
from fastapi.responses import StreamingResponse
from langchain_ollama import OllamaLLM
from graph import get_profile

@app.post("/translate")
async def translate(request: TranslationRequest):
    async def generate():
        # Get Mode params
        profile = get_profile(request.mode)
        
        # Conditional system prompt
        reasoning_instruction = (
            f"RULE: If you reason, do it INSIDE <think></think> tags. "
            f"Outside tags, write ONLY the final translation."
            if request.use_reasoning else 
            "Provide ONLY the final translation. Do not include explanations or reasoning."
        )

        llm = OllamaLLM(
            model=request.model, 
            base_url="http://127.0.0.1:11434",
            keep_alive=300,
            system=f"{profile['system']}\n{reasoning_instruction}",
            **profile["params"]
        )
        
        # Map short codes
        lang_map = {"ESP": "Espanyol (Castellà)", "CAT": "Català", "ENG": "Anglès"}
        target = lang_map.get(request.target_lang, request.target_lang)
        
        full_prompt = f"Translate to {target}:\n{request.text}"
        
        # Stream from LLM
        for chunk in llm.stream(full_prompt):
            yield f"data: {json.dumps({'content': chunk})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

class UnloadRequest(BaseModel):
    model: str

@app.post("/unload")
async def unload_model(request: UnloadRequest):
    # Ollama API to unload model: send a request with keep_alive=0
    target_model = request.model
    async with httpx.AsyncClient() as client:
        try:
            print(f"--- [Ollama] Alliberant model: {target_model} ---")
            await client.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": target_model, "keep_alive": 0}
            )
            return {"status": "unloaded", "model": target_model}
        except Exception as e:
            print(f"--- [Ollama] Error en alliberar {target_model}: {e} ---")
            return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
