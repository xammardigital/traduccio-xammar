# 🛡️ Guies de Seguretat i Dependències per a IA

Aquest document defineix les polítiques de seguretat obligatòries per al desenvolupament d'aquest projecte. La IA ha de validar qualsevol suggeriment de codi o configuració seguint aquestes regles.

## 1. Gestió de Dependències (Seguretat en la Cadena de Subministrament)
- **Versions Exactes:** Està prohibit l'ús de rangs (`^` o `~`). Totes les dependències s'han de declarar amb la seva versió exacta per evitar actualitzacions malicioses automàtiques.
- **Quarantena de Paquets:** No instal·lis ni suggereixis versions de llibreries publicades fa menys de 24 hores.
- **Bloqueig d'Scripts:** S'ha d'evitar l'execució d'scripts d'instal·lació. La IA ha de prioritzar ordres amb la flag `--ignore-scripts`.
- **Preferència de Gestor:** Utilitzar `pnpm` per defecte, ja que bloqueja els hooks d'instal·lació (`preinstall`, `postinstall`) de forma nativa.

## 2. Configuració de l'Entorn (.npmrc)
Qualsevol fitxer `.npmrc` generat o modificat ha d'incloure aquestes proteccions:

```ini
# Desactivar scripts de dependències de tercers
ignore-scripts=true

# Desar sempre la versió exacta en instal·lar
save-exact=true

# Temps mínim de publicació (1440 min = 24 hores)
min-release-age=1440
```

## 3. Prevenció d'Exfiltració de Dades
- **Variables d'Entorn:** Mai posis credencials directament al codi (hardcoding). Valida que els fitxers `.env` estiguin sempre al `.gitignore`.
- **Revisió de Paquets:** Abans d'afegir una dependència nova, avalua si la seva funcionalitat es pot resoldre amb codi natiu (Node.js/Web APIs) per reduir la superfície d'atac.
- **Connexions Externes:** Desconfia de llibreries que sol·licitin accés a xarxa o variables d'entorn durant la fase de construcció o instal·lació.

## 4. Auditoria Contínua
- Cada vegada que s'afegeixi una dependència, s'ha d'executar una ordre d'auditoria: `pnpm audit` o `npm audit`.
- Les dependències de Python s'han de revisar periòdicament amb `pip-audit`.

## 5. Protocols de Privacitat de traducció-Xammar
Aquest projecte neix amb la premissa de la privacitat absoluta de l'usuari:

- **Local-First Execució:** Totes les dades de text enviades per a traducció es processen a la memòria local (RAM/VRAM) de l'usuari mitjançant Ollama. Mai s'envien a servidors externs.
- **Zero Telemetria:** L'aplicació no recull cap tipus d'estadística d'ús, adreça IP o mètrica de rendiment que s'enviï a tercers.
- **Micro-serveis Aïllats:** El backend de Python (FastAPI) només escolta peticions des de `127.0.0.1`. Qualsevol intent de connexió des d'una IP externa és bloquejat automàticament pel sistema de xarxa local.
- **CSP Estricta:** La interfície d'usuari només té permís per connectar-se al backend local, evitant atacs de cross-site scripting (XSS) que puguin exfiltrar dades.