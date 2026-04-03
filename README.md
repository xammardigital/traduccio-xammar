# traducció-Xammar

Una eina de traducció local basada en IA, optimitzada per al català, l'espanyol i l'anglès.

## Característiques
- **Execució Local**: Funciona completament en la teva màquina mitjançant Ollama.
- **Motor Salamandra**: Utilitza el model `Salamandra-7b-instruct` optimitzat per a la traducció.
- **Preservació de Markdown**: Garanteix que els títols (`#`), negretes (`**`) i enllaços es mantinguin intactes.
- **Optimització de Memòria**: Allibera automàticament el model de la VRAM quan no s'utilitza o es demana manualment.
- **Control de Raonament**: Opció per activar o desactivar el procés de pensament de la IA.

## Instal·lació Ràpida (Recomanat)

Si tens Mac o Linux, el més fàcil és fer servir el nostre script d'automatització:

```bash
# 1. Clona el repositori i entra-hi
# 2. Executa l'script de llançament
./start.sh
```

Aquest script comprovarà si tens les dependències de Python i Node.js instal·lades i engegarà l'aplicació per tu.

---

## Instal·lació Manual

### 1. Ollama
Assegura't que [Ollama](https://ollama.com) estigui instal·lat i en funcionament.

### 2. Importar el Model
El motor principal d'aquesta aplicació és el model **Salamandra-7b-instruct**, un model optimitzat per a la traducció.

Pots descarregar-lo directament des d'Ollama:
```bash
ollama run hdnh2006/salamandra-7b-instruct
```

O si prefereixes crear la nostra versió personalitzada (opcional):
```bash
ollama create salamandra-ta-7b -f Modelfile
```

### 3. Arrencar el sistema

Tens dues maneres de fer anar l'aplicació:

#### A) Mode Desenvolupament (Ràpid)
Ideal si vols fer canvis al codi de Python o React i veure'ls al moment:
```bash
npm start
```

#### B) Mode App d'Escriptori (Sidecar)
Per provar l'aplicació tal com serà en producció, utilitzant el motor Python ja compilat:
```bash
npm run tauri dev
```

## 🧪 Verificació i Qualitat
Hem implementat una suite de tests automatitzada per garantir que la seguretat i la connectivitat del projecte són sempre 10/10:

```bash
./run_tests.sh
```

## 🏗️ Arquitectura i Seguretat
Aquest projecte segueix un enfocament de **seguretat Zero-Trust**:
- **Sidecar Isolation**: El motor de Python s'executa com un procés aïllat gestionat per Tauri.
- **Network Hardening**: El backend només accepta peticions des de `127.0.0.1`.
- **In-Memory Only**: Per privacitat, tota la traducció es processa a la memòria RAM/VRAM i no es genera cap log a disc (Zero-Log Policy).

## 🚀 Distribució
Per generar l'instal·lador final (`.dmg` o `.app` per a Mac):
```bash
npm run tauri build
```
L'executable resultant inclourà el motor de Python integrat, sense necessitat de dependències externes.

## Autoria i Crèdits

### Autors de l'Eina
Aquesta aplicació de traducció local ha estat desenvolupada per:
- **Abel Cabrerizo Cortés** ([abel.cabrerizo@xammardigital.cat](mailto:abel.cabrerizo@xammardigital.cat)) - **Xammar Digital**
- **Antigravity** (AI Coding Assistant by Google DeepMind)

### Autors del Model (Salamandra)
El motor de traducció utilitza el model **Salamandra-7b**, creat per la **Unitat de Tecnologies del Llenguatge del Barcelona Supercomputing Center (BSC)**.
- 📧 **Contacte BSC**: langtech@bsc.es
- © **Copyright**: Copyright(c) 2024 by Language Technologies Unit, Barcelona Supercomputing Center.

### Finançament i Suport
Aquest projecte es beneficia de la recerca finançada per:
- El **Govern de la Generalitat de Catalunya** a través del **Projecte Aina**.
- El Ministerio para la Transformación Digital y de la Función Pública (Projecte ILENIA) - Finançat per la Unió Europea (**NextGenerationEU**).

### Agraïments Especials
Volem expressar el nostre agraïment especial a **Henry Navarro** per la seva feina de quantització del model Salamandra-7b-instruct mitjançant `llama.cpp`.
- 🌐 **Web**: [henrynavarro.org](https://henrynavarro.org)
- 📧 **Email**: contact@henrynavarro.org

## Avis Legal (Disclaimer)
Tingueu en compte que el model pot contenir biaixos o altres distorsions no intencionades. Com a propietari i creador del model, el Barcelona Supercomputing Center no es fa responsable dels resultats derivats de l'ús per part de tercers. L'ús d'aquesta eina implica la responsabilitat de l'usuari final en la mitigació de riscos i el compliment de la normativa vigent en matèria d'Intel·ligència Artificial.

## Seguretat
- La comunicació amb l'API està restringida a `127.0.0.1`.
- Proteccions de Markdown integrades per evitar deformacions del format original.

## Nota sobre els Models de Raonament
Els models dissenyats específicament per a raonament (com la sèrie R1 o similars) seguiran realitzant el seu procés de pensament intern encara que l'opció de "Raonament" estigui en OFF a la interfície. Això és inherent a la seva arquitectura i pot fer que la traducció trigui més temps del que és habitual en models estàndard.
