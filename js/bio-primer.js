/* ==========================================================================
   Bio primer — "biology for programmers" sections.
   One function per module (CBB.Primer.m1 … m11) returns lesson HTML: an
   analogy-driven introduction for readers with zero biology background, a
   static SVG illustration, a biology ↔ computer-science glossary and a
   one-line summary. Loaded BEFORE the curriculum files, which embed the
   output at the top of every lesson. Pure presentation: no app logic here.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const HEB = /[֐-׿]/;

  /* ───────────── SVG helpers ───────────── */
  const COLORS = ["ink", "dim", "faint", "accent", "cyan", "ok", "warn", "danger", "u"];
  const defs = (fid) =>
    `<defs><linearGradient id="bf-heat-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#ef4444"/><stop offset="1" stop-color="#3b82f6"/></linearGradient>${COLORS.map(
      (c) =>
        `<marker id="bf-ar-${fid}-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0.8 L10 5 L0 9.2 z" class="bf-fill-${c}"/></marker>`
    ).join("")}</defs>`;

  /** Text that may be Hebrew (RTL) or Latin. `anchor` is visual: start = left edge at x. */
  const txt = (x, y, s, cls = "", anchor = "middle") => {
    const rtl = HEB.test(s);
    let ta = anchor;
    if (rtl) ta = anchor === "start" ? "end" : anchor === "end" ? "start" : "middle";
    return `<text x="${x}" y="${y}" class="bf-tx ${cls}" text-anchor="${ta}"${rtl ? ' direction="rtl"' : ""}>${esc(s)}</text>`;
  };
  const lines = (x, y, arr, cls = "", anchor = "middle", lh = 15) => arr.map((s, i) => txt(x, y + i * lh, s, cls, anchor)).join("");
  const box = (x, y, w, h, cls = "", r = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" class="bf-box ${cls}"/>`;
  const line = (x1, y1, x2, y2, cls = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bf-ln ${cls}"/>`;
  const arrow = (fid, x1, y1, x2, y2, c = "accent", cls = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bf-ln bf-ln-${c} ${cls}" marker-end="url(#bf-ar-${fid}-${c})"/>`;
  const parrow = (fid, d, c = "accent", cls = "") => `<path d="${d}" class="bf-ln bf-ln-${c} ${cls}" fill="none" marker-end="url(#bf-ar-${fid}-${c})"/>`;
  const NT = { A: "a", C: "c", G: "g", T: "t", U: "u" };
  const tile = (x, y, b, s = 24, cls = "") => {
    const k = NT[b] || "x";
    return `<g class="bf-nt bf-nt-${k} ${cls}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${Math.round(s * 0.22)}"/><text x="${x + s / 2}" y="${y + s / 2}" dominant-baseline="central" text-anchor="middle">${b === "-" ? "–" : b}</text></g>`;
  };
  const tiles = (x, y, seq, s = 24, gap = 4, clsFn) => [...seq].map((b, i) => tile(x + i * (s + gap), y, b, s, clsFn ? clsFn(b, i) : "")).join("");
  const idx = (x, y, n, s = 24, gap = 4, start = 0) =>
    Array.from({ length: n }, (_, i) => txt(x + i * (s + gap) + s / 2, y, String(start + i), "bf-tx-xs bf-tx-faint bf-mono")).join("");
  const badge = (x, y, n, c = "accent") =>
    `<circle cx="${x}" cy="${y}" r="10" class="bf-fill-${c}"/><text x="${x}" y="${y}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-tx-white bf-tx-b bf-tx-sm">${n}</text>`;
  /** Monospace code chip (LTR). */
  const chip = (x, y, s, cls = "", w = 0, h = 22) => {
    const ww = w || Math.round(s.length * 7.4 + 16);
    return `${box(x, y, ww, h, "bf-box-code " + cls, 6)}<text x="${x + ww / 2}" y="${y + h / 2}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-sm">${esc(s)}</text>`;
  };
  /** Rounded label pill with Hebrew text. */
  const pill = (x, y, w, s, cls = "", h = 22) =>
    `${box(x, y, w, h, "bf-pill " + cls, h / 2)}${txt(x + w / 2, y + h / 2 + 4.5, s, "bf-tx-sm bf-tx-b " + cls.replace(/bf-box-/g, "bf-tx-"))}`;
  /** Simplified double helix: two sine strands with rungs. */
  const helix = (x0, cy, w, amp, cls = "") => {
    const n = 48;
    let a = "", b = "", rungs = "";
    for (let i = 0; i <= n; i++) {
      const x = x0 + (w * i) / n;
      const ph = (i / n) * Math.PI * 4;
      const ya = cy + amp * Math.sin(ph), yb = cy - amp * Math.sin(ph);
      a += (i ? "L" : "M") + x.toFixed(1) + "," + ya.toFixed(1);
      b += (i ? "L" : "M") + x.toFixed(1) + "," + yb.toFixed(1);
      if (i % 4 === 2) rungs += `<line x1="${x.toFixed(1)}" y1="${ya.toFixed(1)}" x2="${x.toFixed(1)}" y2="${yb.toFixed(1)}" class="bf-helix-rung"/>`;
    }
    return `<g class="bf-helix ${cls}">${rungs}<path d="${a}" class="bf-helix-a"/><path d="${b}" class="bf-helix-b"/></g>`;
  };
  /** Jigsaw piece with a knob on its bottom edge (used for tRNA). */
  const knobPiece = (x, y, w, h, r, cls = "") =>
    `<path d="M${x},${y} H${x + w} V${y + h} H${x + w / 2 + r} A${r},${r} 0 0 1 ${x + w / 2 - r},${y + h} H${x} Z" class="bf-box ${cls}"/>`;
  /** Jigsaw piece with a socket cut into its top edge (used for codons). */
  const socketPiece = (x, y, w, h, r, cls = "") =>
    `<path d="M${x},${y} H${x + w / 2 - r} A${r},${r} 0 0 0 ${x + w / 2 + r},${y} H${x + w} V${y + h} H${x} Z" class="bf-box ${cls}"/>`;

  /* ───────────── Section builders ───────────── */
  const figure = (id, w, h, title, body, caption) => `
<figure class="bio-fig" id="bf-${id}">
  <div class="bio-fig-head"><span class="bio-fig-badge">איור</span><span class="bio-fig-title">${title}</span></div>
  <div class="bio-fig-stage" dir="ltr"><svg class="bf-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">${defs(id)}${body}</svg></div>
  <figcaption>${caption}</figcaption>
</figure>`;

  const glossary = (rows) => `
<h3>מילון מונחים: ביולוגיה ↔ מדעי המחשב</h3>
<table class="table analogy-table">
  <thead><tr><th>בביולוגיה</th><th>במדעי המחשב</th><th>למה הדימוי עובד</th></tr></thead>
  <tbody>${rows.map(([b, c, w]) => `<tr><td><strong>${b}</strong></td><td>${c}</td><td>${w}</td></tr>`).join("")}</tbody>
</table>`;

  const section = ({ lead, fig, rows, oneLiner }) => `
<div class="primer">
${lead}
${fig}
${glossary(rows)}
<div class="callout callout-key">
  <div class="callout-title">בשורה אחת</div>
  <p>${oneLiner}</p>
</div>
</div>`;

  const P = {};

  /* ═══════════════════ Module 1: the cell as a computer ═══════════════════ */
  P.m1 = () => {
    const f = "m1", W = 760, H = 350;
    let s = "";
    s += box(12, 14, 736, 322, "bf-box-cell", 70);
    s += txt(736, 328, "התא", "bf-tx-sm bf-tx-faint", "end");
    s += txt(722, 40, "ציטופלזמה = שאר התא, שם ההוראות מבוצעות", "bf-tx-xs bf-tx-faint", "end");
    // nucleus
    s += `<circle cx="160" cy="180" r="118" class="bf-nucleus"/>`;
    s += txt(160, 90, "גרעין = חדר השרתים", "bf-tx-b");
    s += txt(160, 106, "עותק האב לעולם לא יוצא מכאן", "bf-tx-xs bf-tx-dim");
    // helix + gene
    s += `<rect x="128" y="128" width="70" height="46" rx="8" class="bf-box bf-box-dashed-accent"/>`;
    s += txt(163, 122, "גן = קובץ אחד", "bf-tx-xs bf-tx-accent");
    s += helix(78, 151, 164, 15);
    s += txt(160, 190, "DNA = הדיסק הקשיח", "bf-tx-b bf-tx-accent");
    // transcription arrow
    s += arrow(f, 160, 197, 160, 225, "accent");
    s += badge(128, 212, 1);
    s += txt(172, 215, "שעתוק = copy", "bf-tx-sm bf-tx-b", "start");
    // mRNA strip (inside nucleus, through the pore, to the ribosome)
    const mrna = "AUGGCCAUUGUAGGCCGC";
    s += `<ellipse cx="440" cy="264" rx="52" ry="26" class="bf-ribo"/>`;
    s += `<ellipse cx="440" cy="219" rx="40" ry="17" class="bf-ribo"/>`;
    s += `<rect x="266" y="230" width="34" height="23" class="bf-fill-stage"/>`;
    s += tiles(100, 232, mrna, 18, 3);
    s += txt(160, 275, "mRNA = עותק עבודה ב-RAM", "bf-tx-sm bf-tx-b bf-tx-u");
    // nuclear pore
    s += box(264, 220, 38, 9, "bf-box-cyan", 3);
    s += box(264, 254, 38, 9, "bf-box-cyan", 3);
    s += txt(283, 274, "נקבובית הגרעין", "bf-tx-xs bf-tx-cyan");
    s += txt(283, 287, "= אפיק הנתונים", "bf-tx-xs bf-tx-cyan");
    s += badge(283, 308, 2);
    s += txt(268, 311, "העותק יוצא החוצה", "bf-tx-xs bf-tx-dim", "end");
    // ribosome labels (the ellipses are drawn behind the strip)
    s += txt(440, 306, "ריבוזום = המפרש", "bf-tx-sm bf-tx-b bf-tx-cyan");
    s += txt(440, 320, "קורא 3 אותיות בכל פעם", "bf-tx-xs bf-tx-dim");
    // protein chain
    const beads = [[486, 232], [516, 206], [548, 184], [582, 166], [617, 152], [652, 142]];
    const aa = ["M", "A", "I", "V", "G", "R"];
    s += `<polyline points="${beads.map((p) => p.join(",")).join(" ")}" class="bf-chain"/>`;
    beads.forEach(([x, y], i) => {
      s += `<circle cx="${x}" cy="${y}" r="11" class="bf-bead"/><text x="${x}" y="${y}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-b bf-tx-sm bf-tx-accent">${aa[i]}</text>`;
    });
    s += badge(516, 286, 3);
    s += txt(532, 289, "תרגום = הרצת ההוראות", "bf-tx-sm bf-tx-b", "start");
    s += txt(640, 112, "חלבון = התוכנית שרצה", "bf-tx-b bf-tx-ok");
    s += txt(640, 127, "שרשרת של חומצות אמינו שמתקפלת למכונה", "bf-tx-xs bf-tx-dim");
    // what proteins do
    s += box(566, 186, 170, 88, "bf-box-ok", 10);
    s += txt(651, 206, "מה \"התוכנית\" עושה?", "bf-tx-sm bf-tx-b bf-tx-ok");
    s += lines(726, 226, ["אנזים: מזרז תגובה כימית", "תעלה: מעביר חומרים דרך הקרום", "חיישן: מזהה אות מבחוץ"], "bf-tx-xs bf-tx-dim", "end", 16);
    const fig = figure(f, W, H, "מפת התא כמחשב: מהדיסק הקשיח ועד התוכנית שרצה", s,
      "זרימת המידע בתא: (1) בגרעין, ההוראות לבניית חלבון מועתקות מה-DNA לעותק עבודה זמני (mRNA); (2) העותק יוצא דרך נקבובית בקרום הגרעין; (3) הריבוזום קורא אותו שלוש אותיות בכל פעם ומרכיב חלבון. הגנום עצמו, כמו דיסק אב, נשאר בגרעין.");
    return section({
      lead: `
<p>אם מעולם לא למדתם ביולוגיה, הנה כל מה שצריך כדי להתחיל, במונחים שאתם כבר מכירים. <strong>DNA</strong> הוא הדיסק הקשיח של התא: עותק אב של כל ההוראות, שמור בתוך <strong>הגרעין</strong> (חדר השרתים) ולעולם לא יוצא ממנו. <strong>גן</strong> הוא קובץ אחד על הדיסק הזה: ההוראות לבניית מכונה אחת. כשהתא צריך את המכונה, הוא לא שולח את הדיסק עצמו, אלא מעתיק את הקובץ ל-<strong>mRNA</strong>: עותק עבודה זמני, כמו קובץ שנטען לזיכרון ה-RAM. העותק יוצא דרך <strong>נקבובית הגרעין</strong>, האפיק שמחבר בין הגרעין לשאר התא, ושם מחכה <strong>הריבוזום</strong>: מפרש (interpreter) שקורא את העותק הוראה אחר הוראה ובונה ממנו <strong>חלבון</strong>, התוכנית שבאמת רצה ועושה את העבודה.</p>
<p>ההעתקה מהדיסק לזיכרון נקראת <strong>שעתוק</strong>, והיא כמעט העתקה מדויקת: ההבדל היחיד הוא שבעותק ה-RNA כל אות <code>T</code> נכתבת כ-<code>U</code>. בשפה של Python, השעתוק כולו הוא <code>dna.replace("T", "U")</code>, וזה בדיוק מה שתכתבו בסוף המודול. כל השאר בשיעור הזה, האלפבית של ארבע האותיות, הזיווג בין הגדילים והכיווניות, הוא הפירוט של אותו סיפור.</p>`,
      fig,
      rows: [
        ["DNA (הגנום)", "דיסק קשיח / ROM", "אחסון ארוך-טווח של כל ההוראות; לא מריצים ממנו ישירות, רק מעתיקים."],
        ["גן", "קובץ אחד (או פונקציה אחת)", "יחידה אחת של הוראות, עם התחלה וסוף, שבונה מכונה אחת."],
        ["גרעין התא", "חדר השרתים", "המקום המוגן שבו שמור עותק האב, עם בקרת גישה."],
        ["mRNA", "עותק בזיכרון RAM", "עותק עבודה זמני, קצר-מועד, שנמחק אחרי השימוש."],
        ["שעתוק", "<code>copy</code> עם החלפת תו", "העתקה כמעט מדויקת: <code>T</code> הופך ל-<code>U</code>, וזה הכול."],
        ["ריבוזום", "מפרש (interpreter)", "קורא את העותק פקודה אחר פקודה (3 אותיות) ומבצע."],
        ["חלבון", "התוכנית שרצה", "התוצר הסופי שעושה עבודה: מזרז, מעביר, מזהה, בונה."],
      ],
      oneLiner: "התא מעתיק קובץ (גן) מהדיסק (DNA) לזיכרון (mRNA), והמפרש (ריבוזום) מריץ אותו ובונה תוכנית (חלבון). מבחינת המחשב, ההעתקה היא החלפת כל <code>T</code> ב-<code>U</code> במחרוזת.",
    });
  };

  /* ═══════════════════ Module 2: the zipper ═══════════════════ */
  P.m2 = () => {
    const f = "m2", W = 760, H = 310;
    const top = "ATATGCGCGC", bot = "TATACGCGCG";
    const S = 26, G = 8, x0 = 40, yT = 96, yB = 176;
    let s = "";
    // heat bar
    s += `<rect x="40" y="30" width="332" height="10" rx="5" class="bf-heat"/>`;
    s += txt(40, 24, "חם", "bf-tx-xs bf-tx-danger", "start");
    s += txt(372, 24, "קר", "bf-tx-xs bf-tx-cyan", "end");
    s += txt(206, 24, "חימום = משיכת הרוכסן", "bf-tx-xs bf-tx-dim");
    // melted region (first 4 pairs) opens up
    [...top].forEach((b, i) => {
      const x = x0 + i * (S + G);
      const open = i < 4;
      const dy = open ? 14 : 0;
      s += tile(x, yT - dy, b, S, open ? "bf-nt-open" : "");
      s += tile(x, yB + dy, bot[i], S, open ? "bf-nt-open" : "");
      const n = b === "A" || b === "T" ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const xx = x + S / 2 + (k - (n - 1) / 2) * 7;
        if (open) s += `<line x1="${xx}" y1="${yT + S - dy + 4}" x2="${xx}" y2="${yT + S - dy + 16}" class="bf-hook bf-hook-broken"/><line x1="${xx}" y1="${yB + dy - 16}" x2="${xx}" y2="${yB + dy - 4}" class="bf-hook bf-hook-broken"/>`;
        else s += `<line x1="${xx}" y1="${yT + S + 3}" x2="${xx}" y2="${yB - 3}" class="bf-hook"/>`;
      }
    });
    s += txt(40 + 2 * 34 - 4, 236, "אזור עשיר ב-AT", "bf-tx-sm bf-tx-b bf-tx-a");
    s += txt(40 + 2 * 34 - 4, 251, "2 ווים לכל זוג: נפתח ראשון", "bf-tx-xs bf-tx-dim");
    s += txt(40 + 7 * 34 - 4, 236, "אזור עשיר ב-GC", "bf-tx-sm bf-tx-b bf-tx-g");
    s += txt(40 + 7 * 34 - 4, 251, "3 ווים לכל זוג: מחזיק מעמד", "bf-tx-xs bf-tx-dim");
    s += txt(x0 - 6, yT + S / 2 + 4, "5′", "bf-tx-xs bf-tx-faint bf-mono", "end");
    s += txt(x0 - 6, yB + S / 2 + 4, "3′", "bf-tx-xs bf-tx-faint bf-mono", "end");
    // bracket for "hooks = hydrogen bonds"
    s += txt(206, 278, "כל זוג בסיסים הוא שן ברוכסן; הווים הם קשרי מימן", "bf-tx-xs bf-tx-faint");
    // stats panel
    s += box(420, 52, 310, 226, "bf-box-panel", 12);
    s += txt(575, 76, "הסטטיסטיקה שהמחשב מחשב", "bf-tx-b");
    s += chip(438, 90, 'dna = "ATATGCGCGC"', "", 274);
    s += txt(716, 134, "G + C = 6", "bf-tx-sm bf-mono bf-tx-g", "end");
    s += txt(716, 154, "N = 10", "bf-tx-sm bf-mono", "end");
    s += txt(716, 176, "GC = 6 / 10 × 100 = 60%", "bf-tx-sm bf-mono bf-tx-b bf-tx-accent", "end");
    s += txt(434, 134, "כמה אותיות הן G או C", "bf-tx-xs bf-tx-dim", "start");
    s += txt(434, 154, "אורך המחרוזת", "bf-tx-xs bf-tx-dim", "start");
    s += txt(434, 176, "האחוז", "bf-tx-xs bf-tx-dim", "start");
    // composition bar
    const comp = { A: 2, T: 2, G: 3, C: 3 };
    let cx = 438;
    ["A", "T", "G", "C"].forEach((b) => {
      const w = (comp[b] / 10) * 274;
      s += `<rect x="${cx}" y="196" width="${w}" height="18" class="bf-comp bf-comp-${b.toLowerCase()}"/><text x="${cx + w / 2}" y="205" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-xs bf-tx-white">${b}:${comp[b]}</text>`;
      cx += w;
    });
    s += txt(716, 236, "GC גבוה ⇒ יותר ווים ⇒ צריך יותר חום להפריד", "bf-tx-xs bf-tx-dim", "end");
    s += txt(716, 254, "ולכן תכולת GC מנבאת את טמפרטורת ההתכה", "bf-tx-xs bf-tx-dim", "end");
    const fig = figure(f, W, H, "הסליל הכפול כרוכסן: למה GC מחזיק חזק יותר", s,
      "משמאל: עשרה זוגות בסיסים כעשר שיני רוכסן. זוגות A–T מחוברים בשני ווים (קשרי מימן), זוגות G–C בשלושה; כשמחממים, הצד העשיר ב-AT נפתח ראשון. מימין: תכולת ה-GC היא ספירה פשוטה על המחרוזת, והיא מנבאת כמה חום יידרש כדי לפתוח את הרוכסן כולו.");
    return section({
      lead: `
<p>דמיינו את הסליל הכפול כ<strong>רוכסן</strong> ארוך: כל "שן" ברוכסן היא זוג בסיסים, ושני הגדילים הם שני צידי הרוכסן. לא כל השיניים נאחזות באותה חוזקה. זוג <code>A</code>–<code>T</code> מחובר בשני ווים (שני קשרי מימן), וזוג <code>G</code>–<code>C</code> בשלושה. חימום הוא כמו למשוך את הרוכסן בכוח: קטעים עם הרבה <code>A</code> ו-<code>T</code> נפתחים ראשונים, וקטעים עשירים ב-<code>G</code> ו-<code>C</code> מחזיקים מעמד זמן רב יותר. הטמפרטורה שבה חצי מהרוכסנים כבר פתוחים נקראת <strong>טמפרטורת ההתכה</strong>.</p>
<p>מבחינת המחשב, <strong>תכולת GC</strong> היא סטטיסטיקה פשוטה על מחרוזת, כמו לספור כמה ביטים דולקים במחרוזת ביטים: עוברים על האותיות, סופרים כמה מהן <code>G</code> או <code>C</code>, ומחלקים באורך. המספר הזה מנבא כמה "כוח" (חום) יידרש כדי לפתוח את הרוכסן, ולכן ביולוגים בודקים אותו לפני כל ניסוי שבו צריך להצמיד או להפריד גדילים, למשל PCR. בהמשך השיעור תראו גם למה המספר הזה משתנה בין מינים ואיך משתמשים בו לבקרת איכות.</p>`,
      fig,
      rows: [
        ["זוג בסיסים", "שן אחת ברוכסן", "יחידה אחת שמחברת את שני הצדדים; הגדילים מחוברים רק דרך הזוגות."],
        ["קשר מימן", "וו קטן", "חיבור חלש שאפשר לפתוח; ככל שיש יותר ווים, קשה יותר להפריד."],
        ["A–T לעומת G–C", "2 ווים לעומת 3", "זה כל ההבדל: G–C פשוט נאחז חזק יותר."],
        ["תכולת GC", "<code>count</code> חלקי <code>len</code>", "אחוז התווים מסוג מסוים במחרוזת, כמו צפיפות ביטים דולקים."],
        ["התכה (דנטורציה)", "פתיחת הרוכסן", "הפרדת שני הגדילים על ידי חום; מתחילה באזורים ה\"חלשים\"."],
        ["טמפרטורת התכה", "סף העומס", "הטמפרטורה שבה חצי מהמולקולות כבר נפתחו; עולה עם תכולת ה-GC."],
      ],
      oneLiner: "DNA הוא רוכסן, זוגות G–C הם שיניים עם וו נוסף, ותכולת GC היא פשוט אחוז השיניים החזקות: ספירה אחת על המחרוזת שמנבאת כמה חום צריך כדי לפתוח את הרוכסן.",
    });
  };

  /* ═══════════════════ Module 3: bit flips and diff ═══════════════════ */
  P.m3 = () => {
    const f = "m3", W = 760, H = 300;
    const ref = "GAGCCTACTAACGGGAT", alt = "CATCGTAATGACGGCCT";
    const PUR = new Set(["A", "G"]);
    const S = 24, G = 4, x0 = 100;
    const kind = (a, b) => (a === b ? "same" : PUR.has(a) === PUR.has(b) ? "ts" : "tv");
    let s = "";
    s += idx(x0, 44, ref.length, S, G);
    s += txt(x0 - 12, 72, "ref (המקור)", "bf-tx-sm bf-tx-b", "end");
    s += txt(x0 - 12, 148, "alt (העותק)", "bf-tx-sm bf-tx-b", "end");
    s += tiles(x0, 56, ref, S, G);
    s += tiles(x0, 132, alt, S, G, (b, i) => (kind(ref[i], b) === "same" ? "" : "bf-nt-" + kind(ref[i], b)));
    let d = 0;
    const bits = [];
    [...ref].forEach((a, i) => {
      const k = kind(a, alt[i]);
      const x = x0 + i * (S + G) + S / 2;
      if (k === "same") s += txt(x, 112, "=", "bf-tx-sm bf-tx-faint bf-mono");
      else {
        d += 1;
        s += txt(x, 112, "≠", "bf-tx-sm bf-tx-b bf-mono " + (k === "ts" ? "bf-tx-warn" : "bf-tx-danger"));
      }
      bits.push(k === "same" ? 0 : 1);
    });
    // bit row
    s += txt(x0 - 12, 196, "a != b", "bf-tx-sm bf-mono bf-tx-dim", "end");
    bits.forEach((bit, i) => {
      const x = x0 + i * (S + G);
      s += `<rect x="${x}" y="182" width="${S}" height="20" rx="4" class="bf-bit ${bit ? "bf-bit-1" : ""}"/><text x="${x + S / 2}" y="192" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-sm ${bit ? "bf-tx-white bf-tx-b" : "bf-tx-faint"}">${bit}</text>`;
    });
    const xe = x0 + ref.length * (S + G) + 6;
    s += txt(xe, 196, `Σ = ${d}`, "bf-tx-b bf-mono bf-tx-accent", "start");
    s += txt(x0 + (ref.length * (S + G)) / 2, 228, "מרחק המינג = מספר העמדות השונות = סכום הביטים", "bf-tx-sm bf-tx-dim");
    // legend
    s += `<rect x="100" y="252" width="14" height="14" rx="4" class="bf-fill-warn"/>`;
    s += txt(120, 264, "טרנזיציה: אות הוחלפה ב\"דומה\" לה (A↔G, C↔T), כמו 0 במקום O", "bf-tx-xs bf-tx-dim", "start");
    s += `<rect x="100" y="274" width="14" height="14" rx="4" class="bf-fill-danger"/>`;
    s += txt(120, 286, "טרנסברזיה: אות הוחלפה באות מהמשפחה האחרת, כמו X במקום O", "bf-tx-xs bf-tx-dim", "start");
    const fig = figure(f, W, H, "מוטציות כ-bit flips: diff בין המקור לעותק", s,
      "שני עותקים של אותו קטע DNA, מיושרים אינדקס מול אינדקס. בכל עמדה בודקים אם האותיות שוות (=) או שונות (≠), כותבים 0 או 1, וסוכמים: שבע עמדות שונות, ולכן מרחק המינג הוא 7. צבע האות בעותק מסמן את סוג ההחלפה.");
    return section({
      lead: `
<p>כשתא מתחלק הוא מעתיק את כל הגנום, ולפעמים נופלת שגיאת הקלדה: אות אחת מוחלפת באחרת. זו <strong>מוטציה נקודתית</strong>, המקבילה הביולוגית ל-<em>bit flip</em>, ביט אחד שהתהפך בזיכרון. רוב ההחלפות האלה לא משנות דבר, חלקן גורמות לבאג (מחלה), ומעטות הן דווקא שיפור. כשמשווים את העותק המקורי לעותק החדש, <strong>מרחק המינג</strong> הוא פשוט מספר העמדות השונות: בדיוק מה ש-<code>diff</code> או <code>cmp</code> מדווחים כשמשווים שני קבצים באותו אורך.</p>
<p>יש שני סוגים של "שגיאות הקלדה". <strong>טרנזיציה</strong> מחליפה אות באות שדומה לה בצורתה הכימית (כמו להקליד <code>0</code> במקום <code>O</code>): קל לעשות אותה, ולכן היא שכיחה. <strong>טרנסברזיה</strong> מחליפה אות באות מהמשפחה האחרת (כמו <code>X</code> במקום <code>O</code>), ונדירה יותר. <strong>SNP</strong> הוא "שגיאת הקלדה" ותיקה כל כך שאנשים רבים נושאים אותה, כמו שתי גרסאות של אותו קובץ הגדרות שמסתובבות באוכלוסייה. ככל ששני גנומים צברו יותר הבדלים, כך הם התפצלו מוקדם יותר, וזו הדרך שבה סופרים "כמה זמן עבר" מאז האב הקדמון המשותף.</p>`,
      fig,
      rows: [
        ["שכפול הגנום", "העתקת קובץ", "התא מעתיק את כל ההוראות לפני שהוא מתחלק; העתקה מושלמת היא המטרה, לא תמיד התוצאה."],
        ["מוטציה נקודתית", "bit flip / שגיאת הקלדה", "תו אחד השתנה; הכול סביבו נשאר במקום."],
        ["טרנזיציה / טרנסברזיה", "החלפה ב\"דומה\" / ב\"שונה\"", "החלפה בין אותיות דומות קלה יותר, ולכן נפוצה יותר; כמו טעויות הקלדה בין מקשים סמוכים."],
        ["SNP", "גרסה נפוצה של אותו קובץ", "עמדה שבה אנשים שונים נושאים אותיות שונות; הבסיס לבדיקות גנטיות."],
        ["מרחק המינג", "<code>sum(a != b)</code> / פלט של diff", "מספר העמדות השונות בין שתי מחרוזות באותו אורך."],
        ["אינדל", "הכנסה/מחיקה של תו", "מזיז את כל מה שאחריו; לכן מרחק המינג לא מתאים לו, וצריך יישור (מודולים 7 ו-11)."],
      ],
      oneLiner: "מוטציה היא ביט שהתהפך בעותק, ומרחק המינג הוא ה-diff: עוברים על שתי המחרוזות במקביל וסופרים כמה עמדות שונות.",
    });
  };

  /* ═══════════════════ Module 4: Ctrl+F and the sliding window ═══════════════════ */
  P.m4 = () => {
    const f = "m4", W = 760, H = 372;
    const dna = "GATATATGCATATACTT", motif = "ATAT";
    const S = 24, G = 4, x0 = 60, m = motif.length;
    let s = "";
    s += txt(x0 - 10, 44, "dna", "bf-tx-sm bf-mono bf-tx-dim", "end");
    s += idx(x0, 28, dna.length, S, G);
    s += tiles(x0, 36, dna, S, G);
    s += txt(x0 + dna.length * (S + G) + 8, 52, "← המסמך שבו מחפשים", "bf-tx-xs bf-tx-faint", "start");
    const snap = (y, i, label, lcls) => {
      let r = "";
      const win = dna.slice(i, i + m);
      // window frame on the document row
      r += `<rect x="${x0 + i * (S + G) - 4}" y="${y - 4}" width="${m * (S + G) - G + 8}" height="${S + 8}" rx="8" class="bf-window"/>`;
      r += tiles(x0, y, dna, S, G, (b, j) => (j >= i && j < i + m ? "" : "bf-nt-dim"));
      // pattern under the window + marks
      let ok = true;
      [...motif].forEach((c, j) => {
        const x = x0 + (i + j) * (S + G);
        const good = ok && c === win[j];
        if (!good) ok = false;
        r += tile(x, y + 40, c, S, good ? "bf-nt-ok" : ok === false && c !== win[j] ? "bf-nt-bad" : "bf-nt-dim");
        r += txt(x + S / 2, y + 34, good ? "✓" : c !== win[j] && !ok ? "✗" : "·", "bf-tx-xs bf-tx-b " + (good ? "bf-tx-ok" : "bf-tx-danger"));
      });
      r += txt(x0 - 10, y + 56, "motif", "bf-tx-sm bf-mono bf-tx-dim", "end");
      r += txt(x0 + dna.length * (S + G) + 8, y + 18, label, "bf-tx-sm bf-tx-b " + lcls, "start");
      return r;
    };
    s += snap(84, 1, "i = 1: כל 4 התווים תואמים ⇒ hits.append(1)", "bf-tx-ok");
    s += snap(172, 2, "i = 2: כישלון כבר בתו הראשון ⇒ ממשיכים", "bf-tx-danger");
    s += snap(260, 3, "i = 3: התאמה חופפת ⇒ hits.append(3)", "bf-tx-ok");
    s += chip(x0, 340, "hits = [1, 3, 9]", "bf-box-accent", 150);
    s += txt(x0 + 160, 355, "החלון זז תא אחד בכל צעד, ולכן גם מופעים חופפים (1 ו-3) נמצאים", "bf-tx-xs bf-tx-dim", "start");
    const fig = figure(f, W, H, "Ctrl+F על DNA: החלון הנע, שלושה צעדים", s,
      "למעלה: ה-DNA שבו מחפשים. מתחתיו שלושה צעדים של האלגוריתם: מסגרת ברוחב המוטיב מונחת על אינדקס i, התווים מושווים אחד-אחד (✓ תואם, ✗ לא), ואז המסגרת זזה תא אחד קדימה. שימו לב שההתאמות באינדקסים 1 ו-3 חופפות, ושתיהן נספרות.");
    return section({
      lead: `
<p>גורם שעתוק הוא חלבון שמסתובב על ה-DNA ומחפש "מילה" קצרה, בדיוק כמו <strong>Ctrl+F</strong> בעורך טקסט או <code>grep</code> במסוף. כשהוא מוצא את המילה הוא נצמד אליה, וכך מסמן לתא: "את הגן שליד המילה הזאת צריך להפעיל (או לכבות)". המילה נקראת <strong>מוטיב</strong>, והמקום שבו היא נמצאה הוא <strong>אתר קישור</strong>. אם נחזור לדימוי ממודול 1, המוטיב יושב ב"כותרת" של קובץ הגן ואומר למערכת ההפעלה מתי לטעון אותו.</p>
<p>האלגוריתם שהמחשב מריץ נקרא <strong>חלון נע</strong>: מסגרת ברוחב המוטיב מונחת על תחילת המערך, משווים תו מול תו, ואז מזיזים את המסגרת תא אחד קדימה, וחוזר חלילה עד סוף המערך. בניגוד ל-Ctrl+F רגיל, כאן חייבים לדווח גם על מופעים <strong>חופפים</strong>, כי כל אחד מהם הוא מקום נפרד שבו חלבון יכול להיאחז. ולמה המילים מטושטשות? כי החלבון "סובל" כמה וריאציות של אותה מילה, כמו חיפוש עם תו ג'וקר.</p>`,
      fig,
      rows: [
        ["גורם שעתוק", "תוכנית שמריצה Ctrl+F", "חלבון שסורק את ה-DNA ומחפש מילה קצרה שהוא יודע לזהות."],
        ["מוטיב", "מחרוזת החיפוש", "דפוס קצר (6–20 אותיות) בעל משמעות ביולוגית."],
        ["אתר קישור", "תוצאת החיפוש (אינדקס)", "המקום שבו המילה נמצאה והחלבון נצמד."],
        ["פרומוטור", "כותרת הקובץ / קובץ ההגדרות", "האזור שלפני הגן, שבו יושבות המילים שקובעות מתי להפעיל אותו."],
        ["מוטיב מנוון (IUPAC)", "תו ג'וקר / ביטוי רגולרי", "<code>W</code> = A או T: אותה מילה עם כמה איותים מותרים."],
        ["סריקת גנום", "חלון נע על מערך", "מסגרת בגודל קבוע שזזה תא אחד בכל צעד ומשווה תו מול תו."],
      ],
      oneLiner: "מוטיב הוא מילה קצרה, גורם שעתוק הוא ה-Ctrl+F של התא, והקוד שלכם הוא חלון ברוחב המילה שזז תא אחד בכל פעם ומדווח על כל התאמה, גם חופפת.",
    });
  };

  /* ═══════════════════ Module 5: the interpreter and its opcode table ═══════════════════ */
  P.m5 = () => {
    const f = "m5", W = 760, H = 340;
    const codons = ["AUG", "GCC", "AUU", "GUA", "UGA"];
    const anti = { AUG: "UAC", GCC: "CGG", AUU: "UAA" };
    const aa = { AUG: "Met", GCC: "Ala", AUU: "Ile" };
    const PW = 86, PH = 40, GAP = 8, x0 = 40, yC = 206;
    let s = "";
    // ribosome backdrop over the first two codons
    s += `<rect x="26" y="96" width="206" height="178" rx="44" class="bf-ribo"/>`;
    s += txt(129, 292, "ריבוזום = המפרש", "bf-tx-sm bf-tx-b bf-tx-cyan");
    // codon pieces
    codons.forEach((c, k) => {
      const x = x0 + k * (PW + GAP);
      const cls = c === "AUG" ? "bf-box-ok" : c === "UGA" ? "bf-box-danger" : "bf-box-panel";
      s += socketPiece(x, yC, PW, PH, 10, cls);
      s += tiles(x + 7, yC + 12, c, 22, 3);
      s += txt(x + PW / 2, yC + PH + 14, String(k * 3), "bf-tx-xs bf-tx-faint bf-mono");
    });
    s += txt(x0 + 4 * (PW + GAP) + PW / 2, yC - 8, "עצור = return", "bf-tx-xs bf-tx-b bf-tx-danger");
    s += txt(x0 + 2 * (PW + GAP) + PW / 2 + 47, 272, "mRNA = קובץ ההוראות", "bf-tx-sm bf-tx-b bf-tx-u");
    s += txt(x0 + 2 * (PW + GAP) + PW / 2 + 47, 287, "נקרא במילים של 3 אותיות, בלי רווחים ובלי חפיפה", "bf-tx-xs bf-tx-dim");
    // docked tRNAs (codons 0 and 1)
    const beads = [];
    codons.slice(0, 2).forEach((c, k) => {
      const x = x0 + k * (PW + GAP);
      s += knobPiece(x, 158, PW, 48, 10, "bf-box-accent");
      s += txt(x + PW / 2, 170, "אנטי-קודון", "bf-tx-xs bf-tx-accent");
      s += tiles(x + 7, 176, anti[c], 22, 3);
      s += `<line x1="${x + PW / 2}" y1="154" x2="${x + PW / 2}" y2="158" class="bf-ln bf-ln-accent"/>`;
      beads.push([x + PW / 2, 139, aa[c]]);
    });
    // growing chain
    s += `<line x1="${beads[0][0]}" y1="139" x2="${beads[1][0]}" y2="139" class="bf-chain"/>`;
    s += arrow(f, beads[1][0] + 18, 139, beads[1][0] + 70, 139, "ok");
    s += txt(beads[1][0] + 76, 143, "השרשרת גדלה", "bf-tx-xs bf-tx-ok", "start");
    beads.forEach(([x, y, a]) => {
      s += `<circle cx="${x}" cy="${y}" r="15" class="bf-bead"/><text x="${x}" y="${y}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-b bf-tx-xs bf-tx-accent">${a}</text>`;
    });
    s += txt(30, 88, "חלבון = הפלט (שרשרת שגדלה)", "bf-tx-sm bf-tx-b bf-tx-ok", "start");
    s += txt(30, 72, "tRNA = מתאם: מפתח למטה, ערך למעלה", "bf-tx-xs bf-tx-dim", "start");
    // incoming tRNA for codon 2
    const xi = x0 + 2 * (PW + GAP) + 70, yi = 84;
    s += knobPiece(xi, yi, PW, 48, 10, "bf-box-accent bf-box-dashed-accent");
    s += txt(xi + PW / 2, yi + 12, "אנטי-קודון", "bf-tx-xs bf-tx-accent");
    s += tiles(xi + 7, yi + 18, anti.AUU, 22, 3);
    s += `<circle cx="${xi + PW / 2}" cy="${yi - 19}" r="15" class="bf-bead"/><text x="${xi + PW / 2}" y="${yi - 19}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-b bf-tx-xs bf-tx-accent">Ile</text>`;
    s += parrow(f, `M${xi + 10},${yi + 62} C ${xi - 20},${yi + 90} ${x0 + 2 * (PW + GAP) + PW / 2 + 20},${yC - 40} ${x0 + 2 * (PW + GAP) + PW / 2 + 4},${yC - 2}`, "accent", "bf-ln-dashed");
    s += txt(xi + PW + 8, yi + 30, "הבא בתור: החלק שמתאים", "bf-tx-xs bf-tx-dim", "start");
    s += txt(xi + PW + 8, yi + 44, "לקודון AUU הוא UAA", "bf-tx-xs bf-tx-dim", "start");
    // opcode table panel
    s += box(540, 150, 200, 136, "bf-box-panel", 12);
    s += txt(640, 170, "הקוד הגנטי = טבלת פקודות", "bf-tx-sm bf-tx-b");
    [["\"AUG\": \"M\"", "Met · start"], ["\"GCC\": \"A\"", "Ala"], ["\"AUU\": \"I\"", "Ile"], ["\"UGA\": \"*\"", "stop"]].forEach(([k, v], i) => {
      s += txt(556, 194 + i * 20, k, "bf-tx-sm bf-mono", "start");
      s += txt(726, 194 + i * 20, v, "bf-tx-xs bf-tx-faint bf-mono", "end");
    });
    s += txt(640, 279, "64 מפתחות: 61 פקודות + 3 עצירות", "bf-tx-xs bf-tx-dim");
    s += txt(640, 318, "codon_table[codon]  →  O(1)", "bf-tx-xs bf-tx-accent bf-mono");
    const fig = figure(f, W, H, "קודונים כחלקי פאזל: המפרש, טבלת הפקודות והמתאם", s,
      "ה-mRNA מחולק ל\"מילים\" של שלוש אותיות (קודונים), וכל קודון הוא שקע בפאזל. לכל שקע מתאים רק חלק אחד: מולקולת tRNA שבתחתיתה אנטי-קודון משלים (המפתח) ובראשה חומצת האמינו המתאימה (הערך). הריבוזום מחבר את חומצות האמינו לשרשרת, קודון אחר קודון, עד שהוא פוגש קודון עצירה.");
    return section({
      lead: `
<p>אם mRNA הוא קובץ של הוראות, <strong>הריבוזום</strong> הוא המפרש (interpreter) שמריץ אותו. הוא קורא את הקובץ ב"מילים" קבועות של שלוש אותיות, <strong>קודונים</strong>, בדיוק כמו מעבד שקורא פקודות ברוחב קבוע. לכל קודון יש משמעות אחת, שמוגדרת ב<strong>קוד הגנטי</strong>: טבלת פקודות (opcode table) עם 64 שורות. 61 מהן אומרות "הוסף את חומצת האמינו X לשרשרת", ושלוש אומרות "עצור". הפקודה <code>AUG</code> היא גם נקודת הכניסה, ה-<code>main</code> של הגן, וגם פקודה רגילה שמוסיפה מתיונין.</p>
<p>מי שמבצע את החיפוש בטבלה הוא <strong>tRNA</strong>: מולקולת מתאם שבקצה אחד יש לה "מפתח" (אנטי-קודון) שמתאים לקודון כמו חלק בפאזל, ובקצה השני "ערך", חומצת האמינו הנכונה. אין כאן קסם: זה <code>dict</code> שמומש בכימיה, ו-<code>codon_table[codon]</code> ב-Python עושה בדיוק אותו דבר. התוצר הוא <strong>חלבון</strong>: שרשרת של 20 סוגי אבני בניין (חומצות אמינו) שמתקפלת למכונה עובדת. כשהריבוזום פוגש קודון עצירה הוא משחרר את השרשרת, כמו <code>return</code> שמסיים פונקציה.</p>`,
      fig,
      rows: [
        ["קודון", "פקודה (opcode) ברוחב 3 תווים", "המפרש קורא תמיד שלוש אותיות, ולכן אין צורך ברווחים או במפרידים."],
        ["הקוד הגנטי", "טבלת פקודות / <code>dict</code>", "64 מפתחות אפשריים, ולכל אחד ערך אחד: חומצת אמינו או \"עצור\"."],
        ["tRNA", "מתאם מפתח ↔ ערך", "צד אחד מזהה את הקודון, הצד השני נושא את חומצת האמינו המתאימה."],
        ["ריבוזום", "מפרש / מכונה וירטואלית", "עובר על הקובץ פקודה אחר פקודה ומבצע: מוסיף אבן בניין לשרשרת."],
        ["חומצת אמינו", "אבן בניין (20 סוגים)", "הפלט של כל פקודה; רצף של אבני בניין הוא התוכנית המורכבת."],
        ["קודון התחלה AUG", "<code>main()</code> / נקודת כניסה", "מסמן מאיפה להתחיל לקרוא, וגם מוסיף את חומצת האמינו הראשונה (Met)."],
        ["קודון עצירה", "<code>return</code> / halt", "מסיים את הפונקציה ומשחרר את התוצר; מה שאחריו לא מורץ."],
      ],
      oneLiner: "הריבוזום הוא מפרש שקורא פקודות של 3 אותיות, מחפש כל אחת ב-dict של 64 כניסות (דרך ה-tRNA), ומוסיף אבן בניין לחלבון עד שהוא פוגש return.",
    });
  };

  /* ═══════════════════ Module 6: byte alignment and executable blocks ═══════════════════ */
  P.m6 = () => {
    const f = "m6", W = 760, H = 352;
    const rna = "CCAUGGCCAAAUGACC";
    const STOP = new Set(["UAA", "UAG", "UGA"]);
    const S = 24, G = 4, x0 = 110, col = S + G;
    let s = "";
    s += txt(x0 - 12, 56, "mRNA", "bf-tx-sm bf-mono bf-tx-dim", "end");
    s += idx(x0, 30, rna.length, S, G);
    s += tiles(x0, 40, rna, S, G);
    s += txt(x0 + rna.length * col + 8, 56, "← אותו רצף, שלוש דרכים לחתוך", "bf-tx-xs bf-tx-faint", "start");
    const frameRow = (off, y, note, noteCls) => {
      let r = "";
      r += txt(x0 - 12, y + 19, `מסגרת ${off}`, "bf-tx-sm bf-tx-b", "end");
      r += txt(x0 - 12, y + 33, `מתחילים מאינדקס ${off}`, "bf-tx-xs bf-tx-faint", "end");
      // leftover prefix
      if (off) r += `<rect x="${x0 - 2}" y="${y}" width="${off * col}" height="30" rx="6" class="bf-box bf-box-dashed"/>`;
      let k = off;
      let orfStart = -1, orfEnd = -1;
      while (k + 3 <= rna.length) {
        const c = rna.slice(k, k + 3);
        const cls = c === "AUG" ? "bf-box-ok" : STOP.has(c) ? "bf-box-danger" : "bf-box-panel";
        const x = x0 + k * col - 2;
        r += box(x, y, 3 * col - G + 4, 30, cls, 7);
        r += `<text x="${x + (3 * col - G + 4) / 2}" y="${y + 15}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-b bf-tx-sm ${c === "AUG" ? "bf-tx-ok" : STOP.has(c) ? "bf-tx-danger" : ""}">${c}</text>`;
        if (c === "AUG" && orfStart < 0) orfStart = k;
        if (STOP.has(c) && orfStart >= 0 && orfEnd < 0) orfEnd = k + 3;
        k += 3;
      }
      if (k < rna.length) r += `<rect x="${x0 + k * col - 2}" y="${y}" width="${(rna.length - k) * col}" height="30" rx="6" class="bf-box bf-box-dashed"/>`;
      if (orfStart >= 0 && orfEnd > 0) {
        const xa = x0 + orfStart * col - 6, xb = x0 + orfEnd * col - G + 6;
        r += `<rect x="${xa}" y="${y - 6}" width="${xb - xa}" height="42" rx="10" class="bf-orf-block"/>`;
        r += txt(xa + 2, y - 10, "def", "bf-tx-xs bf-mono bf-tx-ok bf-tx-b", "start");
        r += txt(xb - 2, y - 10, "return", "bf-tx-xs bf-mono bf-tx-danger bf-tx-b", "end");
      }
      r += txt(x0 + rna.length * col + 8, y + 19, note, "bf-tx-xs bf-tx-b " + noteCls, "start");
      return r;
    };
    s += frameRow(0, 96, "אין AUG: אין נקודת כניסה", "bf-tx-faint");
    s += frameRow(1, 166, "AUG בלי return באותה מסגרת: לא ORF", "bf-tx-warn");
    s += frameRow(2, 248, "ORF: בלוק קוד תקין מ-def עד return", "bf-tx-ok");
    s += txt(x0 + (rna.length * col) / 2, 320, "+ שלוש מסגרות נוספות על הגדיל השני (ההשלמה ההפוכה, מודול 8) = 6 מסגרות קריאה בסך הכול", "bf-tx-xs bf-tx-dim");
    s += txt(x0 + (rna.length * col) / 2, 338, "מסגרת מלאה = ירוק להתחלה, אדום לעצירה, מקווקו לשאריות שלא נקראות", "bf-tx-xs bf-tx-faint");
    const fig = figure(f, W, H, "מסגרות קריאה כיישור בתים: אותו רצף, שלוש \"תוכניות\" שונות", s,
      "אותו mRNA נחתך לקודונים משלושה היסטים: 0, 1 ו-2. רק במסגרת 2 מופיע בלוק שלם: קודון התחלה (AUG, הירוק), גוף של קודונים מלאים, וקודון עצירה (UGA, האדום) באותה מסגרת. זה ORF: הקטע שהריבוזום באמת יריץ. במסגרת 1 יש AUG אבל אין עצירה באותה מסגרת, ובמסגרת 0 אין אפילו נקודת כניסה.");
    return section({
      lead: `
<p>קובץ בינארי הוא רצף אחד ארוך של ביטים, ואם מתחילים לקרוא אותו מהבית הלא נכון, כל ה"פקודות" יוצאות ג'יבריש. ל-mRNA יש בדיוק אותה בעיה: הריבוזום קורא שלוש אותיות בכל פעם, ולכן יש שלוש דרכים לחתוך את אותו רצף לקודונים, לפי האות שבה מתחילים (אינדקס 0, 1 או 2). כל חיתוך כזה נקרא <strong>מסגרת קריאה</strong>, ורק אחת מהן נותנת את החלבון הנכון.</p>
<p><strong>מסגרת קריאה פתוחה</strong> (ORF) היא בלוק קוד תקין: מתחיל בקודון ההתחלה <code>AUG</code> (ה-<code>def</code> או ה-<code>main</code> של הגן), ממשיך בקודונים שלמים ומסתיים בקודון עצירה (ה-<code>return</code>) <em>באותה מסגרת</em>. ל-DNA יש שני גדילים שנקראים בכיוונים הפוכים, ולכן בסך הכול יש שש מסגרות לבדוק: שלוש בכל כיוון. ולמה ORF ארוך מרמז על גן אמיתי? כי ברצף אקראי "return" צץ בממוצע כל 20 פקודות; מי שמצא 300 פקודות רצופות בלי עצירה, כנראה מצא קוד שמישהו (האבולוציה) כתב בכוונה. כלים לחיזוי גנים מתחילים בדיוק מהסריקה הזאת.</p>`,
      fig,
      rows: [
        ["מסגרת קריאה", "יישור בתים (byte alignment)", "אותו רצף ביטים, שלושה היסטים התחלה, שלוש \"תוכניות\" שונות לגמרי."],
        ["קודון התחלה AUG", "<code>def</code> / נקודת כניסה", "מכאן המפרש מתחיל לקרוא; בלי זה אין מה להריץ."],
        ["קודון עצירה", "<code>return</code>", "סוף הבלוק; חייב להיות באותה מסגרת, אחרת הוא נקרא כפקודה רגילה."],
        ["ORF", "בלוק קוד תקין (פונקציה שלמה)", "מ-def עד return, בלי return באמצע; מועמד להיות גן."],
        ["שש מסגרות", "3 היסטים × 2 כיווני קריאה", "ל-DNA שני גדילים, וכל אחד נקרא בכיוון שלו, ולכן בודקים את שניהם."],
        ["ORF ארוך", "קוד שנכתב בכוונה", "ברצף אקראי עצירה מופיעה כל ~20 קודונים; מאות קודונים בלי עצירה הם אות ולא רעש."],
      ],
      oneLiner: "מסגרת קריאה היא ההיסט שממנו חותכים לשלשות, ו-ORF הוא בלוק קוד שמתחיל ב-def (AUG) ונגמר ב-return (קודון עצירה) באותה מסגרת. ככל שהבלוק ארוך יותר, כך פחות סביר שהוא מקרי.",
    });
  };

  /* ═══════════════════ Module 7: alignment as diff ═══════════════════ */
  P.m7 = () => {
    const f = "m7", W = 760, H = 312;
    let s = "";
    // left: git-style diff
    s += box(28, 28, 300, 190, "bf-box-panel", 12);
    s += txt(178, 50, "diff בין שתי גרסאות של אותו קובץ", "bf-tx-sm bf-tx-b");
    s += txt(44, 70, "@@ v1 → v2 @@", "bf-tx-xs bf-mono bf-tx-faint", "start");
    const diffLines = [
      ["  GA", "ללא שינוי", "faint", "dim"],
      ["- T", "אות הוחלפה", "warn", "warn"],
      ["+ C", "", "warn", "warn"],
      ["  TACA", "ללא שינוי", "faint", "dim"],
      ["+ T", "אות נוספה", "danger", "danger"],
      ["  G", "ללא שינוי", "faint", "dim"],
    ];
    diffLines.forEach(([code, note, c, nc], i) => {
      const y = 92 + i * 19;
      s += txt(44, y, code, "bf-tx-sm bf-mono bf-tx-" + c, "start");
      if (note) s += txt(312, y, note, "bf-tx-xs bf-tx-" + nc, "end");
    });
    // ancestry fork
    s += `<circle cx="60" cy="262" r="6" class="bf-fill-accent"/>`;
    s += txt(60, 288, "אב קדמון משותף", "bf-tx-xs bf-tx-dim");
    s += line(66, 262, 150, 240, "bf-ln-accent");
    s += line(66, 262, 150, 284, "bf-ln-accent");
    s += `<circle cx="150" cy="240" r="5" class="bf-fill-warn"/><circle cx="150" cy="284" r="5" class="bf-fill-danger"/>`;
    s += txt(162, 244, "רצף 1 (ענף א)", "bf-tx-xs bf-tx-dim", "start");
    s += txt(162, 288, "רצף 2 (ענף ב)", "bf-tx-xs bf-tx-dim", "start");
    s += txt(330, 266, "הומולוגיה = שני ענפים מאותו commit", "bf-tx-xs bf-tx-faint", "end");
    // right: the alignment with scores
    const top = "GATTACA-G", bot = "GACTACATG";
    const S = 26, G = 6, x0 = 376, col = S + G;
    const M = 1, X = -1, GP = -2;
    s += txt(x0 + (top.length * col) / 2, 50, "אותו diff, כתוב כיישור עם ציון", "bf-tx-sm bf-tx-b");
    let total = 0;
    [...top].forEach((a, i) => {
      const b = bot[i];
      const k = a === "-" || b === "-" ? "gap" : a === b ? "match" : "mismatch";
      const sc = k === "gap" ? GP : k === "match" ? M : X;
      total += sc;
      const x = x0 + i * col;
      s += tile(x, 66, a, S, k === "mismatch" ? "bf-nt-ts" : k === "gap" ? "bf-nt-gapcol" : "");
      s += tile(x, 118, b, S, k === "mismatch" ? "bf-nt-ts" : k === "gap" ? "bf-nt-gapcol" : "");
      s += txt(x + S / 2, 108, k === "match" ? "|" : k === "mismatch" ? "·" : " ", "bf-tx-sm bf-mono bf-tx-b " + (k === "match" ? "bf-tx-ok" : "bf-tx-warn"));
      s += txt(x + S / 2, 166, (sc > 0 ? "+" : "") + sc, "bf-tx-sm bf-mono bf-tx-b " + (k === "match" ? "bf-tx-ok" : k === "mismatch" ? "bf-tx-warn" : "bf-tx-danger"));
    });
    s += txt(x0 - 8, 84, "רצף 1", "bf-tx-xs bf-tx-dim", "end");
    s += txt(x0 - 8, 136, "רצף 2", "bf-tx-xs bf-tx-dim", "end");
    s += txt(x0 - 8, 170, "ציון", "bf-tx-xs bf-tx-dim", "end");
    s += chip(x0, 186, `score = ${total}`, "bf-box-accent", 110);
    s += txt(x0 + 120, 201, "= 7·(+1) + 1·(−1) + 1·(−2)", "bf-tx-xs bf-mono bf-tx-dim", "start");
    // legend
    const lg = [["התאמה", "+1", "ok", "אות לא השתנתה"], ["אי-התאמה", "−1", "warn", "אות הוחלפה"], ["פער", "−2", "danger", "אות נוספה או נמחקה"]];
    lg.forEach(([n, v, c, note], i) => {
      const y = 236 + i * 22;
      s += `<rect x="${x0}" y="${y - 10}" width="12" height="12" rx="3" class="bf-fill-${c}"/>`;
      s += txt(x0 + 18, y, n, "bf-tx-xs bf-tx-b", "start");
      s += txt(x0 + 92, y, v, "bf-tx-xs bf-mono bf-tx-" + c, "start");
      s += txt(x0 + 124, y, note, "bf-tx-xs bf-tx-dim", "start");
    });
    const fig = figure(f, W, H, "יישור רצפים הוא diff עם ציון", s,
      "משמאל: שתי גרסאות של אותו \"קובץ\" (שני רצפים שירשו מאב קדמון משותף) והעריכות ביניהן: אות שהוחלפה, אות שנוספה. מימין: אותן עריכות כתובות כיישור, עמודה לכל עמדה, עם מקף במקום האות החסרה. כל עמודה מקבלת ציון, והסכום הוא ציון היישור.");
    return section({
      lead: `
<p>כל מי שעבד עם <code>git</code> מכיר את הרעיון: שני קבצים שיצאו מאותו מקור, ו-<code>diff</code> שמראה מה השתנה ביניהם. <strong>יישור רצפים</strong> הוא ה-diff של הביולוגיה. שני גנים שירשו מאב קדמון משותף (שני ענפים מאותו commit; ביולוגים אומרים <strong>הומולוגיים</strong>) נבדלים זה מזה בשלושה סוגי עריכה: אות שהוחלפה (<strong>אי-התאמה</strong>), אות שנוספה או נמחקה (<strong>פער</strong>, המקף ביישור), ואותיות שלא נגעו בהן (<strong>התאמה</strong>).</p>
<p><strong>פונקציית הניקוד</strong> הופכת את ה-diff למספר אחד: נקודה על כל התאמה, קנס על כל החלפה, וקנס גדול יותר על כל פער, כי הכנסה או השמטה הן אירוע נדיר יותר מהחלפת אות. ככל שהציון גבוה יותר, כך סביר יותר ששני הרצפים באמת קרובים, ולא דומים במקרה. בסוף המודול תכתבו את הפונקציה שמחשבת את הציון הזה עמודה אחר עמודה; במודול 11 תלמדו איך למצוא את היישור <em>הטוב ביותר</em> מבין כל האפשרויות.</p>`,
      fig,
      rows: [
        ["רצפים הומולוגיים", "שני ענפים מאותו commit", "לשניהם מקור משותף; ההבדלים הם העריכות שהצטברו מאז הפיצול."],
        ["יישור", "<code>diff</code> תו-אחר-תו", "מסדר את שני הרצפים כך שכל עמודה מכילה את אותה עמדה מקורית."],
        ["התאמה", "שורה ללא שינוי", "אותו תו בשני הרצפים: מקבל נקודה."],
        ["אי-התאמה", "שורה שנערכה", "תו שהוחלף במוטציה: קנס קטן."],
        ["פער (-)", "שורה שנוספה או נמחקה", "הכנסה או השמטה; קנס גדול יותר, כי זה אירוע נדיר יותר."],
        ["ציון היישור", "סכום נקודות וקנסות", "מספר אחד שמסכם כמה טוב היישור; גבוה = קרבה אמיתית."],
      ],
      oneLiner: "יישור הוא diff בין שני קבצים שהתפצלו מאותו מקור, והציון הוא סכום של נקודות על שורות זהות וקנסות על עריכות, כשהכנסה/מחיקה (פער) עולה יותר מהחלפת אות.",
    });
  };

  /* ═══════════════════ Module 8: map + reverse ═══════════════════ */
  P.m8 = () => {
    const f = "m8", W = 760, H = 330;
    const dna = "ATGCCGTT", comp = "TACGGCAA", rc = "AACGGCAT";
    const S = 26, G = 6, x0 = 210, col = S + G, n = dna.length;
    let s = "";
    const strand = (y, seq, left, right, label, cls = "") => {
      let r = tiles(x0, y, seq, S, G);
      r += txt(x0 - 10, y + S / 2 + 4, left, "bf-tx-xs bf-mono bf-tx-faint", "end");
      r += txt(x0 + n * col - G + 10, y + S / 2 + 4, right, "bf-tx-xs bf-mono bf-tx-faint", "start");
      r += txt(x0 + n * col + 36, y + S / 2 + 4, label, "bf-tx-xs bf-tx-dim " + cls, "start");
      return r;
    };
    s += idx(x0, 36, n, S, G);
    s += strand(44, dna, "5′", "3′", "הקלט: הגדיל העליון, בכיוון הקריאה שלו");
    s += txt(x0 - 10, 40, "index", "bf-tx-xs bf-mono bf-tx-faint", "end");
    // step 1: map
    for (let i = 0; i < n; i++) s += arrow(f, x0 + i * col + S / 2, 74, x0 + i * col + S / 2, 102, "accent");
    s += badge(x0 - 60, 92, 1);
    s += txt(x0 - 44, 86, "map", "bf-tx-sm bf-mono bf-tx-b bf-tx-accent", "start");
    s += txt(x0 - 44, 101, "כל אות ↦ בת-הזוג", "bf-tx-xs bf-tx-dim", "start");
    s += chip(x0 + n * col + 36, 80, "dna.translate(table)", "bf-box-accent");
    s += strand(110, comp, "3′", "5′", "השלמה בלבד: הגדיל התחתון, אבל הפוך לכיוון הקריאה שלו", "bf-tx-warn");
    // step 2: reverse (crossing arcs)
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * col + S / 2, xb = x0 + (n - 1 - i) * col + S / 2;
      s += parrow(f, `M${xa},140 C ${xa},178 ${xb},176 ${xb},212`, i === 0 || i === n - 1 ? "accent" : "faint");
    }
    s += badge(x0 - 60, 176, 2);
    s += txt(x0 - 44, 170, "reverse", "bf-tx-sm bf-mono bf-tx-b bf-tx-accent", "start");
    s += txt(x0 - 44, 185, "הפוך את הסדר", "bf-tx-xs bf-tx-dim", "start");
    s += chip(x0 + n * col + 36, 164, "[::-1]", "bf-box-accent", 70);
    s += strand(220, rc, "5′", "3′", "הפלט: ההשלמה ההפוכה, בכיוון הקריאה הנכון", "bf-tx-ok bf-tx-b");
    s += idx(x0, 266, n, S, G);
    // mapping table (left)
    s += box(20, 120, 120, 118, "bf-box-panel", 10);
    s += txt(80, 140, "טבלת המיפוי", "bf-tx-xs bf-tx-b");
    [["A", "T"], ["T", "A"], ["C", "G"], ["G", "C"]].forEach(([a, b], i) => {
      const y = 150 + i * 22;
      s += tile(36, y, a, 18) + txt(72, y + 13, "↦", "bf-tx-sm bf-tx-faint") + tile(90, y, b, 18);
    });
    // pipeline summary
    s += chip(x0, 290, 'reverse_complement = dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]', "bf-box-ok", 520);
    s += txt(x0 + 260, 284, "שתי הפעולות, בשורה אחת:", "bf-tx-xs bf-tx-dim");
    const fig = figure(f, W, H, "השלמה הפוכה כצינור של שתי פעולות: map ואז reverse", s,
      "שלב 1 (map): כל אות בגדיל העליון מוחלפת בבת-הזוג שלה לפי טבלת המיפוי, וכך מתקבל הגדיל התחתון, אבל כתוב בכיוון הקריאה של העליון. שלב 2 (reverse): הופכים את סדר התאים (האינדקס 0 עובר לסוף), וכך הגדיל התחתון נכתב בכיוון הקריאה שלו. סדר שני השלבים לא משנה, אבל שניהם חובה.");
    return section({
      lead: `
<p>DNA נשמר בשני גדילים שמונחים "ראש לזנב": הגדיל השני הוא אותו מידע, אבל כתוב במראה. דמיינו שני מערכים שמחוברים זה לזה, כאשר האינדקס 0 של אחד יושב מול האינדקס האחרון של השני. לכל גדיל יש "כיוון קריאה" טבעי (מ-5′ ל-3′), כמו קובץ שקוראים תמיד מההתחלה לסוף. כדי לקבל את הגדיל השני בכיוון הקריאה <em>שלו</em>, צריך שני צעדים: להחליף כל אות בבת-זוגה (<strong>השלמה</strong>: <code>A↔T</code>, ‏<code>C↔G</code>), ולהפוך את סדר המערך (<strong>היפוך</strong>).</p>
<p>בשפה של תכנות זה צינור (pipeline) קצר של שתי פעולות סטנדרטיות: <code>map</code> עם טבלת מיפוי, ואז <code>reverse</code>. ב-Python: <code>dna.translate(table)[::-1]</code>. הסדר לא משנה, אבל <em>שתי</em> הפעולות חובה: השלמה בלי היפוך נותנת מחרוזת שקוראים מהכיוון הלא נכון, וכל חיפוש או תרגום עליה ייתן תוצאות שגויות. בהמשך תראו למה הכיווניות הזאת היא תוצאה של המבנה הכימי של הגדיל, ואיפה היא פוגשת אתכם בנתוני ריצוף אמיתיים.</p>`,
      fig,
      rows: [
        ["שני גדילים", "שני מערכים ראש-לזנב", "אותו מידע פעמיים, בצורת מראה; האינדקס הראשון של אחד מול האחרון של השני."],
        ["כיוון 5′→3′", "כיוון הקריאה של הקובץ", "כל גדיל נקרא תמיד מההתחלה שלו לסוף שלו; המכונות בתא לא יודעות לקרוא הפוך."],
        ["השלמה", "<code>map</code> עם טבלת מיפוי", "החלפה תו-לתו לפי טבלה קבועה: A↔T, C↔G."],
        ["היפוך", "<code>reverse</code> / <code>[::-1]</code>", "הפיכת סדר התאים במערך."],
        ["השלמה הפוכה", "צינור: map ואז reverse", "שתי הפעולות יחד; מה שמאגרי מידע וכלי מיפוי קריאות עושים כל הזמן."],
        ["פלינדרום ביולוגי", "מחרוזת ששווה להשלמה ההפוכה שלה", "לא היפוך רגיל של מחרוזת, אלא היפוך + השלמה; למשל GAATTC."],
      ],
      oneLiner: "הגדיל השני הוא המערך שלכם במראה: החליפו כל אות בבת-זוגה (map) והפכו את הסדר (reverse). ב-Python זה translate ואז [::-1].",
    });
  };

  /* ═══════════════════ Module 9: n-grams into a hash table ═══════════════════ */
  P.m9 = () => {
    const f = "m9", W = 760, H = 330;
    const dna = "ACGTACGT", k = 3;
    const S = 26, G = 6, x0 = 40, col = S + G, cur = 4;
    let s = "";
    s += idx(x0, 36, dna.length, S, G);
    s += tiles(x0, 44, dna, S, G, (b, i) => (i >= cur && i < cur + k ? "" : "bf-nt-dim"));
    s += `<rect x="${x0 + cur * col - 4}" y="40" width="${k * col - G + 8}" height="${S + 8}" rx="8" class="bf-window"/>`;
    s += txt(x0 + cur * col + (k * col - G) / 2, 22, `חלון באורך k = ${k}, i = ${cur}`, "bf-tx-xs bf-tx-accent");
    // previous windows as chips
    s += txt(x0, 100, "המילים שכבר נחתכו:", "bf-tx-xs bf-tx-dim", "start");
    for (let i = 0; i <= cur; i++) {
      s += chip(x0 + i * 54, 108, dna.slice(i, i + k), i === cur ? "bf-box-accent" : "", 46);
      s += txt(x0 + i * 54 + 23, 146, `i=${i}`, "bf-tx-xs bf-tx-faint bf-mono");
    }
    // hash function
    s += arrow(f, x0 + k * col - G + 4 + cur * col + 6, 57, 356, 57, "accent");
    s += box(360, 36, 86, 42, "bf-box-accent", 10);
    s += txt(403, 53, "hash()", "bf-tx-sm bf-mono bf-tx-b bf-tx-accent");
    s += txt(403, 69, "פונקציית גיבוב", "bf-tx-xs bf-tx-dim");
    s += arrow(f, 446, 57, 490, 57, "accent");
    // hash table
    s += box(494, 24, 246, 150, "bf-box-panel", 12);
    s += txt(617, 44, "טבלת גיבוב: מילה ↦ מונה", "bf-tx-sm bf-tx-b");
    const counts = [["ACG", 2, true], ["CGT", 2, false], ["GTA", 1, false], ["TAC", 1, false]];
    counts.forEach(([w, c, hot], i) => {
      const y = 60 + i * 26;
      s += `<rect x="506" y="${y - 10}" width="222" height="22" rx="6" class="bf-box ${hot ? "bf-box-accent" : "bf-box-stage"}"/>`;
      s += txt(514, y + 4, w, "bf-tx-sm bf-mono bf-tx-b", "start");
      s += `<rect x="568" y="${y - 4}" width="${c * 40}" height="10" rx="5" class="bf-fill-cyan"/>`;
      s += txt(720, y + 4, String(c), "bf-tx-sm bf-mono bf-tx-b", "end");
      if (hot) s += txt(690, y + 4, "+1", "bf-tx-xs bf-mono bf-tx-accent bf-tx-b", "end");
    });
    s += txt(617, 166, "כל עדכון: O(1) בממוצע, בלי קשר לאורך הגנום", "bf-tx-xs bf-tx-dim");
    // puzzle overlap (assembly)
    s += box(28, 184, 712, 128, "bf-box-stage", 12);
    s += txt(370, 206, "למה זה חשוב: מילים חופפות הן חלקי פאזל להרכבת גנום", "bf-tx-sm bf-tx-b");
    s += tiles(60, 224, "ACG", 24, 4);
    s += txt(154, 240, "+", "bf-tx-b bf-tx-faint");
    s += tiles(170, 224, "CGT", 24, 4);
    s += `<rect x="86" y="220" width="52" height="32" rx="6" class="bf-overlap"/><rect x="168" y="220" width="52" height="32" rx="6" class="bf-overlap"/>`;
    s += txt(139, 272, "חפיפה של k−1 = 2 אותיות (CG)", "bf-tx-xs bf-tx-accent");
    s += arrow(f, 262, 240, 300, 240, "ok");
    s += tiles(310, 224, "ACGT", 24, 4);
    s += txt(366, 272, "מחברים לרצף ארוך יותר", "bf-tx-xs bf-tx-dim");
    s += lines(726, 232, ["מכשיר ריצוף מחזיר מיליוני מקטעים קצרים,", "כמו פאזל שנשפך מהקופסה. שני מקטעים", "שחולקים k-mer כנראה שכנים בגנום,", "וכך מרכיבים את התמונה המלאה."], "bf-tx-xs bf-tx-dim", "end", 15);
    const fig = figure(f, W, H, "k-mers כ-n-grams: חותכים מילים, סופרים בטבלת גיבוב, מרכיבים פאזל", s,
      "למעלה: חלון באורך 3 זז תא אחד בכל צעד וחותך \"מילה\"; כל מילה עוברת דרך פונקציית גיבוב אל התא שלה בטבלה, ושם המונה עולה באחד (ACG כבר נראה פעמיים). למטה: שתי מילים שחופפות ב-k−1 אותיות אפשר לחבר, וזה הרעיון שמאחורי הרכבת גנומים ממקטעים קצרים.");
    return section({
      lead: `
<p>k-mer הוא פשוט "מילה" באורך k שחותכים מתוך הרצף, ומאחר שאין רווחים ב-DNA, חותכים את <em>כל</em> המילים האפשריות: מכל אינדקס, k אותיות קדימה. זה בדיוק ה-<em>n-gram</em> שמנועי חיפוש ומערכות השלמה אוטומטית מחשבים על טקסט, או ה-<em>shingles</em> שתוכנות לזיהוי העתקות משוות בין מסמכים. אותו רעיון של חלון נע ממודול 4, רק שהפעם לא מחפשים מילה אחת אלא סופרים את כולן.</p>
<p>הספירה עצמה היא שימוש קלאסי ב<strong>טבלת גיבוב</strong> (המילון של Python): כל חלון נשלח לפונקציית גיבוב, שמפנה אותו לתא במילון, ושם המונה עולה באחד. בלי קשר לאורך הגנום, כל עדכון עולה זמן קבוע בממוצע. ולמה זה חשוב לביולוגים? כי מכשירי ריצוף לא קוראים גנום שלם אלא מיליוני מקטעים קצרים, ו-k-mers הם חלקי הפאזל: שני מקטעים שחולקים k-mer, סביר שמגיעים מאותו מקום בגנום, וכך מרכיבים את התמונה המלאה. אותה ספירה משמשת גם לזיהוי מינים בדגימה, להערכת גודל הגנום ולתפיסת שגיאות ריצוף.</p>`,
      fig,
      rows: [
        ["k-mer", "n-gram / shingle", "תת-מחרוזת באורך קבוע; כל האינדקסים, כולל חפיפות."],
        ["הרכב k-mers", "היסטוגרמה של מילים", "כמה פעמים כל מילה הופיעה; טביעת אצבע של הרצף."],
        ["ספירה", "טבלת גיבוב (<code>dict</code>, <code>Counter</code>)", "מפתח = המילה, ערך = מונה; עדכון בזמן קבוע בממוצע."],
        ["קריאת ריצוף", "חלק פאזל", "מקטע קצר ואקראי של הגנום; לבד הוא לא אומר הרבה."],
        ["הרכבת גנום", "חיבור פאזל לפי קצוות חופפים", "מילים שחופפות ב-k−1 אותיות מצביעות על שכנות בגנום (גרף de Bruijn)."],
        ["בחירת k", "גודל ה-n-gram", "קצר = דו-משמעי, ארוך = שביר לשגיאות; בוחרים באמצע, ובדרך כלל אי-זוגי."],
      ],
      oneLiner: "k-mers הם ה-n-grams של DNA: חותכים כל מילה באורך k, סופרים אותן במילון, ומשתמשים בחפיפות ביניהן כדי להרכיב גנום ממקטעים קצרים.",
    });
  };

  /* ═══════════════════ Module 10: the spreadsheet and the vote ═══════════════════ */
  P.m10 = () => {
    const f = "m10", W = 760, H = 330;
    const seqs = ["ATGCAA", "ATGGAA", "ACGCAT", "ATCCAA", "ATGCTA"];
    const n = seqs[0].length, S = 24, G = 4, x0 = 70, col = S + G, hot = 3;
    const BASES = "ACGT";
    let s = "";
    // spreadsheet grid
    for (let j = 0; j < n; j++) s += txt(x0 + j * col + S / 2, 32, String.fromCharCode(65 + j), "bf-tx-xs bf-tx-faint bf-mono");
    s += `<rect x="${x0 + hot * col - 4}" y="38" width="${S + 8}" height="${seqs.length * col + 4}" rx="7" class="bf-window"/>`;
    seqs.forEach((q, r) => {
      s += txt(x0 - 10, 44 + r * col + S / 2 + 4, String(r + 1), "bf-tx-xs bf-tx-faint bf-mono", "end");
      s += tiles(x0, 44 + r * col, q, S, G, (b, j) => (j === hot ? "" : "bf-nt-dim"));
    });
    s += txt(x0 + (n * col) / 2, 196, "היישור = גיליון: שורה לכל רצף, עמודה לכל עמדה", "bf-tx-xs bf-tx-dim");
    // ballot for the hot column
    const tally = { A: 0, C: 0, G: 0, T: 0 };
    seqs.forEach((q) => tally[q[hot]]++);
    const winner = [...BASES].reduce((b, c) => (tally[c] > tally[b] ? c : b), "A");
    s += arrow(f, x0 + n * col + 6, 110, 262, 110, "accent");
    s += box(268, 38, 170, 150, "bf-box-panel", 12);
    s += txt(353, 58, `ספירת קולות בעמודה ${String.fromCharCode(65 + hot)}`, "bf-tx-sm bf-tx-b");
    [...BASES].forEach((b, i) => {
      const y = 74 + i * 26;
      s += tile(282, y - 2, b, 20);
      s += `<rect x="310" y="${y + 2}" width="${tally[b] * 20}" height="12" rx="6" class="bf-fill-${b === winner ? "accent" : "faint"}"/>`;
      s += txt(422, y + 12, String(tally[b]), "bf-tx-sm bf-mono bf-tx-b " + (b === winner ? "bf-tx-accent" : "bf-tx-faint"), "end");
    });
    s += txt(353, 178, `הרוב: ${winner} ⇒ זה הקונצנזוס בעמודה`, "bf-tx-xs bf-tx-b bf-tx-accent");
    // profile matrix for all columns
    const px = 470, py = 44;
    s += txt(px + (n * col) / 2 + 20, 32, "מטריצת הפרופיל = ספירת הקולות בכל העמודות", "bf-tx-xs bf-tx-b");
    [...BASES].forEach((b, i) => {
      const y = py + i * col;
      s += tile(px, y, b, S);
      for (let j = 0; j < n; j++) {
        const c = seqs.filter((q) => q[j] === b).length;
        const w = [...BASES].reduce((a, bb) => (seqs.filter((q) => q[j] === bb).length > seqs.filter((q) => q[j] === a).length ? bb : a), "A");
        const max = w === b;
        s += `<rect x="${px + (j + 1) * col + 6}" y="${y}" width="${S}" height="${S}" rx="5" class="bf-cell ${max ? "bf-cell-max" : ""} ${j === hot ? "bf-cell-hot" : ""}"/><text x="${px + (j + 1) * col + 6 + S / 2}" y="${y + S / 2}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-sm ${max ? "bf-tx-b bf-tx-accent" : "bf-tx-faint"}">${c}</text>`;
      }
    });
    // consensus row
    const cons = Array.from({ length: n }, (_, j) => [...BASES].reduce((a, bb) => (seqs.filter((q) => q[j] === bb).length > seqs.filter((q) => q[j] === a).length ? bb : a), "A")).join("");
    s += txt(px + S / 2, py + 4 * col + S / 2 + 4, "★", "bf-tx-sm bf-tx-warn");
    s += tiles(px + col + 6, py + 4 * col, cons, S, G);
    s += txt(px + col + 6 + (n * col) / 2, py + 5 * col + 10, `קונצנזוס = המנצח בכל עמודה: ${cons}`, "bf-tx-xs bf-tx-dim");
    // tie rule
    s += box(28, 218, 712, 92, "bf-box-stage", 12);
    s += txt(370, 240, "ומה אם יש תיקו?", "bf-tx-sm bf-tx-b");
    s += tiles(60, 254, "ACCA", 22, 3);
    s += txt(170, 270, "⇒ A: 2 קולות, C: 2 קולות", "bf-tx-xs bf-tx-dim", "start");
    s += txt(726, 262, "צריך כלל קבוע כדי שהפלט יהיה דטרמיניסטי. בתרגיל: הראשון לפי סדר האלפבית (A לפני C).", "bf-tx-xs bf-tx-dim", "end");
    s += txt(726, 280, "ביולוגים מסמנים לפעמים תיקו בקוד IUPAC, למשל M לתיקו בין A ל-C.", "bf-tx-xs bf-tx-faint", "end");
    s += chip(60, 282, 'max("ACGT", key=column.count)', "bf-box-accent", 230);
    const fig = figure(f, W, H, "יישור מרובה כגיליון אלקטרוני: הצבעת רוב בכל עמודה", s,
      "משמאל: חמישה רצפים מיושרים, שורה לכל רצף. לוקחים עמודה אחת (D) וסופרים כמה פעמים כל אות מופיעה בה; האות עם הכי הרבה קולות היא הקונצנזוס של העמודה. עושים זאת לכל העמודות ומקבלים את מטריצת הפרופיל (4 × n) ואת רצף הקונצנזוס. למטה: הכלל לשבירת תיקו.");
    return section({
      lead: `
<p>כשמסדרים כמה גרסאות של אותו גן זו מעל זו, מקבלים <strong>גיליון אלקטרוני</strong>: שורה לכל רצף, עמודה לכל עמדה. עכשיו מסתכלים על עמודה אחת ושואלים "מה כתוב בה ברוב השורות?". זו הצבעת רוב, בדיוק כמו ב-<em>ensemble</em> של מודלים או בבחירות: סופרים קולות לכל אות, והאות עם הכי הרבה קולות מנצחת. הטבלה שמחזיקה את ספירת הקולות בכל עמודה היא <strong>מטריצת הפרופיל</strong> (4 שורות, אחת לכל אות, ועמודה לכל עמדה), והמחרוזת של המנצחים היא <strong>רצף הקונצנזוס</strong>.</p>
<p>למה זה מעניין? כי האבולוציה מוחקת שינויים במקומות חשובים: אם בעמודה מסוימת כל 50 המינים שומרים על אותה אות, סביר שהאות הזאת חיונית, בערך כמו שורת קוד שאף אחד לא מעז לשנות כי הכול תלוי בה. עמודה שבה כל מין "הצביע" אחרת היא כנראה עמדה שלא משנה הרבה. כשיש תיקו בהצבעה צריך כלל קבוע לשבירתו, ובתרגיל הכלל הוא סדר האלפבית, כדי שהפלט יהיה דטרמיניסטי ואפשר יהיה לבדוק אותו.</p>`,
      fig,
      rows: [
        ["יישור מרובה (MSA)", "גיליון אלקטרוני / מערך דו-ממדי", "שורה לכל רצף, עמודה לכל עמדה; <code>rows[i][j]</code>."],
        ["עמודה ביישור", "<code>zip(*rows)</code>", "אותה עמדה בכל הרצפים; זה מה שסופרים."],
        ["מטריצת פרופיל", "טבלת ספירות 4 × n", "כמה קולות קיבלה כל אות בכל עמודה."],
        ["רצף הקונצנזוס", "הצבעת רוב בכל עמודה", "האות עם הכי הרבה קולות, עמודה אחר עמודה."],
        ["עמודה שמורה", "שורת קוד שאיש לא משנה", "כל הרצפים מסכימים, ולכן כנראה חיונית לתפקוד."],
        ["שבירת תיקו", "כלל דטרמיניסטי (סדר אלפביתי)", "בלי כלל קבוע, שתי הרצות יתנו תשובות שונות ואי אפשר לבדוק."],
      ],
      oneLiner: "יישור מרובה הוא גיליון, מטריצת הפרופיל סופרת קולות בכל עמודה, והקונצנזוס הוא האות שזכתה ברוב, עם כלל אלפביתי קבוע לשבירת תיקו.",
    });
  };

  /* ═══════════════════ Module 11: the memo table ═══════════════════ */
  P.m11 = () => {
    const f = "m11", W = 760, H = 336;
    const s1 = "GCA", s2 = "GATCA", gap = -2;
    const S = 34, G = 4, x0 = 86, y0 = 56, col = S + G;
    let s = "";
    // spreadsheet-style headers
    for (let j = 0; j <= s2.length; j++) s += txt(x0 + (j + 1) * col + S / 2, 22, String.fromCharCode(65 + j), "bf-tx-xs bf-tx-faint bf-mono");
    for (let i = 0; i <= s1.length; i++) s += txt(x0 - 26, y0 + (i + 1) * col + S / 2 + 4, String(i + 1), "bf-tx-xs bf-tx-faint bf-mono");
    s += txt(x0 + S / 2, 22, "", "bf-tx-xs");
    // sequence headers
    s += `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" rx="6" class="bf-cell bf-cell-head"/>`;
    [...("-" + s2)].forEach((c, j) => {
      s += `<rect x="${x0 + (j + 1) * col}" y="${y0}" width="${S}" height="${S}" rx="6" class="bf-cell bf-cell-head"/><text x="${x0 + (j + 1) * col + S / 2}" y="${y0 + S / 2}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-b bf-tx-accent">${c}</text>`;
    });
    [...("-" + s1)].forEach((c, i) => {
      s += `<rect x="${x0}" y="${y0 + (i + 1) * col}" width="${S}" height="${S}" rx="6" class="bf-cell bf-cell-head"/><text x="${x0 + S / 2}" y="${y0 + (i + 1) * col + S / 2}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-b bf-tx-accent">${c}</text>`;
    });
    const ci = 2, cj = 3; // highlighted cell F[2][3]
    for (let i = 0; i <= s1.length; i++) {
      for (let j = 0; j <= s2.length; j++) {
        const x = x0 + (j + 1) * col, y = y0 + (i + 1) * col;
        const init = i === 0 || j === 0;
        const val = init ? (i === 0 ? j * gap : i * gap) : null;
        const cur = i === ci && j === cj;
        const nb = (i === ci - 1 && j === cj - 1) || (i === ci - 1 && j === cj) || (i === ci && j === cj - 1);
        const corner = i === s1.length && j === s2.length;
        s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="6" class="bf-cell ${init ? "bf-cell-init" : ""} ${cur ? "bf-cell-cur" : ""} ${nb ? "bf-cell-nb" : ""} ${corner ? "bf-cell-corner" : ""}"/>`;
        const label = init ? String(val) : cur ? "?" : corner ? "★" : "·";
        s += `<text x="${x + S / 2}" y="${y + S / 2}" dominant-baseline="central" text-anchor="middle" class="bf-tx bf-mono bf-tx-sm ${init ? "bf-tx-cyan bf-tx-b" : cur ? "bf-tx-accent bf-tx-b" : corner ? "bf-tx-warn" : "bf-tx-faint"}">${label}</text>`;
      }
    }
    // arrows into the current cell
    const cx = x0 + (cj + 1) * col, cy = y0 + (ci + 1) * col;
    s += arrow(f, cx - col + S - 4, cy - col + S - 4, cx + 6, cy + 6, "warn");
    s += arrow(f, cx + S / 2, cy - col + S + 1, cx + S / 2, cy - 2, "warn");
    s += arrow(f, cx - col + S + 1, cy + S / 2, cx - 2, cy + S / 2, "warn");
    // labels around the grid
    s += txt(x0 + 2.5 * col + S, y0 + (s1.length + 1) * col + S + 18, "השורה והעמודה הראשונות = מקרי הבסיס: יישור מול מחרוזת ריקה, פער לכל אות", "bf-tx-xs bf-tx-cyan");
    s += txt(x0 + 2.5 * col + S, y0 + (s1.length + 1) * col + S + 34, "★ הפינה = התשובה הסופית, אחרי שכל התאים מולאו", "bf-tx-xs bf-tx-warn");
    // formula panel
    s += box(392, 46, 346, 176, "bf-box-panel", 12);
    s += txt(565, 68, "הנוסחה בכל תא (כמו תא בגיליון אלקטרוני)", "bf-tx-sm bf-tx-b");
    s += txt(404, 92, "F[2][3] = max(", "bf-tx-sm bf-mono bf-tx-b", "start");
    s += txt(420, 112, "F[1][2] + s(C, T),", "bf-tx-sm bf-mono bf-tx-warn", "start");
    s += txt(726, 112, "↖ שני התווים מיושרים", "bf-tx-xs bf-tx-dim", "end");
    s += txt(420, 132, "F[1][3] + gap,", "bf-tx-sm bf-mono bf-tx-warn", "start");
    s += txt(726, 132, "↑ פער ברצף 2", "bf-tx-xs bf-tx-dim", "end");
    s += txt(420, 152, "F[2][2] + gap )", "bf-tx-sm bf-mono bf-tx-warn", "start");
    s += txt(726, 152, "← פער ברצף 1", "bf-tx-xs bf-tx-dim", "end");
    s += line(404, 164, 726, 164, "bf-ln-faint bf-ln-dashed");
    s += lines(726, 184, ["כל תא = תשובה שמורה (memo) לתת-בעיה אחת:", "הציון הטוב ביותר ליישור i האותיות הראשונות", "של רצף 1 מול j הראשונות של רצף 2."], "bf-tx-xs bf-tx-dim", "end", 15);
    // memo vs brute force
    s += box(392, 236, 346, 84, "bf-box-stage", 12);
    s += txt(565, 258, "למה זה עובד?", "bf-tx-sm bf-tx-b");
    s += lines(726, 278, ["כוח גס: יותר מ-10⁷⁵ יישורים לשני רצפים באורך 100.", "תכנון דינמי: כל תת-בעיה נפתרת פעם אחת ונשמרת,", "ולכן רק (n+1)·(m+1) תאים, O(1) עבודה לכל תא."], "bf-tx-xs bf-tx-dim", "end", 15);
    const fig = figure(f, W, H, "תכנון דינמי כגיליון אלקטרוני: כל תא הוא תשובה שמורה", s,
      "המטריצה של GCA (שורות) מול GATCA (עמודות). השורה והעמודה הראשונות (תכלת) הן מקרי הבסיס שתמלאו בתרגיל: יישור מול מחרוזת ריקה עולה פער לכל אות. כל תא אחר מחושב משלושת שכניו (החצים): באלכסון, מלמעלה ומשמאל. הפינה (★) תחזיק בסוף את ציון היישור הטוב ביותר.");
    return section({
      lead: `
<p>כדי למצוא את היישור הטוב ביותר אי אפשר לנסות את כל האפשרויות: יש יותר מהן מאטומים ביקום. <strong>תכנון דינמי</strong> פותר את זה בטריק שמתכנתים מכירים בשם <em>memoization</em>: במקום לחשב את אותה תת-בעיה שוב ושוב, שומרים את התשובה בטבלה ומשתמשים בה שוב. כאן הטבלה היא <strong>גיליון אלקטרוני</strong>: התא <code>F[i][j]</code> מחזיק את הציון הטוב ביותר ליישור של i האותיות הראשונות של רצף 1 מול j האותיות הראשונות של רצף 2, והנוסחה בכל תא מסתכלת על שלושת השכנים שלו: באלכסון, מלמעלה ומשמאל.</p>
<p>כמו בכל רקורסיה, צריך <strong>מקרי בסיס</strong>: השורה והעמודה הראשונות מתארות יישור מול מחרוזת ריקה, שעולה פער אחד לכל אות, ולכן הן מתמלאות בקנסות מצטברים (0, −2, −4, …). זה בדיוק החלק שתבנו בתרגיל. אחרי שהטבלה מלאה, הציון הסופי יושב בפינה, וכדי לשחזר את היישור עצמו הולכים אחורה לאורך "ההפניות" של הנוסחאות, כמו "trace precedents" בגיליון אלקטרוני. זהו אלגוריתם Needleman–Wunsch, והוא הבסיס לכל כלי היישור שתפגשו.</p>`,
      fig,
      rows: [
        ["היישור הטוב ביותר", "אופטימיזציה על מרחב עצום", "אי אפשר לנסות הכול; צריך לפרק לתת-בעיות."],
        ["תכנון דינמי", "memoization בטבלה", "כל תת-בעיה נפתרת פעם אחת, התשובה נשמרת ומשמשת שוב."],
        ["המטריצה F", "גיליון אלקטרוני", "תא לכל זוג תחיליות; הנוסחה בכל תא מפנה לשלושה שכנים."],
        ["אתחול", "מקרי הבסיס של הרקורסיה", "יישור מול מחרוזת ריקה = פער לכל אות: 0, −2, −4, …"],
        ["מילוי", "חישוב הגיליון שורה אחר שורה", "כשמגיעים לתא, שלושת שכניו כבר מחושבים."],
        ["traceback", "\"trace precedents\" / מעקב אחורה", "הולכים מהפינה חזרה לפי ההפניות ומשחזרים את היישור עצמו."],
        ["המלכודת <code>[[0]*m]*n</code>", "n הפניות לאותה שורה", "כל השורות הן אותו אובייקט; שינוי באחת משנה את כולן."],
      ],
      oneLiner: "תכנון דינמי הוא גיליון אלקטרוני של תשובות שמורות: השורה והעמודה הראשונות הן מקרי הבסיס (פער לכל אות), וכל תא אחר הוא המקסימום של שלושת שכניו ועוד הציון המתאים.",
    });
  };

  CBB.Primer = P;
})();
