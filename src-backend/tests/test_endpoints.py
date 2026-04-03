import pytest
from fastapi.testclient import TestClient
import sys
import os
from unittest.mock import MagicMock, patch

# Append src-backend to path
sys.path.append(os.path.join(os.getcwd(), 'src-backend'))
from main import app

client = TestClient(app)

def test_get_models_success():
    """Verifica que l'endpoint /models retorna una llista vàlida quan Ollama respon."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"models": [{"name": "salamandra-ta-7b"}]}

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        response = client.get("/models")
        assert response.status_code == 200
        assert "salamandra-ta-7b" in response.json()

def test_get_models_failure_fallback():
    """Verifica que /models retorna un fallback si Ollama està apagat."""
    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection Refused")):
        response = client.get("/models")
        assert response.status_code == 200
        # El nostre backend retorna ['salamandra-ta-7b:latest'] com a fallback
        assert "salamandra-ta-7b:latest" in response.json()

def test_translate_streaming_structure():
    """Verifica que l'endpoint /translate retorna un stream correcte (Mocked)."""
    # Mock de LangChain stream
    mock_stream = ["Això ", "és ", "una ", "prova."]
    
    with patch("langchain_ollama.OllamaLLM.stream", return_value=mock_stream):
        response = client.post(
            "/translate",
            json={
                "text": "This is a test.",
                "target_lang": "CAT",
                "mode": "NATURAL",
                "model": "salamandra-ta-7b",
                "use_reasoning": False
            }
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
        # Verifiquem fragments del stream
        assert "data: " in response.text
        assert "Això" in response.text

@pytest.mark.asyncio
async def test_unload_model_success():
    """Verifica l'alliberament de memòria VRAM."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    
    with patch("httpx.AsyncClient.post", return_value=mock_response):
        response = client.post("/unload", json={"model": "salamandra-ta-7b"})
        assert response.status_code == 200
        assert response.json()["status"] == "unloaded"
