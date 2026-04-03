# 📋 Informe de Disseny Tècnic i Arquitectura: traducció-Xammar

**Data**: 3 d'abril de 2026
**Àrea**: Seguretat d'Aplicacions i IA Local
**Autors**: Abel Cabrerizo Cortés (Xammar Digital) & Antigravity AI

---

## 1. Resum Executiu
`traducció-Xammar` és una aplicació de traducció local-first que prioritza la privacitat de les dades i la seguretat de l'usuari. L'arquitectura es basa en un model de seguretat **Zero-Trust**, on totes les comunicacions són locals i descrites mitjançant polítiques estrictes d'origen i contingut.

## 2. Stack Tecnològic
L'aplicació utilitza una pila tecnològica moderna de 3 capes per garantir un rendiment òptim i un aïllament de processos:

- **Desktop Framework**: [Tauri v2 (Rust)](https://tauri.app/). Proporciona el contenidor de l'aplicació, gestionant el cicle de vida del backend com un Sidecar i aplicant polítiques de seguretat a nivell de OS.
- **Frontend**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/). Una interfície reactiva i lleugera estilitzada amb **Tailwind CSS**.
- **Backend (Sidecar)**: [FastAPI (Python 3.9)](https://fastapi.tiangolo.com/). Un servidor asíncron d'alt rendiment que actua com a pont entre la UI i el motor d'IA.
- **Motor d'IA**: [Ollama](https://ollama.com/) amb el model **Salamandra-7b**, optimitzat pel BSC i quantitzat per Henry Navarro.

### 2.1 Diagrama de Flux de Dades (Data Flow)
A continuació es detalla com viatja la informació des de la interacció de l'usuari fins a l'execució del model:

```mermaid
graph TD
    User["Interacció Usuari (App.tsx)"] -->|Fetch API (127.0.0.1:8000)| Backend["FastAPI Sidecar (main.py)"]
    Backend -->|LangChain Streaming| Ollama["Ollama Engine (Local)"]
    Ollama -->|Salamandra-7b (VRAM)| Translate["Generació de Text"]
    Translate -->|Stream Response| Backend
    Backend -->|SSE (Server-Sent Events)| UI["Previsualització UI (React)"]
    
    subgraph "Capes de Seguretat"
        Backend -.- CORS["Strict CORS Whitelist"]
        UI -.- CSP["Strict CSP Policy"]
    end
```

## 3. Arquitectura de Seguretat (Zero-Trust)

### 3.1 Aïllament de Xarxa
L'ús de Python com a **Sidecar** binari permet un control total sobre la xarxa:
- **Binding**: El servidor s'enllaça exclusivament a la interfície de loopback IPv4 (`127.0.0.1`). No hi ha exposició a `0.0.0.0`.
- **CORS (Cross-Origin Resource Sharing)**: Whitelist estricta limitada exclusivament a l'origen de producció de Tauri (`tauri://localhost`) i l'entorn de dev autoritzat.
- **CSP (Content Security Policy)**: Implementada a `tauri.conf.json` per evitar l'exfiltració de dades. Només es permeten connexions `connect-src` a les adreces internes de l'aplicació.

### 3.2 Integritat de la Cadena de Subministrament (Supply Chain)
- **Locking de versions**: Totes les dependències de `package.json` utilitzen versions exactes per evitar atacs per substitució de paquets.
- **Script Blocking**: Configuració de `.npmrc` amb `ignore-scripts=true` per evitar l'execució de codi natiu maliciós durant la instal·lació de dependències.
- **Build Hermètic**: El backend Python es compila mitjançant `PyInstaller` en un binari standalone, evitant la necessitat de dependències de Python a la màquina de l'usuari final.

## 4. Gestió d'Errors i Resiliència

### 4.1 Fallback de Dependències
L'aplicació implementa una capa de verificació d'estat (health check) en el muntatge del component principal (`App.tsx`):
- **Models Check**: Es realitza un `GET /models` al backend. Si la connexió falla (Sidecar no actiu) o el backend no pot parlar amb Ollama, es mostra una interfície d'error crítica ("Dependències No Trobades") que bloqueja l'ús fins a la resolució.

### 4.2 Cicle de Vida del Sidecar
Tauri és el responsable de l'orquestració dels processos:
- **Spawning**: El binari Python s'inicia durant el `setup` del core de Rust.
- **Auto-Cleanup**: En tancar l'App, Tauri s'assegura de matar el procés fill del Sidecar per evitar processos zombis i alliberar el port 8000.

## 5. Flux de Dades i Privacitat

### 5.1 Política de Zero-Log
Per disseny, `traducció-Xammar` no persisteix cap informació a disc:
- **In-Memory Only**: El text enviat es processa a la memòria RAM/VRAM i s'esborra immediatament després del streaming.
- **No Logs**: Tant FastAPI com Uvicorn estan configurats per emetre logs només per `STDOUT` (visualitzables en consola durant el desenvolupament), però no es generen fitxers de registre al sistema operatiu.

## 6. Estratègia de Verificació Automàtica (QA)
Per garantir la sostenibilitat i el blindatge de la solució, s'ha implementat una suite de tests automatitzada (`pytest`):

- **Regressió de CORS (`test_cors.py`)**: S'audita automàticament cada build per assegurar que el binding a `127.0.0.1` no s'obre accidentalment a orígens externs.
- **Integració d'Endpoints (`test_endpoints.py`)**: Verificació del camí crític UI-Sidecar mitjançant moking asíncron, garantint la disponibilitat dels serveis fins i tot sense connexió amb Ollama.
- **Test de Càrrega de Streaming (`test_load.py`)**: Micro-test de concurrència asíncrona per validar que l'App suporta múltiples peticions de traducció sense bloqueig de xarxa.

### 6.1 Execució de Qualitat
L'enginyer de revisió pot executar el protocol de qualitat següent:
```bash
./run_tests.sh
```
Aquest script garanteix que el codi segueix complint amb els estàndards de **Xammar Digital** abans de qualsevol nou desplagament.

---

**Signat**,
*Abel Cabrerizo Cortés*
Xammar Digital
