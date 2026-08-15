# M3 Home background provenance

Data: 15 agosto 2026
Stato: asset integrato; anteprima UI in attesa di revisione umana

## Metodo e confine di prova

[F] Il fondale Home è stato creato espressamente per App Relax con una singola
generazione text-only tramite OpenAI image generation built-in. Non sono stati
usati loghi, immagini di terzi o reference visuali esterne.

- Output sorgente: PNG generato nel runtime Codex, SHA-256
  `bdb63bbb1b1b1f3c0c25c5d5070b2b7a914404866769b38ffd63941f1eabdfb4`.
- Asset finale: `assets/images/backgrounds/rituals-home-v1.jpg`.
- Normalizzazione: JPEG RGB qualità 82, 864×1821, 297.807 byte.
- SHA-256 finale:
  `93815a818e3284ad49966a5465cb35588aef79fe5c7f2c2608921e1d2decf560`.

## Prompt finale

```text
Use case: stylized-concept
Asset type: portrait mobile app Home background for App Relax, behind readable UI
Primary request: contemporary minimal Japanese impressionism with a pastel,
meditative atmosphere; a hand-painted field rather than a digital gradient.
Scene: luminous warm-ivory washi suggesting a misted water horizon at dawn.
Medium: nihonga mineral pigment, diluted sumi, dry gouache, restrained
impressionist brushwork, refined cosmic new age, much ma and asymmetry.
Composition: generous quiet negative space in the upper-left and centre for UI;
subtle pigment toward the right edge, lower third and corners; a very pale
incomplete lunar glow, sparse reed traces and almost invisible warm-gold flecks.
Palette: ivory, chalk white, pale jade, mineral blue, lavender mist, dusty rose,
whisper peach and muted saffron; very low contrast.
Constraints: background only; no text, logo, watermark, people, UI or central
object; no black planet, Anima-like sphere, neon, digital gradient, stock blob,
waveform, mandala, chakra, Buddha, torii, pagoda, kanji, zodiac, lotus or pose.
```

## Ispezione

[F] L'asset mostra carta avorio materica, una luna chiarissima parziale,
velature pastello minerali, acqua/nebbia e vegetazione rada. Non contiene testo,
logo, persone, simboli religiosi, architettura stereotipata o motivi vietati.

[U] La resa finale sotto copy e box resta soggetta alla revisione umana
dell'anteprima Home. Questo fondale non modifica alcun contenuto o funzione.

## Prova visiva locale

[F] L'export web locale renderizza il fondale, i sei controlli disabilitati e i
sei artwork senza avviare Android Emulator. Le prove finali sono:

- `dist/m3-screenshots/01-home-grid-painterly-background-approved-candidate.jpg`,
  viewport 390×844, 41.890 byte, SHA-256
  `c5a455b25355253692435696432d3bf2830e31a54b1eb85a8b179aaa4349a696`;
- `dist/m3-screenshots/01-home-grid-painterly-background-cards-detail.jpg`,
  viewport 390×844 dopo scorrimento, 49.356 byte, SHA-256
  `2de23efb2696892cc89c393c24f6837cadeda94a817fc3b89aa8ac40b17b2367`.

La prima prova mostra la gerarchia iniziale e la presenza del fondale; la seconda
mostra che Yoga e Massage restano due box equivalenti con funzione, CTA,
durata/formato e naming secondario. Non sostituiscono il futuro screenshot
runtime mobile.
