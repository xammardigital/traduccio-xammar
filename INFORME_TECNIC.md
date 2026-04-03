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

## 4. Flux de Dades i Privacitat
1. L'usuari introdueix text a la UI (React).
2. La petició es transmet de forma xifrada pel bridge de Tauri (IPC) cap al Backend Sidecar (FastAPI).
3. El Sidecar utilitza el protocol de streaming (SSE) per comunicar-se amb Ollama localment.
4. **Data Sovereignty**: Cap fragment de text o metadada surt mai de l'estació de treball de l'usuari cap a internet.

## 5. Dependències Crítiques

### Frontend (npm)
- `@tauri-apps/api`: Comunicació segura amb el core de Tauri.
- `react-markdown`: Renderitzat segur de contingut.
- `lucide-react`: Iconografia de codi lliure.

### Backend (Python)
- `fastapi`: Framework API.
- `langgraph`: Orquestració de la lògica de traducció.
- `langchain-ollama`: Integració oficial amb el motor LLM.
- `pyinstaller`: Envasat i blindatge del binari del Sidecar.

---

**Signat**,
*Abel Cabrerizo Cortés*
Xammar Digital
