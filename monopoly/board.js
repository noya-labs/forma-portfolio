/* ============================================================
   Nahariya Monopoly — SVG board renderer
   viewBox is canonical: 0 0 1000 1000 (aspect locked 1:1).
   Physical size (cm) is applied via CSS only, never by changing
   the viewBox. Every tile's content is rotated to face outward
   toward its own board edge: bottom 0°, left 90°, top 180°, right -90°.
   ============================================================ */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const { TILES, NEIGHBORHOOD_COLORS, NEIGHBORHOODS } = BOARD_DATA;

  // ---- locked geometry (viewBox units) ----
  const CORNER = 152;                   // corner tile size
  const EDGE = 1000 - 2 * CORNER;       // 696
  const TILE_LEN = EDGE / 9;            // 77.33 per non-corner tile
  const TILE_W = 100;                   // tile depth
  const INK = '#3a3226';

  // Carriage tiles are made ~10% deeper. The extra depth grows INWARD toward
  // the board centre only — the outer board edge, the tile's width along the
  // edge and every neighbouring tile stay exactly where they were.
  const CARRIAGE_TILES = { 6: 1, 16: 1, 26: 1, 36: 1 };
  const CARRIAGE_DEPTH = 1.1;           // 100 → 110 viewBox units

  // ---- source image assets (READ-ONLY; never cropped/resized/rewritten) ----
  // Canonical rule: tile N uses pic/N.png. The two repeated card types share
  // one source file each (18 & 34 → 3, 23 & 37 → 8); no duplicate files exist.
  const IMAGE_OVERRIDES = { 18: 3, 34: 3, 23: 8, 37: 8 };
  function assetNumber(n) { return IMAGE_OVERRIDES[n] || n; }
  function imageHref(n) { return 'pic/' + assetNumber(n) + '.png'; }

  // Foreground tile wording (title / subtitle / body) is intentionally NOT drawn
  // over the full-tile artwork — suppressed so the artwork stays clear. The
  // wording itself is untouched in board-data.js; flip this to restore it.
  // Unaffected: street-name bands, ₪ price boxes/layer, tile numbers, artwork.
  const SHOW_TILE_WORDING = false;

  // Tile 31 reads STRAIGHT (in its own tile direction) like every other tile.
  // Flip this on to restore the old diagonal / outward-facing card composition.
  const SHOW_T31_DIAGONAL = false;

  // Board-centre SVG wordmark ("מונופול" / "נהריה") + tag line. Hidden so the
  // centre carries no duplicate Monopoly title now that the approved vintage
  // artwork in BG1 supplies the only title. Flip on to restore the three lines.
  const SHOW_CENTER_TITLE = false;

  // ---- board-centre background artwork (an AUXILIARY asset, not a tile) ----
  // Fills only the inner/central area that the 40 perimeter tiles leave open.
  // The source is square (1254×1254) and the area it fills is square, so it is
  // shown 1:1 — no cropping, no distortion, no focal offset. It is drawn UNDER
  // the tiles, so no perimeter tile is ever covered, moved or recoloured, and it
  // never enters the tile-number image mapping (see runChecks).
  const CENTER_BG = 'pic/BG1.png';
  const CENTER_AREA = { x: 100, y: 100, w: 800, h: 800 };   // the existing cream base, unchanged

  // ---- dedicated "מונופול" wordmark overlay (this pass) ----
  // Exactly ONE vector label, deliberately independent of SHOW_CENTER_TITLE
  // (which stays false and keeps the legacy three-line centre group disabled).
  // It sits in the blue area slightly upper-left of the artwork's baked-in
  // "נהריה" logo — left of the sun, above the left of the wordmark — and is
  // clearly smaller than that logo, so the vintage title stays dominant.
  // It is editable SVG text: nothing is baked into BG1.png.
  const MONOPOLY_LABEL = {
    text: 'מונופול',
    cx: 670, cy: 243,       // banner centre, in viewBox units
    w: 178, h: 46,          // banner plate
    rot: -12.6,             // parallel to the marked guide line (578,264)→(763,223)
    size: 31, weight: 800,
    plate: '#b8231d',       // Monopoly red
    plateEdge: '#f2e2c2',   // thin cream inner rule
    ink: '#f7f1de',         // cream lettering (same cream the board uses)
    shadow: '#5a1410',      // dark outline / drop shadow for separation
  };

  // Street tiles that begin or end a neighborhood group on their board side.
  // Their colored inner frame is drawn slightly stronger so the group
  // boundaries read clearly. Street tiles only — nothing else is reframed.
  const GROUP_EDGE_TILES = (function () {
    const byKey = {};
    for (const t of TILES) {
      if (t.type !== 'street' || !t.neighborhood) continue;
      const k = t.side + '|' + t.neighborhood;
      (byKey[k] = byKey[k] || []).push(t.number);
    }
    const edges = {};
    for (const k in byKey) {
      const list = byKey[k];
      edges[list[0]] = true;
      edges[list[list.length - 1]] = true;
    }
    return edges;
  })();

  // Full-tile artwork layer. `slice` is the SVG equivalent of object-fit:
  // cover — the image fills the whole rect edge to edge and any overflow is
  // cropped for DISPLAY only. Sized purely in viewBox/user units (never source
  // pixels), so every board size scales the artwork proportionally and no file
  // is ever regenerated. The source file itself is never modified.
  function tileArt(parent, n, x, y, w, h) {
    const href = imageHref(n);
    const img = el('image', {
      x: x, y: y, width: w, height: h,
      href: href,
      preserveAspectRatio: 'xMidYMid slice',
      'pointer-events': 'none',
    }, parent);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
    return img;
  }

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVG_NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Local frame per tile: x runs along the edge, +y points OUTWARD
  // (toward the tile's own board edge). Text drawn at rotation 0 in
  // this frame ends up facing outward thanks to the group rotation.
  function tileFrame(n) {
    let f;
    if (n === 1)  f = { cx: 924, cy: 924, len: CORNER, w: CORNER, rot: 0 };
    else if (n === 11) f = { cx: 76,  cy: 924, len: CORNER, w: CORNER, rot: 90 };
    else if (n === 21) f = { cx: 76,  cy: 76,  len: CORNER, w: CORNER, rot: 180 };
    else if (n === 31) f = { cx: 924, cy: 76,  len: CORNER, w: CORNER, rot: -90 };
    else if (n >= 2 && n <= 10) { const i = n - 2; const x2 = 848 - i * TILE_LEN; f = { cx: x2 - TILE_LEN / 2, cy: 950, len: TILE_LEN, w: TILE_W, rot: 0 }; }
    else if (n >= 12 && n <= 20) { const j = 20 - n; const y1 = 152 + j * TILE_LEN; f = { cx: 50, cy: y1 + TILE_LEN / 2, len: TILE_LEN, w: TILE_W, rot: 90 }; }
    else if (n >= 22 && n <= 30) { const k = n - 22; const x1 = 152 + k * TILE_LEN; f = { cx: x1 + TILE_LEN / 2, cy: 50, len: TILE_LEN, w: TILE_W, rot: 180 }; }
    else { const m = n - 32; const y1 = 152 + m * TILE_LEN; f = { cx: 950, cy: y1 + TILE_LEN / 2, len: TILE_LEN, w: TILE_W, rot: -90 }; }

    // Carriage-only depth: add the extra inward, then pull the centre back by
    // half of it so the OUTER edge keeps its exact position.
    if (CARRIAGE_TILES[n]) {
      const extra = f.w * (CARRIAGE_DEPTH - 1);
      const half = extra / 2;
      f.w += extra;
      if (n <= 10) f.cy -= half;        // bottom edge: inward is -y
      else if (n <= 20) f.cx += half;   // left edge:   inward is +x
      else if (n <= 30) f.cy += half;   // top edge:    inward is +y
      else f.cx -= half;                // right edge:  inward is -x
    }
    return f;
  }

  function txt(parent, x, y, str, o) {
    o = o || {};
    const t = el('text', {
      x, y,
      'font-size': o.size || 11,
      'font-weight': o.weight || 400,
      fill: o.fill || '#2b2620',
      'text-anchor': o.anchor || 'middle',
      'font-family': 'Rubik, "Segoe UI", Arial, sans-serif',
      direction: 'rtl',
    }, parent);
    t.textContent = str;
    // Remember the size the caller asked for, so the fit below can always be
    // re-derived from it (it is re-run once the webfont has loaded).
    if (o.maxW) {
      t.setAttribute('data-maxw', String(o.maxW));
      t.setAttribute('data-nat-size', String(o.size || 11));
      fitText(t);
    }
    return t;
  }

  // ---- text width fitting, MEASURED (never the character-count estimate) ----
  // A string is left completely natural unless its ACTUAL rendered width is
  // wider than the width its band allows. Shrinking the typeface is the first
  // choice; textLength is only a last resort and may only ever SHRINK a string,
  // never stretch it past its natural width — sizing by `length * size * 0.62`
  // over-estimates Hebrew and was stretching eight street names wide.
  function fitText(t) {
    const maxW = parseFloat(t.getAttribute('data-maxw') || '0');
    if (!maxW) return t;
    const nat = parseFloat(t.getAttribute('data-nat-size')) || parseFloat(t.getAttribute('font-size')) || 11;
    t.setAttribute('font-size', String(nat));
    t.removeAttribute('textLength');
    t.removeAttribute('lengthAdjust');
    let w = 0;
    try { w = t.getComputedTextLength(); } catch (e) { w = 0; }
    if (!w || w <= maxW) return t;                 // fits (or cannot be measured) — leave it natural
    t.setAttribute('font-size', String(Math.max(4, Math.round(nat * maxW / w * 10) / 10)));
    let w2 = 0;
    try { w2 = t.getComputedTextLength(); } catch (e) { w2 = 0; }
    if (w2 > maxW) {                               // shrink-only safety net
      t.setAttribute('textLength', String(maxW));
      t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    return t;
  }
  function refitText(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('text[data-maxw]'), fitText);
  }

  function wrapLines(str, maxChars) {
    const words = String(str).split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur.trim()); cur = w; }
      else cur = (cur + ' ' + w).trim();
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function tileBase(g, f) {
    el('rect', { x: -f.len / 2, y: -f.w / 2, width: f.len, height: f.w, fill: '#f6efdd', stroke: INK, 'stroke-width': 1.4 }, g);
  }
  function tileNum(g, n, f) {
    txt(g, 0, f.w / 2 - 4, String(n), { size: 6.5, fill: '#8b7d63' });
  }
  function imagePlaceholder(g, cy, w, h, label) {
    el('rect', { x: -w / 2, y: cy - h / 2, width: w, height: h, fill: 'none', stroke: '#a89a7e', 'stroke-width': 0.8, 'stroke-dasharray': '3 2.5' }, g);
    txt(g, 0, cy + 2.5, label || 'מקום לתמונה', { size: 6, fill: '#a89a7e' });
  }

  // ---- carriage direction labels (SEPARATE layer, one per carriage) -------
  // The four APPROVED directions come from the real geography of the associated
  // Nahariya areas — never from the physical side of the board. The wording is
  // read from BOARD_DATA.CARRIAGE_CARDS, the same source the ownership cards use,
  // so board and cards can never drift apart.
  // Each label is drawn in its carriage's OWN frame on the −y side (inward,
  // toward the board centre) and centred on the carriage axis, so it is visually
  // attached to that carriage, sits just outside its inner edge, keeps the small
  // clear gap asked for, and rotates with the tile exactly like every other
  // element on this board (each edge reads outward). The tile's artwork is never
  // covered: the label lives entirely in the centre area. Contrast over the
  // centre artwork comes from a thin cream halo around the glyphs, not a panel.
  const CARRIAGE_LABEL = { size: 11.5, gap: 7, halo: 1.6, haloColor: '#f1e8d2' };
  function carriageLabel(g, t, f) {
    const cc = BOARD_DATA.CARRIAGE_CARDS || {};
    const entry = cc[t.number];
    const name = (entry && entry.name) || t.title;
    const size = CARRIAGE_LABEL.size;
    const baseline = -(f.w / 2 + CARRIAGE_LABEL.gap + size * 0.78);
    const label = txt(g, 0, baseline, name, { size: size, weight: 800, fill: INK });
    label.setAttribute('data-carriage-label', String(t.number));
    if (entry && entry.areas) label.setAttribute('data-carriage-areas', entry.areas);
    return halo(label, CARRIAGE_LABEL.halo, CARRIAGE_LABEL.haloColor);
  }

  // ---- purchase-price badge (SEPARATE layer) -----------------------------
  // Drawn ABOVE the full-tile artwork — never baked into any source PNG.
  // Anchored against the tile's OUTER / BASE edge: the edge that faces OUTSIDE
  // the board and is opposite the colored street-name band. In the tile's own
  // frame +y points at that base, so the badge rotates naturally with each side
  // of the board (bottom / left / top / right) instead of following one global
  // screen direction. Band-less carriage & special-property badges use exactly
  // the same rule. viewBox/user units only, so the layer scales with the board
  // at any physical print size.
  // Tile 39 is NOT purchasable and gets NO badge — its artwork already shows
  // the תשלום קבוע 100 ש״ח payment.
  const PRICE_PLATE = { w: 54, h: 11.6 };
  // Distance kept between the badge and the tile's base edge, so the badge stays
  // as low as the tile allows: it clears the small tile numeral that already
  // sits at the base (its cap top is at f.w/2 - 8.7) and the tile outline.
  const PRICE_BASE_CLEARANCE = 9.2;
  function priceTop(f) { return f.w / 2 - PRICE_BASE_CLEARANCE - PRICE_PLATE.h; }
  // Tile-5 auxiliary callout artwork (pic/41.png): an IMAGE hung just OUTSIDE
  // the tile, on the board-centre side (the −y side of the tile's own frame),
  // centred on tile 5's axis. It is NOT a board tile: it is never reachable
  // through assetNumber()/imageHref(), so the board stays 40 tiles.
  // The source is 1312 × 1199 and carries transparent padding — the visible
  // artwork spans x 271→1091, y 195→1098 — so the element box is sized from the
  // VISIBLE artwork and the padding is allowed to hang over the centre panel's
  // inner frame (transparent pixels paint nothing, so that line stays visible).
  // The whole canvas is always shown (nothing is cropped) and the element uses
  // `meet`, so the aspect ratio can never be altered by the box.
  const CALLOUT_SRC = { w: 1312, h: 1199, x0: 271, x1: 1091, y0: 195, y1: 1098 };
  const CALLOUT_VIS_W = 69.6;              // viewBox units ≈ 90% of tile 5's 77.33 width
  const CALLOUT_W = CALLOUT_VIS_W * CALLOUT_SRC.w / (CALLOUT_SRC.x1 - CALLOUT_SRC.x0);
  const CALLOUT_H = CALLOUT_W * CALLOUT_SRC.h / CALLOUT_SRC.w;
  const CALLOUT_GAP = 11;                  // tile inner edge → visible callout bottom
  // A tax tile whose own artwork already prints the amount (tile 39) gets no
  // generated badge and no decorative ₪.
  function artworkPrintsFee(t) { return !!(t.notes && t.notes.kind === 'fee'); }
  // Auxiliary callout artwork — same viewBox/user-unit sizing as tile art (never
  // source pixels, never regenerated), but `meet` instead of `slice` so the
  // callout keeps its aspect ratio and is never cropped or stretched.
  function calloutArt(parent, href, x, y, w, h) {
    const img = el('image', {
      x: x, y: y, width: w, height: h,
      href: href,
      preserveAspectRatio: 'xMidYMid meet',
      'pointer-events': 'none',
    }, parent);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
    return img;
  }
  function pricePlate(g, f, text) {
    const size = 7;
    const w = Math.min(f.len - 8, PRICE_PLATE.w);
    const h = PRICE_PLATE.h;
    const y = priceTop(f);
    el('rect', {
      x: -w / 2, y: y, width: w, height: h, rx: 2.4,
      fill: '#f7f1de', 'fill-opacity': 0.92,
      stroke: '#8b7d63', 'stroke-width': 0.7,
    }, g);
    txt(g, 0, y + h / 2 + size * 0.35, text, { size: size, weight: 700, fill: INK, maxW: w - 5 });
  }

  // ---- corner story text (SEPARATE layer) -------------------------------
  // The free-parking corner (tile 21) carries a short Friday-night story, drawn
  // as editable SVG text ABOVE the full-tile artwork. It is written in the
  // tile's OWN frame, exactly like that artwork and like every other tile's
  // wording on this board (each tile faces outward: bottom 0°, left 90°,
  // top 180°, right −90°), so the tile reads as one piece. Contrast over the
  // photograph comes from a cream halo around the glyphs (paint-order: stroke)
  // rather than a backing plate, so no part of the artwork is covered.
  // viewBox/user units only, so it scales with the board at any print size.
  // Sizes are set from the measured natural widths of the locked wording
  // (line 1 ≈ 122, line 2 ≈ 90, punch ≈ 85 viewBox units at these sizes), so all
  // three fit the 152-unit corner with margin. No maxW is passed on purpose: the
  // shared char-count guard (0.62 em per char) over-estimates Hebrew, and a
  // textLength squeeze would visibly distort the glyphs.
  const STORY = {
    setupSize: 13.5, setupWeight: 600, setupY: [-26, -10],
    punchSize: 19, punchWeight: 800, punchY: 22,
  };
  function halo(t, width, color) {
    t.setAttribute('stroke', color || '#f7f1de');
    t.setAttribute('stroke-width', String(width));
    t.setAttribute('stroke-linejoin', 'round');
    t.setAttribute('paint-order', 'stroke');
    return t;
  }
  function drawCornerStory(g, t) {
    const n = t.notes || {};
    (n.storySetup || []).forEach(function (line, i) {
      halo(txt(g, 0, STORY.setupY[i], line, { size: STORY.setupSize, weight: STORY.setupWeight, fill: INK }), 2.4);
    });
    if (n.storyPunch) {
      halo(txt(g, 0, STORY.punchY, n.storyPunch, { size: STORY.punchSize, weight: STORY.punchWeight, fill: '#8f2f28' }), 3);
    }
  }

  // ---- tile 29 (הכבלים) flavor line (SEPARATE layer) ---------------------
  // The approved line is drawn on the artwork as editable SVG text, in the
  // tile's OWN frame and centred on its local axis, in the free band between the
  // artwork's centre and the purchase badge — so it reads as part of the tile and
  // covers no important part of the artwork. Contrast comes from a thin cream
  // halo (paint-order: stroke), not a plate: no banner, no box, no redesign.
  // Size is set from the MEASURED natural width of the locked wording — 69.2 of
  // the tile's 77.33 units at size 8 (3.7 mm at 46.5 cm), i.e. a ~1.9 mm margin
  // each side, with ~4.6 mm of clear artwork between the line and the badge. So
  // the wording needs no wrapping and no squeeze. The wording itself is read from
  // BOARD_DATA.UTILITY_CARDS — the SAME source the ownership card prints — so the
  // board and the card can never drift. Scoped to tile 29 only: המשביר keeps its
  // artwork clean. No maxW is passed on purpose: the shared char-count guard
  // over-estimates Hebrew and would stretch the glyphs (see drawCornerStory).
  const T29_TILE = 29;
  const T29_LINE = { size: 8, weight: 600, y: 17, halo: 1.6, haloColor: '#f7f1de' };
  function drawUtilityLine(g, t) {
    const note = (BOARD_DATA.UTILITY_CARDS && BOARD_DATA.UTILITY_CARDS[t.number] || {}).note;
    if (!note) return;
    const box = el('g', { 'data-tile29-line': note }, g);
    halo(txt(box, 0, T29_LINE.y, note, { size: T29_LINE.size, weight: T29_LINE.weight, fill: INK }), T29_LINE.halo, T29_LINE.haloColor);
  }

  // Street: colored header band with the street name INSIDE the band.
  function renderStreet(g, t, f) {
    const color = NEIGHBORHOOD_COLORS[t.neighborhood] || '#b3a98f';
    // 1. full-tile artwork background (slice = cover, edge to edge)
    tileArt(g, t.number, -f.len / 2, -f.w / 2, f.len, f.w);
    // 2. inner colored frame — STREET TILES ONLY, drawn in the neighbourhood
    //    colour so every tile visibly belongs to its group. Group first/last
    //    tiles get a slightly stronger frame. The board's own dark outer border
    //    stays as the outer level (it is re-stroked in renderTile).
    const edge = !!GROUP_EDGE_TILES[t.number];
    const inset = 2.6;
    el('rect', {
      x: -f.len / 2 + inset, y: -f.w / 2 + inset,
      width: f.len - inset * 2, height: f.w - inset * 2,
      fill: 'none', stroke: color, 'stroke-width': edge ? 3.4 : 2,
    }, g);
    // 3. colored name band stays as the readability overlay for the street name
    el('rect', { x: -f.len / 2 + 2.5, y: -f.w / 2 + 3, width: f.len - 5, height: 23, fill: color, stroke: INK, 'stroke-width': 1 }, g);
    const name = t.street || t.title;
    txt(g, 0, -f.w / 2 + 19.5, name, { size: name.length > 12 ? 9 : 11, weight: 700, fill: '#fffdf5', maxW: f.len - 10 });
    // 4. purchase price — SEPARATE badge on the artwork, against the tile BASE
    //    (the outer edge, opposite this colored band)
    if (t.price != null) pricePlate(g, f, 'מחיר ' + t.price + ' ₪');
  }

  function renderGeneric(g, t, f) {
    // 0. optional auxiliary callout artwork, ABOVE the tile on the board-centre
    //    side (tile 5 only). Drawn before the tile artwork to honour the
    //    intended layer order: board background → callout → tile → payment badge.
    if (t.notes && t.notes.centerCallout) {
      // Anchor on the VISIBLE artwork, so the small gap to the tile is measured
      // from the notebook itself and not from the transparent padding.
      const visBottom = -(f.w / 2 + CALLOUT_GAP);  // local y, just above the tile
      const padBottom = CALLOUT_H * (CALLOUT_SRC.h - CALLOUT_SRC.y1) / CALLOUT_SRC.h;
      const boxBottom = visBottom + padBottom;
      calloutArt(g, t.notes.centerCallout, -CALLOUT_W / 2, boxBottom - CALLOUT_H, CALLOUT_W, CALLOUT_H);
    }
    // 1. full-tile artwork background (slice = cover, edge to edge)
    tileArt(g, t.number, -f.len / 2, -f.w / 2, f.len, f.w);
    // 2. foreground wording — suppressed (see SHOW_TILE_WORDING)
    if (SHOW_TILE_WORDING) {
      const titleLines = wrapLines(t.title, f.len > 100 ? 16 : 13).slice(0, 2);
      let y = -f.w / 2 + 12;
      for (const line of titleLines) {
        txt(g, 0, y, line, { size: f.len > 100 ? 13 : 10.5, weight: 700, maxW: f.len - 8 });
        y += f.len > 100 ? 15 : 12;
      }
      if (t.subtitle) {
        txt(g, 0, y + 1, t.subtitle, { size: 8, weight: 500, fill: '#5c5240', maxW: f.len - 10 });
        y += 10;
      }
      if (t.body) {
        const bl = wrapLines(t.body, f.len > 100 ? 34 : 22).slice(0, 3);
        for (const line of bl) { txt(g, 0, y + 3, line, { size: 7.5, fill: '#4c4436', maxW: f.len - 10 }); y += 9; }
      }
    }
    // 2b. tile 29 (הכבלים) flavor line — see drawUtilityLine. Same tile size and
    //     geometry; drawn under the badge, so the 150 ₪ plate is untouched.
    if (t.number === T29_TILE) drawUtilityLine(g, t);
    // 3. purchase price / payment instruction — SEPARATE badge on the artwork,
    //    against the tile base. Carriage & special-property badges use the
    //    street badge language but no neighborhood band. A tax tile whose own
    //    artwork already prints the amount (tile 39) gets nothing here.
    if (t.price != null) {
      pricePlate(g, f, 'מחיר ' + t.price + ' ₪');
    } else if (t.payment != null && !artworkPrintsFee(t)) {
      pricePlate(g, f, 'שלם ' + t.payment + ' ₪');
    }
    // 4. payment badge only — the story text now lives inside the callout art
    //    (see step 0); no additional text is drawn over pic/41.png.
  }

  // ---- corner tiles (reading orientation LOCKED) ----
  function renderCorner(g, t, f) {
    if (t.type === 'start') {
      // Diagonal split: divider runs from the tile's inner corner to its outer
      // corner. Zone A (start only) faces the bottom edge / tile 2, where players
      // set off. Zone B (arrival bonuses) faces the right edge / tile 40, where
      // players arrive after completing a lap. Exact landing 500 ₪ replaces the
      // 250 ₪ lap pass. Same muted palette, horizontal readable text.
      el('path', { d: 'M -76 -76 L 76 76 L -76 76 Z', fill: '#f0e6c9' }, g);   // zone A tint
      el('path', { d: 'M -76 -76 L 76 76 L 76 -76 Z', fill: '#f7f0da' }, g);   // zone B tint
      // full-tile artwork (covers the zone tints); the approved diagonal split
      // and both text zones stay drawn above it, unchanged.
      tileArt(g, t.number, -76, -76, 152, 152);
      el('line', { x1: -76, y1: -76, x2: 76, y2: 76, stroke: INK, 'stroke-width': 1.2 }, g);
      // foreground wording — suppressed (see SHOW_TILE_WORDING); the approved
      // diagonal split above stays, only the text is withheld
      if (SHOW_TILE_WORDING) {
        // ZONE A — start only
        txt(g, -34, 48, t.title, { size: 17, weight: 800, maxW: 64 });
        // ZONE B — arrival / bonus zone
        txt(g, -6, -50, t.notes.exactLanding, { size: 9.5, weight: 700, maxW: 74 });
        txt(g, 12, -28, t.notes.lapPass, { size: 9.5, weight: 700, maxW: 66 });
        wrapLines(t.notes.exactLandingFootnote, 34).slice(0, 3).forEach(function (line, i) {
          txt(g, 46, -12 + i * 7, line, { size: 4.8, fill: '#8b7d63', maxW: 40 });
        });
      }
    } else if (t.type === 'go-to-jail') {
      // Tile 31 reads STRAIGHT, in the tile's own direction, like every other
      // tile: one full-tile artwork fill, nothing diagonal. (Set
      // SHOW_T31_DIAGONAL to true to bring the old outward/diagonal card back.)
      if (!SHOW_T31_DIAGONAL) {
        tileArt(g, t.number, -76, -76, 152, 152);
        return;
      }
      // ---- TILE 31 (top-right corner): the tile FACES the outer corner ----
      // A player standing outside the board at the top-right corner looks back
      // at the board along (-1,1). For that viewer this tile must read as an
      // ordinary upright card: its TOP edge toward the board centre, its BOTTOM
      // edge toward the outer corner, text baselines running \\ in screen
      // space. That is a total screen rotation of -135°, and this tile's own
      // group is already rotate(-90), so the entire internal composition gets
      // one further -45° as a single unit. Nothing here is rotated on its own.
      //
      // Card frame: u runs the way a text line advances, v the way lines stack,
      // with v = -top (faces the board centre) and v = +bottom (faces the outer
      // corner). Seen through the tile square, that diamond is the only visible
      // part of the card: |u| + |v| <= 107.5, so the scene canvas below is drawn
      // wider than the tile and then trimmed by the tile's own clip — the
      // artwork therefore reaches every edge of tile 31 and stops there.
      const defs = el('defs', {}, g);
      const clip = el('clipPath', { id: 'nm-t31-clip', clipPathUnits: 'userSpaceOnUse' }, defs);
      el('rect', { x: -76, y: -76, width: 152, height: 152 }, clip);

      function lgrad(id, x1, y1, x2, y2, stops) {
        const gr = el('linearGradient', { id: id, gradientUnits: 'userSpaceOnUse', x1: x1, y1: y1, x2: x2, y2: y2 }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] }, gr); });
        return 'url(#' + id + ')';
      }
      function rgrad(id, cx, cy, r, stops) {
        const gr = el('radialGradient', { id: id, gradientUnits: 'userSpaceOnUse', cx: cx, cy: cy, r: r }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] }, gr); });
        return 'url(#' + id + ')';
      }
      // worn-print grain
      const grain = el('pattern', { id: 'nm-t31-grain', width: 5, height: 5, patternUnits: 'userSpaceOnUse' }, defs);
      el('circle', { cx: 1.3, cy: 1.5, r: 0.34, fill: '#3a3226', opacity: 0.10 }, grain);
      el('circle', { cx: 3.7, cy: 3.2, r: 0.24, fill: '#3a3226', opacity: 0.07 }, grain);
      el('circle', { cx: 4.5, cy: 0.7, r: 0.22, fill: '#f6efdd', opacity: 0.12 }, grain);
      // soft light panel that carries the text (readability support only)
      const softBlur = el('filter', { id: 'nm-t31-soft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
      el('feGaussianBlur', { stdDeviation: 3.2 }, softBlur);

      const stage = el('g', { 'clip-path': 'url(#nm-t31-clip)' }, g);
      const d = el('g', { class: 'tile31-card', transform: 'rotate(-45)', 'data-facing': 'outward-outer-corner' }, stage);
      const put = function (name, attrs) { return el(name, attrs, d); };

      // ------------------ scene: the holding wing, seen from outside a barred gate
      // institutional wall, damp plaster, ceiling shadow
      put('rect', { x: -110, y: -110, width: 220, height: 220, fill: lgrad('nm-t31-wall', 0, -110, 0, 110, [[0, '#ded3b7'], [0.5, '#d1c5a7'], [1, '#b9ac90']]) });
      put('rect', { x: -110, y: -110, width: 220, height: 38, fill: lgrad('nm-t31-ceil', 0, -110, 0, -72, [[0, '#4f4636', 0.52], [1, '#4f4636', 0]]) });
      put('ellipse', { cx: -70, cy: -44, rx: 54, ry: 28, fill: '#8b7a5e', opacity: 0.065 });
      put('ellipse', { cx: 54, cy: -58, rx: 52, ry: 22, fill: '#8b7a5e', opacity: 0.055 });
      put('ellipse', { cx: 6, cy: 4, rx: 92, ry: 30, fill: '#f0e6c9', opacity: 0.10 });
      // the cell: dark interior, its floor, a dim light, then the gate frame
      put('rect', { x: -110, y: 53.4, width: 220, height: 58.6, fill: lgrad('nm-t31-cell', 0, 53.4, 0, 112, [[0, '#2c281f'], [1, '#17140f']]) });
      put('rect', { x: -110, y: 70, width: 220, height: 42, fill: lgrad('nm-t31-cellfloor', 0, 70, 0, 112, [[0, '#3f382c'], [1, '#241f18']]) });
      put('line', { x1: -110, y1: 70, x2: 110, y2: 70, stroke: '#5c5343', 'stroke-width': 0.6, opacity: 0.75 });
      put('ellipse', { cx: 0, cy: 80, rx: 50, ry: 20, fill: rgrad('nm-t31-celllight', 0, 80, 50, [[0, '#e6d8b2', 0.16], [1, '#e6d8b2', 0]]) });
      put('rect', { x: -110, y: 49, width: 220, height: 5, fill: '#6a5f4b' });
      put('rect', { x: -110, y: 53, width: 220, height: 1.6, fill: '#3a3428', opacity: 0.6 });
      // ground contact shadows (the men stand just inside the gate)
      put('ellipse', { cx: -20, cy: 68.5, rx: 15, ry: 3.2, fill: '#241f16', opacity: 0.42 });
      put('ellipse', { cx: 18.5, cy: 68.5, rx: 14, ry: 3.2, fill: '#241f16', opacity: 0.42 });

      // ---- the prisoner: seen from behind, walked out, wrists cuffed behind ----
      // (shoes, then legs, then body, then the cuffed wrists at his back, head last)
      put('rect', { x: -31, y: 65.6, width: 9, height: 3.4, rx: 1.3, fill: '#2f2b25' });
      put('rect', { x: -16.4, y: 61.4, width: 9, height: 3.4, rx: 1.3, fill: '#2f2b25' });
      put('path', { d: 'M -28 45 L -30 56 L -30.4 66 L -22.8 66 L -23.6 56 L -20.8 45 Z', fill: '#443e33' });
      put('path', { d: 'M -18.6 45 L -16.6 55 L -15.4 61.6 L -8.6 61.6 L -10.4 53.6 L -12.4 45 Z', fill: '#3d372d' });
      put('path', { d: 'M -21.6 26.6 L -24.6 26.6 L -24.6 30 L -21.6 30 Z', fill: '#bd9769' });
      put('path', { d: 'M -28 34.4 C -27.4 30.6 -24 28.4 -20 28.4 C -16 28.4 -12.6 30.6 -12 34.4 C -11.4 38.6 -12.2 43 -13.6 45.4 L -26.4 45.4 C -27.8 43 -28.6 38.6 -28 34.4 Z', fill: '#8d7c5e' });
      put('path', { d: 'M -28 34.4 C -27.4 30.6 -24 28.4 -20 28.4 L -20 45.4 L -26.4 45.4 C -27.8 43 -28.6 38.6 -28 34.4 Z', fill: '#77684f', opacity: 0.55 });
      put('path', { d: 'M -22.4 29.2 L -20 31.6 L -17.8 29.2', fill: 'none', stroke: '#6b5c43', 'stroke-width': 1 });
      // arms pulled behind his back to meet at the small of it
      put('path', { d: 'M -27.4 32.4 L -30.4 37.6 L -26.6 43.6 L -23.4 40.6 L -25.4 33.6 Z', fill: '#8d7c5e' });
      put('path', { d: 'M -12.6 32.4 L -9.8 37.6 L -13.6 43.6 L -16.6 40.4 L -14.6 33.6 Z', fill: '#84755a' });
      put('ellipse', { cx: -19.4, cy: 44.2, rx: 2.8, ry: 2.5, fill: '#cda87c' });
      put('ellipse', { cx: -21.6, cy: 45.4, rx: 2.8, ry: 2.5, fill: '#cda87c' });
      put('circle', { cx: -19.4, cy: 44.2, r: 2.9, fill: 'none', stroke: '#302c26', 'stroke-width': 1.4 });
      put('circle', { cx: -21.6, cy: 45.4, r: 2.9, fill: 'none', stroke: '#302c26', 'stroke-width': 1.4 });
      put('path', { d: 'M -20.5 44.8 L -20.5 46', stroke: '#302c26', 'stroke-width': 1.4 });
      put('path', { d: 'M -20.4 47.8 C -20.4 49.6 -20 50.8 -20.6 52.2', fill: 'none', stroke: '#302c26', 'stroke-width': 1, 'stroke-dasharray': '1.3 1.1' });
      // head bowed so the crown drops between the shoulders, cheek turned to us
      put('ellipse', { cx: -20, cy: 23.6, rx: 4.4, ry: 4.8, fill: '#382f28', transform: 'rotate(12 -20 23.6)' });
      put('path', { d: 'M -17.6 20.8 C -14.4 21.4 -13.8 24.6 -15.4 27 C -16.8 28.8 -19 28.2 -19.6 27.2 Z', fill: '#cda87c' });
      put('path', { d: 'M -15.4 25.6 C -16.4 26.8 -17.6 27 -18.6 26.4', fill: 'none', stroke: '#8a5a48', 'stroke-width': 0.9 });
      put('path', { d: 'M -15.6 23.4 L -17.2 23.9', fill: 'none', stroke: '#4a3a2e', 'stroke-width': 0.8 });
      put('ellipse', { cx: -23.4, cy: 24.4, rx: 1.5, ry: 1.9, fill: '#c39c70' });

      // ---- the guard: taller, upright, routine, one hand on the prisoner ----
      put('rect', { x: 9.9, y: 65.2, width: 8.6, height: 3.4, rx: 1.3, fill: '#26221c' });
      put('rect', { x: 18.6, y: 65.2, width: 8.6, height: 3.4, rx: 1.3, fill: '#26221c' });
      put('path', { d: 'M 11.4 45 L 10.4 56 L 10.9 65.4 L 17.6 65.4 L 17.4 56 L 18.4 45 Z', fill: '#33362f' });
      put('path', { d: 'M 18.6 45 L 18.6 56 L 19.3 65.4 L 25.6 65.4 L 25.8 56 L 25.6 45 Z', fill: '#2d302a' });
      put('rect', { x: 16.4, y: 26.2, width: 3.2, height: 3.4, fill: '#bd9769' });
      put('path', { d: 'M 9.4 33.4 C 10 29.8 13.4 27.6 18 27.6 C 22.6 27.6 26 29.8 26.6 33.4 C 27.2 38.4 27 43.4 26.2 46 L 9.8 46 C 9 43.4 8.8 38.4 9.4 33.4 Z', fill: '#9a9c84' });
      put('path', { d: 'M 9.4 33.4 C 10 29.8 13.4 27.6 18 27.6 L 18 46 L 9.8 46 C 9 43.4 8.8 38.4 9.4 33.4 Z', fill: '#85876f', opacity: 0.5 });
      put('path', { d: 'M 14.6 28.6 L 18 32 L 21.4 28.6', fill: 'none', stroke: '#6d6f5b', 'stroke-width': 1.1 });
      put('rect', { x: 9.2, y: 44, width: 17.4, height: 3, fill: '#3f382d' });
      put('rect', { x: 16.6, y: 44.4, width: 3.6, height: 2.2, fill: '#a99f83' });
      // his near arm reaches across and takes the prisoner's shoulder
      put('path', { d: 'M 11.6 29.4 L 8.2 34.8 L -8.6 38.6 L -9.8 34.6 Z', fill: '#85876f' });
      put('ellipse', { cx: -11, cy: 36.4, rx: 3.2, ry: 2.8, fill: '#cda87c' });
      // his other arm hangs square at his side
      put('path', { d: 'M 25.6 30.6 L 29.4 36.6 L 28.4 41.4 L 24.6 36.6 Z', fill: '#8d8f78' });
      put('ellipse', { cx: 28.4, cy: 43, rx: 3, ry: 2.6, fill: '#cda87c' });
      put('rect', { x: 21.4, y: 30, width: 4.6, height: 3.8, rx: 0.9, fill: '#4e534a' });
      put('circle', { cx: 23.6, cy: 31.8, r: 0.9, fill: '#cbbc93' });
      put('ellipse', { cx: 18, cy: 22, rx: 4.3, ry: 4.7, fill: '#cda87c' });
      put('ellipse', { cx: 15.6, cy: 24, rx: 1.6, ry: 1.9, fill: '#bd9769' });
      put('path', { d: 'M 13.4 21.6 C 13.4 15.6 22.6 15.6 22.6 21.6 Z', fill: '#34322c' });
      put('rect', { x: 13.4, y: 20.4, width: 9.2, height: 1.7, fill: '#4a4740' });
      put('path', { d: 'M 12.6 21.8 C 10.4 21.6 9.4 23 9.9 24.4 L 14.6 23.6 Z', fill: '#26241f' });

      // foreground gate bars, in front of both men
      [-104, -78, -52, -26, 0, 26, 52, 78, 104].forEach(function (u) {
        put('rect', { x: u, y: 53, width: 5.6, height: 59, rx: 2.2, fill: '#241f19' });
        put('rect', { x: u + 0.7, y: 53, width: 1.3, height: 59, fill: '#8d8577', opacity: 0.45 });
      });
      put('rect', { x: -110, y: 52, width: 220, height: 3.4, fill: '#26221b', opacity: 0.92 });
      put('rect', { x: -110, y: 86, width: 220, height: 3.4, fill: '#26221b', opacity: 0.92 });

      // aged print: vignette, then grain over the scene (under the text)
      put('rect', { x: -110, y: -110, width: 220, height: 220, fill: rgrad('nm-t31-vig', 2, -4, 150, [[0.45, '#2f2a20', 0], [1, '#2f2a20', 0.26]]) });
      put('rect', { x: -110, y: -110, width: 220, height: 220, fill: 'url(#nm-t31-grain)' });

      // ---- full-tile artwork: the source image inside the approved
      // rotate(-45) card frame, so tile 31 keeps its diagonal/outward
      // orientation exactly (the tile clip trims it to the tile edge).
      tileArt(d, t.number, -110, -110, 220, 220);

      // ------------------ text layer — suppressed (see SHOW_TILE_WORDING)
      // The whole layer (readability panel + title + body) is off so the 31.png
      // artwork reads cleanly; nothing else in the scene changed.
      if (SHOW_TILE_WORDING) {
        put('rect', { x: -92, y: -110, width: 184, height: 130, rx: 5, filter: 'url(#nm-t31-soft)', fill: lgrad('nm-t31-panel', 0, -110, 0, 20, [[0, '#f7f1de', 0.94], [0.55, '#f7f1de', 0.74], [0.8, '#f7f1de', 0.42], [1, '#f7f1de', 0.08]]) });
        wrapLines(t.title, 17).slice(0, 2).forEach(function (line, i) {
          txt(d, 0, -32 + i * 15.6, line, { size: 14, weight: 800, maxW: 120 });
        });
        String(t.body || '').split('\n').slice(0, 3).forEach(function (line, i) {
          txt(d, 0, -4 + i * 6.5, line, { size: 5.4, fill: '#413a2c', maxW: 110 });
        });
      }
    } else {
      // 1. full-tile artwork background (slice = cover, edge to edge)
      tileArt(g, t.number, -76, -76, 152, 152);
      // 2. corner story text (tile 21 only) — see STORY
      if (t.notes && (t.notes.storyPunch || t.notes.storySetup)) drawCornerStory(g, t);
      // 3. foreground wording — suppressed (see SHOW_TILE_WORDING)
      if (SHOW_TILE_WORDING) {
        const titleLines = wrapLines(t.title, 16).slice(0, 2);
        let y = -30;
        for (const line of titleLines) { txt(g, 0, y, line, { size: 14, weight: 700, maxW: 132 }); y += 16; }
        if (t.subtitle) { txt(g, 0, y, t.subtitle, { size: 9, fill: '#5c5240' }); y += 11; }
        if (t.body) {
          for (const line of wrapLines(t.body, 34).slice(0, 3)) { txt(g, 0, y + 2, line, { size: 8, fill: '#4c4436' }); y += 10; }
        }
      }
    }
  }

  function renderTile(t, root) {
    const f = tileFrame(t.number);
    const g = el('g', { transform: 'translate(' + f.cx + ',' + f.cy + ') rotate(' + f.rot + ')', 'data-tile': t.number, 'data-type': t.type, 'data-side': t.side, 'data-image': imageHref(t.number) }, root);
    tileBase(g, f);
    if (t.type === 'street') renderStreet(g, t, f);
    else if (f.len === CORNER) renderCorner(g, t, f);
    else renderGeneric(g, t, f);
    // re-stroke the outline so the grid lines stay crisp above the artwork
    el('rect', { x: -f.len / 2, y: -f.w / 2, width: f.len, height: f.w, fill: 'none', stroke: INK, 'stroke-width': 1.4 }, g);
    tileNum(g, t.number, f);
    // carriage direction label — drawn last, in the tile's own frame, on the
    // inward (board-centre) side. Nothing else about the tile changes.
    if (t.type === 'carriage') carriageLabel(g, t, f);
    return g;
  }

  // ---- neighborhood grouping (ISOLATED: redesign later without touching tiles) ----
  // Neighborhood label readability over the centre artwork (BG1): the canonical
  // neighborhood color stays the fill; the label is 12 % larger and heavier, and
  // a thin warm-cream halo (paint-order stroke, round joins) separates the
  // letters from the sand/sea photo. No box, no pill, no glow filter — the halo
  // is the only readability treatment, so nothing is obscured and print stays sharp.
  const NB_LABEL = { size: 25.2, weight: 800, halo: 1.8, haloColor: '#f1e8d2' };
  function renderNeighborhoodBrackets(root) {
    const layer = el('g', { id: 'neighborhood-layer' }, root);
    const byEdge = {};
    for (const t of TILES) {
      if (t.type !== 'street' || !t.neighborhood) continue;
      const key = t.side + '|' + t.neighborhood;
      (byEdge[key] = byEdge[key] || []).push(t);
    }
    const CFG = {
      bottom: { line: 'horizontal', at: 894, tick: 4, labelY: 886, labelRot: 0, edgeA: 0 },
      left:   { line: 'vertical',   at: 106, tick: -4, labelY: 0,   labelRot: 90, edgeA: 1 },
      top:    { line: 'horizontal', at: 106, tick: -4, labelY: 115, labelRot: 180, edgeA: 0 },
      right:  { line: 'vertical',   at: 894, tick: 4,  labelY: 0,   labelRot: -90, edgeA: 1 },
    };
    for (const key in byEdge) {
      const list = byEdge[key];
      const side = list[0].side, nb = list[0].neighborhood;
      const cfg = CFG[side];
      const frames = list.map((t) => tileFrame(t.number));
      const a = Math.min.apply(null, frames.map((f) => cfg.edgeA ? f.cy : f.cx)) - TILE_LEN / 2 + 4;
      const b = Math.max.apply(null, frames.map((f) => cfg.edgeA ? f.cy : f.cx)) + TILE_LEN / 2 - 4;
      const color = NEIGHBORHOOD_COLORS[nb];
      const g = el('g', {}, layer);
      const x1 = cfg.line === 'horizontal' ? a : cfg.at, y1 = cfg.line === 'horizontal' ? cfg.at : a;
      const x2 = cfg.line === 'horizontal' ? b : cfg.at, y2 = cfg.line === 'horizontal' ? cfg.at : b;
      el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 1.6 }, g);
      // end ticks toward the tiles
      const tk = cfg.tick;
      if (cfg.line === 'horizontal') {
        el('line', { x1: a, y1: cfg.at, x2: a, y2: cfg.at + tk, stroke: color, 'stroke-width': 1.2 }, g);
        el('line', { x1: b, y1: cfg.at, x2: b, y2: cfg.at + tk, stroke: color, 'stroke-width': 1.2 }, g);
      } else {
        el('line', { x1: cfg.at, y1: a, x2: cfg.at + tk, y2: a, stroke: color, 'stroke-width': 1.2 }, g);
        el('line', { x1: cfg.at, y1: b, x2: cfg.at + tk, y2: b, stroke: color, 'stroke-width': 1.2 }, g);
      }
      // label near the bracket, oriented like the edge
      const mid = (a + b) / 2;
      let lx = cfg.at, ly = mid;
      if (side === 'bottom') { lx = mid; ly = cfg.labelY; }
      if (side === 'top') { lx = mid; ly = cfg.labelY; }
      if (side === 'left') { lx = cfg.at + 8; ly = mid; }
      if (side === 'right') { lx = cfg.at - 8; ly = mid; }
      // Label: canonical neighborhood colour kept as the FILL; +12 % size,
      // heavier weight and a thin cream halo make it read over the centre
      // artwork. Halo only — no banner, no box, the artwork stays visible.
      const lbl = txt(g, lx, ly, nb, { size: NB_LABEL.size, weight: NB_LABEL.weight, fill: color });
      halo(lbl, NB_LABEL.halo, NB_LABEL.haloColor);
      if (cfg.labelRot) lbl.setAttribute('transform', 'rotate(' + cfg.labelRot + ' ' + lx + ' ' + ly + ')');
      // Regum micro-note: tiny, visually secondary, editable
      if (nb === 'רגום' && NEIGHBORHOODS['רגום'].microNote) {
        // shifted up (878→864) so the enlarged 22.5 label (top ≈ 870) does not collide
        const lines = wrapLines(NEIGHBORHOODS['רגום'].microNote, 46).slice(0, 3);
        lines.forEach((line, i) => {
          const t2 = txt(g, mid, 864 - i * 7, line, { size: 5, fill: '#8b7d63', maxW: b - a });
          if (cfg.labelRot) t2.setAttribute('transform', 'rotate(' + cfg.labelRot + ' ' + mid + ' ' + (864 - i * 7) + ')');
        });
      }
    }
  }

  // The one dedicated "מונופול" overlay. Drawn as editable vectors on top of the
  // centre artwork, it never touches BG1.png and never re-enables the legacy
  // three-line centre group. A Monopoly-era red banner with cream lettering and
  // a dark outline, tilted to match the artwork's נהריה logo.
  function renderCenterLabel(g) {
    const L = MONOPOLY_LABEL;
    const wrap = el('g', {
      'data-monopoly-label': L.text,
      'data-role': 'monopoly-overlay',
      transform: 'translate(' + L.cx + ' ' + L.cy + ') rotate(' + L.rot + ')',
      'pointer-events': 'none',
    }, g);
    // soft drop shadow so the plate separates from the blue backdrop
    el('rect', { x: -L.w / 2 + 2.5, y: -L.h / 2 + 3, width: L.w, height: L.h, rx: 9, fill: '#3a0f0b', opacity: 0.28 }, wrap);
    // red banner plate with a dark keyline
    el('rect', { x: -L.w / 2, y: -L.h / 2, width: L.w, height: L.h, rx: 9, fill: L.plate, stroke: L.shadow, 'stroke-width': 2 }, wrap);
    // thin cream inner rule, as on the classic banner
    el('rect', { x: -L.w / 2 + 3.5, y: -L.h / 2 + 3.5, width: L.w - 7, height: L.h - 7, rx: 6, fill: 'none', stroke: L.plateEdge, 'stroke-width': 1.2, opacity: 0.9 }, wrap);
    // cream lettering, dark outline/shadow for separation
    const t = txt(wrap, 0, 0, L.text, { size: L.size, weight: L.weight, fill: L.ink });
    t.setAttribute('dominant-baseline', 'central');
    halo(t, 2.4, L.shadow);
    return wrap;
  }

  // Layer order inside the centre, bottom → top:
  //   1. centre base   2. BG1   3. hairline frame   4. dedicated מונופול overlay
  //   5. legacy wordmark group (disabled — SHOW_CENTER_TITLE stays false)
  // The perimeter tiles are drawn later by renderBoard, so they always sit on
  // top of this layer and are never touched by it.
  function renderCenter(root) {
    const g = el('g', { id: 'center-layer' }, root);
    const A = CENTER_AREA;
    // 1. board-centre base
    el('rect', { x: A.x, y: A.y, width: A.w, height: A.h, fill: '#f1e8d2' }, g);
    // 2. centre background artwork — square source into the square area
    const img = el('image', {
      x: A.x, y: A.y, width: A.w, height: A.h,
      href: CENTER_BG,
      preserveAspectRatio: 'xMidYMid slice',
      'pointer-events': 'none',
      'data-center-bg': CENTER_BG,
    }, g);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', CENTER_BG);
    // 3. inner hairline frame — kept above the artwork, exactly as before
    el('rect', { x: 108, y: 108, width: 784, height: 784, fill: 'none', stroke: '#c9b98f', 'stroke-width': 1 }, g);
    // 4. the dedicated מונופול overlay — always drawn, independent of the
    //    legacy centre-title switch below
    renderCenterLabel(g);
    // 5. QR overlay — a separate vector layer above BG1, seated in the blue
    //    counter of the letter ה in the artwork's baked-in "נהריה" wordmark.
    //    Square, unrotated, quiet zone intact; BG1.png is never touched.
    const QR = { x: 354.4, y: 371.5, size: 34, href: 'pic/qr.svg' };
    const qrImg = el('image', {
      x: QR.x, y: QR.y, width: QR.size, height: QR.size,
      href: QR.href,
      preserveAspectRatio: 'xMidYMid meet',
      'pointer-events': 'none',
      'data-qr': 'https://rec0rd.com/creator',
      'data-qr-box': QR.x + ',' + QR.y + ',' + QR.size + ',' + QR.size,
    }, g);
    qrImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', QR.href);
    // 5. legacy wordmark — unchanged typography; a very soft cream wash under
    //    the glyphs keeps it readable over the artwork without becoming a plate
    if (SHOW_CENTER_TITLE) {
      halo(txt(g, 500, 462, BOARD_DATA.CENTER.wordmarkTop, { size: 46, weight: 800, fill: '#8f2f28' }), 3);
      halo(txt(g, 500, 545, BOARD_DATA.CENTER.wordmark, { size: 78, weight: 800, fill: '#8f2f28' }), 5);
      halo(txt(g, 500, 585, BOARD_DATA.CENTER.tag, { size: 13, fill: '#6b5f4a' }), 2);
    }
  }

  const SVG_CSS = 'text{user-select:none}';

  function renderBoard() {
    const svg = document.getElementById('board-svg');
    svg.setAttribute('viewBox', '0 0 1000 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const style = el('style', {}, svg); style.textContent = SVG_CSS;
    const root = el('g', { id: 'board-root' }, svg);
    renderCenter(root);
    for (const t of TILES) renderTile(t, root);
    renderNeighborhoodBrackets(root);
  }

  // ---- editor control panel (outside the printable board) ----
  function initControls() {
    const input = document.getElementById('board-size');
    const label = document.getElementById('size-label');
    function apply(cm) {
      const v = Math.min(120, Math.max(10, Number(cm) || 46.5));
      document.documentElement.style.setProperty('--board-size', v + 'cm');
      label.textContent = v + ' cm × ' + v + ' cm (1:1)';
    }
    input.addEventListener('change', function () { apply(input.value); });
    document.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-preset'); apply(input.value); });
    });
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        document.body.classList.toggle('print-preview', b.getAttribute('data-mode') === 'print');
      });
    });
    apply(46.5);
  }

  // ---- self-checks (acceptance list) ----
  function runChecks() {
    const LOCKED_CORNER_READING = { 1: 'bottom', 11: 'left', 21: 'top', 31: 'right' };
    const c = { tileCount: TILES.length, orderOk: true, streets: 0, cornersOk: true, typeAt: {}, groupOk: true, errors: [], orientation: {} };
    TILES.forEach(function (t, i) {
      if (t.title !== BOARD_DATA.CANONICAL_ORDER[i]) { c.orderOk = false; c.errors.push('order@' + (i + 1) + ': ' + t.title); }
      if (t.type === 'street') c.streets++;
      c.typeAt[t.number] = t.type;
      c.orientation[t.number] = { side: t.side, rotation: t.rotation };
    });
    [1, 11, 21, 31].forEach(function (n) {
      const t = TILES[n - 1];
      if (t.side !== LOCKED_CORNER_READING[n]) { c.cornersOk = false; c.errors.push('cornerReading@' + n); }
    });
    [6, 16, 26, 36].forEach(function (n) { if (c.typeAt[n] !== 'carriage') c.errors.push('carriage@' + n); });
    [3, 18, 34].forEach(function (n) { if (c.typeAt[n] !== 'luck') c.errors.push('luck@' + n); });
    [8, 23, 37].forEach(function (n) { if (c.typeAt[n] !== 'event') c.errors.push('event@' + n); });
    // ---- canonical purchase prices + fee (this pass) ----
    // Classic Monopoly progression, LOCKED. Order follows tile number.
    const LOCKED_STREET_PRICES = [60, 60, 100, 100, 120, 140, 140, 160, 180, 180, 200, 220, 220, 240, 260, 260, 280, 300, 300, 320, 350, 400];
    const streetPrices = TILES.filter(function (t) { return t.type === 'street'; }).map(function (t) { return t.price; });
    c.streetPriceCount = streetPrices.length;
    c.pricesOk = streetPrices.length === LOCKED_STREET_PRICES.length && JSON.stringify(streetPrices) === JSON.stringify(LOCKED_STREET_PRICES);
    if (!c.pricesOk) c.errors.push('street-prices: ' + streetPrices.join(','));
    [6, 16, 26, 36].forEach(function (n) { if (TILES[n - 1].price !== 200) c.errors.push('carriage-price@' + n); });
    [13, 29].forEach(function (n) { if (TILES[n - 1].price !== 150) c.errors.push('special-price@' + n); });
    // Paired media/utility rule — declared as data, no engine.
    c.utilityPairOk = [TILES[12], TILES[28]].every(function (t) {
      return t.notes && t.notes.utilityGroup === 'media' && t.notes.pairWith && t.notes.rent &&
        t.notes.rent.oneOwned === 'dice × 4' && t.notes.rent.bothOwned === 'dice × 10';
    });
    if (!c.utilityPairOk) c.errors.push('utility-pair');
    if (TILES[38].payment !== 100) c.errors.push('t39-payment');
    if (TILES[38].price != null) c.errors.push('t39-must-not-be-purchasable');
    // Tile 5: payment instruction + auxiliary callout art (this pass).
    if (TILES[4].payment !== 200) c.errors.push('t5-payment');
    if (!(TILES[4].notes && TILES[4].notes.centerCallout === 'pic/41.png')) c.errors.push('t5-callout');
    // Board centre: the auxiliary background artwork fills the centre only, and
    // must never become one of the 40 tile images.
    const centreBg = document.querySelector('#center-layer image[data-center-bg]');
    c.centerBgOk = !!centreBg && centreBg.getAttribute('data-center-bg') === CENTER_BG;
    c.centerBgSquare = !!centreBg && CENTER_AREA.w === CENTER_AREA.h;
    if (!c.centerBgOk) c.errors.push('center-bg');
    // ---- dedicated מונופול overlay (this pass) ----
    // Exactly ONE banner, and it is the only title text the centre carries: no
    // duplicate נהריה (the artwork supplies it) and no legacy sketch tag.
    const labelWrap = document.querySelectorAll('#center-layer [data-monopoly-label]');
    c.monopolyLabelCount = labelWrap.length;
    const labelText = document.querySelector('#center-layer [data-monopoly-label] text');
    c.monopolyLabelOk = labelWrap.length === 1 && !!labelText && labelText.textContent === MONOPOLY_LABEL.text;
    if (!c.monopolyLabelOk) c.errors.push('monopoly-label');
    const centreTexts = Array.prototype.slice.call(document.querySelectorAll('#center-layer text')).map(function (x) { return x.textContent; });
    c.centerNoDuplicateNahariya = centreTexts.indexOf('נהריה') === -1;
    c.centerNoSketchTag = !centreTexts.some(function (s) { return s.indexOf('סקיצת מבנה') !== -1; });
    if (!c.centerNoDuplicateNahariya) c.errors.push('center-duplicate-nahariya');
    if (!c.centerNoSketchTag) c.errors.push('center-sketch-tag');
    // ---- 1. neighborhood labels readable over the centre artwork (this pass) ----
    // All 8 must keep their canonical color as the fill and carry the cream halo.
    const nbLabels = Array.prototype.slice.call(document.querySelectorAll('#neighborhood-layer text'));
    const named = nbLabels.filter(function (x) { return Object.prototype.hasOwnProperty.call(NEIGHBORHOOD_COLORS, x.textContent); });
    c.neighborhoodLabels = named.length;
    c.neighborhoodLabelsOk = named.length === 8 && named.every(function (x) {
      const nb = x.textContent;
      return x.getAttribute('fill') === NEIGHBORHOOD_COLORS[nb] &&
        Number(x.getAttribute('font-size')) === NB_LABEL.size &&
        Number(x.getAttribute('font-weight')) === NB_LABEL.weight &&
        x.getAttribute('stroke') === NB_LABEL.haloColor &&
        Number(x.getAttribute('stroke-width')) === NB_LABEL.halo &&
        x.getAttribute('paint-order') === 'stroke';
    });
    if (!c.neighborhoodLabelsOk) c.errors.push('neighborhood-labels');
    if (nbLabels.some(function (x) { return x.getAttribute('stroke-width') && Number(x.getAttribute('stroke-width')) > 4; })) c.errors.push('neighborhood-label-banner');
    // ---- 2. carriage direction labels (this pass) ----
    // Exact approved wording, read from the SAME source the cards use, on all four.
    const cc = BOARD_DATA.CARRIAGE_CARDS || {};
    c.carriageLabels = [6, 16, 26, 36].map(function (n) {
      const x = document.querySelector('[data-carriage-label="' + n + '"]');
      return x ? x.textContent : null;
    }).filter(Boolean);
    c.carriageLabelsOk = [6, 16, 26, 36].every(function (n) {
      const x = document.querySelector('[data-carriage-label="' + n + '"]');
      return !!x && !!cc[n] && x.textContent === cc[n].name;
    }) && document.querySelectorAll('[data-carriage-label]').length === 4;
    if (!c.carriageLabelsOk) c.errors.push('carriage-labels');
    if (!c.centerBgSquare) c.errors.push('center-bg-area');
    if (TILES.some(function (t) { return t.imageAsset === CENTER_BG || imageHref(t.number) === CENTER_BG; })) c.errors.push('center-bg-must-not-be-a-tile');
    // The callout must never enter the tile-number mapping.
    if (TILES.some(function (t) { return t.imageAsset === 'pic/41.png'; })) c.errors.push('t5-callout-must-not-be-a-tile');
    // Tile 21: the free-parking corner story (this pass) — exact wording.
    const t21 = TILES[20].notes || {};
    c.cornerStoryOk = JSON.stringify(t21.storySetup) === JSON.stringify(['יום שישי, געתון, אוטו.', 'שלוש טעויות ברצף.']) && t21.storyPunch === 'המתן תור.';
    if (!c.cornerStoryOk) c.errors.push('t21-corner-story');
    // Tile 29 (הכבלים): the approved flavor line, drawn on the tile from the
    // same canonical source the ownership card prints. Exactly one instance, on
    // tile 29, text identical to the record.
    const t29el = document.querySelector('[data-tile29-line]');
    const t29note = (BOARD_DATA.UTILITY_CARDS[29] || {}).note || '';
    const norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
    c.t29Line = t29el ? t29el.getAttribute('data-tile29-line') : null;
    c.t29LineOk = !!t29el && c.t29Line === t29note &&
      document.querySelectorAll('[data-tile29-line]').length === 1 &&
      !!document.querySelector('[data-tile="29"] [data-tile29-line]');
    c.t29TextOk = !!t29el && norm(Array.prototype.map.call(t29el.querySelectorAll('text'), function (x) { return x.textContent; }).join(' ')) === norm(t29note);
    if (!c.t29LineOk) c.errors.push('t29-flavor-line');
    if (!c.t29TextOk) c.errors.push('t29-flavor-text');
    if (TILES.length !== 40) c.errors.push('tile-count:' + TILES.length);
    const trump = TILES.filter(function (t) { return t.neighborhood === 'גבעת טרומפלדור'; }).map(function (t) { return t.street; });
    if (JSON.stringify(trump) !== JSON.stringify(['החלוץ', 'דרך בר כוכבא', 'יהודה המכבי'])) c.errors.push('trumpeldor-streets');
    if (TILES.some(function (t) { return t.street && t.street.indexOf('טרומפלדור') !== -1; })) c.errors.push('no-street-named-trumpeldor');
    for (const nb in NEIGHBORHOODS) {
      const set = TILES.filter(function (t) { return t.neighborhood === nb; }).map(function (t) { return t.street; });
      if (JSON.stringify(set) !== JSON.stringify(NEIGHBORHOODS[nb].streets)) { c.groupOk = false; c.errors.push('group:' + nb); }
    }
    if (c.errors.some(function (e) { return e.indexOf('cornerReading@') === 0; })) c.cornersOk = false;
    return c;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderBoard();
    initControls();
    const checks = runChecks();
    window.NM_CHECKS = checks;
    console.info('[NM] tiles rendered:', TILES.length, '| order ok:', checks.orderOk, '| streets:', checks.streets, '| corners ok:', checks.cornersOk, '| groups ok:', checks.groupOk, '| prices ok:', checks.pricesOk, '| utility pair ok:', checks.utilityPairOk, '| t21 story ok:', checks.cornerStoryOk, '| t29 line ok:', checks.t29LineOk, '| centre bg ok:', checks.centerBgOk, '| nb labels ok:', checks.neighborhoodLabelsOk, '| carriage labels:', checks.carriageLabels.join(' · '));
    if (checks.errors.length) console.warn('[NM] check issues:', checks.errors);
    // The webfont can arrive after this first render, so re-run every measured
    // fit once it settles — the fit is always derived from the natural size.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { refitText(); });
  });

  // Exposed for automated verification: tile number → source image.
  function imageMap() {
    const m = {};
    for (const t of TILES) m[t.number] = imageHref(t.number);
    return m;
  }

  // Exposed for automated verification: tile number → canonical price / fee.
  function priceMap() {
    const m = {};
    for (const t of TILES) {
      if (t.price != null) m[t.number] = { kind: 'purchase', price: t.price };
      else if (t.payment != null) m[t.number] = { kind: 'fee', payment: t.payment };
    }
    return m;
  }

  window.NM = { renderBoard: renderBoard, runChecks: runChecks, imageMap: imageMap, priceMap: priceMap };
})();
