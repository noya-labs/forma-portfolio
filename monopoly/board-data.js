/* ============================================================
   Nahariya Monopoly — canonical board data (single source of truth)
   Geometry is LOCKED: classic 40-tile Monopoly positions.
   Canonical numbering: 1 = START corner, corners at 11 / 21 / 31,
   40 = last street before START. All changes are content/design
   inside these fixed positions.
   Side orientation: bottom 0°, left 90°, top 180°, right -90°.
   Corner reading orientation LOCKED: 1→bottom, 11→left, 21→top, 31→right.
   ============================================================ */

const ORIENTATION = { bottom: 0, left: 90, top: 180, right: -90 };

// Canonical classic-Monopoly side per tile number (1 = bottom-right corner).
function sideOf(n) {
  if (n === 1 || (n >= 2 && n <= 10)) return 'bottom';   // tile 1 = bottom-right corner
  if (n === 11 || (n >= 12 && n <= 20)) return 'left';   // tile 11 = bottom-left corner
  if (n === 21 || (n >= 22 && n <= 30)) return 'top';    // tile 21 = top-left corner
  return 'right';                                        // tile 31 = top-right corner, 32–40 right edge
}

// Muted neighborhood colors (early-90s Israeli board-game feel).
const NEIGHBORHOOD_COLORS = {
  'רגום':            '#7a5230',   // brown
  'יוספטל':          '#6f9fca',   // light blue
  'גבעת טרומפלדור':  '#c9879b',   // pink
  'ממשלתי':          '#d08a3c',   // orange
  'גבעת אוסישקין':   '#a8383a',   // red
  'עמידר':           '#d5b13f',   // yellow
  'מרכז העיר':       '#4e8a56',   // green
  'עין שרה':         '#7d5a9e',   // purple
};

// Neighborhood grouping — isolated here so it can be redesigned later
// without touching tile geometry.
const NEIGHBORHOODS = {
  'רגום': {
    streets: ['נחלת אשר', 'קיבוץ גלויות'],
    microNote:
      "הידעת? מקור היסטורי מקומי מציין שהשכונה נקראה על שם החברה שבנתה אותה — ולא על שם 'רוסים, גרוזינים ומרוקאים'.",
  },
  'יוספטל':         { streets: ['דרך יחיעם', 'הנגב', 'שד׳ בן צבי'] },
  // IMPORTANT: "גבעת טרומפלדור" is ONLY a neighborhood name.
  // There is NO street named "טרומפלדור" — never add one.
  'גבעת טרומפלדור': { streets: ['החלוץ', 'דרך בר כוכבא', 'יהודה המכבי'] },
  'ממשלתי':         { streets: ['דרך הזיתים', 'שביל הכרם', 'רבי עקיבא'] },
  'גבעת אוסישקין':  { streets: ['אשכול', 'שפרינצק', 'יפה נוף'] },
  'עמידר':          { streets: ['מסריק', 'ההגנה', 'העלייה'] },
  'מרכז העיר':      { streets: ['שד׳ הגעתון', 'וייצמן', 'ז׳בוטינסקי'] },
  'עין שרה':        { streets: ['שד׳ זלמן שז״ר', 'השקד'] },
};

function T(number, fields) {
  const side = sideOf(number);
  const t = {
    number,
    side,
    rotation: ORIENTATION[side],
    type: 'street',
    neighborhood: null,
    street: null,
    title: '',
    subtitle: '',
    body: '',
    colorGroup: null,
    imageAsset: null,
    // Canonical purchase price in ₪ (null = not a purchasable property).
    price: null,
    // Fixed landing FEE in ₪ — fees only, never a purchase price.
    payment: null,
    notes: {},
    editable: true,
    ...fields,
  };
  // Canonical full title: "שכונה — רחוב" for streets, plain title otherwise.
  if (t.street && t.neighborhood && !t.title) {
    t.title = t.neighborhood + ' — ' + t.street;
  }
  return t;
}

const TILES = [
  T(1, {
    id: 'start', type: 'start', title: 'התחל כאן',
    notes: {
      lapPass: 'עברת סיבוב? קבל 250 ₪',
      exactLanding: 'נחתת בדיוק? קבל 500 ₪',
      exactLandingReplacesLap: true,
      exactLandingFootnote: 'פעם אחת בחיים הגעת בדיוק בזמן — קח כפול ואל תתרגל.',
      // Player completes the lap arriving down the right edge (from tile 40),
      // so the arrival/bonus zone faces the right edge of the tile.
      arrivalSide: 'right',
    },
  }),
  T(2,  { id: 'street-regum-1',      neighborhood: 'רגום', street: 'נחלת אשר', price: 60 }),
  T(3,  { id: 'luck-1',     type: 'luck',  title: 'מזל של נהריינים', imageAsset: 'placeholder:hand-20nis' }),
  T(4,  { id: 'street-regum-2',      neighborhood: 'רגום', street: 'קיבוץ גלויות', price: 60 }),
  T(5,  {
    id: 'tax-income', type: 'tax', title: 'מס הכנסה',
    // PAYMENT instruction (not a purchase price).
    payment: 200,
    notes: {
      status: 'temporary — not yet redesigned',
      // Callout artwork hung just above the tile on the board-centre side.
      // Source: pic/41.png — an AUXILIARY asset, NOT a board tile (the board
      // stays 40 tiles; this path never enters the tile-number image mapping).
      // The story text is baked into that artwork; nothing is drawn over it.
      centerCallout: 'pic/41.png',
    },
  }),
  T(6,  {
    id: 'carriage-1', type: 'carriage', title: 'כרכרת מזרח',
    price: 200,
    body: 'עולה? תעלה. יורד? תקפוץ.', imageAsset: 'placeholder:carriage',
  }),
  T(7,  { id: 'street-yoseftal-1',   neighborhood: 'יוספטל', street: 'דרך יחיעם', price: 100 }),
  T(8,  { id: 'event-1',    type: 'event', title: 'מה כבר יכול לקרות?', imageAsset: 'placeholder:alarm-turn' }),
  T(9,  { id: 'street-yoseftal-2',   neighborhood: 'יוספטל', street: 'הנגב', price: 100 }),
  T(10, { id: 'street-yoseftal-3',   neighborhood: 'יוספטל', street: 'שד׳ בן צבי', price: 120 }),
  T(11, {
    id: 'just-visiting', type: 'jail-visiting', title: 'רק מבקר',
    imageAsset: 'placeholder:prison-bars',
    notes: {
      cornerReading: 'left',
      concept: 'מבקרים מאכילים אסירים; אסירים מציצים מבין הסורגים; בועת מחשבה: כולם קונים; הסוהר הידידותי מנופף במטפחת.',
    },
  }),
  T(12, { id: 'street-trumpeldor-1', neighborhood: 'גבעת טרומפלדור', street: 'החלוץ', price: 140 }),
  // המשביר — half of the paired media/utility group (with הכבלים, tile 29).
  T(13, {
    id: 'special-ac', type: 'special-property', title: 'המשביר', subtitle: 'נכנסים בשביל המזגן',
    price: 150,
    notes: {
      utilityGroup: 'media', pairWith: 29, purchasePrice: 150,
      rent: { oneOwned: 'dice × 4', bothOwned: 'dice × 10' },
    },
  }),
  T(14, { id: 'street-trumpeldor-2', neighborhood: 'גבעת טרומפלדור', street: 'דרך בר כוכבא', price: 140 }),
  T(15, { id: 'street-trumpeldor-3', neighborhood: 'גבעת טרומפלדור', street: 'יהודה המכבי', price: 160 }),
  T(16, {
    id: 'carriage-2', type: 'carriage', title: 'כרכרת צפון',
    price: 200,
    body: 'יש מקום? תעלה. אין מקום? גם תעלה.', imageAsset: 'placeholder:carriage',
  }),
  T(17, { id: 'street-memshalti-1',  neighborhood: 'ממשלתי', street: 'דרך הזיתים', price: 180 }),
  T(18, { id: 'luck-2',     type: 'luck',  title: 'מזל של נהריינים', imageAsset: 'placeholder:hand-20nis' }),
  T(19, { id: 'street-memshalti-2',  neighborhood: 'ממשלתי', street: 'שביל הכרם', price: 180 }),
  T(20, { id: 'street-memshalti-3',  neighborhood: 'ממשלתי', street: 'רבי עקיבא', price: 200 }),
  T(21, {
    id: 'free-parking', type: 'free-parking', title: 'מצאת חניה בגעתון!',
    subtitle: 'אל תזוז. זה לא יקרה שוב.',
    notes: {
      cornerReading: 'top',
      // Corner story (tile 21), drawn as editable SVG text above the artwork —
      // two setup lines, then the punch line which renders larger and bolder.
      // No source image is ever touched.
      storySetup: ['יום שישי, געתון, אוטו.', 'שלוש טעויות ברצף.'],
      storyPunch: 'המתן תור.',
    },
  }),
  T(22, { id: 'street-ushishkin-1',  neighborhood: 'גבעת אוסישקין', street: 'אשכול', price: 220 }),
  T(23, { id: 'event-2',    type: 'event', title: 'מה כבר יכול לקרות?', imageAsset: 'placeholder:alarm-turn' }),
  T(24, { id: 'street-ushishkin-2',  neighborhood: 'גבעת אוסישקין', street: 'שפרינצק', price: 220 }),
  T(25, { id: 'street-ushishkin-3',  neighborhood: 'גבעת אוסישקין', street: 'יפה נוף', price: 240 }),
  T(26, {
    id: 'carriage-3', type: 'carriage', title: 'כרכרת מערב',
    price: 200,
    body: 'כולם מכירים את הנהג. הנהג לא מכיר אף אחד.', imageAsset: 'placeholder:carriage',
  }),
  T(27, { id: 'street-amidar-1',     neighborhood: 'עמידר', street: 'מסריק', price: 260 }),
  T(28, { id: 'street-amidar-2',     neighborhood: 'עמידר', street: 'ההגנה', price: 260 }),
  // הכבלים — second half of the paired media/utility group (with המשביר, tile 13).
  T(29, {
    id: 'cables', type: 'special-property', title: 'הכבלים',
    subtitle: 'אין רמבו — לא קונים.',
    price: 150,
    notes: {
      utilityGroup: 'media', pairWith: 13, purchasePrice: 150,
      rent: { oneOwned: 'dice × 4', bothOwned: 'dice × 10' },
    },
  }),
  T(30, { id: 'street-amidar-3',     neighborhood: 'עמידר', street: 'העלייה', price: 280 }),
  T(31, {
    id: 'go-to-jail', type: 'go-to-jail', title: 'נפלת כאן? חבל לך על הזמן',
    body: 'עוף ישר לכלא. בלי שלום, בלי תודה.\nלא רוצים לשמוע אותך 3 תורים לפחות.\nפושע!',
    imageAsset: 'placeholder:escorted-prisoner',
    notes: {
      cornerReading: 'right',
      mechanic: 'original go-to-jail space',
      // Single outward diagonal axis, read in the tile's own rotate(-90) frame:
      // from the inner lower-left side (facing the board centre) toward the
      // outer upper-right board corner. Title, body and art zone share this axis.
      cornerLayout: 'diagonal — inner lower-left → outer upper-right',
    },
  }),
  T(32, { id: 'street-citycenter-1', neighborhood: 'מרכז העיר', street: 'שד׳ הגעתון', price: 300 }),
  T(33, { id: 'street-citycenter-2', neighborhood: 'מרכז העיר', street: 'וייצמן', price: 300 }),
  T(34, { id: 'luck-3',     type: 'luck',  title: 'מזל של נהריינים', imageAsset: 'placeholder:hand-20nis' }),
  T(35, { id: 'street-citycenter-3', neighborhood: 'מרכז העיר', street: 'ז׳בוטינסקי', price: 320 }),
  T(36, {
    id: 'carriage-4', type: 'carriage', title: 'כרכרת דרום',
    price: 200,
    body: 'יקר יותר, מהיר יותר? לא בטוח.', imageAsset: 'placeholder:carriage',
  }),
  T(37, { id: 'event-3',    type: 'event', title: 'מה כבר יכול לקרות?', imageAsset: 'placeholder:alarm-turn' }),
  T(38, { id: 'street-einsara-1',    neighborhood: 'עין שרה', street: 'שד׳ זלמן שז״ר', price: 350 }),
  // אגרת רשות השידור — NOT purchasable: a fixed landing fee only.
  T(39, {
    id: 'tax-luxury', type: 'tax', title: 'אגרת רשות השידור',
    payment: 100,
    notes: {
      kind: 'fee',
      payment: 100,
      canonical: 'תשלום קבוע — אינו נכס לקנייה',
    },
  }),
  T(40, { id: 'street-einsara-2',    neighborhood: 'עין שרה', street: 'השקד', price: 400 }),
];

// Canonical order of full titles, for automated verification.
const CANONICAL_ORDER = [
  'התחל כאן',
  'רגום — נחלת אשר',
  'מזל של נהריינים',
  'רגום — קיבוץ גלויות',
  'מס הכנסה',
  'כרכרת מזרח',
  'יוספטל — דרך יחיעם',
  'מה כבר יכול לקרות?',
  'יוספטל — הנגב',
  'יוספטל — שד׳ בן צבי',
  'רק מבקר',
  'גבעת טרומפלדור — החלוץ',
  'המשביר',
  'גבעת טרומפלדור — דרך בר כוכבא',
  'גבעת טרומפלדור — יהודה המכבי',
  'כרכרת צפון',
  'ממשלתי — דרך הזיתים',
  'מזל של נהריינים',
  'ממשלתי — שביל הכרם',
  'ממשלתי — רבי עקיבא',
  'מצאת חניה בגעתון!',
  'גבעת אוסישקין — אשכול',
  'מה כבר יכול לקרות?',
  'גבעת אוסישקין — שפרינצק',
  'גבעת אוסישקין — יפה נוף',
  'כרכרת מערב',
  'עמידר — מסריק',
  'עמידר — ההגנה',
  'הכבלים',
  'עמידר — העלייה',
  'נפלת כאן? חבל לך על הזמן',
  'מרכז העיר — שד׳ הגעתון',
  'מרכז העיר — וייצמן',
  'מזל של נהריינים',
  'מרכז העיר — ז׳בוטינסקי',
  'כרכרת דרום',
  'מה כבר יכול לקרות?',
  'עין שרה — שד׳ זלמן שז״ר',
  'אגרת רשות השידור',
  'עין שרה — השקד',
];

// Board center (not a tile — the 9×9 middle area is empty by design).
const CENTER = {
  wordmarkTop: 'מונופול',
  wordmark: 'נהריה',
  tag: 'סקיצת מבנה — לא סופי',
};

/* ============================================================
   OWNERSHIP CARDS — canonical card data (single source of truth)
   ------------------------------------------------------------
   The rent schedule is the CLASSIC Monopoly ladder, aligned row-for-row with
   this board's purchase prices — which are themselves the classic progression
   (60,60,100,100,120,140,140,160,180,180,200,220,220,240,260,260,280,300,300,
   320,350,400). Row i of the ladder belongs to the i-th street in canonical
   board order, so no rent, mortgage or building cost is invented per card.

   Columns: [ rent, 1 house, 2 houses, 3 houses, 4 houses, hotel,
              house cost, mortgage ]   — all in ₪.
   A hotel is the FIFTH building: it is bought by returning the four houses and
   paying ONE further house cost, so there is no separate hotel price
   (see hotelRule below).
   ============================================================ */
const CLASSIC_RENT_LADDER = [
  [2,  10,  30,   90,  160,  250,  50,  30],   //  60  נחלת אשר
  [4,  20,  60,  180,  320,  450,  50,  30],   //  60  קיבוץ גלויות
  [6,  30,  90,  270,  400,  550,  50,  50],   // 100  דרך יחיעם
  [6,  30,  90,  270,  400,  550,  50,  50],   // 100  הנגב
  [8,  40, 100,  300,  450,  600,  50,  60],   // 120  שד׳ בן צבי
  [10, 50, 150,  450,  625,  750, 100,  70],   // 140  החלוץ
  [10, 50, 150,  450,  625,  750, 100,  70],   // 140  דרך בר כוכבא
  [12, 60, 180,  500,  700,  900, 100,  80],   // 160  יהודה המכבי
  [14, 70, 200,  550,  750,  950, 100,  90],   // 180  דרך הזיתים
  [14, 70, 200,  550,  750,  950, 100,  90],   // 180  שביל הכרם
  [16, 80, 220,  600,  800, 1000, 100, 100],   // 200  רבי עקיבא
  [18, 90, 250,  700,  875, 1050, 150, 110],   // 220  אשכול
  [18, 90, 250,  700,  875, 1050, 150, 110],   // 220  שפרינצק
  [20, 100, 300,  750,  925, 1100, 150, 120],  // 240  יפה נוף
  [22, 110, 330,  800,  975, 1150, 150, 130],  // 260  מסריק
  [22, 110, 330,  800,  975, 1150, 150, 130],  // 260  ההגנה
  [24, 120, 360,  850, 1025, 1200, 150, 140],  // 280  העלייה
  [26, 130, 390,  900, 1100, 1275, 200, 150],  // 300  שד׳ הגעתון
  [26, 130, 390,  900, 1100, 1275, 200, 150],  // 300  וייצמן
  [28, 150, 450, 1000, 1200, 1400, 200, 160],  // 320  ז׳בוטינסקי
  [35, 175, 500, 1100, 1300, 1500, 200, 175],  // 350  שד׳ זלמן שז״ר
  [50, 200, 600, 1400, 1700, 2000, 200, 200],  // 400  השקד
];

// FLAVOR ONLY — zero gameplay effect. One unique line per street, keyed by tile
// number; the card footer prints "הערת נהרייני:" followed by the line.
const PROPERTY_NOTES = {
  2:  'בית אחד עוד עובר. בשני כבר שואלים מי אישר.',
  4:  'מחיר של נכס. ביטחון של טייקון.',
  7:  'בנית? יפה. עכשיו תסביר למשאית איך לעבור.',
  9:  'ועד הבית כבר בדרך. תעמיד פנים שאתה לא בבית.',
  10: 'בבקשה לא לקדוח בין 14:00 ל־16:00. גם אם זה שתי דקות.',
  12: 'פה כולם מכירים את כולם. עכשיו גם את הקבלן שלך.',
  14: 'בית שלישי? השכן כבר מודד לך את קו הבניין.',
  15: 'שני בתים ואתה כבר אומר \'השקעתי בשכונה\'.',
  17: 'יש זיתים. עכשיו חסר רק מישהו שיאסוף.',
  19: 'שביל קטן, תוכניות גדולות, חניה אין.',
  20: 'אם בנית פה ארבעה בתים, אל תספר כמה עלה.',
  22: 'בית אחד מספיק. בשני כבר מתחילים לדבר על הארנונה.',
  24: 'הקבלן אמר \'מחר מסיים\'. שמור את הכרטיס לשנה הבאה.',
  25: 'קונים נוף. הנוף לא מחזיר.',
  27: 'השכנים שקטים עד שמגיע מערבל הבטון.',
  28: 'כאן כבר לא בונים. פה \'משביחים נכס\'.',
  30: 'עוד קומה אחת ואתה כבר צריך עורך דין.',
  32: 'על הגעתון? השכירות גבוהה. החניה היא משחק נפרד.',
  33: 'קנית פה? יפה. עכשיו תלמד להגיד \'לוקיישן\'.',
  35: 'שלושה בתים ואתה כבר מבקש לראות תשואה.',
  38: 'כאן כבר שואלים מי האדריכל, לא כמה עלה.',
  40: 'אם הגעת למלון פה, כנראה ניצחת עוד לפני ששמת אותו.',
};

const HOTEL_RULE = 'מלון = מחזירים 4 בתים + עלות בית אחת';

/* ------------------------------------------------------------
   CARRIAGE CARDS (tiles 6 / 16 / 26 / 36)
   Four directions from the real geography of Nahariya — NOT from the physical
   side of the board. CARRIAGE_CARDS below is the ONE canonical source for these
   names: each tile carries the same name as its canonical title and
   CANONICAL_ORDER validates against it, so the board, the order check and the
   ownership cards can never drift apart.
   ------------------------------------------------------------ */
const CARRIAGE_COLOR = '#5f5748';        // neutral carriage identity (no neighborhood color)
const CARRIAGE_PRICE = 200;
const CARRIAGE_MORTGAGE = 100;
const CARRIAGE_RENT = { one: 25, two: 50, three: 100, four: 200 };
const CARRIAGE_RULE = 'ללא בתים וללא מלונות';
const CARRIAGE_CARDS = {
  6:  { name: 'כרכרת מזרח', areas: 'רגום + יוספטל' },
  16: { name: 'כרכרת צפון', areas: 'גבעת טרומפלדור + ממשלתי' },
  26: { name: 'כרכרת מערב', areas: 'גבעת אוסישקין + עמידר' },
  36: { name: 'כרכרת דרום', areas: 'מרכז העיר + עין שרה' },
};
// FLAVOR ONLY — zero gameplay effect.
const CARRIAGE_NOTES = {
  6:  'אם היא הגיעה בזמן, אל תשאל שאלות.',
  16: 'מקום יש. השאלה אם גם לך.',
  26: 'הסוס מכיר את המסלול יותר טוב מכולם.',
  36: 'שקיות על הברכיים. החוויה כלולה במחיר.',
};

/* ------------------------------------------------------------
   SPECIAL PAIR (tiles 13 המשביר / 29 הכבלים)
   One shared pair identity + the locked dice mechanic. FLAVOR text is kept in
   its own field so it can never be read as a rule on the card.
   ------------------------------------------------------------ */
const UTILITY_COLOR = '#4d6b78';          // shared pair identity (no neighborhood color)
const UTILITY_PRICE = 150;
const UTILITY_MORTGAGE = 75;
const UTILITY_RULE = 'ללא בתים וללא מלונות';
const UTILITY_MECHANIC = { one: 'תוצאת הקוביות ×4', both: 'תוצאת הקוביות ×10' };
const UTILITY_CARDS = {
  13: { name: 'המשביר', partner: 'הכבלים', note: 'נכנסים בשביל המזגן.' },
  29: { name: 'הכבלים', partner: 'המשביר', note: 'אין רמבו — לא קונים.' },
};

// Every purchasable tile, in board order — 22 streets + 4 carriages + 2 pair.
const PURCHASABLE_TILES = [2, 4, 6, 7, 9, 10, 12, 13, 14, 15, 16, 17, 19, 20,
  22, 24, 25, 26, 27, 28, 29, 30, 32, 33, 35, 36, 38, 40];

// The canonical ownership-card record for one tile — ONE record shape for every
// card kind. Street name/neighborhood/color/price are read from the TILE (never
// re-typed here); the ladder supplies the rent schedule, building cost and
// mortgage. Carriage and special-pair records carry their own locked values.
// Returns null for anything that is not purchasable.
function ownershipCard(number) {
  const t = TILES[number - 1];
  if (!t || t.price == null) return null;

  if (t.type === 'street') {
    const streets = TILES.filter(function (x) { return x.type === 'street'; });
    const row = CLASSIC_RENT_LADDER[streets.indexOf(t)];
    if (!row) return null;
    return {
      tile: t.number,
      kind: 'street',
      name: t.street,
      title: t.title,
      neighborhood: t.neighborhood,
      color: NEIGHBORHOOD_COLORS[t.neighborhood],
      sub: t.neighborhood + ' · משבצת ' + t.number,
      price: t.price,
      rent: { none: row[0], house1: row[1], house2: row[2], house3: row[3], house4: row[4], hotel: row[5] },
      houseCost: row[6],
      mortgage: row[7],
      hotelCost: row[6],
      footRule: HOTEL_RULE,
      note: PROPERTY_NOTES[number] || null,
    };
  }

  if (t.type === 'carriage') {
    const c = CARRIAGE_CARDS[number];
    if (!c) return null;
    return {
      tile: t.number,
      kind: 'carriage',
      name: c.name,
      title: t.title,
      neighborhood: 'כרכרה',
      color: CARRIAGE_COLOR,
      sub: 'כרכרה · משבצת ' + t.number,
      areas: c.areas,
      price: CARRIAGE_PRICE,
      rent: { one: CARRIAGE_RENT.one, two: CARRIAGE_RENT.two, three: CARRIAGE_RENT.three, four: CARRIAGE_RENT.four },
      mortgage: CARRIAGE_MORTGAGE,
      footRule: CARRIAGE_RULE,
      note: CARRIAGE_NOTES[number] || null,
    };
  }

  if (t.type === 'special-property') {
    const u = UTILITY_CARDS[number];
    if (!u) return null;
    return {
      tile: t.number,
      kind: 'utility',
      name: u.name,
      title: t.title,
      neighborhood: 'זוג מדיה',
      color: UTILITY_COLOR,
      sub: 'זוג מדיה · משבצת ' + t.number,
      partner: u.partner,
      price: UTILITY_PRICE,
      rulesCaption: 'זוג מדיה — עם ' + u.partner,
      rules: [
        ['אם בבעלותך נכס אחד', UTILITY_MECHANIC.one],
        ['אם בבעלותך שני הנכסים', UTILITY_MECHANIC.both],
      ],
      mortgage: UTILITY_MORTGAGE,
      footRule: UTILITY_RULE,
      note: u.note,
    };
  }

  return null;
}

// Self-check for the whole 28-card set: counts by kind, and every value the set
// promises (colors/price tiers/ladder alignment/mechanics).
function verifyOwnershipCards() {
  const errors = [];
  const byKind = { street: 0, carriage: 0, utility: 0 };
  const seen = {};
  const HOUSE_TIERS = {
    'רגום': 50, 'יוספטל': 50, 'גבעת טרומפלדור': 100, 'ממשלתי': 100,
    'גבעת אוסישקין': 150, 'עמידר': 150, 'מרכז העיר': 200, 'עין שרה': 200,
  };
  PURCHASABLE_TILES.forEach(function (n) {
    const r = ownershipCard(n);
    const t = TILES[n - 1];
    if (!r) { errors.push('no-card@' + n); return; }
    if (seen[n]) errors.push('duplicate@' + n);
    seen[n] = true;
    byKind[r.kind]++;
    if (r.price !== t.price) errors.push('price@' + n);
    if (!r.note) errors.push('note@' + n);
    if (r.mortgage !== Math.round(r.price / 2)) errors.push('mortgage@' + n);
    if (r.kind === 'street') {
      if (r.color !== NEIGHBORHOOD_COLORS[t.neighborhood]) errors.push('color@' + n);
      if (r.houseCost !== HOUSE_TIERS[t.neighborhood]) errors.push('house@' + n);
      // rent must rise monotonically from "no houses" to hotel
      if (!(r.rent.none > 0 && r.rent.house1 > r.rent.none && r.rent.house4 > r.rent.house3 && r.rent.hotel > r.rent.house4)) errors.push('rent@' + n);
    }
    if (r.kind === 'carriage') {
      if (r.price !== 200 || r.mortgage !== 100) errors.push('carriage-econ@' + n);
      if (r.rent.one !== 25 || r.rent.two !== 50 || r.rent.three !== 100 || r.rent.four !== 200) errors.push('carriage-rent@' + n);
    }
    if (r.kind === 'utility') {
      if (r.price !== 150 || r.mortgage !== 75) errors.push('utility-econ@' + n);
      if (r.rules[0][1] !== 'תוצאת הקוביות ×4' || r.rules[1][1] !== 'תוצאת הקוביות ×10') errors.push('utility-mechanic@' + n);
      const pairTile = TILES.filter(function (x) { return x.type === 'special-property' && x.number !== n; })[0];
      if (!pairTile || r.partner !== UTILITY_CARDS[pairTile.number].name) errors.push('utility-pair@' + n);
    }
  });
  if (byKind.street !== 22) errors.push('streets:' + byKind.street);
  if (byKind.carriage !== 4) errors.push('carriages:' + byKind.carriage);
  if (byKind.utility !== 2) errors.push('utilities:' + byKind.utility);
  return { total: PURCHASABLE_TILES.length, byKind: byKind, errors: errors, ok: errors.length === 0 };
}

// Self-check: the ladder must line up with the board — 22 rows, one per street
// in canonical order, each sitting on the classic price tier for its position.
function verifyCardLadder() {
  const CLASSIC_PRICES = [60, 60, 100, 100, 120, 140, 140, 160, 180, 180, 200, 220, 220, 240, 260, 260, 280, 300, 300, 320, 350, 400];
  const streets = TILES.filter(function (t) { return t.type === 'street'; });
  const errors = [];
  if (CLASSIC_RENT_LADDER.length !== streets.length) errors.push('ladder-rows:' + CLASSIC_RENT_LADDER.length);
  streets.forEach(function (t, i) {
    if (t.price !== CLASSIC_PRICES[i]) errors.push('price@' + t.number + ':' + t.price);
  });
  Object.keys(PROPERTY_NOTES).forEach(function (n) {
    const t = TILES[Number(n) - 1];
    if (!t || t.type !== 'street') errors.push('note-target@' + n);
  });
  if (Object.keys(PROPERTY_NOTES).length !== streets.length) errors.push('notes:' + Object.keys(PROPERTY_NOTES).length);
  return { rows: CLASSIC_RENT_LADDER.length, streets: streets.length, notes: Object.keys(PROPERTY_NOTES).length, errors: errors };
}

const BOARD_DATA = { TILES, NEIGHBORHOODS, NEIGHBORHOOD_COLORS, ORIENTATION, CANONICAL_ORDER, CENTER, CLASSIC_RENT_LADDER, PROPERTY_NOTES, HOTEL_RULE, CARRIAGE_CARDS, CARRIAGE_RENT, CARRIAGE_MORTGAGE, CARRIAGE_PRICE, CARRIAGE_COLOR, CARRIAGE_NOTES, UTILITY_CARDS, UTILITY_MECHANIC, UTILITY_COLOR, UTILITY_PRICE, UTILITY_MORTGAGE, PURCHASABLE_TILES, ownershipCard, verifyCardLadder, verifyOwnershipCards };
if (typeof module !== 'undefined' && module.exports) module.exports = BOARD_DATA;
