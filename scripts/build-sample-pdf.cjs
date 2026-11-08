// Generate frontend/public/sample-verbale.pdf — a plausible Italian SRB
// telco site-survey verbale used by the InteractiveDemo "Prova con un
// esempio" button. Run with: `npm run build:sample-pdf` from this folder.

const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const OUT = path.resolve(__dirname, "..", "frontend", "public", "sample-verbale.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: "Verbale di sopralluogo SRB — Esempio HQ Flow",
    Author: "HQ | Flow",
    Subject: "Documento di esempio per la demo",
  },
});

doc.pipe(fs.createWriteStream(OUT));

// Header
doc
  .font("Helvetica-Bold")
  .fontSize(16)
  .text("VERBALE DI SOPRALLUOGO TECNICO", { align: "center" });
doc
  .font("Helvetica")
  .fontSize(10)
  .text("Stazione Radio Base (SRB) — Operatore TIM S.p.A.", { align: "center" });
doc.moveDown(1.5);

// Identificativo
doc.font("Helvetica-Bold").fontSize(11).text("Identificativo pratica");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Codice: VRB-SRB-2026-04891")
  .text("Protocollo interno: HQ-IA / TLC / 2026 / 0408");
doc.moveDown();

// Sito
doc.font("Helvetica-Bold").fontSize(11).text("Dati del sito");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Indirizzo: Via Carducci 17, 20099 Sesto San Giovanni (MI)")
  .text("Coordinate WGS84: 45.5320 N, 9.2370 E")
  .text("Identificativo Catastale: Foglio 12, Mappale 348, Sub. 2");
doc.moveDown();

// Soggetti
doc.font("Helvetica-Bold").fontSize(11).text("Soggetti coinvolti");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Operatore richiedente: TIM S.p.A.")
  .text("Tecnico incaricato: Geom. Marco Bianchi (HQ Industrial Assets)")
  .text("Proprietà sito: Comune di Sesto San Giovanni")
  .text("Direttore lavori: Ing. Laura Conti (TIM S.p.A.)");
doc.moveDown();

// Date
doc.font("Helvetica-Bold").fontSize(11).text("Date chiave");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Data sopralluogo: 08/02/2026")
  .text("Data redazione verbale: 09/02/2026")
  .text("Scadenza validazione: 11/03/2026");
doc.moveDown();

// Tecnico
doc.font("Helvetica-Bold").fontSize(11).text("Caratteristiche impianto");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Tipologia: pannello direttivo 1800 MHz (LTE band 3)")
  .text("Altezza palo: 24 m da piano campagna")
  .text("Numero antenne: 3 (settori 0°, 120°, 240°)")
  .text("Potenza ERP per settore: 35 dBW")
  .text("Conformità FM: verificata, distanze di rispetto rispettate ai sensi del DPCM 8/7/2003");
doc.moveDown();

// Importi
doc.font("Helvetica-Bold").fontSize(11).text("Aspetti economici");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Canone locazione annuo: € 8.400,00")
  .text("Indennità una tantum installazione: € 1.200,00")
  .text("Adeguamento ISTAT: annuale a partire dal 2027");
doc.moveDown();

// Riferimenti
doc.font("Helvetica-Bold").fontSize(11).text("Riferimenti normativi");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("D.Lgs. 259/2003 — Codice delle comunicazioni elettroniche")
  .text("L.R. Lombardia 11/2001 — Norme sulla protezione dai campi elettromagnetici")
  .text("DPR 380/2001 — Testo unico edilizia")
  .text("L. 241/1990 art. 7 c. 2 — Avvio del procedimento")
  .text("DM 29/05/2008 — Specifiche tecniche per impianti di telecomunicazione");
doc.moveDown();

// Scadenze
doc.font("Helvetica-Bold").fontSize(11).text("Scadenze procedurali");
doc
  .font("Helvetica")
  .fontSize(11)
  .text("Invio integrazione documentale: entro il 22/02/2026")
  .text("Risposta ente locale: entro il 25/03/2026")
  .text("Inizio lavori previsti: aprile 2026");
doc.moveDown();

// Note
doc.font("Helvetica-Bold").fontSize(11).text("Note tecniche");
doc
  .font("Helvetica")
  .fontSize(11)
  .text(
    "Si attesta che l'impianto rispetta i valori di attenzione e gli obiettivi di qualità " +
      "previsti dalla normativa vigente in materia di esposizione ai campi elettromagnetici. " +
      "Le distanze di rispetto sono state calcolate secondo il modello volumetrico CEI 211-10. " +
      "Non risultano edifici ad uso residenziale entro la fascia di rispetto principale.",
    { align: "justify" },
  );

// Footer
doc.moveDown(2);
doc
  .font("Helvetica-Oblique")
  .fontSize(9)
  .fillColor("#666")
  .text(
    "Documento di esempio generato automaticamente per la demo di HQ | Flow. " +
      "Dati fittizi, nessuna corrispondenza con persone o luoghi reali.",
    { align: "center" },
  );

doc.end();
console.log("OK ->", OUT);
