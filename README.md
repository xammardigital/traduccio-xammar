# traducció-Xammar

Una eina de traducció local basada en IA, optimitzada per al català, l'espanyol i l'anglès.

## Característiques
- **Execució Local**: Funciona completament en la teva màquina mitjançant Ollama.
- **Motor Salamandra**: Utilitza el model `Salamandra-7b-instruct` optimitzat per a la traducció.
- **Preservació de Markdown**: Garanteix que els títols (`#`), negretes (`**`) i enllaços es mantinguin intactes.
- **Optimització de Memòria**: Allibera automàticament el model de la VRAM quan no s'utilitza o es demana manualment.
- **Control de Raonament**: Opció per activar o desactivar el procés de pensament de la IA.

## Configuració

### 1. Ollama
Assegura't que [Ollama](https://ollama.com) estigui instal·lat i en funcionament.

### 2. Importar el Model
Executa la següent comanda per crear el model amb els nostres paràmetres personalitzats:
```bash
ollama create salamandra-ta-7b -f Modelfile
```

### 3. Servidor Backend (Python)
Assegura't de tenir Python 3.9 o superior instal·lat.
```bash
# Activa l'entorn virtual
source .venv/bin/activate
# Executa el servidor FastAPI
python3 src-backend/main.py
```

### 4. Interfície d'Usuari (Tauri/Vite)
```bash
# Instal·la les dependències
npm install
# Executa en mode desenvolupament
npm run dev
```

## Seguretat
- La comunicació amb l'API està restringida a `127.0.0.1`.
- Proteccions de Markdown integrades per evitar deformacions del format original.

## Nota sobre els Models de Raonament
Els models dissenyats específicament per a raonament (com la sèrie R1 o similars) seguiran realitzant el seu procés de pensament intern encara que l'opció de "Raonament" estigui en OFF a la interfície. Això és inherent a la seva arquitectura i pot fer que la traducció trigui més temps del que és habitual en models estàndard.
