# Contesto progetto — HQ Plus

Documento di passaggio per chi progetta, scrive o sviluppa il sito. Leggerlo prima di
iniziare una nuova pagina o modificare gli stili. È un riferimento di contesto e non
sostituisce le istruzioni dell’utente, la guida di sviluppo o i controlli di sicurezza.

Ultima ricognizione del repository: 17 novembre 2026.

## Identità e obiettivo

- Marchio pubblico: **HQ+**; nome per esteso: **HQ Plus**.
- Descrittore attuale: **AI System Integrator**.
- HQ Flow è un nome precedente e non va usato come marchio.
- Il sito presenta l’integrazione di software, dati e AI nei processi aziendali e raccoglie
  richieste commerciali.
- L’italiano è la lingua corrente. Lingue aggiuntive e relativa struttura URL non sono
  ancora state decise.
- Light è il tema principale; dark è il tema alternativo. Entrambi usano la famiglia di
  colori blu e viola del logo HQ+.
- Il logo vettoriale originale è in `docs/brand/source/`; le varianti trasparenti per i
  temi sono in `apps/site/public/images/brand/`.

## Ruoli e confini editoriali

- L’utente definisce strategia SEO, parole chiave, testi, titoli, descrizioni e affermazioni
  commerciali. Non inventare o riscrivere questi contenuti senza richiesta.
- Chi sviluppa prepara struttura delle pagine, componenti, campi e metadati tecnici usando
  i contenuti forniti dall’utente.
- Non inventare numeri di risparmio o ROI, certificazioni, clienti, casi o capacità di
  prodotto. Le affermazioni e le prove commerciali devono essere fornite o confermate
  dall’utente.
- Prima di creare nuove route, approvare insieme mappa del sito, obiettivo e contenuti
  richiesti per ciascuna pagina.

## Stato attuale del sito

- Astro genera HTML statico; React è riservato alle isole interattive.
- Le route presenti sono `/` e `/404`. Servizi, casi, demo e contatti sono al momento
  sezioni o ancore della homepage, non pagine autonome.
- La homepage contiene hero, origine e credibilità del gruppo, metodo di lavoro, demo
  documentale, casi d’uso, FAQ e contatto.
- La mappa del hero visualizza email, documenti, CRM e gestionali collegati al nucleo HQ+.
- La scena Spline è intenzionalmente caricata solo dopo una scelta esplicita dell’utente.
- La palette, il tema doppio, il logo trasparente e il campo cosmico sono già presenti.
  Il CSS è stato suddiviso in fogli per fondazioni, componenti, movimento, sezioni e layout; la
  sitemap e le pagine autonome restano da approvare.

### Possibile mappa delle pagine — proposta, da approvare

Queste sono ipotesi di organizzazione, non route già approvate o presenti:

| Route candidata | Scopo                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| `/`             | Presentare HQ+, il valore offerto e i percorsi principali.                  |
| `/servizi/`     | Spiegare le aree di integrazione e automazione definite dall’utente.        |
| `/casi/`        | Mostrare casi verificati, con dati e autorizzazioni confermati.             |
| `/azienda/`     | Raccontare origine, gruppo e credibilità con contenuti approvati.           |
| `/demo/`        | Dare spazio alla demo documentale e spiegarne il funzionamento.             |
| `/contatti/`    | Raccogliere richieste con il form esistente o una sua evoluzione approvata. |
| `/risorse/`     | Valutare in futuro solo se viene pianificata una sezione editoriale.        |

Per ogni pagina, prima di sviluppare, compilare una scheda con: scopo, pubblico, URL,
azione principale, sezioni, testi forniti, CTA, collegamenti interni, asset, interazioni,
metadati SEO forniti dall’utente, vincoli accessibili e criteri di completamento. Non
pubblicare pagine vuote o con testi segnaposto.

## Struttura CSS attuale e regole

Il CSS è ora suddiviso per responsabilità sotto apps/site/src/styles/. I fogli sono importati
in modo esplicito da BaseLayout.astro, nell’ordine necessario per mantenere la cascata.

    styles/
      foundation/       Tailwind, token dei temi, base HTML e accessibilità
      components/       effetti, logo, pulsanti e controlli
      interactive/      dettagli grafici della demo
      motion/           reveal, digitazione e stati di caricamento
      sections/home/    hero e marquee
      site/             atmosfera, sfondi delle sezioni, layout e responsive
      utilities.css     utility condivise

- Aggiungere token di colore e superficie in foundation/tokens.css; evitare valori di tema
  hardcoded nei singoli componenti.
- Tenere regole condivise in components/; quelle specifiche della homepage in
  sections/home/; quelle della demo in interactive/.
- Usare prefissi di classe per componente o sezione. Evitare selettori generici che modificano
  elementi in altre parti del sito.
- Non duplicare regole Tailwind e CSS per la stessa responsabilità.
- Mantenere il contrasto dei due temi, i focus visibili e le eccezioni per movimento ridotto.
- Quando si aggiunge un file CSS, importarlo nel punto coerente con la cascata in
  BaseLayout.astro e verificare build e viste light/dark.
- Prima di rimuovere una regola o un asset, cercarne tutti gli usi nel codice e nel markup.

## Regole per movimento e grafica

- Usare la galassia come atmosfera leggera; il movimento principale deve spiegare i flussi
  di integrazione e non competere con testo o CTA.
- Mantenere un solo canvas di sfondo condiviso. Non crearne uno per ogni sezione.
- Motion Mini è già usato nel diagramma del hero. Avviare animazioni solo quando visibili
  e fermarle fuori viewport, con scheda nascosta, risparmio dati o movimento ridotto.
- Preferire animazioni di `transform` e opacità; evitare cicli costosi su layout e grandi
  filtri sfocati continui.
- Le animazioni decorative non devono nascondere contenuti se JavaScript è disabilitato.
- Rispettare `prefers-reduced-motion`; su mobile ridurre densità, profondità e movimento.
- Non introdurre una nuova libreria di animazione o una scena 3D senza motivazione,
  controllo del peso e comportamento di fallback.

## Asset e prestazioni

- Immagini raster pubblicate in WebP, vettoriali in SVG ottimizzato.
- Conservare gli originali forniti in `docs/brand/source/`; non sovrascriverli.
- Asset di brand in `apps/site/public/images/brand/`, fondali in
  `apps/site/public/images/backgrounds/`, media interattivi in `apps/site/public/media/`.
- Dare nomi descrittivi agli asset e non caricare file non usati nel sito.
- Caricare scene 3D o dipendenze pesanti solo su richiesta o al momento d’uso.
- Ogni nuova richiesta di rete deve corrispondere a un’azione utente e avere uno scopo
  documentato. La grafica decorativa resta locale.

## Firebase e sicurezza

- Sito statico pubblicato in `apps/site/dist` tramite Firebase Hosting.
- Cloud Functions Node.js 22 in `europe-west8`; le quattro route Hosting devono continuare
  a corrispondere a `submitLead`, `extractDocument`, `suggestAutomations` e `submitDemoLead`.
- Il progetto selezionato in `.firebaserc` è `hq-flow-dev`: è un identificativo tecnico
  esistente, non il nome pubblico del marchio. Non rinominarlo o migrare il progetto in un
  refactor visivo.
- I form e la demo usano le Functions. Non introdurre nuove scritture Firestore dal client.
- Conservare App Check, CORS, validazione server, rate limit, anonimizzazione IP e
  segreti server-side. Le variabili `PUBLIC_*` sono pubbliche.
- `.firebaserc`, `firebase.json`, funzioni e regole locali permettono di verificare gli
  abbinamenti di configurazione, ma non dimostrano lo stato remoto di Firebase. Non
  dichiarare verificati deployment, dominio, secrets o località del database senza
  controllo autenticato del progetto.
- `firestore.rules` nega l’accesso client a `leads`, `demo_leads` e `rate_limits`. Le
  Functions mantengono l’invio e scrivono con Admin SDK; non reintrodurre scritture dirette
  dal browser, perché aggirerebbero validazione e rate limit HTTP.
- Il dominio definitivo non è stato confermato: prima del rilascio aggiornare la allowlist
  CORS e le configurazioni che dipendono dall’origine effettiva.

## SEO tecnico e pubblicazione

- L’utente fornisce strategia e testi. Le implementazioni possono occuparsi di title,
  description, canonical, Open Graph, sitemap, robots e dati strutturati usando i valori
  approvati, senza inventare il contenuto.
- `BaseLayout.astro` ha già campi per title e description, canonical condizionale e robots.
  `PUBLIC_SITE_URL` è vuoto e `PUBLIC_ALLOW_INDEXING=false` nell’esempio: il sito resta
  `noindex` finché dominio e indicizzazione non vengono abilitati esplicitamente.
- Sitemap, `robots.txt`, immagine Open Graph e schema strutturato non sono ancora definiti
  nel repository.
- Dominio, pagine legali, dati societari, email aziendale definitiva e casi/metriche da
  pubblicare sono ancora da confermare. Il recapito attualmente presente è
  `info@hqflow.it`: non sostituirlo con un indirizzo ipotizzato.
- Il controllo locale di configurazione non sostituisce revisione del diff, test dei flussi
  e verifica del progetto Firebase reale. Push Git e deploy Firebase sono attività separate;
  non eseguirli senza una richiesta esplicita.

## Documenti di riferimento

- [Avvio e comandi](../README.md) e [sviluppo locale](development/local.md).
- [Guida operativa e passaggio di consegne](development/implementation-guide.md).
- [Architettura](architecture/overview.md), [sicurezza](security/controls.md) e
  [identità visiva](brand/README.md).
- [Product brief corrente](../memory/PRD.md). Se un documento non coincide con una nuova
  istruzione esplicita dell’utente, vale l’istruzione più recente dell’utente.
