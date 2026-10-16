/* ==========================================================================
   Expert curriculum — Modules 8–11 (reverse complement, k-mers, profiles &
   consensus, dynamic-programming alignment matrix). Appended to CBB.MODULES
   after modules 1–7, using the shared lesson helpers (CBB.lessonKit).
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const { esc, py, nt, demo, examplesIntro } = CBB.lessonKit;

  const L = (s) => `<span dir="ltr">${s}</span>`; // pin a number/notation LTR inside Hebrew text

  /* ───────────── Reference helpers (used to generate large hidden tests) ───────────── */
  const COMP = { A: "T", T: "A", C: "G", G: "C" };
  const revComp = (s) => [...s].reverse().map((b) => COMP[b]).join("");

  const countKmers = (s, k) => {
    const out = {};
    if (k <= 0) return out;
    for (let i = 0; i + k <= s.length; i++) out[s.slice(i, i + k)] = (out[s.slice(i, i + k)] || 0) + 1;
    return out;
  };

  const consensus = (list) => {
    if (!list.length) return "";
    let out = "";
    for (let j = 0; j < list[0].length; j++) {
      const c = { A: 0, C: 0, G: 0, T: 0 };
      list.forEach((s) => c[s[j]]++);
      out += "ACGT".split("").reduce((best, b) => (c[b] > c[best] ? b : best), "A");
    }
    return out;
  };

  const initMatrix = (n, m, gap) =>
    Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j * gap : j === 0 ? i * gap : 0)));

  // Small deterministic PRNG so generated tests are identical on every load
  function lcg(seed) {
    let x = seed >>> 0;
    return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  }
  const noisyAlignment = (count, length, seed) => {
    const rnd = lcg(seed);
    const base = Array.from({ length }, () => "ACGT"[Math.floor(rnd() * 4)]).join("");
    return Array.from({ length: count }, () =>
      [...base].map((b) => (rnd() < 0.45 ? "ACGT"[Math.floor(rnd() * 4)] : b)).join("")
    );
  };

  /* ───────────── Static lesson figures ───────────── */
  const tileHTML = (b) => (b === "-" ? '<span class="nt nt-gap">–</span>' : `<span class="nt nt-${b.toLowerCase()}">${b}</span>`);

  const kmerFigure = (seq, k) => {
    const rows = [];
    for (let i = 0; i + k <= seq.length; i++) {
      rows.push(
        `<div class="km-fig-row">${'<span class="km-pad"></span>'.repeat(i)}${seq
          .slice(i, i + k)
          .split("")
          .map(tileHTML)
          .join("")}<span class="km-fig-label">i = ${i}</span></div>`
      );
    }
    return `<div class="formula km-figure" dir="ltr"><div class="km-fig-row km-fig-seq">${seq.split("").map(tileHTML).join("")}</div>${rows.join("")}</div>`;
  };

  const profileFigure = (list) => {
    const n = list[0].length;
    const counts = Array.from({ length: n }, (_, j) => {
      const c = { A: 0, C: 0, G: 0, T: 0 };
      list.forEach((s) => c[s[j]]++);
      return c;
    });
    const cons = consensus(list);
    const cell = (x) => `<td>${x}</td>`;
    return `
<div class="profile-wrap" dir="ltr">
  <table class="profile-table">
    <tbody>
      ${list.map((s, r) => `<tr class="pf-seq"><th>${r + 1}</th>${s.split("").map((b) => `<td>${tileHTML(b)}</td>`).join("")}</tr>`).join("")}
      <tr class="pf-sep"><td colspan="${n + 1}"></td></tr>
      ${"ACGT"
        .split("")
        .map(
          (b) =>
            `<tr class="pf-count"><th><span class="nt nt-${b.toLowerCase()}">${b}</span></th>${counts
              .map((c, j) => `<td class="${cons[j] === b ? "pf-max" : ""}" style="--a:${c[b] / list.length}">${c[b]}</td>`)
              .join("")}</tr>`
        )
        .join("")}
      <tr class="pf-cons"><th>★</th>${cons.split("").map((b) => `<td>${tileHTML(b)}</td>`).join("")}</tr>
    </tbody>
  </table>
</div>`;
  };

  const dpFigure = (s1, s2, gap) => {
    const m = initMatrix(s1.length, s2.length, gap);
    const head = `<tr><th></th><th>-</th>${s2.split("").map((c) => `<th>${c}</th>`).join("")}</tr>`;
    const rows = m
      .map(
        (row, i) =>
          `<tr><th>${i === 0 ? "-" : s1[i - 1]}</th>${row
            .map((v, j) => `<td class="${i === 0 || j === 0 ? "dp-init" : "dp-empty"}">${i === 0 || j === 0 ? v : "·"}</td>`)
            .join("")}</tr>`
      )
      .join("");
    return `<div class="dp-wrap" dir="ltr"><table class="dp-table dp-static">${head}${rows}</table></div>`;
  };

  /* ─────────────────────────────── Module 8 ─────────────────────────────── */
  const m8 = {
    id: "m8",
    number: 8,
    title: "השלמה הפוכה (Reverse Complement)",
    short: "השלמה הפוכה",
    level: "medium-hard",
    difficulty: "בינוני-קשה",
    minutes: 40,
    topics: ["אנטי-מקביליות", "היפוך מחרוזות", "טבלאות תרגום"],
    fnName: "reverse_complement",

    lesson: `
<p class="eyebrow">מודול 8 · ביולוגיה × מדעי המחשב</p>
<h1>השלמה הפוכה (Reverse Complement)</h1>
<p class="lede">ל-DNA יש שני גדילים, וכל אחד מהם נושא מידע. כשרצף נשמר במאגר, נכתב בו רק גדיל אחד, ואת השני צריך לחשב. במודול הזה תבינו למה החישוב הזה הוא <em>היפוך ועוד השלמה</em>, ולא השלמה בלבד, ותכתבו את אחת הפונקציות השימושיות ביותר בביואינפורמטיקה.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>שני גדילים, כיווניות ${L("5′→3′")}, ומה פירוש "אנטי-מקביליים"</li>
    <li>למה את הגדיל השני קוראים בסדר הפוך</li>
    <li>היפוך מחרוזות וחיתוך עם צעד שלילי</li>
    <li>טבלאות תרגום (<code>str.maketrans</code>) ומיפוי תווים</li>
  </ul>
</div>

<h2><span class="h-num">1</span>סליל כפול, שני כיוונים</h2>
<p>כל נוקלאוטיד מחובר לשכנו דרך קבוצת פוספט, שמקשרת בין פחמן 3′ של סוכר אחד לפחמן 5′ של הסוכר הבא. לכן לכל גדיל יש "ראש" ו"זנב": <strong>קצה 5′</strong>, עם קבוצת פוספט חופשית, ו<strong>קצה 3′</strong>, עם קבוצת הידרוקסיל חופשית. לפי המוסכמה, רצפים נכתבים תמיד <strong>מ-5′ ל-3′</strong>.</p>
<p>שני הגדילים בסליל הם <strong>אנטי-מקביליים</strong>: הם פונים לכיוונים הפוכים. כשגדיל אחד רץ משמאל לימין מ-5′ ל-3′, הגדיל שמולו רץ מ-3′ ל-5′. רק בסידור הזה הבסיסים מתיישבים זה מול זה ויוצרים קשרי מימן.</p>

<div class="formula" dir="ltr">
  <div><span class="f-label">גדיל עליון 5′</span>${nt("ATGCCGTT")}<span class="f-label">3′</span></div>
  <div><span class="f-label">גדיל תחתון 3′</span>${nt("TACGGCAA")}<span class="f-label">5′</span></div>
  <div class="f-arrow">↓ <bdi>קוראים את הגדיל התחתון בכיוון 5′→3′</bdi></div>
  <div><span class="f-label">השלמה הפוכה 5′</span>${nt("AACGGCAT")}<span class="f-label">3′</span></div>
</div>

<p>כדי לכתוב את הגדיל השני לפי המוסכמה, מ-5′ ל-3′, צריך שני צעדים: <strong>להשלים</strong> כל בסיס (A↔T, ‏C↔G) ו<strong>להפוך</strong> את הסדר. התוצאה נקראת <strong>ההשלמה ההפוכה</strong> (reverse complement). סדר הצעדים לא משנה: אפשר להשלים ואז להפוך, או להפוך ואז להשלים.</p>

<div class="callout callout-warn">
  <div class="callout-title">טעות נפוצה: השלמה בלי היפוך</div>
  <p>השלמה בלבד (<code>TACGGCAA</code>) נותנת את הגדיל השני, אבל כתוב מ-3′ ל-5′. אם תחפשו בו מוטיב או תתרגמו אותו, תקבלו תוצאות שגויות לגמרי, כי ריבוזומים, פולימראזות וגורמי שעתוק קוראים תמיד מ-5′ ל-3′.</p>
</div>

<div class="callout callout-bio">
  <div class="callout-title">תוצאה של אנטי-מקביליות: מקטעי אוקזאקי</div>
  <p>DNA פולימראז יכול להאריך גדיל רק בכיוון ${L("5′→3′")}. במזלג השכפול, גדיל אחד (<em>הגדיל המוביל</em>) נבנה ברצף אחד, אבל הגדיל השני (<em>הגדיל המפגר</em>) נבנה במקטעים קצרים, <em>מקטעי אוקזאקי</em>, שמחוברים אחר כך על ידי אנזים ליגאז. כל זה קורה רק משום ששני הגדילים פונים לכיוונים הפוכים.</p>
</div>

<h3>איפה זה פוגש אתכם במחקר</h3>
<ul class="tight">
  <li><strong>קריאות ריצוף</strong>: מכשיר ריצוף קורא מקטעים משני הגדילים באקראי. כדי למפות קריאה לגנום, מנסים גם אותה וגם את ההשלמה ההפוכה שלה. בקובצי SAM, קריאה שמופתה לגדיל ההפוך מסומנת בדגל 16.</li>
  <li><strong>תכנון פריימרים</strong>: הפריימר ההפוך (reverse primer) ב-PCR הוא ההשלמה ההפוכה של הרצף בקצה האזור שרוצים להגביר.</li>
  <li><strong>גנים על הגדיל השלילי</strong>: בערך מחצית מהגנים יושבים על הגדיל "השני". קובצי GFF מסמנים זאת ב-<code>-</code> בעמודת ה-strand.</li>
  <li><strong>פלינדרומים</strong>: אתרי הגבלה כמו <code>GAATTC</code> שווים להשלמה ההפוכה של עצמם (מודול 4).</li>
</ul>

<h2><span class="h-num">2</span>מעבדה חזותית: משלימים והופכים</h2>
<p>הקלידו רצף ולחצו <strong>הדגמה</strong>. בשלב הראשון כל בסיס מקבל את המשלים שלו, והגדיל התחתון נבנה בכיוון ${L("3′→5′")}. בשלב השני קוראים את הגדיל התחתון מהסוף להתחלה, וכותבים אותו מחדש בכיוון ${L("5′→3′")}. נסו גם פלינדרום, למשל <code>GAATTC</code>.</p>
<div data-viz="revcomp"></div>

<h2><span class="h-num">3</span>היפוך מחרוזות ומיפוי תווים</h2>
<p>היפוך ומיפוי הם שתי פעולות נפרדות, ול-Python יש כלי טוב לכל אחת מהן:</p>
${py(`
dna = "ATGCCGTT"

dna[::-1]                         # 'TTGCCGTA'  -> slice with step -1
"".join(reversed(dna))            # 'TTGCCGTA'  -> reversed() gives an iterator

COMPLEMENT = {"A": "T", "T": "A", "C": "G", "G": "C"}
"".join(COMPLEMENT[b] for b in dna)              # 'TACGGCAA'  (complement only)
"".join(COMPLEMENT[b] for b in reversed(dna))    # 'AACGGCAT'  (reverse complement)
`)}

<h3>טבלאות תרגום</h3>
<p><code>str.maketrans(from, to)</code> בונה טבלה שממפה כל תו במחרוזת הראשונה לתו שבאותו מקום במחרוזת השנייה. <code>str.translate</code> מחיל את הטבלה במעבר אחד שממומש ב-C, ולכן הוא מהיר בהרבה מלולאת Python.</p>
${py(`
table = str.maketrans("ACGT", "TGCA")
table                             # {65: 84, 67: 71, 71: 67, 84: 65}  (Unicode code points)
"ATGCCGTT".translate(table)       # 'TACGGCAA'
"ATGCNNGT".translate(table)       # 'TACGNNCA'  -> characters not in the table pass through

# Lowercase too, still in a single pass:
table = str.maketrans("ACGTacgt", "TGCAtgca")
`)}

<div class="callout callout-warn">
  <div class="callout-title">למה לא שרשרת של <code>replace</code>?</div>
  <p>הניסיון האינטואיטיבי, <code>dna.replace("A", "T").replace("T", "A")</code>, שובר את הרצף: ה-<code>replace</code> השני הופך בחזרה ל-A גם את ה-T שנוצרו בשלב הראשון. למשל, <code>"AAAACCCGGT"</code> הופך ל-<code>'AAAACCCGGA'</code>. המיפוי חייב לקרות <em>בבת אחת</em> לכל תו, וזה בדיוק מה ש-<code>translate</code> ומילון עושים.</p>
</div>

<table class="table">
  <thead><tr><th>גישה</th><th>זמן</th><th>הערה</th></tr></thead>
  <tbody>
    <tr><td><code>translate</code> ואז <code>[::-1]</code></td><td dir="ltr">O(n)</td><td>הכי מהירה: שני מעברים, שניהם ב-C</td></tr>
    <tr><td>מילון וגנרטור עם <code>join</code></td><td dir="ltr">O(n)</td><td>ברורה וגמישה, אבל איטית יותר כי כל תו עובר בלולאת Python</td></tr>
    <tr><td>לולאה עם <code>+=</code> למחרוזת</td><td dir="ltr">O(n²)</td><td>במקרה הגרוע: כל חיבור עלול להעתיק את כל המחרוזת</td></tr>
  </tbody>
</table>

<div class="callout callout-tip">
  <div class="callout-title">תכונה שימושית לבדיקה</div>
  <p>השלמה הפוכה היא <em>אינוולוציה</em>: הפעלה כפולה מחזירה את הרצף המקורי. <code>reverse_complement(reverse_complement(s)) == s</code> היא בדיקה מצוינת לקוד שלכם, ובדיוק את סוג התכונות האלה בודקות ספריות של בדיקות מבוססות-תכונות (property-based testing) כמו Hypothesis.</p>
</div>

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">כל בסיס ממופה פעם אחת, וההיפוך הוא מעבר נוסף</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">מחרוזת חדשה באותו אורך</span></div>
</div>

<h2><span class="h-num">4</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "איתור פלינדרומים ביולוגיים",
  intro: `אתרי הגבלה רבים הם רצפים ששווים להשלמה ההפוכה של עצמם. הדוגמה סורקת רצף ומדפיסה כל קטע באורך 4 עד 12 שהוא פלינדרום כזה, בדומה לבעיית REVP ב-Rosalind.`,
  code: `
def reverse_complement(dna):
    return dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]

dna = "TCAATGCATGCGGGTCTATATGCAT"

for length in range(4, 13):
    for i in range(len(dna) - length + 1):
        site = dna[i:i + length]
        if site == reverse_complement(site):
            print(f"position {i + 1:>2}  length {length:>2}  {site}")
`,
  steps: [
    `<code>reverse_complement</code> כתובה כאן בשורה אחת: <code>translate</code> משלים את כל הבסיסים, ו-<code>[::-1]</code> הופך את הסדר.`,
    `הלולאה החיצונית עוברת על אורכי הקטעים, 4 עד 12 (<code>range(4, 13)</code> לא כולל את 13). הלולאה הפנימית היא חלון נע: כל עמדת התחלה אפשרית לקטע באורך הזה.`,
    `<code>site == reverse_complement(site)</code> בודק את תכונת הפלינדרום. שימו לב שפלינדרום ביולוגי שונה מפלינדרום במילים: <code>GCATGC</code> אינו נקרא אותו דבר מהסוף, אבל ההשלמה ההפוכה שלו שווה לו.`,
    `ההדפסה משתמשת ב-<code>i + 1</code>, כי Rosalind סופרת עמדות מ-1 (זוכרים את מודול 4?).`,
    `פלינדרום ביולוגי תמיד באורך זוגי: באורך אי-זוגי, הבסיס האמצעי היה צריך להיות המשלים של עצמו, וזה בלתי אפשרי. לכן כל האורכים בפלט זוגיים.`,
  ],
})}

${demo({
  title: "חיפוש מוטיב בשני הגדילים ותרגום קואורדינטות",
  intro: `גורם שעתוק יכול להיקשר לאותו מוטיב על כל אחד משני הגדילים. הדוגמה מחפשת את תיבת ה-TATA גם בגדיל העליון וגם בהשלמה ההפוכה, ומתרגמת כל התאמה בגדיל ההפוך בחזרה לקואורדינטות של הגדיל העליון.`,
  code: `
def reverse_complement(dna):
    return dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]

def find_all(seq, motif):
    hits, i = [], seq.find(motif)
    while i != -1:
        hits.append(i)
        i = seq.find(motif, i + 1)
    return hits

genome = "GGTATAAACCGTTTATACCA"
motif = "TATAAA"
n, m = len(genome), len(motif)

print("+ strand:", find_all(genome, motif))
for j in find_all(reverse_complement(genome), motif):
    start = n - (j + m)          # map back to plus-strand coordinates
    print(f"- strand: index {j} on the reverse complement "
          f"= plus-strand {start}..{start + m - 1} ({genome[start:start + m]})")
`,
  steps: [
    `<code>find_all</code> היא לולאת ה-<code>find</code> ממודול 4, שמוצאת גם מופעים חופפים.`,
    `החיפוש בגדיל העליון מוצא את <code>TATAAA</code> באינדקס 2.`,
    `החיפוש בהשלמה ההפוכה מוצא התאמה נוספת: ברצף המקורי היא נראית כמו <code>TTTATA</code>, שהיא ההשלמה ההפוכה של המוטיב. על הגדיל השני זהו <code>TATAAA</code> רגיל.`,
    `תרגום הקואורדינטות הוא החלק העדין: אינדקס <code>j</code> בהשלמה ההפוכה סופר מהקצה השני של הגנום. הקטע מסתיים בעמדה ${L("n − 1 − j")} של הגדיל העליון, ולכן מתחיל ב-${L("n − (j + m)")}.`,
    `באגים בתרגום קואורדינטות בין גדילים נפוצים מאוד בצנרות ניתוח. בדיקה פשוטה: <code>genome[start:start + m]</code> צריך להיות שווה ל-<code>reverse_complement(motif)</code>.`,
  ],
})}

${demo({
  title: "k-mers קנוניים: ספירה בלי תלות בגדיל",
  intro: `אותה מולקולת DNA יכולה להיקרא מכל אחד משני הגדילים. כדי שהספירה לא תהיה תלויה בגדיל שנקרא, כלים כמו Jellyfish ו-Mash סופרים כל k-mer יחד עם ההשלמה ההפוכה שלו, תחת נציג אחד: ה"קנוני". זה גם גשר למודול הבא.`,
  code: `
from collections import Counter

def reverse_complement(dna):
    return dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]

def canonical(kmer):
    return min(kmer, reverse_complement(kmer))

read_plus = "ATGGCGTA"
read_minus = reverse_complement(read_plus)   # same molecule, other strand
k = 3

for name, read in (("plus ", read_plus), ("minus", read_minus)):
    kmers = [read[i:i + k] for i in range(len(read) - k + 1)]
    counts = Counter(canonical(x) for x in kmers)
    print(name, read, "->", sorted(counts.items()))
`,
  steps: [
    `<code>canonical</code> מחזירה את הקטן מבין ה-k-mer וההשלמה ההפוכה שלו, לפי סדר אלפביתי (<code>min</code> על מחרוזות משווה מילונית).`,
    `<code>read_minus</code> היא אותה מולקולה כפי שהייתה נקראת מהגדיל השני. ה-k-mers הגולמיים שלה שונים לגמרי מאלה של <code>read_plus</code>.`,
    `רשימת ההבנה מפרקת כל קריאה ל-k-mers חופפים, ו-<code>Counter</code> סופר אותם אחרי ההמרה לצורה הקנונית.`,
    `<code>sorted(counts.items())</code> ממיין את הזוגות כדי שיהיה קל להשוות. שתי השורות בפלט זהות: הספירה הקנונית לא תלויה בגדיל.`,
    `שימו לב: ל-k אי-זוגי אין k-mer ששווה להשלמה ההפוכה של עצמו, ולכן כל זוג מקבל נציג אחד ברור. זו אחת הסיבות שכלים בוחרים k אי-זוגי.`,
  ],
})}

<h2><span class="h-num">5</span>המשימה שלכם</h2>
<p>ממשו את <code>reverse_complement(dna)</code>. הבדיקות הנסתרות כוללות מחרוזת ריקה, בסיסים בודדים, פלינדרומים ורצף ארוך מאוד.</p>
`,

    problem: {
      statement: `
<p>ההשלמה ההפוכה של מחרוזת DNA ‏<code>s</code> מתקבלת בשני צעדים: הופכים את סדר הסמלים ב-<code>s</code>, ואז מחליפים כל סמל במשלים שלו: <code>A</code>↔<code>T</code> ו-<code>C</code>↔<code>G</code>. (אפשר גם בסדר ההפוך: קודם להשלים ואז להפוך.)</p>
<p>ממשו את <code>reverse_complement(dna)</code> כך שתחזיר את ההשלמה ההפוכה כמחרוזת.</p>`,
      examples: [
        { input: 'dna = "AAAACCCGGT"', output: '"ACCGGGTTTT"', explanation: "היפוך נותן TGGCCCAAAA, וההשלמה שלו היא ACCGGGTTTT." },
        { input: 'dna = "ATGCCGTT"', output: '"AACGGCAT"' },
        { input: 'dna = "GAATTC"', output: '"GAATTC"', explanation: "אתר EcoRI הוא פלינדרום: הוא שווה להשלמה ההפוכה של עצמו." },
      ],
      constraints: [
        "<code>0 ≤ len(dna) ≤ 10<sup>5</sup></code>",
        "<code>dna</code> מכילה רק את האותיות הגדולות <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code>",
        "יש להחזיר <code>str</code>",
      ],
      hints: [
        "<code>dna[::-1]</code> הופך מחרוזת.",
        "מילון <code>{\"A\": \"T\", ...}</code> או <code>str.maketrans</code> ממפים כל בסיס למשלים שלו.",
        "אל תשתמשו בשרשרת של <code>replace</code>: ה-<code>replace</code> השני ישנה גם את התווים שנוצרו בראשון.",
      ],
    },

    starter: `def reverse_complement(dna):
    """
    Return the reverse complement of a DNA string (A<->T, C<->G, then reverse).

    >>> reverse_complement("AAAACCCGGT")
    'ACCGGGTTTT'
    """
    # Write your code here
    pass
`,
    solution: `COMPLEMENT = str.maketrans("ACGT", "TGCA")


def reverse_complement(dna):
    # Complement every base in one C-speed pass, then read it backwards.
    return dna.translate(COMPLEMENT)[::-1]
`,
    tests: [
      { args: ["AAAACCCGGT"], expected: "ACCGGGTTTT" },
      { args: ["ATGCCGTT"], expected: "AACGGCAT" },
      { args: ["GAATTC"], expected: "GAATTC" },
      { args: [""], expected: "", hidden: true },
      { args: ["A"], expected: "T", hidden: true },
      { args: ["C"], expected: "G", hidden: true },
      { args: ["TTTT"], expected: "AAAA", hidden: true },
      { args: ["ACGT"], expected: "ACGT", hidden: true },
      { args: ["GGGCCCATAC"], expected: revComp("GGGCCCATAC"), hidden: true },
      { args: ["ATGGCCTAGC".repeat(1000)], expected: revComp("ATGGCCTAGC".repeat(1000)), hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 9 ─────────────────────────────── */
  const m9 = {
    id: "m9",
    number: 9,
    title: "תדירויות k-mer",
    short: "תדירויות k-mer",
    level: "hard",
    difficulty: "קשה",
    minutes: 45,
    topics: ["הרכבת גנומים", "חלון נע", "ספירה במילון"],
    fnName: "count_kmers",

    lesson: `
<p class="eyebrow">מודול 9 · ביולוגיה × מדעי המחשב</p>
<h1>תדירויות k-mer</h1>
<p class="lede">k-mer הוא פשוט תת-מחרוזת באורך k. הרעיון הפשוט הזה מניע חלק גדול מהביואינפורמטיקה המודרנית: הרכבת גנומים, זיהוי מינים בדגימות מיקרוביום, הערכת גודל של גנום ואפילו בקרת איכות של נתוני ריצוף. במודול הזה תכתבו את פונקציית הספירה שעומדת בבסיס כל אלה.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>מהו k-mer, וכמה k-mers יש ברצף באורך n</li>
    <li>למה k-mers הם הבסיס להרכבת גנומים (גרפי de Bruijn)</li>
    <li>ספירה במילון: <code>dict</code>, ‏<code>get</code>, ‏<code>defaultdict</code> ו-<code>Counter</code></li>
    <li>איך בוחרים k: הפשרה בין ייחודיות לעמידות בפני שגיאות</li>
  </ul>
</div>

<h2><span class="h-num">1</span>מהו k-mer?</h2>
<p>k-mer הוא כל תת-מחרוזת רציפה באורך k. ברצף באורך n יש בדיוק <strong>${L("n − k + 1")}</strong> חלונות, כמו בחלון הנע של מודול 4. לעומת זאת, מספר ה-k-mers <em>האפשריים</em> באלפבית של 4 אותיות הוא ${L("4<sup>k</sup>")}: ‏16 עבור ${L("k = 2")}, ‏65,536 עבור ${L("k = 8")}, ויותר מ-4 טריליון עבור ${L("k = 21")}.</p>
${kmerFigure("ACGTACGT", 3)}
<p class="caption">שישה חלונות באורך 3 ברצף באורך 8: ${L("8 − 3 + 1 = 6")}. ‏<code>ACG</code> ו-<code>CGT</code> מופיעים פעמיים כל אחד.</p>
<p><strong>הרכב ה-k-mers</strong> (k-mer composition) של רצף הוא רשימת כל ה-k-mers שלו, עם מספר המופעים של כל אחד. זה בדיוק מה שתחזירו בתרגיל: מילון שבו המפתח הוא ה-k-mer, והערך הוא הספירה.</p>

<h2><span class="h-num">2</span>למה k-mers חשובים?</h2>
<ul class="tight">
  <li><strong>הרכבת גנומים</strong>: מכשירי ריצוף קוראים מיליוני מקטעים קצרים. אסמבלרים כמו SPAdes ו-Velvet מפרקים את הקריאות ל-k-mers ובונים מהם <em>גרף de Bruijn</em>: כל k-mer הוא קשת בין התחילית לסיפא שלו, שאורכן ${L("k − 1")}. מסלול שעובר בכל הקשתות משחזר את הגנום.</li>
  <li><strong>זיהוי מינים ומטאגנומיקה</strong>: כלים כמו Kraken2 מחזיקים מאגר של k-mers (למשל באורך 35) שבו כל k-mer ממופה למין שלו. כך אפשר לסווג מיליוני קריאות בדקות, בלי יישור.</li>
  <li><strong>הערכת גודל הגנום</strong>: היסטוגרמה של ספירות ה-k-mers (‏"k-mer spectrum") מראה פסגה סביב עומק הריצוף. כלים כמו GenomeScope מסיקים ממנה את גודל הגנום, את רמת ההטרוזיגוטיות ואת כמות הרצפים החוזרים.</li>
  <li><strong>תיקון שגיאות</strong>: k-mer שמופיע פעם אחת בלבד בנתונים עמוקים הוא כנראה שגיאת ריצוף. על העיקרון הזה עובדים כלים לתיקון שגיאות.</li>
  <li><strong>חתימת הרכב</strong>: לכל גנום יש "טביעת אצבע" של תדירויות k-mers קצרים (למשל 4-mers), שמשמשת לקיבוץ (binning) של רצפים לפי המין שממנו הגיעו.</li>
</ul>

<div class="callout callout-bio">
  <div class="callout-title">בחירת k היא פשרה</div>
  <p>אם k קטן מדי, אותו k-mer מופיע במקומות רבים בגנום, ואי אפשר לדעת מאיפה הוא הגיע. אם k גדול מדי, כל שגיאת ריצוף אחת הורסת k k-mers, ויש פחות חפיפה בין קריאות. בגנום האדם (${L("3·10⁹")} בסיסים) רוב ה-k-mers באורך 31 ומעלה ייחודיים, ולכן ערכים כמו 21, ‏31 ו-51 נפוצים. מקובל לבחור k אי-זוגי, כדי ש-k-mer לעולם לא יהיה שווה להשלמה ההפוכה של עצמו (מודול 8).</p>
</div>

<h2><span class="h-num">3</span>מעבדה חזותית: ספירת k-mers</h2>
<p>בחרו רצף וערך של k ולחצו <strong>סריקה</strong>. החלון זז עמדה אחת בכל צעד, והספירה של ה-k-mer שבתוכו עולה ב-1. הטבלה ממוינת לפי שכיחות. נסו להגדיל את k ולראות איך כמעט כל k-mer הופך לייחודי.</p>
<div data-viz="kmers"></div>

<h2><span class="h-num">4</span>ספירה במילון</h2>
<p>ספירת תדירויות היא שימוש קלאסי במילון: המפתח הוא הפריט, והערך הוא מספר הפעמים שראינו אותו. יש כמה דרכים לכתוב את זה, מהמפורשת ועד הקצרה ביותר:</p>
${py(`
dna, k = "ACGTACGT", 3
windows = [dna[i:i + k] for i in range(len(dna) - k + 1)]
# ['ACG', 'CGT', 'GTA', 'TAC', 'ACG', 'CGT']

# 1) Explicit check
counts = {}
for kmer in windows:
    if kmer in counts:
        counts[kmer] += 1
    else:
        counts[kmer] = 1

# 2) dict.get with a default
counts = {}
for kmer in windows:
    counts[kmer] = counts.get(kmer, 0) + 1

# 3) defaultdict: a missing key starts at int() == 0
from collections import defaultdict
counts = defaultdict(int)
for kmer in windows:
    counts[kmer] += 1

# 4) Counter: does it all, plus most_common()
from collections import Counter
counts = Counter(windows)
print(counts)        # Counter({'ACG': 2, 'CGT': 2, 'GTA': 1, 'TAC': 1})
`)}

<div class="callout callout-cs">
  <div class="callout-title">כמה זה עולה?</div>
  <p>כל עדכון של <code>counts[kmer]</code> הוא חיפוש בטבלת גיבוב, ${L("O(1)")} בממוצע (מודול 5). ספירת כל ה-k-mers לוקחת ${L("O(n·k)")}: יש ${L("n − k + 1")} חלונות, וחיתוך וגיבוב של כל k-mer עולים ${L("O(k)")}. המילון שומר רק k-mers שבאמת הופיעו, ולא את כל ${L("4<sup>k</sup>")} האפשרויות, ולכן הוא חסכוני גם כש-k גדול.</p>
</div>

<div class="callout callout-warn">
  <div class="callout-title">מקרי קצה</div>
  <ul class="tight">
    <li><strong>k גדול מאורך הרצף</strong>: אין אף חלון, ולכן מחזירים מילון ריק. <code>range</code> עם גבול שלילי פשוט לא רץ, אבל כדאי לחשוב על זה במפורש.</li>
    <li><strong><code>k ≤ 0</code></strong>: אין k-mers באורך 0 או באורך שלילי. שימו לב שהחיתוך <code>dna[i:i + 0]</code> מחזיר מחרוזת ריקה, ולכן בלי בדיקה מפורשת תקבלו מפתח <code>""</code> שגוי.</li>
    <li><code>Counter</code> הוא תת-מחלקה של <code>dict</code>, ולכן מותר להחזיר אותו בתרגיל.</li>
  </ul>
</div>

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n·k)</span><span class="cx-note">${L("n − k + 1")} חלונות, וחיתוך וגיבוב של ${L("O(k)")} לכל אחד</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n·k)</span><span class="cx-note">לכל היותר ${L("n − k + 1")} מפתחות שונים, כל אחד באורך k</span></div>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "גרף de Bruijn: הצעד הראשון בהרכבת גנום",
  intro: `אסמבלרים לא משווים קריאות זו לזו ישירות. הם מפרקים אותן ל-k-mers, ומחברים כל תחילית לסיפא שלה. הדוגמה בונה את רשימת השכנויות של הגרף מארבע קריאות קצרות וחופפות.`,
  code: `
from collections import defaultdict

reads = ["ATGGCGT", "GGCGTGC", "CGTGCAA", "TGCAATG"]
k = 4

graph = defaultdict(set)
for read in reads:
    for i in range(len(read) - k + 1):
        kmer = read[i:i + k]
        graph[kmer[:-1]].add(kmer[1:])     # edge: prefix -> suffix

for node in sorted(graph):
    print(node, "->", ", ".join(sorted(graph[node])))
`,
  steps: [
    `ארבע הקריאות חופפות זו לזו, כמו מקטעים אמיתיים מאותו אזור בגנום. אף אחת מהן לבדה לא מכילה את כל הרצף.`,
    `<code>defaultdict(set)</code> יוצר קבוצה ריקה בפעם הראשונה שניגשים למפתח חדש. בחרנו ב-<code>set</code> ולא ב-<code>list</code>, כי אותו k-mer מופיע בכמה קריאות וחפיפות כפולות לא מוסיפות מידע.`,
    `כל k-mer הופך לקשת: מהתחילית שלו, <code>kmer[:-1]</code>, אל הסיפא שלו, <code>kmer[1:]</code>. שתיהן באורך ${L("k − 1 = 3")}.`,
    `ההדפסה ממוינת כדי שהפלט יהיה קבוע. עקבו אחרי החצים: <code>ATG → TGG → GGC → GCG → CGT → GTG → TGC → GCA → CAA → AAT → ATG</code>. זה מעגל, כלומר הקריאות כנראה הגיעו מ-DNA מעגלי, כמו פלסמיד.`,
    `באסמבלר אמיתי מחפשים <em>מסלול אוילר</em>, מסלול שעובר בכל קשת פעם אחת. זו בעיה שפותרים ביעילות, וזו הסיבה שגרפי de Bruijn החליפו את שיטות ההרכבה הישנות שהשוו כל זוג קריאות.`,
  ],
})}

${demo({
  title: "ספקטרום k-mer: כמה פעמים מופיע כל k-mer?",
  intro: `נייצר גנום אקראי, נדגום ממנו קריאות בעומק של כ-30x, ונספור k-mers. ההיסטוגרמה של הספירות, ה"ספקטרום", חושפת את עומק הריצוף, ומכאן אפשר להעריך את גודל הגנום בלי להרכיב אותו.`,
  code: `
import random
from collections import Counter

random.seed(7)
genome = "".join(random.choice("ACGT") for _ in range(400))
reads = []
for _ in range(120):                       # 120 reads x 100 bp over 400 bp = 30x
    start = random.randrange(len(genome) - 99)
    reads.append(genome[start:start + 100])

k = 15
kmer_counts = Counter(r[i:i + k] for r in reads for i in range(len(r) - k + 1))
spectrum = Counter(10 * (c // 10) for c in kmer_counts.values())

for low in sorted(spectrum):
    print(f"{low:>3}-{low + 9:<3}x  {spectrum[low]:>3} k-mers  {'#' * (spectrum[low] // 5)}")

total = sum(c for c in kmer_counts.values())
peak = max(kmer_counts.values(), key=list(kmer_counts.values()).count)
print("estimated genome size:", round(total / peak), "bp (true: 400)")
`,
  steps: [
    `<code>random.seed(7)</code> מבטיח שהגנום והקריאות יהיו זהים בכל הרצה. <code>random.randrange(len(genome) - 99)</code> בוחר עמדת התחלה כך שכל קריאה באורך 100 נכנסת במלואה לגנום.`,
    `ה-<code>Counter</code> מקבל גנרטור עם שתי לולאות: על כל קריאה, ועל כל חלון בתוכה. כך נספרים כל ה-15-mers מכל הקריאות, בלי לבנות רשימת ביניים ענקית.`,
    `<code>kmer_counts.values()</code> הן הספירות. ‏<code>10 * (c // 10)</code> מקבץ אותן לתאים ברוחב 10 (‏0–9, ‏10–19, וכן הלאה), ו-<code>Counter</code> שני סופר כמה k-mers נופלים בכל תא. זה הספקטרום.`,
    `רוב ה-k-mers מתקבצים בתא 30–39. עומק הריצוף <em>הממוצע</em> הוא 30x, אבל במרכז הגנום הוא גבוה יותר, כי קריאות לא יכולות להתחיל קרוב לקצה הימני. מצד שני, k-mer באורך 15 נספר רק בקריאות שמכסות אותו במלואו, ולכן עומק ה-k-mer נמוך מעט מעומק הבסיסים. k-mers בקצוות הגנום מכוסים פחות, ולכן נופלים לתאים הנמוכים.`,
    `הערכת הגודל: סך כל מופעי ה-k-mers מחולק בספירה השכיחה ביותר (פסגת הספקטרום) נותן בקירוב את מספר ה-k-mers השונים בגנום, כלומר את אורכו. כאן מתקבל 356 במקום 400: הגנום קצר מאוד, והקצוות המכוסים פחות והרעש האקראי מטים את ההערכה. בגנומים של מיליארדי בסיסים ההשפעה הזו זניחה, ו-GenomeScope גם מתקן אותה במודל סטטיסטי.`,
  ],
})}

${demo({
  title: "השוואת רצפים לפי הרכב k-mer (מדד Jaccard)",
  intro: `אפשר להשוות שני רצפים בלי ליישר אותם: מספיק להשוות את קבוצות ה-k-mers שלהם. זה הרעיון שמאחורי Mash ו-sourmash, שמשווים אלפי גנומים שלמים בשניות.`,
  code: `
def kmer_set(seq, k):
    return {seq[i:i + k] for i in range(len(seq) - k + 1)}

def jaccard(a, b, k=4):
    A, B = kmer_set(a, k), kmer_set(b, k)
    return len(A & B) / len(A | B)

seqs = {
    "seqA": "ATGCGTACGTTAGCCGATCGATCGGATCCA",
    "seqB": "ATGCGTACGTTAGCCGATCGTTCGGATCCA",   # one substitution vs seqA
    "seqC": "TTGACCATGGCATTAGCAACCGTTAGCGAT",
}
names = list(seqs)
for i, a in enumerate(names):
    for b in names[i + 1:]:
        print(f"{a} vs {b}: Jaccard = {jaccard(seqs[a], seqs[b]):.2f}")
`,
  steps: [
    `<code>kmer_set</code> משתמשת ב<em>הבנת קבוצה</em> (set comprehension), עם סוגריים מסולסלים: כל k-mer נשמר פעם אחת בלבד, בלי ספירה.`,
    `<code>A &amp; B</code> הוא החיתוך (k-mers משותפים), ו-<code>A | B</code> הוא האיחוד. מדד Jaccard הוא היחס ביניהם: 1 לקבוצות זהות, 0 לקבוצות זרות.`,
    `הלולאה הכפולה עם <code>names[i + 1:]</code> עוברת על כל זוג פעם אחת בלבד, בלי להשוות רצף לעצמו ובלי זוגות כפולים.`,
    `seqA ו-seqB נבדלים בבסיס אחד בלבד, ובכל זאת המדד נמוך מ-1 בצורה בולטת: מוטציה אחת משנה עד k k-mers. ל-seqC כמעט אין k-mers משותפים עם השניים האחרים.`,
    `בגנומים שלמים, Mash לא מחזיק את כל הקבוצה אלא "סקיצה" קטנה (MinHash) של כמה אלפי k-mers, ומעריך ממנה את מדד Jaccard ואת המרחק האבולוציוני.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>ממשו את <code>count_kmers(dna, k)</code>, שמחזירה מילון עם כל ה-k-mers והספירות שלהם. הבדיקות הנסתרות כוללות <code>k</code> שווה ל-0 ושלילי, <code>k</code> גדול מהרצף, רצף ריק ורצף ארוך מאוד.</p>
`,

    problem: {
      statement: `
<p>בהינתן מחרוזת DNA ‏<code>dna</code> ומספר שלם <code>k</code>, ספרו כמה פעמים מופיע כל k-mer: כל תת-מחרוזת רציפה באורך <code>k</code>.</p>
<p>ממשו את <code>count_kmers(dna, k)</code> כך שתחזיר <strong>מילון</strong> שבו כל מפתח הוא k-mer שמופיע ברצף, והערך הוא מספר המופעים שלו.</p>
<ul class="tight">
  <li>החלונות חופפים: ב-<code>"AAAA"</code> יש שלושה מופעים של <code>"AA"</code>.</li>
  <li>k-mers שאינם מופיעים לא נכללים במילון.</li>
  <li>אם <code>k</code> גדול מאורך הרצף, או ש-<code>k ≤ 0</code>, החזירו מילון ריק <code>{}</code>.</li>
  <li>מותר להחזיר <code>dict</code> רגיל או <code>Counter</code>. סדר המפתחות לא משנה.</li>
</ul>`,
      examples: [
        { input: 'dna = "ACGTACGT", k = 3', output: "{'ACG': 2, 'CGT': 2, 'GTA': 1, 'TAC': 1}", explanation: "שישה חלונות: ACG, ‏CGT, ‏GTA, ‏TAC, ‏ACG, ‏CGT." },
        { input: 'dna = "AAAA", k = 2', output: "{'AA': 3}" },
        { input: 'dna = "ACG", k = 5', output: "{}", explanation: "אין אף חלון באורך 5." },
      ],
      constraints: [
        "<code>0 ≤ len(dna) ≤ 10<sup>5</sup></code>",
        "<code>k</code> הוא מספר שלם, ויכול להיות גם 0 או שלילי",
        "יש להחזיר <code>dict</code> (או <code>Counter</code>) עם מפתחות <code>str</code> וערכים <code>int</code>",
      ],
      hints: [
        "יש <code>len(dna) - k + 1</code> חלונות.",
        "<code>counts[kmer] = counts.get(kmer, 0) + 1</code> מעדכן ספירה גם כשהמפתח עדיין לא קיים.",
        "בדקו <code>k &lt;= 0</code> לפני הלולאה, אחרת תקבלו מפתח <code>\"\"</code>.",
      ],
    },

    starter: `def count_kmers(dna, k):
    """
    Count every overlapping k-mer in dna.
    Return a dict {kmer: count}; return {} if k <= 0 or k > len(dna).

    >>> count_kmers("AAAA", 2)
    {'AA': 3}
    """
    # Write your code here
    pass
`,
    solution: `def count_kmers(dna, k):
    counts = {}
    if k <= 0:
        return counts
    for i in range(len(dna) - k + 1):
        kmer = dna[i:i + k]
        counts[kmer] = counts.get(kmer, 0) + 1
    return counts
`,
    tests: [
      { args: ["ACGTACGT", 3], expected: { ACG: 2, CGT: 2, GTA: 1, TAC: 1 } },
      { args: ["AAAA", 2], expected: { AA: 3 } },
      { args: ["ACG", 5], expected: {} },
      { args: ["", 3], expected: {}, hidden: true },
      { args: ["ACGT", 0], expected: {}, hidden: true },
      { args: ["ACGT", -2], expected: {}, hidden: true },
      { args: ["ACGT", 4], expected: { ACGT: 1 }, hidden: true },
      { args: ["GATTACA", 1], expected: { G: 1, A: 3, T: 2, C: 1 }, hidden: true },
      { args: ["ATATAT", 2], expected: { AT: 3, TA: 2 }, hidden: true },
      { args: ["ACGTTGCATGTCGCATGATGCATGAGAGCT", 4], expected: countKmers("ACGTTGCATGTCGCATGATGCATGAGAGCT", 4), hidden: true },
      { args: ["ACGT".repeat(2500), 4], expected: countKmers("ACGT".repeat(2500), 4), hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 10 ─────────────────────────────── */
  const CONS_SAMPLE = ["ATCCAGCT", "GGGCAACT", "ATGGATCT", "AAGCAACC", "TTGGAACT", "ATGCCATT", "ATGGCACT"];
  const BIG_ALIGNMENT = noisyAlignment(60, 80, 2026);

  const m10 = {
    id: "m10",
    number: 10,
    title: "מטריצות פרופיל ורצפי קונצנזוס",
    short: "פרופיל וקונצנזוס",
    level: "hard",
    difficulty: "קשה",
    minutes: 50,
    topics: ["יישור מרובה", "רשימות של רשימות", "zip על עמודות"],
    fnName: "consensus_sequence",

    lesson: `
<p class="eyebrow">מודול 10 · ביולוגיה × מדעי המחשב</p>
<h1>מטריצות פרופיל ורצפי קונצנזוס</h1>
<p class="lede">כשמיישרים את אותו גן מעשרות מינים, או את אתרי הקישור של אותו גורם שעתוק, רואים מיד שיש עמודות שכמעט לא משתנות, ועמודות שמשתנות הרבה. <strong>מטריצת פרופיל</strong> סופרת את הבסיסים בכל עמודה, ו<strong>רצף הקונצנזוס</strong> מסכם אותה למחרוזת אחת. אלה הכלים הבסיסיים לתיאור מוטיבים ואזורים שמורים.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>יישור מרובה (MSA), ומה מלמדות עמודות שמורות</li>
    <li>מטריצת פרופיל, רצף קונצנזוס, PWM ולוגו רצף</li>
    <li>מערכים דו-ממדיים ב-Python: רשימות של רשימות</li>
    <li>מעבר על עמודות בעזרת <code>zip(*rows)</code></li>
  </ul>
</div>

<h2><span class="h-num">1</span>יישור מרובה ואזורים שמורים</h2>
<p><strong>יישור רצפים מרובה</strong> (Multiple Sequence Alignment, ‏MSA) מסדר כמה רצפים הומולוגיים זה מעל זה, כך שכל עמודה מכילה עמדות בעלות מוצא משותף. כלים כמו Clustal Omega, ‏MAFFT ו-MUSCLE בונים יישורים כאלה מעשרות ועד מיליוני רצפים.</p>
<p>הברירה הטבעית פועלת כמסננת: מוטציה בעמדה חיונית לתפקוד, כמו האתר הפעיל של אנזים או בסיס שגורם שעתוק חייב לזהות, פוגעת ביצור ולכן נעלמת מהאוכלוסייה. כתוצאה מכך, <strong>עמודות שמורות</strong> ביישור מצביעות על עמדות חשובות, ועמודות משתנות מצביעות על עמדות שבהן לשינוי אין מחיר גבוה.</p>

<h2><span class="h-num">2</span>מטריצת פרופיל ורצף קונצנזוס</h2>
<p><strong>מטריצת פרופיל</strong> היא טבלה בגודל ${L("4 × n")}: שורה לכל בסיס ועמודה לכל עמדה ביישור. כל תא סופר כמה רצפים מכילים את הבסיס הזה בעמדה הזו. <strong>רצף הקונצנזוס</strong> נוצר כשבוחרים בכל עמודה את הבסיס עם הספירה הגבוהה ביותר.</p>
${profileFigure(CONS_SAMPLE)}
<p class="caption">למעלה: שבעה רצפים מיושרים. באמצע: מטריצת הפרופיל, כשהמקסימום בכל עמודה מודגש. למטה (★): רצף הקונצנזוס <code>ATGCAACT</code>.</p>

<div class="callout callout-cs">
  <div class="callout-title">כשיש תיקו</div>
  <p>ייתכן ששני בסיסים יקבלו את אותה ספירה מקסימלית בעמודה. אין תשובה "נכונה" אחת, אבל צריך כלל עקבי. בתרגיל בוחרים את הבסיס <strong>הראשון לפי סדר האלפבית</strong> (A, אחריו C, ‏G ו-T). שימו לב: <code>Counter.most_common</code> שובר תיקו לפי סדר ההופעה ולא לפי האלפבית, ולכן הוא עלול לתת תשובה אחרת. ביולוגים מסמנים לפעמים תיקו בקוד IUPAC, למשל <code>R</code> לתיקו בין A ל-G.</p>
</div>

<h3>מקונצנזוס ל-PWM וללוגו רצף</h3>
<p>רצף קונצנזוס מאבד מידע: עמודה עם 90% A ועמודה עם 40% A יקבלו שתיהן A. לכן מחלקים כל ספירה במספר הרצפים ומקבלים <strong>מטריצת הסתברויות</strong>, ומשם <strong>מטריצת משקל-עמדה</strong> (PWM): הלוגריתם של היחס בין כל הסתברות להסתברות הרקע. בעזרת PWM סורקים גנומים כדי למצוא אתרי קישור חדשים. הייצוג החזותי המוכר הוא <strong>לוגו רצף</strong> (sequence logo): בכל עמודה נערמות האותיות, וגובהן פרופורציונלי לשימור, שנמדד בביטים. מאגרים כמו JASPAR מפרסמים אלפי מוטיבים כאלה.</p>
<div class="formula-card">
  <div class="fc-row"><span class="fc-name">תוכן מידע בעמודה</span><span class="fc-when">0 עד 2 ביטים ב-DNA</span></div>
  <div class="fc-eq" dir="ltr">IC = 2 + Σ<sub>b</sub> p<sub>b</sub> · log₂ p<sub>b</sub></div>
</div>

<h2><span class="h-num">3</span>מעבדה חזותית: בונים פרופיל</h2>
<p>ערכו את היישור (שורה לכל רצף) ולחצו <strong>סריקה</strong>. בכל צעד נספרת עמודה אחת, ספירות הבסיסים נכנסות למטריצת הפרופיל, והבסיס הנבחר מתווסף לקונצנזוס. עמודות עם תיקו מסומנות, והבחירה בהן היא לפי סדר האלפבית.</p>
<div data-viz="profile"></div>

<h2><span class="h-num">4</span>מערכים דו-ממדיים ב-Python</h2>
<p>ל-Python אין מערך דו-ממדי מובנה (בלי ספריות כמו NumPy), ולכן משתמשים ב<strong>רשימה של רשימות</strong>: הרשימה החיצונית מחזיקה שורות, וכל שורה היא רשימה של ערכים. ניגשים לתא בעזרת שני אינדקסים: <code>matrix[row][col]</code>. גם רשימה של מחרוזות באותו אורך מתנהגת כמו טבלה דו-ממדית.</p>
${py(`
alignment = ["ATCC", "GGGC", "ATGG"]

# Rows are the strings themselves; one cell is alignment[row][col]
alignment[2][1]                 # 'T'  -> row 2, column 1

# Columns: zip(*rows) "transposes" the alignment
columns = list(zip(*alignment))
columns[0]                      # ('A', 'G', 'A')
len(columns)                    # 4    -> number of positions

# A 4 x n profile matrix as a list of lists, one row per base
BASES = "ACGT"
n = len(alignment[0])
profile = [[0] * n for _ in BASES]
for j, column in enumerate(zip(*alignment)):
    for base in column:
        profile[BASES.index(base)][j] += 1
print(profile)    # [[2, 0, 0, 0], [0, 0, 1, 2], [1, 1, 2, 1], [0, 2, 0, 0]]
`)}

<div class="callout callout-warn">
  <div class="callout-title">המלכודת של <code>[[0] * n] * 4</code></div>
  <p>הביטוי הזה <em>נראה</em> כמו ארבע שורות, אבל בפועל הוא ארבע הפניות לאותה רשימה בדיוק. שינוי של <code>profile[0][0]</code> ישנה את כל השורות! תמיד בנו כל שורה מחדש בעזרת רשימת הבנה: <code>[[0] * n for _ in range(4)]</code>. תפגשו את המלכודת הזו שוב במודול 11.</p>
  ${py(`
bad = [[0] * 3] * 2
bad[0][0] = 9
print(bad)        # [[9, 0, 0], [9, 0, 0]]  <- both rows changed!

good = [[0] * 3 for _ in range(2)]
good[0][0] = 9
print(good)       # [[9, 0, 0], [0, 0, 0]]
`)}
</div>

<h3>בחירת מקסימום עם כלל לשבירת תיקו</h3>
<p><code>max</code> מחזיר את האיבר <em>הראשון</em> עם הערך הגבוה ביותר. אם עוברים על הבסיסים בסדר <code>"ACGT"</code>, תיקו נשבר אוטומטית לטובת הבסיס שקודם באלפבית:</p>
${py(`
column = ("A", "C", "C", "A")
max("ACGT", key=column.count)       # 'A'  -> A and C tie at 2; A comes first
`)}

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(m·n)</span><span class="cx-note">m רצפים באורך n: כל תו נספר פעם אחת</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">מטריצת פרופיל ${L("4 × n")} ורצף קונצנזוס באורך n</span></div>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "מטריצת פרופיל בפורמט של Rosalind",
  intro: `הדוגמה בונה את מטריצת הפרופיל של שבעת הרצפים מהאיור, כמילון שבו לכל בסיס יש רשימת ספירות, ומדפיסה אותה בפורמט של בעיית CONS ב-Rosalind.`,
  code: `
dna_list = [
    "ATCCAGCT", "GGGCAACT", "ATGGATCT", "AAGCAACC",
    "TTGGAACT", "ATGCCATT", "ATGGCACT",
]
BASES = "ACGT"
n = len(dna_list[0])

profile = {base: [0] * n for base in BASES}
for seq in dna_list:
    for j, base in enumerate(seq):
        profile[base][j] += 1

for base in BASES:
    print(base + ":", " ".join(str(count) for count in profile[base]))

column_totals = [sum(profile[b][j] for b in BASES) for j in range(n)]
print("column totals:", column_totals)
`,
  steps: [
    `<code>{base: [0] * n for base in BASES}</code> היא הבנת מילון: היא יוצרת ארבע רשימות <em>נפרדות</em> של אפסים, אחת לכל בסיס. כאן אין מלכודת הפניות, כי <code>[0] * n</code> מחושב מחדש עבור כל מפתח.`,
    `הלולאה החיצונית עוברת על הרצפים (השורות), ו-<code>enumerate(seq)</code> נותן לכל תו את מספר העמודה שלו. <code>profile[base][j] += 1</code> מעלה את הספירה בתא הנכון.`,
    `ההדפסה ממירה כל ספירה למחרוזת ומחברת ברווחים. ‏<code>" ".join</code> דורש מחרוזות, ולכן צריך את <code>str(count)</code>.`,
    `<code>column_totals</code> היא בדיקת שפיות: בכל עמודה סכום הספירות חייב להיות שווה למספר הרצפים, 7. בדיקות כאלה תופסות באגים של אינדקסים מוקדם.`,
    `כדי לקבל רצף קונצנזוס מהטבלה, בוחרים בכל עמודה את הבסיס עם הספירה הגבוהה ביותר. את השלב הזה, כולל כלל שבירת התיקו, תממשו בתרגיל.`,
  ],
})}

${demo({
  title: "תוכן מידע לכל עמודה: הבסיס ללוגו רצף",
  intro: `כמה "מידע" יש בכל עמודה של מוטיב? עמודה שמורה לגמרי שווה 2 ביטים, ועמודה אקראית לגמרי שווה 0. הדוגמה מחשבת זאת עבור אתרי TATA box, ומשרטטת פס טקסטואלי לכל עמדה.`,
  code: `
import math

sites = ["TATAAA", "TATATA", "TATAAT", "TATAAA", "CATAAA", "TATAAA"]

for j, column in enumerate(zip(*sites)):
    n = len(column)
    entropy = 0.0
    for base in "ACGT":
        p = column.count(base) / n
        if p > 0:
            entropy -= p * math.log2(p)
    info = 2 - entropy
    print(f"pos {j}: {''.join(column)}  IC = {info:.2f} bits  {'#' * round(info * 10)}")
`,
  steps: [
    `<code>zip(*sites)</code> מחזיר את העמודות, ו-<code>enumerate</code> מוסיף לכל אחת את מספר העמדה.`,
    `<code>column.count(base) / n</code> הוא שיעור הבסיס בעמודה, כלומר הסתברות. עבור p שווה 0 מדלגים, כי ${L("log₂ 0")} אינו מוגדר (ובגבול, התרומה שלו היא 0).`,
    `האנטרופיה של שאנון, ${L("H = −Σ p·log₂ p")}, מודדת אי-ודאות: 0 לעמודה שמורה לגמרי, ו-2 ביטים לעמודה שבה ארבעת הבסיסים שווים בשכיחותם.`,
    `תוכן המידע הוא ${L("2 − H")}. עמודות 1, ‏2 ו-3, שבהן אותו בסיס בכל האתרים (<code>AAAAAA</code>, ‏<code>TTTTTT</code>, ‏<code>AAAAAA</code>), מקבלות את המקסימום: 2 ביטים. עמודות 0, ‏4 ו-5, שבהן יש שונות, מקבלות פחות.`,
    `<code>'#' * round(info * 10)</code> משרטט פס באורך פרופורציונלי למידע. בלוגו רצף אמיתי, זה גובה ערימת האותיות בכל עמודה.`,
  ],
})}

${demo({
  title: "סריקת רצף בעזרת מטריצת משקל-עמדה (PWM)",
  intro: `מהאתרים הידועים בונים PWM, ואז "מעבירים" אותה לאורך רצף חדש ונותנים ציון לכל חלון. ציון גבוה פירושו חלון שדומה למוטיב, גם אם הוא לא זהה לאף אחד מהאתרים המקוריים.`,
  code: `
import math

sites = ["TATAAA", "TATATA", "TATAAT", "TATAAA", "CATAAA", "TATAAA"]
BASES = "ACGT"
k = len(sites[0])

# Log-odds weights with a pseudocount of 1 and a uniform 25% background
pwm = []
for column in zip(*sites):
    total = len(column) + 4
    pwm.append({b: math.log2(((column.count(b) + 1) / total) / 0.25) for b in BASES})

def score(window):
    return sum(pwm[j][base] for j, base in enumerate(window))

promoter = "GCGCTATAAAAGGCCTATTTAGGC"
hits = [(score(promoter[i:i + k]), i) for i in range(len(promoter) - k + 1)]
for s, i in sorted(hits, reverse=True)[:3]:
    print(f"index {i:>2}: {promoter[i:i + k]}  score = {s:+.2f}")
`,
  steps: [
    `לכל עמודה מחושב מילון משקלים, אחד לכל בסיס. המשקל הוא ${L("log₂")} של היחס בין שכיחות הבסיס בעמודה לבין שכיחות הרקע (25%). ציון חיובי פירושו "שכיח יותר מבמקרה".`,
    `<em>Pseudocount</em> של 1 מתווסף לכל ספירה (ולכן המכנה הוא ${L("len(column) + 4")}). בלעדיו, בסיס שלא הופיע באף אתר היה מקבל הסתברות 0, והלוגריתם שלו היה מינוס אינסוף.`,
    `<code>score</code> מסכמת את משקלי הבסיסים בחלון, עמדה אחר עמדה. זהו בדיוק הניקוד של מודול 7, רק שהפעם לכל עמדה יש "מטריצת ניקוד" משלה.`,
    `רשימת ההבנה מנקדת כל חלון ברצף, ו-<code>sorted(hits, reverse=True)[:3]</code> מחזיר את שלושת הגבוהים ביותר. tuples ממוינים קודם לפי האיבר הראשון, הציון.`,
    `<code>TATAAA</code> באינדקס 4 מקבל את הציון הגבוה ביותר. חלונות שדומים לו רק חלקית מקבלים ציונים נמוכים יותר, כך שהשיטה מדרגת אתרים לפי חוזקם ולא רק לפי "כן או לא". כך עובדים כלים כמו FIMO ו-HOMER.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>ממשו את <code>consensus_sequence(dna_list)</code>. הבדיקות הנסתרות כוללות רשימה ריקה, רצף בודד, הרבה עמודות עם תיקו, ויישור גדול של 60 רצפים באורך 80.</p>
`,

    problem: {
      statement: `
<p>נתונה רשימה <code>dna_list</code> של מחרוזות DNA באורך שווה, שמייצגת יישור: כל מחרוזת היא שורה, וכל אינדקס הוא עמודה.</p>
<p>ממשו את <code>consensus_sequence(dna_list)</code> כך שתחזיר את <strong>רצף הקונצנזוס</strong>: מחרוזת שבה בכל עמדה מופיע הבסיס השכיח ביותר בעמודה המתאימה.</p>
<ul class="tight">
  <li>אם יש תיקו בין כמה בסיסים, בחרו את הראשון לפי הסדר <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code>.</li>
  <li>אם הרשימה ריקה, החזירו מחרוזת ריקה <code>""</code>.</li>
</ul>`,
      examples: [
        { input: `dna_list = ${esc(JSON.stringify(CONS_SAMPLE)).replace(/,/g, ", ")}`, output: '"ATGCAACT"', explanation: "זה הקונצנזוס מהאיור בשיעור." },
        { input: 'dna_list = ["AC", "CA"]', output: '"AA"', explanation: "בשתי העמודות יש תיקו בין A ל-C, ו-A קודם באלפבית." },
        { input: 'dna_list = ["GT", "GT", "AC"]', output: '"GT"' },
      ],
      constraints: [
        "<code>0 ≤ len(dna_list) ≤ 500</code>, ואורך כל מחרוזת עד <code>1000</code>",
        "כל המחרוזות באותו אורך, ומכילות רק <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code>",
        "יש להחזיר <code>str</code>",
      ],
      hints: [
        "<code>zip(*dna_list)</code> מחזיר את העמודות אחת אחרי השנייה.",
        "עבור כל עמודה, ספרו כמה פעמים מופיע כל בסיס. <code>column.count(base)</code> מספיק.",
        "<code>max(\"ACGT\", key=column.count)</code> בוחר את הבסיס עם הספירה הגבוהה ביותר, ושובר תיקו לטובת הקודם באלפבית.",
        "רשימה ריקה: <code>zip()</code> בלי ארגומנטים מחזיר אפס עמודות, וזה בדיוק מה שצריך.",
      ],
    },

    starter: `def consensus_sequence(dna_list):
    """
    Return the consensus of equal-length DNA strings: the most frequent
    base in every column, breaking ties in the order A, C, G, T.

    >>> consensus_sequence(["AC", "CA"])
    'AA'
    """
    # Write your code here
    pass
`,
    solution: `def consensus_sequence(dna_list):
    consensus = []
    for column in zip(*dna_list):
        # max() keeps the first maximum, so iterating "ACGT" breaks ties alphabetically
        consensus.append(max("ACGT", key=column.count))
    return "".join(consensus)
`,
    tests: [
      { args: [CONS_SAMPLE], expected: "ATGCAACT" },
      { args: [["AC", "CA"]], expected: "AA" },
      { args: [["GT", "GT", "AC"]], expected: "GT" },
      { args: [[]], expected: "", hidden: true },
      { args: [["ACGT"]], expected: "ACGT", hidden: true },
      { args: [["T", "G"]], expected: "G", hidden: true },
      { args: [["", ""]], expected: "", hidden: true },
      { args: [["AAAA", "CCCC", "GGGG", "TTTT"]], expected: "AAAA", hidden: true },
      { args: [["TTTA", "TTTC", "GGGC"]], expected: "TTTC", hidden: true },
      { args: [["CGT", "GTC", "TCG", "TGC"]], expected: consensus(["CGT", "GTC", "TCG", "TGC"]), hidden: true },
      { args: [BIG_ALIGNMENT], expected: consensus(BIG_ALIGNMENT), hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 11 ─────────────────────────────── */
  const m11 = {
    id: "m11",
    number: 11,
    title: "תכנון דינמי: מטריצת היישור",
    short: "תכנון דינמי",
    level: "expert",
    difficulty: "מומחה",
    minutes: 60,
    topics: ["Needleman–Wunsch", "עונשי פער", "מטריצות דו-ממדיות"],
    fnName: "init_dp_matrix",

    lesson: `
<p class="eyebrow">מודול 11 · ביולוגיה × מדעי המחשב</p>
<h1>תכנון דינמי: מטריצת היישור</h1>
<p class="lede">במודול 7 ניקדתם יישור <em>נתון</em>. אבל איך מוצאים את היישור הטוב ביותר מבין מספר עצום של אפשרויות? התשובה היא <strong>תכנון דינמי</strong>: בונים טבלה שבה כל תא שומר את הציון הטוב ביותר עבור תת-בעיה קטנה, וממלאים אותה צעד אחר צעד. זה הרעיון שמאחורי אלגוריתם Needleman–Wunsch, ובמודול הזה תבנו את השלב הראשון שלו.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>למה אי אפשר פשוט לבדוק את כל היישורים האפשריים</li>
    <li>הרעיון של תכנון דינמי: תת-בעיות חופפות ומבנה אופטימלי</li>
    <li>מטריצת Needleman–Wunsch: אתחול, מילוי ו-traceback</li>
    <li>יצירה ומילוי של מטריצות דו-ממדיות ב-Python, בלי מלכודת ההפניות המשותפות</li>
  </ul>
</div>

<h2><span class="h-num">1</span>כמה יישורים יש?</h2>
<p>בין שני רצפים באורך 100 יש יותר מ-${L("10<sup>75</sup>")} יישורים גלובליים אפשריים: בכל עמדה אפשר להתאים שני תווים, או להכניס פער באחד מהם. גם מחשב שבודק מיליארד יישורים בשנייה לא יסיים לפני סוף היקום. צריך דרך חכמה יותר.</p>

<h3>התובנה של Needleman ו-Wunsch ‏(1970)</h3>
<p>ליישור הטוב ביותר יש מבנה רקורסיבי. הסתכלו על העמודה <em>האחרונה</em> שלו: יש בה רק שלוש אפשרויות.</p>
<ul class="tight">
  <li>שני התווים האחרונים מיושרים זה מול זה (התאמה או אי-התאמה);</li>
  <li>התו האחרון של רצף 1 מול פער;</li>
  <li>התו האחרון של רצף 2 מול פער.</li>
</ul>
<p>בכל אחד מהמקרים, מה שנשאר לפני העמודה האחרונה הוא יישור טוב ביותר של <em>תחיליות</em> קצרות יותר. אם כבר יודעים את הציונים הטובים ביותר של התחיליות, הציון הטוב ביותר עכשיו הוא פשוט המקסימום מבין שלוש האפשרויות. זהו <strong>תכנון דינמי</strong>: פותרים כל תת-בעיה פעם אחת, שומרים את התוצאה בטבלה, ומשתמשים בה שוב ושוב.</p>
<div class="formula-card">
  <div class="fc-row"><span class="fc-name">נוסחת הנסיגה</span><span class="fc-when">s הוא ציון ההתאמה או אי-ההתאמה</span></div>
  <div class="fc-eq" dir="ltr">F[i][j] = max( F[i−1][j−1] + s(x<sub>i</sub>, y<sub>j</sub>),&nbsp; F[i−1][j] + gap,&nbsp; F[i][j−1] + gap )</div>
</div>

<h2><span class="h-num">2</span>המטריצה ואתחולה</h2>
<p>המטריצה <code>F</code> היא בגודל ${L("(len(seq1) + 1) × (len(seq2) + 1)")}. התא <code>F[i][j]</code> מחזיק את הציון הטוב ביותר של יישור <code>seq1[:i]</code> מול <code>seq2[:j]</code>. השורה והעמודה הנוספות מייצגות את <strong>התחילית הריקה</strong>.</p>
<p>השורה והעמודה הראשונות הן <strong>מקרי הבסיס</strong> של הרקורסיה. יישור של תחילית באורך i מול מחרוזת ריקה מחייב i פערים, ולכן ${L("F[i][0] = i × gap")}, ובאופן דומה ${L("F[0][j] = j × gap")}. התא <code>F[0][0] = 0</code>, כי יישור של שתי מחרוזות ריקות לא עולה כלום. זה בדיוק מה שתבנו בתרגיל.</p>
${dpFigure("GCA", "GATCA", -2)}
<p class="caption">המטריצה של <code>seq1 = "GCA"</code> (שורות) ו-<code>seq2 = "GATCA"</code> (עמודות) עם עונש פער של ${L("−2")}, אחרי האתחול. התאים המסומנים ב-· עוד לא חושבו.</p>

<div class="callout callout-cs">
  <div class="callout-title">למה עונש הפער מצטבר?</div>
  <p>כל פער נוסף מוסיף את העונש פעם נוספת, ולכן עונש של ${L("−2")} לפער נותן ${L("0, −2, −4, −6, …")} לאורך השורה הראשונה. ביישור מקומי (Smith–Waterman) מאתחלים דווקא את השורה והעמודה הראשונות ל-0, כי מותר להתחיל את היישור בכל מקום בלי עונש. ההבדל הקטן הזה באתחול הוא כל ההבדל בין יישור גלובלי ליישור מקומי.</p>
</div>

<h3>מילוי ו-traceback</h3>
<p>אחרי האתחול ממלאים את שאר התאים שורה אחר שורה, ובכל שורה עמודה אחר עמודה, כך ששלושת השכנים של כל תא (באלכסון, מעליו ומשמאלו) כבר חושבו. הציון של היישור הטוב ביותר נמצא בפינה הימנית התחתונה. כדי לשחזר את היישור עצמו, הולכים אחורה מהפינה (<em>traceback</em>) ובכל תא בודקים מאיזה שכן הגענו: אלכסון פירושו שני תווים מיושרים, למעלה פירושו פער ברצף 2, ושמאלה פירושו פער ברצף 1.</p>

<h2><span class="h-num">3</span>מעבדה חזותית: ממלאים את המטריצה</h2>
<p>לחצו <strong>אתחול</strong> כדי לראות את השורה והעמודה הראשונות מתמלאות בעונשי פער מצטברים: זה החלק של התרגיל. אחר כך <strong>מילוי</strong> מחשב כל תא מתוך שלושת שכניו, ו-<strong>traceback</strong> מסמן את המסלול חזרה מהפינה ומציג את היישור האופטימלי. נסו לשנות את עונש הפער ולראות איך היישור משתנה.</p>
<div data-viz="dp"></div>

<h2><span class="h-num">4</span>מטריצות ב-Python: יצירה נכונה</h2>
${py(`
n, m = 3, 4

# Correct: every row is a brand-new list
matrix = [[0] * (m + 1) for _ in range(n + 1)]

# The same thing with explicit loops
matrix = []
for i in range(n + 1):
    matrix.append([0] * (m + 1))

len(matrix), len(matrix[0])     # (4, 5)  -> rows, columns
matrix[2][3] = 7                # row 2, column 3
`)}

<div class="callout callout-warn">
  <div class="callout-title">המלכודת: <code>[[0] * (m + 1)] * (n + 1)</code></div>
  <p>האופרטור <code>*</code> על רשימה משכפל <em>הפניות</em>, לא העתקים. כל השורות יהיו אותו אובייקט, וכשתכתבו <code>matrix[i][0] = i * gap</code> בלולאה, כל השורות ישתנו יחד. בסוף, העמודה הראשונה של כל השורות תכיל רק את הערך האחרון שנכתב, וגם <code>matrix[0][0]</code> כבר לא יהיה 0. הבדיקות הנסתרות בתרגיל תופסות בדיוק את הבאג הזה.</p>
  ${py(`
gap = -2
bad = [[0] * 3] * 3
for i in range(3):
    bad[i][0] = i * gap
print(bad)                 # [[-4, 0, 0], [-4, 0, 0], [-4, 0, 0]]  <- one row, three names
print(bad[0] is bad[1])    # True
`)}
</div>

<h3>אתחול השורה והעמודה הראשונות</h3>
${py(`
gap = -2
first_row = [j * gap for j in range(m + 1)]    # [0, -2, -4, -6, -8]

for i in range(1, n + 1):                      # column 0, below the corner
    matrix[i][0] = i * gap
`)}

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n·m)</span><span class="cx-note">יצירת המטריצה; גם המילוי המלא הוא ${L("O(n·m)")}, ‏${L("O(1)")} לכל תא</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n·m)</span><span class="cx-note">התא לכל זוג תחיליות (אפשר לרדת ל-${L("O(m)")} אם צריך רק את הציון)</span></div>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "מילוי מלא של מטריצת Needleman–Wunsch",
  intro: `אחרי האתחול, שתי לולאות מקוננות ממלאות כל תא לפי נוסחת הנסיגה. הדוגמה מדפיסה את המטריצה המלאה עבור הזוג הקלאסי GATTACA ו-GCATGCA, ואת הציון הסופי.`,
  code: `
def needleman_wunsch_matrix(seq1, seq2, match=1, mismatch=-1, gap=-2):
    n, m = len(seq1), len(seq2)
    F = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        F[i][0] = i * gap
    for j in range(1, m + 1):
        F[0][j] = j * gap
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = match if seq1[i - 1] == seq2[j - 1] else mismatch
            F[i][j] = max(F[i - 1][j - 1] + s,   # diagonal: align two characters
                          F[i - 1][j] + gap,     # up: gap in seq2
                          F[i][j - 1] + gap)     # left: gap in seq1
    return F

seq1, seq2 = "GATTACA", "GCATGCA"
F = needleman_wunsch_matrix(seq1, seq2)

print("     " + "".join(f"{c:>4}" for c in "-" + seq2))
for i, row in enumerate(F):
    label = "-" if i == 0 else seq1[i - 1]
    print(f"{label:>4} " + "".join(f"{v:>4}" for v in row))
print("best global alignment score:", F[-1][-1])
`,
  steps: [
    `שלושת החלקים הראשונים של הפונקציה הם האתחול שתממשו בתרגיל: יצירת מטריצה עם שורות נפרדות, ואז העמודה הראשונה והשורה הראשונה.`,
    `הלולאות המקוננות עוברות שורה אחר שורה ועמודה אחר עמודה, החל מ-1. כשמחשבים את <code>F[i][j]</code>, שלושת השכנים שלו כבר חושבו.`,
    `<code>seq1[i - 1]</code> ולא <code>seq1[i]</code>: שורה i במטריצה מייצגת את התחילית באורך i, שהתו האחרון שלה נמצא באינדקס ${L("i − 1")}. זו ההזזה באחד שנובעת מהשורה הנוספת של התחילית הריקה.`,
    `<code>max</code> של שלוש האפשרויות הוא נוסחת הנסיגה עצמה. ההערות בקוד מסבירות מה כל כיוון אומר על היישור.`,
    `ההדפסה מעצבת כל מספר ברוחב 4 (<code>{v:&gt;4}</code>), כך שהעמודות מתיישרות. ‏<code>F[-1][-1]</code> הוא התא בפינה הימנית התחתונה: הציון של היישור הגלובלי הטוב ביותר.`,
  ],
})}

${demo({
  title: "Traceback: שחזור היישור עצמו",
  intro: `הציון לבדו לא מספיק: רוצים לראות את היישור. אחרי המילוי הולכים אחורה מהפינה, ובכל תא בודקים איזו מבין שלוש האפשרויות יצרה את הערך שלו.`,
  code: `
def align(seq1, seq2, match=1, mismatch=-1, gap=-2):
    n, m = len(seq1), len(seq2)
    F = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        F[i][0] = i * gap
    for j in range(m + 1):
        F[0][j] = j * gap
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = match if seq1[i - 1] == seq2[j - 1] else mismatch
            F[i][j] = max(F[i - 1][j - 1] + s, F[i - 1][j] + gap, F[i][j - 1] + gap)

    top, bottom = [], []
    i, j = n, m
    while i > 0 or j > 0:
        diagonal_ok = i > 0 and j > 0
        s = match if diagonal_ok and seq1[i - 1] == seq2[j - 1] else mismatch
        if diagonal_ok and F[i][j] == F[i - 1][j - 1] + s:
            top.append(seq1[i - 1])
            bottom.append(seq2[j - 1])
            i, j = i - 1, j - 1
        elif i > 0 and F[i][j] == F[i - 1][j] + gap:
            top.append(seq1[i - 1])
            bottom.append("-")
            i -= 1
        else:
            top.append("-")
            bottom.append(seq2[j - 1])
            j -= 1
    return "".join(reversed(top)), "".join(reversed(bottom)), F[n][m]

a, b, score = align("GATTACA", "GCATGCA")
print(a)
print("".join("|" if x == y else " " for x, y in zip(a, b)))
print(b)
print("score:", score)
`,
  steps: [
    `החלק הראשון זהה לדוגמה הקודמת: אתחול ומילוי. שימו לב שכאן האתחול מתחיל מ-0, וזה תקין, כי ${L("0 × gap = 0")}.`,
    `ה-traceback מתחיל בפינה <code>(n, m)</code>, ורץ כל עוד לא הגענו ל-<code>(0, 0)</code>. התנאי <code>i &gt; 0 or j &gt; 0</code> מטפל גם במצב שבו נשארו תווים רק באחד הרצפים.`,
    `בכל צעד בודקים קודם את האלכסון: אם הערך בתא שווה לשכן באלכסון ועוד ציון ההתאמה, שני התווים מיושרים זה מול זה. אחרת בודקים את השכן מלמעלה (פער ב-seq2), ואם גם הוא לא מתאים, השכן משמאל (פער ב-seq1).`,
    `מכיוון שהולכים מהסוף להתחלה, התווים נאספים בסדר הפוך. ‏<code>"".join(reversed(top))</code> מחזיר אותם לסדר הנכון.`,
    `כשיש כמה יישורים עם אותו ציון מקסימלי, סדר הבדיקות (אלכסון, למעלה, שמאלה) קובע איזה מהם נקבל. כלים אמיתיים מאפשרים לבחור את המדיניות הזו, או מחזירים את כל היישורים האופטימליים.`,
  ],
})}

${demo({
  title: "Smith–Waterman: יישור מקומי בשינוי של שלוש שורות",
  intro: `אותו אלגוריתם, עם שני שינויים קטנים, מוצא את <em>הקטע</em> הדומה ביותר בתוך רצפים ארוכים: השורה והעמודה הראשונות נשארות 0, וציון של תא לעולם לא יורד מתחת ל-0. התשובה היא התא עם הציון הגבוה ביותר בכל המטריצה.`,
  code: `
def local_alignment_score(seq1, seq2, match=2, mismatch=-1, gap=-2):
    n, m = len(seq1), len(seq2)
    H = [[0] * (m + 1) for _ in range(n + 1)]      # first row and column stay 0
    best, best_cell = 0, (0, 0)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = match if seq1[i - 1] == seq2[j - 1] else mismatch
            H[i][j] = max(0,
                          H[i - 1][j - 1] + s,
                          H[i - 1][j] + gap,
                          H[i][j - 1] + gap)
            if H[i][j] > best:
                best, best_cell = H[i][j], (i, j)
    return best, best_cell

seq1 = "TTTTGATTACATTTT"
seq2 = "CCGATTACACC"
score, (i, j) = local_alignment_score(seq1, seq2)
print("best local score:", score)
print("ends after seq1[:%d] = ...%s and seq2[:%d] = ...%s" % (i, seq1[i - 7:i], j, seq2[j - 7:j]))
`,
  steps: [
    `ההבדל הראשון: אין לולאות אתחול. מטריצה של אפסים כבר מתאימה, כי ביישור מקומי מותר להתחיל בכל מקום בלי לשלם על פערים.`,
    `ההבדל השני: <code>max(0, ...)</code>. כשהציון היה הופך לשלילי, מתחילים יישור חדש מאפס במקום "לגרור" עונש מקטע לא דומה.`,
    `ההבדל השלישי: התשובה אינה בפינה, אלא בתא עם הציון הגבוה ביותר בכל המטריצה. לכן שומרים את <code>best</code> ואת מיקומו תוך כדי המילוי.`,
    `הקטע המשותף הוא <code>GATTACA</code>: שבע התאמות, כל אחת שווה ${L("+2")}, ולכן הציון הוא 14. הזנבות השונים (<code>TTTT</code> ו-<code>CC</code>) לא מורידים את הציון, כי היישור המקומי פשוט מתעלם מהם.`,
    `ההדפסה מציגה את 7 התווים שלפני תא הסיום בכל רצף (אנחנו יודעים שהיישור כאן באורך 7). במימוש מלא מוצאים את תחילת הקטע ב-traceback, שעוצר בתא הראשון שערכו 0. זהו הבסיס של BLAST ושל חיפוש דומיינים בחלבונים.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>ממשו את <code>init_dp_matrix(seq1, seq2, gap_penalty)</code>, שיוצרת את מטריצת ה-DP ומאתחלת את השורה והעמודה הראשונות. הבדיקות הנסתרות כוללות רצפים ריקים, עונש פער חיובי ועשרוני, מטריצות גדולות, ואת באג השורות המשותפות.</p>
`,

    problem: {
      statement: `
<p>אלגוריתם Needleman–Wunsch מתחיל ממטריצה <code>F</code> עם ${L("len(seq1) + 1")} שורות ו-${L("len(seq2) + 1")} עמודות. השורה הראשונה והעמודה הראשונה מאותחלות בעונשי פער מצטברים, וכל שאר התאים מתחילים ב-0.</p>
<p>ממשו את <code>init_dp_matrix(seq1, seq2, gap_penalty)</code> כך שתחזיר <strong>רשימה של רשימות</strong> שבה:</p>
<ul class="tight">
  <li>יש <code>len(seq1) + 1</code> שורות, ובכל שורה <code>len(seq2) + 1</code> ערכים.</li>
  <li><code>F[i][0] = i * gap_penalty</code> לכל שורה <code>i</code>.</li>
  <li><code>F[0][j] = j * gap_penalty</code> לכל עמודה <code>j</code>.</li>
  <li>כל שאר התאים שווים ל-<code>0</code>, ובפרט <code>F[0][0] = 0</code>.</li>
  <li>כל שורה חייבת להיות רשימה <strong>נפרדת</strong> בזיכרון.</li>
</ul>`,
      examples: [
        {
          input: 'seq1 = "AC", seq2 = "AGC", gap_penalty = -2',
          output: "[[0, -2, -4, -6], [-2, 0, 0, 0], [-4, 0, 0, 0]]",
          explanation: "3 שורות (2 + 1) ו-4 עמודות (3 + 1). השורה והעמודה הראשונות הן כפולות של ‎−2.",
        },
        { input: 'seq1 = "", seq2 = "GA", gap_penalty = -1', output: "[[0, -1, -2]]", explanation: "seq1 ריק, ולכן יש שורה אחת בלבד: השורה של התחילית הריקה." },
        { input: 'seq1 = "A", seq2 = "", gap_penalty = -3', output: "[[0], [-3]]" },
      ],
      constraints: [
        "<code>0 ≤ len(seq1), len(seq2) ≤ 500</code>",
        "<code>gap_penalty</code> הוא <code>int</code> או <code>float</code> (בדרך כלל שלילי)",
        "יש להחזיר <code>list</code> של <code>list</code>, לא tuples ולא מערך NumPy",
      ],
      hints: [
        "<code>[[0] * (m + 1) for _ in range(n + 1)]</code> יוצר שורות נפרדות.",
        "שתי לולאות קצרות מספיקות: אחת לעמודה הראשונה ואחת לשורה הראשונה.",
        "אל תשתמשו ב-<code>[[0] * (m + 1)] * (n + 1)</code>: כל השורות יהיו אותה רשימה.",
        "חשבו על המקרה שבו אחד הרצפים ריק: המטריצה עדיין צריכה שורה אחת או עמודה אחת לפחות.",
      ],
    },

    starter: `def init_dp_matrix(seq1, seq2, gap_penalty):
    """
    Create the (len(seq1) + 1) x (len(seq2) + 1) Needleman-Wunsch matrix.
    F[i][0] = i * gap_penalty, F[0][j] = j * gap_penalty, everything else 0.

    >>> init_dp_matrix("AC", "AGC", -2)
    [[0, -2, -4, -6], [-2, 0, 0, 0], [-4, 0, 0, 0]]
    """
    # Write your code here
    pass
`,
    solution: `def init_dp_matrix(seq1, seq2, gap_penalty):
    n, m = len(seq1), len(seq2)
    # A comprehension builds n + 1 independent rows (no shared references)
    matrix = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        matrix[i][0] = i * gap_penalty
    for j in range(m + 1):
        matrix[0][j] = j * gap_penalty
    return matrix
`,
    tests: [
      { args: ["AC", "AGC", -2], expected: [[0, -2, -4, -6], [-2, 0, 0, 0], [-4, 0, 0, 0]] },
      { args: ["", "GA", -1], expected: [[0, -1, -2]] },
      { args: ["A", "", -3], expected: [[0], [-3]] },
      { args: ["", "", -1], expected: [[0]], hidden: true },
      { args: ["A", "A", -1], expected: [[0, -1], [-1, 0]], hidden: true },
      { args: ["GATTACA", "GCATGCA", -2], expected: initMatrix(7, 7, -2), hidden: true },
      { args: ["AC", "G", 2], expected: [[0, 2], [2, 0], [4, 0]], hidden: true },
      { args: ["AG", "CT", -0.5], expected: [[0, -0.5, -1], [-0.5, 0, 0], [-1, 0, 0]], hidden: true },
      { args: ["A".repeat(60), "C".repeat(45), -1], expected: initMatrix(60, 45, -1), hidden: true },
    ],
  };

  CBB.MODULES.push(m8, m9, m10, m11);
})();
