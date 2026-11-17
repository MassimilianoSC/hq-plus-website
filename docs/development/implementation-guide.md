# Guida operativa e passaggio di consegne

Questa guida definisce dove intervenire e i controlli da rispettare quando si progetta
una nuova pagina o si modifica il sito HQ Plus. Il repository resta locale finché l’utente
non chiede esplicitamente un push o un deploy.

## Stato di riferimento

- Verifica locale del 17 novembre 2026: `npm run check`, `npm run format:check` e
  `npm run build` completano correttamente. `astro check` riporta 26 file, zero errori,
  avvisi o suggerimenti.
- In questa sessione il terminale usa Node `24.21.0`, mentre il repository richiede
  `22.23.4` (`.nvmrc` e `engines`); il build è riuscito, ma per la baseline supportata
  selezionare Node 22 prima di provare emulatori e Functions. Java `21.0.13` è installato.
- Marchio: HQ+ / HQ Plus. Il vecchio nome HQ Flow non va usato nei contenuti del sito.
- Stack: Astro statico, React per le sole isole interattive, Firebase Hosting e Functions.
- Route realizzate: homepage `/` e fallback `/404`. Il resto dei contenuti è organizzato
  come sezione della homepage.
- CSS: moduli per responsabilità, importati in sequenza esplicita da
  `apps/site/src/layouts/BaseLayout.astro`.
- Tema: light predefinito e dark alternativo; i token condivisi sono in
  `styles/foundation/tokens.css`.
- Background: un canvas cosmico condiviso, con movimento adattivo e fallback accessibili.
- 3D: Spline viene scaricato solo dopo la scelta “Carica esperienza 3D”; le preferenze di
  movimento ridotto disattivano la scena.
- Firebase client: nessuna scrittura Firestore diretta. Le raccolte `leads`, `demo_leads`
  e `rate_limits` negano l’accesso client; i flussi autorizzati passano dalle Functions.
- SEO: testi e strategia sono definiti dall’utente. Dominio, indicizzazione e pagine future
  restano decisioni editoriali/di rilascio.

## Struttura e responsabilità

```text
apps/site/
  public/                 File serviti senza trasformazioni (loghi, media, llms.txt)
  src/
    pages/                Route Astro; una pagina per percorso URL
    layouts/              HTML condiviso, head, tema, CSS e script globali
    components/
      brand/              Marchio e lockup
      layout/             Navigazione e footer
      sections/home/      Sezioni specifiche della homepage
      interactive/        Isole React con stato o lavoro client
      motion/             Componenti visivi animati riutilizzabili
    content/              Contenuti strutturati e relative regole
    lib/
      api/                Chiamate agli endpoint
      firebase/           Configurazione browser e token App Check on demand
      motion/             Effetti browser condivisi
    styles/
      foundation/         Tailwind, token tema, reset e accessibilità
      components/         Stili riutilizzabili dei componenti
      interactive/        Stili delle esperienze interattive
      motion/             Reveal, loading e animazioni testuali
      sections/home/      Hero e sezioni della homepage
      site/               Layout, atmosfera, navigazione e responsive
      utilities.css       Utility CSS condivise
functions/                Cloud Functions e dipendenze server
scripts/                  Strumenti eseguibili di progetto
docs/                      Architettura, sicurezza, brand e procedure
memory/                    PRD e decisioni di prodotto
firestore.rules            Regole di accesso Firestore per client
firebase.json              Hosting, rewrite, emulators e runtime
```

La UI non deve importare Firebase Admin o segreti. Astro rende l’HTML iniziale; usare
React solo quando la sezione ha bisogno di stato/eventi nel browser. Per contenuti
informativi preferire componenti Astro e markup statico.

## Come aggiungere una pagina

1. Definire con l’utente scopo, destinatari, URL, CTA, sezioni, prove e collegamenti.
2. Attendere i testi e i metadati SEO approvati: non inventare promesse, casi o metriche.
3. Creare la route in `apps/site/src/pages/` e comporla con layout e componenti per dominio.
4. Aggiornare navigazione, link interni, 404 e `apps/site/public/llms.txt` quando necessario.
5. Configurare title, description e canonical solo con valori approvati. Sitemap, robots e
   Open Graph si finalizzano dopo conferma di dominio, route e asset di condivisione.
6. Eseguire `npm run check`, `npm run build` e `npm run format:check`; rivedere le viste
   light/dark, desktop/mobile, tastiera e movimento ridotto.

Le route candidate e la loro finalità sono raccolte in `docs/project-context.md`; sono
proposte, non pagine già approvate.

## CSS, palette e componenti

- Aggiungere o cambiare i colori semantici in `foundation/tokens.css`, mantenendo i valori
  equivalenti nei temi light e dark. I componenti devono usare token `var(--...)`.
- Mettere regole globali solo in `foundation/`; componenti riutilizzabili in `components/`;
  homepage in `sections/home/`; esperienze demo in `interactive/`; comportamento responsive
  comune in `site/responsive.css`.
- Importare ogni nuovo foglio in `BaseLayout.astro` nel punto coerente con la cascata.
- Usare nomi di classe espliciti con prefisso del componente/sezione. Evitare selettori
  generici che alterano elementi non correlati e non duplicare la stessa regola con Tailwind
  e CSS custom.
- Conservare focus visibile, contrasto, breakpoints, `prefers-reduced-motion` e fallback
  senza JavaScript. Preferire transform e opacity per le animazioni.
- Verificare gli usi prima di rimuovere CSS, componenti o asset.

## Motion, 3D e prestazioni

- Mantenere un solo canvas decorativo globale. Ridurre densità, frequenza e parallasse su
  touch, Save-Data, schede nascoste e movimento ridotto.
- Far partire gli effetti solo mentre sono visibili; evitare filtri pesanti animati e lavoro
  continuo fuori viewport.
- Caricare librerie 3D e PDF al momento dell’uso. Spline deve restare dietro a un’azione
  esplicita dell’utente; non spostare il suo runtime nell’entry iniziale.
- Valutare ogni dipendenza e richiesta di rete in base a utilità, peso, cache e fallback.
  Animazioni decorative e fonti di dati locali non devono aggiungere chiamate al server.

## Asset e brand

- Conservare il file logo originale in `docs/brand/source/`; usare le varianti pubblicate in
  `apps/site/public/images/brand/` senza sfondo opaco.
- Asset raster del sito in WebP; vettoriali in SVG pulito. Usare `public/media/` per video,
  PDF e scene interattive. Non aggiungere duplicati o originali non utilizzati.
- Usare nomi descrittivi e stabili. Ogni immagine informativa deve avere testo alternativo
  fornito o approvato; immagini decorative devono avere `alt=""`.
- Quando cambiano route o anchor pubblici, ricontrollare link interni e `llms.txt`.

## Firebase e sicurezza

- `firebase.json` mappa `/submitLead`, `/extractDocument`, `/suggestAutomations` e
  `/submitDemoLead` alle Functions in `europe-west8`; nomi e payload sono contratti.
- Le Functions sono Node.js 22. Il progetto predefinito in `.firebaserc` è `hq-flow-dev`,
  identificativo tecnico esistente, non il nome pubblico del marchio.
- Tutte le scritture passano dalle Functions, che eseguono validazione, App Check, CORS,
  rate limit e scrittura Admin SDK. Non invocare direttamente le collezioni Firestore dal
  browser e non esporre chiavi private con prefisso `PUBLIC_`.
- Credenziali locali delle Functions stanno nei file `.secret.local`, esclusi da Git.
  Usare documenti sintetici: le chiamate a Vertex AI non sono interamente emulate.
- Le regole locali e i rewrite non dimostrano che il progetto remoto, i segreti o il dominio
  siano corretti. Verifiche remote si eseguono solo in un incarico esplicito di rilascio.

## SEO e rilascio

- La homepage è configurata `noindex` finché non sono valorizzati insieme
  `PUBLIC_SITE_URL` e `PUBLIC_ALLOW_INDEXING=true`. Non attivare indicizzazione su dominio
  provvisorio.
- Prima del rilascio l’utente deve confermare dominio, testi/title/description, URL finali,
  contatti societari e legali, immagini Open Graph e casi/metriche pubblicabili.
- Dopo tali conferme: aggiornare CORS per il dominio esatto, aggiungere sitemap e robots
  coerenti, controllare canonical e link, verificare i rewrite, poi richiedere approvazione
  esplicita per push e deploy.
- `llms.txt` documenta la mappa del sito per sistemi che la consumano; non sostituisce
  sitemap o robots e non va presentato come garanzia di ranking.

## Comandi PowerShell dalla radice

```powershell
# Dipendenze locali
npm install
npm run install:functions
npm run install:scripts

# Sito con hot reload (http://127.0.0.1:4321)
npm run dev

# Functions + Firestore emulator; UI su http://127.0.0.1:4000
npm run emulators

# Verifiche e build statica
npm run check
npm run format:check
npm run build
npm run preview

# Build e Firebase Hosting Emulator (http://127.0.0.1:5000)
npm run emulators:hosting

# Fermare il processo nel terminale attivo
Ctrl+C
```

Usare Node `22.23.4` e Java JDK `21+`. Per la pagina statica bastano `npm install` e
`npm run dev`; Java e gli emulatori servono per provare Functions, Firestore e rewrite.
Se la porta è occupata, chiudere il relativo server o scegliere consapevolmente la porta
alternativa mostrata dal comando.

## Punti ancora in attesa di input o intervento dedicato

- Dominio ufficiale, allowlist CORS definitiva e abilitazione dell’indicizzazione.
- Testi, strategia SEO, metadati e approvazione della mappa finale delle pagine.
- Dati privacy/legali e recapiti societari definitivi.
- Asset immagine Open Graph e generazione della sitemap dopo la conferma delle route.
- Revisione dell’audit npm backend: `nodemailer` ha segnalazioni high; l’audit attuale di
  npm non propone una correzione compatibile. Il workspace Functions ha 12 vulnerabilità
  runtime (1 high, 10 moderate, 1 low); il workspace root ha 19 moderate nella toolchain
  di sviluppo. Un aggiornamento major richiede revisione mirata del flusso email e verifica
  prima del rilascio.
- La build emette un avviso per chunk maggiori di 500 kB, riconducibili ai runtime opzionali
  Spline/3D. I moduli sono importati solo dopo l’azione esplicita; il loro peso non entra nel
  caricamento iniziale. Se l’esperienza 3D diventa centrale, riesaminare la scena e il budget.

Questi punti non impediscono di sviluppare e provare il sito in locale; vanno chiusi prima
di dichiarare pronto un rilascio pubblico.
