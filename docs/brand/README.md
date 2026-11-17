# Identità visiva HQ+

## Logo

- Il sorgente caricato è conservato in `docs/brand/source/hq-plus-system-integrator.original.svg`.
- Le versioni ottimizzate e trasparenti sono in `apps/site/public/images/brand/`.
- La variante chiara usa la tagline blu `#2848c8`; quella scura la usa in lavanda chiara
  `#dbe4ff`. Il simbolo HQ+ mantiene il gradiente blu, viola e azzurro del sorgente.
- Le versioni WebP a 600 px pesano circa 19 KB. SVG resta il fallback vettoriale; i browser
  compatibili con WebP caricano la variante del tema attivo.
- Il logo non ha un riquadro di sfondo. Il tema determina soltanto il colore della tagline.
- `Logo.jsx` serve la navigazione e il footer; `BaseLayout.astro` precarica solo la versione
  del tema attivo sulla homepage.

## Palette

Il tema chiaro è quello principale: superfici fredde quasi bianche, testo navy e blu HQ+ come
colore d'azione. Il tema scuro usa superfici navy e viola chiaro come accento. L'azzurro
presente nel segno grafico non è un token d'accento per l'interfaccia.

I token condivisi dei due temi sono in `apps/site/src/styles/foundation/tokens.css`. I componenti devono
usare i token CSS, senza inserire valori di tema hardcoded nei singoli componenti.

Nel tema light le CTA primarie usano il gradiente blu-viola HQ con un riflesso cromato
discreto; i pulsanti secondari hanno un bordo metallico freddo. Le classi riutilizzabili
`button-primary` e `button-secondary` sono definite in `apps/site/src/styles/components/buttons.css`.
Gli stili cromatici non si applicano al tema dark.

## Regole per gli asset

- Raster pubblicati: WebP con dimensioni adeguate all'uso.
- Loghi, icone e illustrazioni vettoriali: SVG ottimizzato; WebP derivato solo quando serve
  ridurre il peso a runtime.
- Asset del marchio: `apps/site/public/images/brand/`.
- Fondali fotografici e scenari di pagina: `apps/site/public/images/backgrounds/`.
- Video e scene interattive: sottocartelle tematiche di `apps/site/public/media/`.
- Conservare in `docs/brand/source/` gli originali forniti e non modificarli.
