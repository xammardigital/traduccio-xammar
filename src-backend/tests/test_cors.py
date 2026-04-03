import pytest
from fastapi.testclient import TestClient
import sys
import os

# Append src-backend to path
sys.path.append(os.path.join(os.getcwd(), 'src-backend'))
from main import app

client = TestClient(app)

def test_cors_allowed_origin():
    """Verifica que l'aplicació permet peticions des d'orígens autoritzats."""
    allowed_origin = "http://127.0.0.1:5173"
    response = client.options(
        "/models",
        headers={
            "Origin": allowed_origin,
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == allowed_origin

def test_cors_disallowed_origin():
    """Verifica que l'aplicació REBUTJA peticions des d'orígens NO autoritzats (Evil Agent)."""
    evil_origin = "http://evil-attacker.com"
    response = client.options(
        "/models",
        headers={
            "Origin": evil_origin,
            "Access-Control-Request-Method": "GET",
        }
    )
    # En FastAPI, CORSMiddleware no afegeix la capçalera si l'origen no és a la whitelist
    assert response.headers.get("access-control-allow-origin") is None or response.status_code != 200

def test_cors_tauri_origin_allowed():
    """Verifica que l'origen natiu de Tauri està permès."""
    tauri_origin = "tauri://localhost"
    response = client.options(
        "/models",
        headers={
            "Origin": tauri_origin,
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == tauri_origin
