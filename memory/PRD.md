# HQ Plus — Product brief

## Obiettivo

Sito corporate in italiano per presentare HQ Plus come integratore di sistemi AI e
automazione dei processi aziendali. La pagina deve dimostrare esperienza operativa,
spiegare l'offerta in modo concreto e raccogliere richieste commerciali.

## Pubblico

- Referenti aziendali già in contatto con il gruppo HQ | Industrial Assets, interessati a
  prove di affidabilità e casi d'uso reali.
- PMI e aziende strutturate che cercano un primo processo automatizzabile, una demo e un
  percorso d'ingresso con costi e tempi comprensibili.

## Marchio e interfaccia

- Nome pubblico: **HQ+**, per esteso **HQ Plus**.
- Descrittore: **AI System Integrator**.
- Tema chiaro predefinito e tema scuro alternativo, entrambi basati sul blu e viola del
  logo vettoriale HQ+.
- Asset trasparente del logo con tagline differenziata per tema; originali in
  `docs/brand/source/`, asset pubblicati in `apps/site/public/images/brand/`.
- Lingua principale italiana. L'eventuale versione inglese resta una decisione successiva.

## Contenuti e flussi

- Origine e credibilità del gruppo, metodo di lavoro, casi d'uso, demo documentale, offerta,
  FAQ e contatto.
- Il form contatti invia i dati a `submitLead`.
- La demo invia il documento a `extractDocument`; la generazione di spunti con
  `suggestAutomations` parte solo se l'utente la richiede.
- Il gate email della demo usa `submitDemoLead`.
- Menu, contenuti, temi e collegamenti principali devono restare utilizzabili senza
  dipendenze da un backend per il rendering iniziale.

## Architettura attiva

- Astro genera HTML statico in `apps/site/dist`; React è riservato alle sezioni interattive.
- Firebase Hosting serve il sito e inoltra le route delle Cloud Functions.
- Le Functions e Firestore restano l'autorità per validazione, rate limit, App Check e
  trattamento dei dati. Non aggiungere scritture Firestore dirette dal browser.
- Comandi e dettagli tecnici sono documentati in `README.md` e `docs/`.

## Decisioni da confermare prima della pubblicazione

- Indirizzo email aziendale definitivo: il sito mantiene per ora `info@hqflow.it`, già
  configurato come recapito operativo; non sostituirlo con un indirizzo presunto.
- Dominio pubblico, metadati SEO definitivi, pagine legali e dati societari.
- Verifica delle metriche, delle certificazioni e delle affermazioni commerciali pubblicate.
