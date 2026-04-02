from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .graph import app_graph
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

class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    mode: str = "NATURAL"

class TranslationResponse(BaseModel):
    translated_text: str
    detected_format: str
    status: str

@app.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    initial_state = {
        "original_text": request.text,
        "target_lang": request.target_lang,
        "mode": request.mode,
        "attempts": 0
    }
    
    try:
        final_state = app_graph.invoke(initial_state)
        return {
            "translated_text": final_state["translated_text"],
            "detected_format": final_state["detected_format"],
            "status": final_state["review_status"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/unload")
async def unload_model():
    # Ollama API to unload model: send a request with keep_alive=0
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": "salamandra-ta-7b", "keep_alive": 0}
            )
            return {"status": "unloaded"}
        except Exception as e:
            return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
