# Architettura del sito HQ Plus

## Confini

- `apps/site` contiene il sito Astro, le pagine, i componenti UI e il client Firebase.
- `functions` contiene le Cloud Functions e mantiene il proprio `package.json` e lockfile per il deploy Firebase.
- `firestore.rules` e `firestore.indexes.json` restano configurazioni indipendenti del database.
- `scripts` contiene strumenti di progetto, per esempio la generazione del PDF di esempio.
- `docs` contiene procedure e decisioni; il README alla radice rimane una guida rapida.

## Rendering

Astro genera HTML statico. Navigazione, hero e sezioni informative sono HTML senza
hydration React. Restano tre isole interattive: esperienza 3D, demo documentale e form
contatti. Il contenuto principale è presente nell'HTML anche senza JavaScript.

La scena Spline usa un'importazione lazy e viene scaricata solo quando l'utente seleziona
“Carica esperienza 3D”; `prefers-reduced-motion` lascia attivo il segnaposto e non carica
la scena. Un unico canvas decorativo, gestito da `src/lib/motion/cosmicField.js`, disegna
stelle, nebulose e brevi transizioni tra le sezioni con i colori del tema HQ+. Non richiede
immagini o chiamate di rete aggiuntive. Limita il numero di stelle per schermo, la densità
dei pixel e la frequenza dei fotogrammi; sui dispositivi touch usa valori più leggeri.
La parallasse del puntatore è attiva solo con puntatore preciso. Il movimento si ferma con
`prefers-reduced-motion`, `Save-Data` o quando la scheda è nascosta. Le sezioni mantengono
fondi leggibili e variazioni cromatiche locali; gli effetti hover sono limitati ai puntatori
precisi. Le idee AI della demo richiedono un'azione esplicita dopo l'estrazione.

Il client Firebase/App Check viene caricato e inizializzato solo alla prima richiesta
protetta; il rinnovo automatico resta disattivato durante l'attesa. I rewrite Firebase per
i form e la demo non cambiano: le richieste partono solo dopo invio del form, estrazione del
documento o scelta esplicita degli spunti AI.

Il tema chiaro è predefinito. Entrambi i temi usano la palette HQ+ blu/viola; il tema
scuro aggiunge superfici navy e una variante trasparente del lockup con tagline chiara.
La scelta viene salvata in `localStorage` e applicata prima del rendering della pagina.

Il canvas dello sfondo è un livello condiviso dal layout, quindi non viene creato un canvas
per sezione. Il listener `scroll` passivo aggiorna solo la posizione letta dal ciclo grafico;
il puntatore modifica il campo con una parallasse lieve. `IntersectionObserver` seleziona la
sezione attiva e attiva una breve transizione radiale, con frequenza limitata. In modalità
statica il canvas conserva stelle e nebulose ma non anima il campo. I dispositivi touch usano
meno stelle, risoluzione ridotta e nessun effetto al puntatore.

## Dipendenze tra moduli

Le animazioni del diagramma HQ+ usano Motion Mini nel modulo
`src/lib/motion/integrationMotion.js`. L'HTML e gli SVG dell'hero sono renderizzati da Astro;
Motion anima gli elementi nel browser senza idratare React. Un `IntersectionObserver` avvia
e ferma le orbite quando il diagramma entra o esce dalla viewport. Il modulo rispetta
movimento ridotto, risparmio dati e schede nascoste.

Le pagine compongono layout e sezioni. I componenti chiamano le funzioni in `src/lib/api`
e usano il client Firebase solo per App Check. Le Cloud Functions restano l'autorità per
validazione, limiti e accesso ai servizi server. Il browser non deve contenere credenziali
server né introdurre nuove scritture Firestore dirette.

## Asset e contenuti

- Loghi, icone e illustrazioni vettoriali: `apps/site/public/images/brand` e cartelle
  tematiche dedicate.
- Immagini raster pubblicate: WebP; vettoriali: SVG ottimizzato.
- Video e scene interattive: `apps/site/public/media`.
- Contenuti editoriali strutturati: `apps/site/src/content`.

## llms.txt pubblico

apps/site/public/llms.txt viene pubblicato come /llms.txt. È una mappa concisa delle
pagine e sezioni pubbliche: aggiornarlo insieme alle route e agli anchor. Non sostituisce
robots.txt o una sitemap e non va presentato come tecnica per aumentare il ranking Google.
Riferimenti: https://llmstxt.org/ e
https://developers.google.com/search/docs/fundamentals/ai-optimization-guide.

## Invarianti di manutenzione

Gli interventi sul sito non devono cambiare nomi, payload o protezioni degli endpoint
Firebase. App Check, allowlist CORS, validazione server, rate limit e anonimizzazione IP
richiedono una revisione di sicurezza separata. Le regole Firestore negano l’accesso client
alle raccolte lead e rate-limit; i flussi autorizzati usano le Cloud Functions e Admin SDK.
Il progetto Firebase predefinito resta quello configurato in `.firebaserc`.
