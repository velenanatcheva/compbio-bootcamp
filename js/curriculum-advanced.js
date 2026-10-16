/* ==========================================================================
   Advanced curriculum — Modules 5–7 (translation, ORFs, alignment scoring).
   Appended to CBB.MODULES after the core modules defined in curriculum.js,
   using the same lesson helpers (CBB.lessonKit) and data shape.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const { py, nt, demo, examplesIntro } = CBB.lessonKit;

  /* ───────────── Standard genetic code (shared with visuals-advanced.js) ───────────── */
  const BASES = "UCAG";
  const AA_STRING = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  const CODONS = [];
  for (const a of BASES) for (const b of BASES) for (const c of BASES) CODONS.push(a + b + c);
  const GENETIC_CODE = Object.fromEntries(CODONS.map((codon, i) => [codon, AA_STRING[i]]));
  const AA3 = {
    A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys", Q: "Gln", E: "Glu", G: "Gly", H: "His", I: "Ile",
    L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro", S: "Ser", T: "Thr", W: "Trp", Y: "Tyr", V: "Val", "*": "Stop",
  };
  CBB.GENETIC_CODE = GENETIC_CODE;
  CBB.AA3 = AA3;

  /** CODON_TABLE as a Python dict literal, 4 codons per line (for starter code). */
  const pythonCodonTable = () => {
    const lines = [];
    for (let i = 0; i < 64; i += 4) {
      lines.push("    " + CODONS.slice(i, i + 4).map((c) => `"${c}": "${GENETIC_CODE[c]}"`).join(", ") + ",");
    }
    return `CODON_TABLE = {\n${lines.join("\n")}\n}`;
  };

  /** 4×4 genetic-code grid: row = 1st base, column = 2nd base, cell lists the 3rd base. */
  const geneticCodeTable = () => {
    const cell = (b1, b2) =>
      [...BASES]
        .map((b3) => {
          const codon = b1 + b2 + b3;
          const aa = GENETIC_CODE[codon];
          const cls = aa === "*" ? "gc-stop" : codon === "AUG" ? "gc-start" : "";
          return `<div class="gc-entry ${cls}"><span class="mono">${codon}</span><span>${AA3[aa]}</span><b>${aa}</b></div>`;
        })
        .join("");
    return `
<div class="gc-wrap" dir="ltr">
  <table class="gc-table">
    <thead><tr><th class="gc-corner"><span>1st</span><span>2nd</span></th>${[...BASES].map((b) => `<th>${b}</th>`).join("")}</tr></thead>
    <tbody>${[...BASES].map((b1) => `<tr><th>${b1}</th>${[...BASES].map((b2) => `<td>${cell(b1, b2)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
</div>`;
  };

  /** Static alignment figure with per-column scores (match/mismatch/gap). */
  const alignFigure = (top, bottom, match = 1, mismatch = -1, gap = -2) => {
    let total = 0;
    const cols = [...top]
      .map((a, i) => {
        const b = bottom[i];
        const kind = a === "-" || b === "-" ? "gap" : a === b ? "match" : "mismatch";
        const s = kind === "gap" ? gap : kind === "match" ? match : mismatch;
        total += s;
        const t = (x) => (x === "-" ? '<span class="nt nt-gap">–</span>' : `<span class="nt nt-${x.toLowerCase()}">${x}</span>`);
        return `<div class="al-col al-${kind}">${t(a)}<span class="al-mark">${kind === "match" ? "│" : kind === "mismatch" ? "·" : " "}</span>${t(b)}<span class="al-score">${s > 0 ? "+" : ""}${s}</span></div>`;
      })
      .join("");
    return `<div class="formula align-figure" dir="ltr"><div class="al-track">${cols}</div><div class="al-total">score = ${total}</div></div>`;
  };

  const L = (s) => `<span dir="ltr">${s}</span>`; // pin a number/notation LTR inside Hebrew text

  /* ─────────────────────────────── Module 5 ─────────────────────────────── */
  const m5 = {
    id: "m5",
    number: 5,
    title: "תרגום RNA לחלבון",
    short: "תרגום לחלבון",
    level: "medium",
    difficulty: "בינוני",
    minutes: 35,
    topics: ["קודונים", "מילונים (hash maps)", "קוד גנטי"],
    fnName: "translate_rna",

    lesson: `
<p class="eyebrow">מודול 5 · ביולוגיה × מדעי המחשב</p>
<h1>תרגום RNA לחלבון</h1>
<p class="lede">mRNA הוא רק הודעה. כדי שתהפוך לחלבון, מכונה מולקולרית צריכה לקרוא אותה שלוש אותיות בכל פעם ולתרגם כל שלישייה לחומצת אמינו. במודול הזה תלמדו את הקוד הגנטי, ואיך מבנה הנתונים <em>מילון</em> הופך את התרגום לחיפוש מהיר בטבלה.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>מהו קודון, ולמה צריך שלוש אותיות כדי לקודד 20 חומצות אמינו</li>
    <li>איך הריבוזום ומולקולות tRNA מתרגמים mRNA לחלבון</li>
    <li>מילונים (hash maps) ב-Python: חיפוש בזמן ${L("O(1)")} בממוצע</li>
    <li>איך לקרוא רצף במסגרת קריאה ולעצור בקודון עצירה</li>
  </ul>
</div>

<h2><span class="h-num">1</span>הקוד הגנטי: שלישיות של אותיות</h2>
<p>חלבונים בנויים מ-20 סוגים של <strong>חומצות אמינו</strong>, אבל ל-RNA יש רק 4 אותיות. כמה אותיות צריך כדי לקודד כל חומצת אמינו? אות אחת נותנת 4 צירופים בלבד, ושתי אותיות נותנות ${L("4² = 16")}, וזה עדיין לא מספיק. שלוש אותיות נותנות ${L("4³ = 64")} צירופים, יותר ממספיק. כל שלישייה כזו נקראת <strong>קודון</strong>.</p>
<p>ב-1961 גילו מרשל נירנברג ויוהאן מתאיי שהרצף <code>UUU</code> מקודד לחומצת האמינו פנילאלנין, ועד 1966 פוענח הקוד כולו. מתברר שהקוד כמעט <strong>אוניברסלי</strong>: אותה טבלה משמשת חיידקים, צמחים ובני אדם, עם חריגים קטנים בלבד (למשל במיטוכונדריה).</p>
<ul class="tight">
  <li><strong>61 קודונים</strong> מקודדים חומצות אמינו, ולכן לרוב חומצות האמינו יש יותר מקודון אחד. אומרים שהקוד <em>מנוון</em> (degenerate): למשל, ל-Leu ‏(L) יש שישה קודונים שונים.</li>
  <li><strong>3 קודוני עצירה</strong> (<code>UAA</code>, ‏<code>UAG</code>, ‏<code>UGA</code>) אינם מקודדים אף חומצת אמינו. הם מסמנים לריבוזום לשחרר את החלבון. בטבלאות מסמנים אותם ב-<code>*</code>.</li>
  <li><strong>קודון ההתחלה</strong> <code>AUG</code> מקודד מתיונין (M), ובאותו זמן מסמן היכן התרגום מתחיל.</li>
</ul>

${geneticCodeTable()}
<p class="caption">הקוד הגנטי הסטנדרטי. השורה היא הבסיס הראשון, העמודה היא הבסיס השני, ובכל תא מופיעים ארבעת הקודונים לפי הבסיס השלישי. קודון ההתחלה מסומן בירוק, קודוני העצירה באדום.</p>

<div class="callout callout-bio">
  <div class="callout-title">למה הבסיס השלישי "סלחני"?</div>
  <p>שימו לב שבטבלה, לקודונים שנבדלים רק בבסיס השלישי יש לרוב אותה חומצת אמינו: למשל, כל ארבעת הקודונים <code>GCU</code>, ‏<code>GCC</code>, ‏<code>GCA</code> ו-<code>GCG</code> מקודדים Ala. זו תופעת ה-<em>wobble</em>: ה-tRNA נצמד בצורה פחות הדוקה לבסיס השלישי. כתוצאה מכך, מוטציות רבות בעמדה השלישית הן סינונימיות, כלומר שקטות, כפי שראיתם במודול 3.</p>
</div>

<h3>איך הריבוזום עובד</h3>
<p>הריבוזום נצמד ל-mRNA ומתקדם לאורכו קודון אחר קודון, בכיוון ${L("5′→3′")}. לכל קודון מגיעה מולקולת <strong>tRNA</strong> שנושאת בקצה אחד <em>אנטי-קודון</em> משלים, ובקצה השני את חומצת האמינו המתאימה. הריבוזום מחבר כל חומצת אמינו חדשה לשרשרת בקשר פפטידי. כשמגיע קודון עצירה, אין tRNA שמתאים לו: חלבון שנקרא גורם שחרור נקשר במקומו, והחלבון המוכן משתחרר.</p>

<div class="callout callout-cs">
  <div class="callout-title">מסגרת קריאה (reading frame)</div>
  <p>הקוד נקרא בשלישיות <em>שאינן חופפות</em> ובלי רווחים, ולכן חשוב מאיפה מתחילים. הרצף <code>AUGGCCUAA</code> נקרא כ-<code>AUG GCC UAA</code> ‏(Met, ‏Ala, עצירה) אם מתחילים מאינדקס 0, אבל כ-<code>UGG CCU</code> ‏(Trp, ‏Pro) אם מתחילים מאינדקס 1. במודול הזה מתרגמים תמיד מאינדקס 0; במודול הבא תחפשו את מסגרת הקריאה הנכונה בעצמכם.</p>
</div>

<h2><span class="h-num">2</span>מעבדה חזותית: הריבוזום בפעולה</h2>
<p>הזינו רצף mRNA ולחצו <strong>תרגום</strong>. הריבוזום עובר קודון אחר קודון, וכל קודון מתורגם לחומצת אמינו. בקודון העצירה התרגום נעצר, והקודונים שאחריו לא נקראים כלל.</p>
<div data-viz="translation"></div>

<h2><span class="h-num">3</span>מילונים: טבלאות חיפוש ב-Python</h2>
<p>הקוד הגנטי הוא בדיוק מה שמילון (<code>dict</code>) נועד לייצג: התאמה בין <strong>מפתח</strong> (קודון) ל<strong>ערך</strong> (חומצת אמינו). מילון ב-Python ממומש כ<strong>טבלת גיבוב</strong> (hash table), ולכן חיפוש מפתח לוקח בממוצע זמן קבוע, <strong>${L("O(1)")}</strong>, בלי קשר לגודל המילון.</p>
${py(`
codon_table = {"AUG": "M", "GCC": "A", "UAA": "*"}

codon_table["AUG"]            # 'M'    -> lookup by key
codon_table["UUU"] = "F"      # add (or overwrite) a key
"GCC" in codon_table          # True   -> membership test on KEYS
len(codon_table)              # 4

codon_table["XYZ"]            # KeyError: 'XYZ'
codon_table.get("XYZ", "?")   # '?'    -> default instead of an exception

for codon, aa in codon_table.items():   # iterate over (key, value) pairs
    print(codon, "->", aa)
`)}

<h3>איך טבלת גיבוב עובדת</h3>
<p>כשמכניסים מפתח, Python מחשבת עבורו <em>ערך גיבוב</em> (<code>hash(key)</code>): מספר שקובע באיזה "תא" בזיכרון הערך יישמר. בחיפוש מחושב שוב אותו ערך גיבוב, ו-Python ניגשת ישר לתא הנכון במקום לסרוק את כל הטבלה. לכן המפתחות חייבים להיות <em>בלתי ניתנים לשינוי</em>: מחרוזות, מספרים ו-tuples מתאימים, ורשימות לא.</p>
<table class="table">
  <thead><tr><th>פעולה</th><th>רשימה של זוגות</th><th>מילון</th></tr></thead>
  <tbody>
    <tr><td>חיפוש חומצת האמינו של קודון</td><td dir="ltr">O(n)</td><td dir="ltr">O(1)</td></tr>
    <tr><td>בדיקת שייכות עם <code>in</code></td><td dir="ltr">O(n)</td><td dir="ltr">O(1)</td></tr>
    <tr><td>הוספת זוג חדש</td><td dir="ltr">O(1)</td><td dir="ltr">O(1)</td></tr>
  </tbody>
</table>
${py(`
# Slow: scan a list of pairs until the codon is found - O(n) per lookup
pairs = [("UUU", "F"), ("UUC", "F"), ("UUA", "L")]   # ... 64 pairs
def lookup_list(codon):
    for key, value in pairs:
        if key == codon:
            return value

# Fast: one hash computation, then jump straight to the slot - O(1) average
table = dict(pairs)
table["UUA"]                  # 'L'

# Dict comprehension: invert the table (amino acid -> list of codons)
by_amino_acid = {}
for codon, aa in table.items():
    by_amino_acid.setdefault(aa, []).append(codon)
print(by_amino_acid)          # {'F': ['UUU', 'UUC'], 'L': ['UUA']}
`)}

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">n/3 חיפושים במילון, כל אחד ${L("O(1)")} בממוצע</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">רשימת חומצות האמינו של החלבון</span></div>
</div>

<div class="callout callout-warn">
  <div class="callout-title">מלכודות נפוצות</div>
  <ul class="tight">
    <li><strong>DNA במקום RNA</strong>: בטבלה יש <code>U</code>, לא <code>T</code>. חיפוש של <code>"ATG"</code> יזרוק <code>KeyError</code>. שעתקו קודם, כמו במודול 1.</li>
    <li><strong>קודון חלקי בסוף</strong>: אם אורך הרצף אינו מתחלק ב-3, השארית (אות אחת או שתיים) אינה קודון. <code>range(0, len(rna) - 2, 3)</code> עוצר בזמן.</li>
    <li><strong>שכחה לעצור</strong>: מה שבא אחרי קודון העצירה כבר אינו חלק מהחלבון.</li>
  </ul>
</div>

<h2><span class="h-num">4</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "בניית הקוד הגנטי והיפוך המילון",
  intro: `כמה רצפי RNA שונים יכולים לקודד את אותו חלבון? בגלל שהקוד מנוון, התשובה היא מכפלה של מספרי הקודונים. הדוגמה בונה את כל 64 הקודונים בשלוש שורות קוד, וסופרת כמה קודונים יש לכל חומצת אמינו.`,
  code: `
from collections import Counter

bases = "UCAG"
amino_acids = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG"
codons = [a + b + c for a in bases for b in bases for c in bases]
CODON_TABLE = dict(zip(codons, amino_acids))

codons_per_aa = Counter(CODON_TABLE.values())
print("codons:", len(CODON_TABLE))
print("L:", codons_per_aa["L"], "| W:", codons_per_aa["W"], "| stop:", codons_per_aa["*"])

protein = "MA"
total = codons_per_aa["*"]          # every protein ends with one stop codon
for aa in protein:
    total *= codons_per_aa[aa]
print(f"RNA strings that encode {protein!r}: {total}")
`,
  steps: [
    `רשימת ההבנה עם שלוש לולאות מקוננות, <code>for a ... for b ... for c</code>, מייצרת את כל ${L("4 × 4 × 4 = 64")} הקודונים בסדר הקבוע של טבלת הקוד: <code>UUU</code>, ‏<code>UUC</code>, ‏<code>UUA</code> וכן הלאה.`,
    `המחרוזת <code>amino_acids</code> מסודרת באותו סדר בדיוק. <code>zip(codons, amino_acids)</code> מצמיד כל קודון לאות שלו, ו-<code>dict(...)</code> הופך את הזוגות למילון.`,
    `<code>Counter(CODON_TABLE.values())</code> סופר כמה פעמים כל ערך מופיע במילון, כלומר כמה קודונים יש לכל חומצת אמינו. ל-L יש 6, ל-W רק אחד, ולעצירה 3.`,
    `לפי עקרון הכפל, מספר רצפי ה-RNA שמקודדים חלבון הוא מכפלת מספרי הקודונים של כל חומצות האמינו שלו, כפול 3 עבור קודון העצירה בסוף. עבור <code>"MA"</code>: ${L("1 × 4 × 3 = 12")}.`,
    `עבור חלבון אמיתי באורך מאות חומצות אמינו המספר עצום, ולכן בבעיית MRNA של Rosalind מחשבים אותו מודולו 1,000,000.`,
  ],
})}

${demo({
  title: "תרגום בשלוש מסגרות הקריאה",
  intro: `אותו רצף mRNA נותן שלושה חלבונים שונים לגמרי, לפי האינדקס שממנו מתחילים לקרוא. הדוגמה מתרגמת את שלוש המסגרות בלי לעצור, כדי שתראו היכן נופלים קודוני העצירה (<code>*</code>).`,
  code: `
bases = "UCAG"
amino_acids = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG"
codons = [a + b + c for a in bases for b in bases for c in bases]
CODON_TABLE = dict(zip(codons, amino_acids))

rna = "AUGGCCAUGGCGCCCAGAACUGAGAUCAAUAGUACCCGUAUUAACGGGUGA"

for frame in range(3):
    peptide = "".join(
        CODON_TABLE[rna[i:i + 3]] for i in range(frame, len(rna) - 2, 3)
    )
    print(f"frame {frame}: {peptide}")
`,
  steps: [
    `שלוש השורות הראשונות בונות את <code>CODON_TABLE</code> כמו בדוגמה הקודמת, כך שהדוגמה עומדת בפני עצמה.`,
    `<code>range(frame, len(rna) - 2, 3)</code> מתחיל באינדקס <code>frame</code> (‏0, 1 או 2) ומתקדם בצעדים של 3. החסרת 2 מבטיחה שכל חיתוך <code>rna[i:i + 3]</code> יהיה קודון שלם.`,
    `ביטוי הגנרטור בתוך <code>"".join(...)</code> מחפש כל קודון במילון ומחבר את התוצאות למחרוזת אחת, בלי לבנות רשימת ביניים.`,
    `במסגרת 0 מקבלים את החלבון האמיתי, <code>MAMAPRTEINSTRING</code>, ואחריו <code>*</code>. במסגרת 2 קודוני העצירה מפוזרים לאורך הרצף ושוברים אותו לקטעים קצרים: כך נראית מסגרת "סגורה". במסגרת 1 דווקא אין קודון עצירה, אבל גם אין בה <code>M</code>, כלומר אין קודון התחלה. מסגרת בלי עצירות עדיין אינה גן.`,
    `זה בדיוק הרעיון שמאחורי חיפוש ORFs, הנושא של המודול הבא: מחפשים מסגרת שבה יש קטע ארוך בלי <code>*</code>.`,
  ],
})}

${demo({
  title: "תרגום בטוח: DNA, אותיות קטנות וקודונים לא מוכרים",
  intro: `נתונים אמיתיים מבולגנים. הגרסה הזו של התרגום מקבלת גם DNA, גם אותיות קטנות וגם בסיסים עמומים (<code>N</code>), ומשתמשת ב-<code>dict.get</code> כדי לא לקרוס על קודון שאינו בטבלה.`,
  code: `
CODON_TABLE = {"AUG": "M", "GCC": "A", "UUU": "F", "UAA": "*"}   # excerpt

def safe_translate(seq, table, unknown="X"):
    rna = seq.upper().replace("T", "U")
    protein = []
    for i in range(0, len(rna) - 2, 3):
        aa = table.get(rna[i:i + 3], unknown)
        if aa == "*":
            break
        protein.append(aa)
    return "".join(protein)

print(safe_translate("AUGGCCUUU", CODON_TABLE))
print(safe_translate("atgNNNgcc", CODON_TABLE))    # DNA, lowercase, ambiguous
print(safe_translate("AUGUAAGCC", CODON_TABLE))    # stops at UAA
`,
  steps: [
    `<code>seq.upper().replace("T", "U")</code> מנרמל את הקלט בשרשרת אחת: הופך לאותיות גדולות ומשעתק DNA ל-RNA. שתי המתודות מחזירות מחרוזות חדשות.`,
    `<code>table.get(codon, unknown)</code> מחזיר את חומצת האמינו אם הקודון קיים, ואחרת את ערך ברירת המחדל <code>"X"</code>, הסימון המקובל לחומצת אמינו לא ידועה. כך <code>NNN</code> לא גורם ל-<code>KeyError</code>.`,
    `הפרמטר <code>unknown="X"</code> הוא <em>ארגומנט ברירת מחדל</em>: אפשר לקרוא לפונקציה בלעדיו, או להעביר ערך אחר כמו <code>"?"</code>.`,
    `בקודון העצירה <code>break</code> יוצא מהלולאה, ולכן בקריאה השלישית מקבלים רק <code>"M"</code>: הקודון <code>GCC</code> שאחרי <code>UAA</code> לא מתורגם.`,
    `בתרגיל הקלט תמיד נקי (RNA באותיות גדולות), אז אפשר להשתמש ישירות ב-<code>CODON_TABLE[codon]</code>.`,
  ],
})}

<h2><span class="h-num">5</span>המשימה שלכם</h2>
<p>ממשו את <code>translate_rna(rna_sequence)</code> בעזרת המילון <code>CODON_TABLE</code>, שכבר מוגדר עבורכם בקוד ההתחלתי. הבדיקות הנסתרות כוללות קודון עצירה באמצע הרצף, קודון חלקי בסוף, רצף ללא קודון עצירה ורצף ארוך מאוד.</p>
`,

    problem: {
      statement: `
<p>בקוד ההתחלתי מוגדר המילון <code>CODON_TABLE</code>, שממפה כל אחד מ-64 הקודונים לקוד בן אות אחת של חומצת אמינו. קודוני העצירה ממופים ל-<code>"*"</code>.</p>
<p>ממשו את <code>translate_rna(rna_sequence)</code> כך שתתרגם את מחרוזת ה-RNA לחלבון:</p>
<ul class="tight">
  <li>קראו את הרצף בקודונים של 3 אותיות, החל מאינדקס 0.</li>
  <li>החליפו כל קודון בחומצת האמינו שלו והחזירו את התוצאה כמחרוזת.</li>
  <li>עצרו בקודון העצירה הראשון. קודון העצירה עצמו <strong>אינו</strong> נכלל בחלבון.</li>
  <li>אם בסוף נשארות אות אחת או שתיים שאינן מרכיבות קודון שלם, התעלמו מהן.</li>
</ul>`,
      examples: [
        {
          input: 'rna_sequence = "AUGGCCAUGGCGCCCAGAACUGAGAUCAAUAGUACCCGUAUUAACGGGUGA"',
          output: '"MAMAPRTEINSTRING"',
          explanation: "הקודון האחרון, UGA, הוא קודון עצירה ולכן אינו מתורגם.",
        },
        { input: 'rna_sequence = "AUGUUUUAAGCC"', output: '"MF"', explanation: "התרגום נעצר ב-UAA; הקודון GCC שאחריו לא נקרא." },
        { input: 'rna_sequence = "AUGGC"', output: '"M"', explanation: "האותיות GC בסוף אינן קודון שלם." },
      ],
      constraints: [
        "<code>0 ≤ len(rna_sequence) ≤ 3·10<sup>4</sup></code>",
        "הרצף מכיל רק את האותיות הגדולות <code>A</code>, <code>C</code>, <code>G</code>, <code>U</code>",
        "יש להחזיר <code>str</code>; אם אין חומצות אמינו, מחזירים מחרוזת ריקה",
      ],
      hints: [
        "<code>range(0, len(rna_sequence) - 2, 3)</code> נותן את תחילתו של כל קודון שלם.",
        `<code>CODON_TABLE[codon]</code> מחזיר את חומצת האמינו בזמן ${L("O(1)")}.`,
        "<code>break</code> יוצא מהלולאה ברגע שמגיעים ל-<code>\"*\"</code>.",
        "אספו את חומצות האמינו ברשימה, וחברו אותן בסוף עם <code>\"\".join(...)</code>.",
      ],
    },

    starter: `# The standard genetic code: codon -> one-letter amino acid ("*" = stop)
${pythonCodonTable()}


def translate_rna(rna_sequence):
    """
    Translate an RNA string (read from index 0) into a protein string.
    Stop at the first stop codon; ignore a trailing partial codon.

    >>> translate_rna("AUGUUUUAAGCC")
    'MF'
    """
    # Write your code here
    pass
`,
    solution: `# CODON_TABLE is defined at the top of the starter code.

def translate_rna(rna_sequence):
    protein = []
    for i in range(0, len(rna_sequence) - 2, 3):
        amino_acid = CODON_TABLE[rna_sequence[i:i + 3]]
        if amino_acid == "*":        # stop codon: release the protein
            break
        protein.append(amino_acid)
    return "".join(protein)
`,
    tests: [
      { args: ["AUGGCCAUGGCGCCCAGAACUGAGAUCAAUAGUACCCGUAUUAACGGGUGA"], expected: "MAMAPRTEINSTRING" },
      { args: ["AUGUUUUAAGCC"], expected: "MF" },
      { args: ["AUGGC"], expected: "M" },
      { args: [""], expected: "", hidden: true },
      { args: ["UAG"], expected: "", hidden: true },
      { args: ["GCUGCUGCU"], expected: "AAA", hidden: true },
      { args: ["UUUUUCUUAUUG"], expected: "FFLL", hidden: true },
      { args: ["AUGUGGUGAUGG"], expected: "MW", hidden: true },
      {
        args: [CODONS.filter((c) => GENETIC_CODE[c] !== "*").join("")],
        expected: CODONS.filter((c) => GENETIC_CODE[c] !== "*").map((c) => GENETIC_CODE[c]).join(""),
        hidden: true,
      },
      { args: ["AUG" + "GCU".repeat(3000) + "UAGCCC"], expected: "M" + "A".repeat(3000), hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 6 ─────────────────────────────── */
  const m6 = {
    id: "m6",
    number: 6,
    title: "מסגרות קריאה פתוחות (ORFs)",
    short: "מסגרות קריאה (ORF)",
    level: "medium-hard",
    difficulty: "בינוני-קשה",
    minutes: 45,
    topics: ["קודוני התחלה ועצירה", "חיתוך מתקדם", "חיזוי גנים"],
    fnName: "find_first_orf",

    lesson: `
<p class="eyebrow">מודול 6 · ביולוגיה × מדעי המחשב</p>
<h1>מסגרות קריאה פתוחות (ORFs)</h1>
<p class="lede">בגנום אמיתי אין שלט שאומר "כאן מתחיל גן". אחת הדרכים העיקריות למצוא גנים חדשים היא חיפוש <strong>מסגרות קריאה פתוחות</strong>: קטעים שמתחילים בקודון התחלה ונמשכים עד קודון עצירה. במודול הזה תכתבו את הגרסה הבסיסית של כלי לחיזוי גנים.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>קודוני התחלה ועצירה, ומה מגדיר ORF</li>
    <li>שש מסגרות הקריאה של מולקולת DNA</li>
    <li>למה ORF ארוך הוא סימן לגן אמיתי</li>
    <li>חיתוך מתקדם, לולאות עם צעד 3 וחיפוש תת-מחרוזות</li>
  </ul>
</div>

<h2><span class="h-num">1</span>התחלה ועצירה</h2>
<p>במודול הקודם תרגמתם רצף מאינדקס 0. בתא אמיתי הריבוזום מחפש את <strong>קודון ההתחלה</strong> <code>AUG</code>, ומשם קורא בשלישיות עד שהוא פוגש אחד משלושת <strong>קודוני העצירה</strong>: <code>UAA</code>, ‏<code>UAG</code> או <code>UGA</code>.</p>
<p><strong>מסגרת קריאה פתוחה</strong> (Open Reading Frame, ‏ORF) היא קטע רצף ש:</p>
<ul class="tight">
  <li>מתחיל בקודון <code>AUG</code>;</li>
  <li>ממשיך בקודונים שלמים, בלי קודון עצירה באמצע;</li>
  <li>מסתיים בקודון עצירה <strong>באותה מסגרת קריאה</strong>.</li>
</ul>

<div class="formula orf-figure" dir="ltr">
  <div class="orf-row">
    <span class="orf-codon orf-out">CC</span>
    <span class="orf-codon orf-start">AUG</span><span class="orf-codon orf-in">GCC</span><span class="orf-codon orf-in">AAA</span><span class="orf-codon orf-stop">UGA</span>
    <span class="orf-codon orf-out">CC</span>
  </div>
  <div class="orf-row orf-labels">
    <span class="orf-codon orf-blank">CC</span>
    <span class="orf-tag tag-start">start</span><span class="orf-tag orf-span">ORF</span><span class="orf-tag tag-stop">stop</span>
  </div>
</div>

<div class="callout callout-warn">
  <div class="callout-title">עצירה <em>באותה</em> מסגרת</div>
  <p>ברצף <code>AUGAUAAGCUAG</code> מופיע <code>UAA</code> באינדקסים 4–6, אבל הוא לא באותה מסגרת כמו ה-<code>AUG</code> שבאינדקס 0: המרחק ביניהם, 4, אינו מתחלק ב-3. בקריאה בשלישיות מקבלים <code>AUG AUA AGC UAG</code>, וה-ORF מסתיים רק ב-<code>UAG</code>.</p>
</div>

<h3>שש מסגרות קריאה</h3>
<p>לכל רצף יש 3 מסגרות קריאה אפשריות: מתחילים מאינדקס 0, 1 או 2. אינדקס 3 כבר מחזיר אותנו למסגרת 0. ל-DNA יש שני גדילים, ולכן כשמחפשים גנים בודקים גם את 3 המסגרות של ההשלמה ההפוכה (מודול 1), ובסך הכול <strong>6 מסגרות קריאה</strong>.</p>

<h3>למה ORF ארוך הוא סימן לגן?</h3>
<p>ברצף אקראי, 3 מתוך 64 הקודונים הם קודוני עצירה. הסיכוי שקודון אקראי <em>אינו</em> קודון עצירה הוא ${L("61/64")}, והסיכוי לשרשרת של k קודונים בלי עצירה הוא ${L("(61/64)<sup>k</sup>")}. לכן ORF אקראי נמשך בממוצע כ-20 קודונים בלבד, וכמעט אף פעם לא מגיע ל-100. חלבונים אמיתיים ארוכים בדרך כלל ממאות חומצות אמינו, ולכן ORF ארוך מאוד הוא מועמד טוב לגן. על העיקרון הזה מבוססים כלים כמו NCBI ORFfinder, ‏Prodigal ו-GeneMark, שמחפשים גנים בחיידקים.</p>
<div class="formula-card">
  <div class="fc-row"><span class="fc-name">סיכוי ל-k קודונים בלי עצירה</span><span class="fc-when">ברצף אקראי</span></div>
  <div class="fc-eq" dir="ltr">P(k) = (61/64)<sup>k</sup> &nbsp;→&nbsp; P(100) ≈ 0.008</div>
  <div class="fc-row"><span class="fc-name">אורך ממוצע לפני עצירה</span><span class="fc-when">התפלגות גאומטרית</span></div>
  <div class="fc-eq" dir="ltr">E[length] = (61/64) / (3/64) = 61/3 ≈ 20.3 codons</div>
</div>

<div class="callout callout-bio">
  <div class="callout-title">ובתאים איקריוטיים?</div>
  <p>בתאים איקריוטיים גנים מפוצלים ל<em>אקסונים</em> ול<em>אינטרונים</em>, וה-ORF השלם מופיע רק ב-mRNA הבוגר, אחרי שתהליך החיבור (splicing) הסיר את האינטרונים. לכן חיזוי גנים בגנום האדם דורש מודלים מורכבים יותר, ונתוני ביטוי כמו RNA-seq.</p>
</div>

<h2><span class="h-num">2</span>מעבדה חזותית: מחפשים ORF</h2>
<p>השורה העליונה היא הרצף, ושלוש השורות שמתחתיו מציגות אותו כקודונים בכל אחת משלוש מסגרות הקריאה. קודוני <code>AUG</code> מסומנים בירוק, קודוני עצירה באדום, ואזורי ORF מוצללים. לחצו <strong>סריקה</strong> כדי לצפות באלגוריתם של התרגיל: הוא מחפש <code>AUG</code>, קורא קדימה בשלישיות, ואם אין קודון עצירה באותה מסגרת, הוא ממשיך ל-<code>AUG</code> הבא.</p>
<div data-viz="orf"></div>

<h2><span class="h-num">3</span>חיתוך מתקדם ולולאות עם צעד</h2>
<p>שלושה כלים יעשו את רוב העבודה: חיתוך עם צעד, <code>range</code> עם צעד, ו-<code>str.find</code> עם נקודת התחלה.</p>
${py(`
rna = "CCAUGGCCAAAUGACC"

rna[2:5]                      # 'AUG'    -> one codon
rna[2::3]                     # 'AGAUC'  -> first base of every codon in frame 2
[rna[i:i + 3] for i in range(2, len(rna) - 2, 3)]
                              # ['AUG', 'GCC', 'AAA', 'UGA']  -> codons in frame 2

rna.find("AUG")               # 2        -> first AUG
rna.find("AUG", 3)            # 10       -> next AUG, searching from index 3
`)}
<p>כדי לעבור על <em>כל</em> המופעים, מקדמים את נקודת ההתחלה בעצמכם בלולאת <code>while</code>:</p>
${py(`
i = rna.find("AUG")
while i != -1:
    print("AUG at", i, "-> frame", i % 3)
    i = rna.find("AUG", i + 1)            # +1 so overlapping matches are not skipped
# AUG at 2 -> frame 2
# AUG at 10 -> frame 1
`)}
<p>ול-Python יש מבנה פחות מוכר שמתאים בדיוק לשאלה "האם מצאנו עצירה?": <code>for ... else</code>. בלוק ה-<code>else</code> רץ רק אם הלולאה הסתיימה <em>בלי</em> <code>break</code>.</p>
${py(`
STOP_CODONS = {"UAA", "UAG", "UGA"}

start = 2                                  # an AUG we found
for i in range(start + 3, len(rna) - 2, 3):
    codon = rna[i:i + 3]
    if codon in STOP_CODONS:
        print("stop", codon, "at", i, "->", rna[start:i + 3])
        break
else:
    print("no in-frame stop codon")
# stop UGA at 11 -> AUGGCCAAAUGA
`)}

<div class="callout callout-cs">
  <div class="callout-title">כמה זה עולה?</div>
  <p>הגישה הישירה (לכל <code>AUG</code>, לקרוא קדימה עד קודון עצירה) היא ${L("O(n²)")} במקרה הגרוע: חשבו על <code>AUGAUGAUG...</code> בלי קודון עצירה, שבו כל <code>AUG</code> נקרא עד הסוף. אפשר לרדת ל-${L("O(n)")}: עוברים פעם אחת על כל מסגרת, זוכרים את ה-<code>AUG</code> הפתוח הראשון, וכשמגיעים לקודון עצירה סוגרים את ה-ORF. בתרגיל הגישה הישירה מספיקה, אבל כלים לגנומים שלמים חייבים את הגרסה הלינארית.</p>
</div>

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n²)</span><span class="cx-note">הגישה הישירה במקרה הגרוע; ${L("O(n)")} עם מעבר אחד לכל מסגרת</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">מחרוזת ה-ORF המוחזרת</span></div>
</div>

<h2><span class="h-num">4</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "כל ה-ORFs בשש מסגרות הקריאה של DNA",
  intro: `זו הגרסה ה"מחקרית" של הרעיון: הדוגמה עוברת על שני הגדילים של מולקולת DNA ועל שלוש המסגרות בכל גדיל, ומדפיסה כל ORF שנמצא. היא עובדת ישירות על DNA, ולכן קודוני העצירה נכתבים עם <code>T</code>.`,
  code: `
def reverse_complement(dna):
    return dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]

STOPS = {"TAA", "TAG", "TGA"}

def orfs_in_frame(seq, frame):
    orfs, start = [], None
    for i in range(frame, len(seq) - 2, 3):
        codon = seq[i:i + 3]
        if start is None and codon == "ATG":
            start = i
        elif start is not None and codon in STOPS:
            orfs.append(seq[start:i + 3])
            start = None
    return orfs

dna = ("AGCCATGTAGCTAACTCAGGTTACATGGGGATGACCCCGCGACTTGGATTAG"
       "AGTCTCTTTTGGAATAAGCCTGAATGATCCGAGTAGCATCTCAG")

for strand, seq in (("+", dna), ("-", reverse_complement(dna))):
    for frame in range(3):
        for orf in orfs_in_frame(seq, frame):
            print(f"strand {strand} frame {frame}: {orf} ({len(orf) // 3} codons)")
`,
  steps: [
    `<code>reverse_complement</code> היא אותה פונקציה ממודול 1. היא נותנת את הגדיל השני, כתוב בכיוון ${L("5′→3′")} שלו, כך שאפשר לסרוק אותו בדיוק כמו את הגדיל הראשון.`,
    `<code>orfs_in_frame</code> עוברת על מסגרת אחת <em>פעם אחת בלבד</em>, בצעדים של 3. המשתנה <code>start</code> זוכר אם יש כרגע <code>ATG</code> "פתוח": <code>None</code> פירושו שעדיין לא נמצא קודון התחלה.`,
    `כשאין ORF פתוח ונמצא <code>ATG</code>, שומרים את מיקומו. כשיש ORF פתוח ומגיע קודון עצירה, חותכים <code>seq[start:i + 3]</code> (כולל קודון העצירה), מוסיפים לרשימה וסוגרים עם <code>start = None</code>. זו בדיוק הגרסה הלינארית, ${L("O(n)")}, שתוארה למעלה.`,
    `שימו לב: מכיוון ש-<code>start</code> נקבע רק כשאין ORF פתוח, <code>ATG</code> פנימי לא פותח ORF חדש. הפונקציה מחזירה את ה-ORF הארוך ביותר שמתחיל בכל אזור, וזה מה שרוב כלי החיזוי מחפשים.`,
    `הלולאה החיצונית עוברת על שני הגדילים (<code>"+"</code> ו-<code>"-"</code>) ועל שלוש המסגרות, ובסך הכול 6 מסגרות קריאה. <code>len(orf) // 3</code> הוא מספר הקודונים, כולל קודון העצירה.`,
  ],
})}

${demo({
  title: "כמה ארוך ORF אקראי? סימולציה",
  intro: `האם החישוב התאורטי (בממוצע כ-20 קודונים לפני עצירה) באמת נכון? הדוגמה מייצרת אלפי רצפים אקראיים ומודדת אותם. זו טכניקה חשובה במחקר: לבדוק טענה הסתברותית בעזרת סימולציה.`,
  code: `
import random

random.seed(42)                      # same "random" numbers on every run
STOPS = {"UAA", "UAG", "UGA"}
BASES = "ACGU"

def random_orf_length():
    length = 0
    while True:
        codon = "".join(random.choice(BASES) for _ in range(3))
        if codon in STOPS:
            return length
        length += 1

lengths = [random_orf_length() for _ in range(5000)]

print(f"mean length: {sum(lengths) / len(lengths):.1f} codons (theory: {61 / 3:.1f})")
print("longest of 5,000 random ORFs:", max(lengths), "codons")
print("share longer than 100 codons:", sum(n > 100 for n in lengths) / len(lengths))
`,
  steps: [
    `<code>random.seed(42)</code> קובע את נקודת ההתחלה של מחולל המספרים האקראיים. כך כל הרצה נותנת בדיוק אותן תוצאות, וזה חשוב כדי שתוצאות מחקר יהיו ניתנות לשחזור.`,
    `<code>random_orf_length</code> מגרילה קודון אחר קודון: <code>random.choice(BASES)</code> בוחר בסיס אקראי, והגנרטור בתוך <code>"".join</code> מחבר שלושה כאלה לקודון.`,
    `<code>while True</code> רץ עד ש-<code>return</code> מסיים את הפונקציה. זו לולאה שאינה אינסופית בפועל, כי בכל צעד יש סיכוי של ${L("3/64")} להגריל קודון עצירה.`,
    `רשימת ההבנה מריצה 5,000 ניסויים. <code>sum(n > 100 for n in lengths)</code> סופר כמה ORFs עברו את 100 הקודונים, כי <code>True</code> נחשב 1, בדיוק כמו במודול 3.`,
    `השוו את התוצאות לתאוריה: הממוצע צריך להיות קרוב ל-${L("61/3 ≈ 20.3")}, ושיעור ה-ORFs שעוברים 100 קודונים צריך להיות פחות מאחוז אחד (בתאוריה ${L("(61/64)<sup>101</sup> ≈ 0.8%")}; עם 5,000 ניסויים בלבד יוצא מעט פחות, בגלל רעש סטטיסטי). מכאן ש-ORF של 300 קודונים כמעט בוודאות אינו צירוף מקרים.`,
  ],
})}

<h2><span class="h-num">5</span>המשימה שלכם</h2>
<p>ממשו את <code>find_first_orf(rna)</code>, שמחזירה את ה-ORF הראשון ברצף, כולל קודון העצירה. הבדיקות הנסתרות כוללות <code>AUG</code> בלי קודון עצירה, קודון עצירה שאינו באותה מסגרת, רצף ריק ורצפים ארוכים.</p>
`,

    problem: {
      statement: `
<p>בהינתן מחרוזת RNA ‏<code>rna</code>, מצאו את <strong>מסגרת הקריאה הפתוחה הראשונה</strong> ברצף, והחזירו אותה כמחרוזת.</p>
<ul class="tight">
  <li>עברו על עמדות ההתחלה לפי הסדר, מהאינדקס הנמוך לגבוה, וחפשו את הקודון <code>AUG</code>.</li>
  <li>מכל <code>AUG</code> קראו קדימה בקודונים של 3 אותיות, באותה מסגרת, עד קודון העצירה הראשון: <code>UAA</code>, ‏<code>UAG</code> או <code>UGA</code>.</li>
  <li>אם נמצא קודון עצירה, החזירו את הקטע מה-<code>AUG</code> ועד סוף קודון העצירה, <strong>כולל</strong> קודון העצירה.</li>
  <li>אם ל-<code>AUG</code> מסוים אין קודון עצירה באותה מסגרת, הוא אינו ORF תקין: המשיכו ל-<code>AUG</code> הבא.</li>
  <li>אם אין ברצף אף ORF תקין, החזירו מחרוזת ריקה <code>""</code>.</li>
</ul>`,
      examples: [
        { input: 'rna = "CCAUGGCCUAAGG"', output: '"AUGGCCUAA"', explanation: "ה-AUG נמצא באינדקס 2, ואחריו GCC ו-UAA." },
        {
          input: 'rna = "GGAUGAAUGCCCUGAGG"',
          output: '"AUGCCCUGA"',
          explanation: "ל-AUG שבאינדקס 2 אין קודון עצירה באותה מסגרת (AUG AAU GCC CUG AGG), ולכן ממשיכים ל-AUG שבאינדקס 6.",
        },
        { input: 'rna = "AUGAUAAGCUAG"', output: '"AUGAUAAGCUAG"', explanation: "ה-UAA שבאינדקס 4 אינו באותה מסגרת, ולכן ה-ORF מסתיים ב-UAG." },
      ],
      constraints: [
        "<code>0 ≤ len(rna) ≤ 10<sup>4</sup></code>",
        "הרצף מכיל רק את האותיות הגדולות <code>A</code>, <code>C</code>, <code>G</code>, <code>U</code>",
        "יש להחזיר <code>str</code> שמתחיל ב-<code>AUG</code> ומסתיים בקודון עצירה, או <code>\"\"</code>",
      ],
      hints: [
        "<code>for start in range(len(rna) - 2)</code> עובר על כל עמדות ההתחלה האפשריות.",
        "מ-<code>AUG</code> שבאינדקס <code>start</code>, הקודונים הבאים מתחילים ב-<code>start + 3</code>, ‏<code>start + 6</code> וכן הלאה: <code>range(start + 3, len(rna) - 2, 3)</code>.",
        "<code>return</code> מתוך הלולאה הפנימית מסיים את הפונקציה מיד כשנמצא ה-ORF הראשון.",
        "שימו לב לחיתוך: <code>rna[start:i + 3]</code> כולל את קודון העצירה.",
      ],
    },

    starter: `START_CODON = "AUG"
STOP_CODONS = {"UAA", "UAG", "UGA"}


def find_first_orf(rna):
    """
    Return the first open reading frame in rna: from the first AUG that has
    an in-frame stop codon, up to and including that stop codon.
    Return "" if there is no valid ORF.

    >>> find_first_orf("GGAUGAAUGCCCUGAGG")
    'AUGCCCUGA'
    """
    # Write your code here
    pass
`,
    solution: `START_CODON = "AUG"
STOP_CODONS = {"UAA", "UAG", "UGA"}


def find_first_orf(rna):
    for start in range(len(rna) - 2):
        if rna[start:start + 3] != START_CODON:
            continue
        # Read forward codon by codon, in the same frame as this AUG
        for i in range(start + 3, len(rna) - 2, 3):
            if rna[i:i + 3] in STOP_CODONS:
                return rna[start:i + 3]
        # No in-frame stop for this AUG: try the next one
    return ""
`,
    tests: [
      { args: ["CCAUGGCCUAAGG"], expected: "AUGGCCUAA" },
      { args: ["GGAUGAAUGCCCUGAGG"], expected: "AUGCCCUGA" },
      { args: ["AUGAUAAGCUAG"], expected: "AUGAUAAGCUAG" },
      { args: [""], expected: "", hidden: true },
      { args: ["AUGCCC"], expected: "", hidden: true },
      { args: ["UAAUAGUGA"], expected: "", hidden: true },
      { args: ["AUGUAA"], expected: "AUGUAA", hidden: true },
      { args: ["AUGAUGUAA"], expected: "AUGAUGUAA", hidden: true },
      { args: ["CAUGA"], expected: "", hidden: true },
      { args: ["GGAUGAAUGCCCUGAGGCCAUGUUUGGCUAAGC"], expected: "AUGCCCUGA", hidden: true },
      { args: ["AUG" + "GCU".repeat(3000) + "UGA"], expected: "AUG" + "GCU".repeat(3000) + "UGA", hidden: true },
      { args: ["AUG".repeat(600)], expected: "", hidden: true },
      { args: ["AUG".repeat(600) + "UAG"], expected: "AUG".repeat(600) + "UAG", hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 7 ─────────────────────────────── */
  const m7 = {
    id: "m7",
    number: 7,
    title: "ניקוד יישור רצפים",
    short: "ניקוד יישור",
    level: "hard",
    difficulty: "קשה",
    minutes: 50,
    topics: ["הומולוגיה", "פונקציות ניקוד", "zip על כמה רצפים"],
    fnName: "score_alignment",

    lesson: `
<p class="eyebrow">מודול 7 · ביולוגיה × מדעי המחשב</p>
<h1>ניקוד יישור רצפים</h1>
<p class="lede">כשמוצאים גן חדש, השאלה הראשונה היא כמעט תמיד: למה הוא דומה? <strong>יישור רצפים</strong> מסדר שני רצפים זה מול זה, כך שעמדות בעלות מוצא אבולוציוני משותף יעמדו באותה עמודה. <strong>פונקציית ניקוד</strong> מכמתת עד כמה היישור טוב. זה הלב של כלים כמו BLAST, שמורצים מיליוני פעמים בכל יום.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>למה מיישרים רצפים: הומולוגיה, זהות ודמיון</li>
    <li>ניקוד של התאמות, אי-התאמות ופערים (gaps)</li>
    <li>מטריצות החלפה, ויישור גלובלי לעומת יישור מקומי</li>
    <li>מעבר על כמה רצפים במקביל ואלגוריתמי ניקוד איטרטיביים</li>
  </ul>
</div>

<h2><span class="h-num">1</span>למה מיישרים רצפים?</h2>
<p>שני רצפים שמקורם באב קדמון משותף נקראים <strong>הומולוגיים</strong>. לאורך הדורות הם צברו התמרות, הכנסות והשמטות (מודול 3). יישור מנסה לשחזר את ההיסטוריה הזו: אילו עמדות מקבילות זו לזו, והיכן התרחשו שינויים.</p>
<ul class="tight">
  <li><strong>חיזוי תפקוד</strong>: אם חלבון לא מוכר דומה מאוד לאנזים ידוע, סביר שגם התפקוד שלו דומה.</li>
  <li><strong>אבולוציה ופילוגנטיקה</strong>: כמות ההבדלים ביישור משמשת לבניית עצים, כמו מטריצת המרחקים שבניתם במודול 3.</li>
  <li><strong>רפואה וגנטיקה</strong>: מיפוי קריאות ריצוף לגנום ייחוס הוא יישור, וכך מזהים את המוטציות של מטופל.</li>
  <li><strong>אזורים שמורים</strong>: יישור מראה אילו אזורים כמעט לא השתנו בין מינים, ולכן כנראה חשובים לתפקוד.</li>
</ul>

<div class="callout callout-bio">
  <div class="callout-title">הומולוגיה היא כן או לא</div>
  <p>הומולוגיה היא קביעה על היסטוריה: לשני רצפים יש אב קדמון משותף, או שאין להם. לכן לא נכון לומר "75% הומולוגיה". מה שמודדים ביישור הוא <strong>זהות</strong> (אחוז העמדות הזהות) או <strong>דמיון</strong> (שמתחשב גם בהחלפות בין חומצות אמינו בעלות תכונות דומות), ומהם מסיקים אם סביר שהרצפים הומולוגיים.</p>
</div>

<h2><span class="h-num">2</span>איך מנקדים יישור</h2>
<p>יישור כותבים כשתי שורות באותו אורך. המקף <code>-</code> מסמן <strong>פער</strong> (gap): הכנסה ברצף אחד, או השמטה ברצף השני. את הציון מחשבים עמודה אחר עמודה, ואז מסכמים:</p>
${alignFigure("GATTACA-G", "GACTACATG")}
<table class="table">
  <thead><tr><th>סוג עמודה</th><th>ציון לדוגמה</th><th>משמעות</th></tr></thead>
  <tbody>
    <tr><td>התאמה (match)</td><td dir="ltr">+1</td><td>אותו תו בשתי השורות</td></tr>
    <tr><td>אי-התאמה (mismatch)</td><td dir="ltr">−1</td><td>התמרה: תווים שונים</td></tr>
    <tr><td>פער (gap)</td><td dir="ltr">−2</td><td>הכנסה או השמטה; בדרך כלל נענש בחומרה רבה יותר</td></tr>
  </tbody>
</table>
<p>בתרגיל של המודול הזה תשתמשו בסכמה הפשוטה ביותר: ${L("+1")} להתאמה ו-${L("−1")} לאי-התאמה. כלים אמיתיים משתמשים בסכמות עשירות יותר:</p>
<ul class="tight">
  <li><strong>מטריצות החלפה</strong>: לחלבונים משתמשים במטריצות כמו BLOSUM62 ו-PAM250, שבהן לכל זוג חומצות אמינו יש ציון משלו. החלפה בין שתי חומצות אמינו דומות (למשל Leu ו-Ile) נענשת פחות מהחלפה בין חומצות שונות מאוד. הציונים הם <em>log-odds</em>: עד כמה סביר לראות את הזוג ברצפים הומולוגיים לעומת צירוף מקרי.</li>
  <li><strong>ב-DNA</strong> נותנים לפעמים לטרנזיציות עונש קטן יותר מאשר לטרנסברזיות (מודול 3).</li>
  <li><strong>עונש פער אפיני</strong> (affine gap): פתיחת פער עולה הרבה (למשל ${L("−10")}), והארכתו עולה מעט (${L("−1")}). כך פער ארוך אחד עדיף על הרבה פערים קצרים, וזה מתאים לביולוגיה: הכנסה אחת של 6 בסיסים סבירה יותר משש הכנסות נפרדות.</li>
</ul>

<h3>יישור גלובלי ויישור מקומי</h3>
<p>הציון רק <em>מעריך</em> יישור נתון. כדי <em>למצוא</em> את היישור הטוב ביותר מבין כל האפשרויות, משתמשים ב<strong>תכנון דינמי</strong> (dynamic programming):</p>
<table class="table">
  <thead><tr><th>אלגוריתם</th><th>מה הוא מוצא</th><th>זמן</th></tr></thead>
  <tbody>
    <tr><td>Needleman–Wunsch ‏(1970)</td><td>יישור <strong>גלובלי</strong> של שני הרצפים לכל אורכם. מתאים להשוואת שני גנים או חלבונים באורך דומה.</td><td dir="ltr">O(n·m)</td></tr>
    <tr><td>Smith–Waterman ‏(1981)</td><td>יישור <strong>מקומי</strong>: הקטע הדומה ביותר בתוך רצפים ארוכים, למשל דומיין שמור בתוך חלבון.</td><td dir="ltr">O(n·m)</td></tr>
    <tr><td>BLAST ‏(1990)</td><td>יישורים מקומיים בקירוב, מהר מאוד, מול מאגר שלם כמו GenBank.</td><td>היוריסטי, מהיר בהרבה בפועל</td></tr>
  </tbody>
</table>
<p>כל האלגוריתמים האלה משתמשים, כאבן בניין, בפונקציית ניקוד כמו זו שתכתבו עכשיו.</p>

<h2><span class="h-num">3</span>מעבדה חזותית: ניקוד יישור</h2>
<p>ערכו את שתי השורות (השתמשו ב-<code>-</code> לפערים) ושנו את ערכי הניקוד. כל עמודה מקבלת ציון, והגרף שמתחת מציג את <strong>הציון המצטבר</strong> לאורך היישור. לחצו <strong>סריקה</strong> כדי לצפות בלולאה שמחשבת את הסכום עמודה אחר עמודה, ונסו להזיז פער כדי לראות איך הציון משתנה.</p>
<div data-viz="alignment"></div>

<h2><span class="h-num">4</span>מעבר על כמה רצפים במקביל</h2>
<p>במודול 3 עברתם על שני רצפים עם <code>zip</code>. הפונקציה הזו מקבלת כל מספר של רצפים, ומחזירה בכל צעד <em>עמודה</em>: tuple עם תו אחד מכל רצף.</p>
${py(`
seq1, seq2, seq3 = "GATTACA", "GACTACA", "GATTGCA"

for column in zip(seq1, seq2, seq3):
    print(column)        # ('G', 'G', 'G'), ('A', 'A', 'A'), ('T', 'C', 'T'), ...

alignment = [seq1, seq2, seq3]
columns = list(zip(*alignment))     # * unpacks the list into separate arguments
print(len(columns), columns[2])     # 7 ('T', 'C', 'T')
`)}

<h3>אלגוריתם ניקוד איטרטיבי</h3>
<p>ניקוד הוא שוב תבנית הצובר: מתחילים מאפס, ובכל עמודה מוסיפים את הציון שלה. כדאי להפריד את <em>כלל הניקוד</em> מ<em>הלולאה</em>, כך שאפשר להחליף סכמה בלי לגעת בשאר הקוד:</p>
${py(`
MATCH, MISMATCH, GAP = 1, -1, -2

def column_score(a, b):
    if a == "-" or b == "-":
        return GAP
    return MATCH if a == b else MISMATCH

def score(seq1, seq2, scorer=column_score):
    total = 0
    for a, b in zip(seq1, seq2):
        total += scorer(a, b)
    return total

print(score("GATTACA", "GACTACA"))    # 5
`)}

<div class="callout callout-cs">
  <div class="callout-title">פונקציות כערכים</div>
  <p>ב-Python אפשר להעביר פונקציה כפרמטר, כמו <code>scorer=column_score</code> בדוגמה. כך מחליפים כלל ניקוד (למשל BLOSUM62) בלי לשכתב את הלולאה. כך בנויות גם ספריות כמו Biopython, למשל <code>Bio.Align.PairwiseAligner</code>.</p>
</div>

<div class="callout callout-warn">
  <div class="callout-title">ציון גבוה אינו בהכרח יישור טוב</div>
  <p>הציון תלוי באורך: יישור ארוך צובר יותר נקודות גם אם הוא פחות טוב באופן יחסי. לכן מסתכלים גם על <strong>אחוז הזהות</strong>, ובכלים כמו BLAST משתמשים ב-<em>E-value</em>: כמה יישורים עם ציון כזה היינו מצפים למצוא במקרה, במאגר בגודל הזה.</p>
</div>

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">עמודה אחת לכל עמדה ביישור</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(1)</span><span class="cx-note">צובר אחד בלבד</span></div>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "דוח יישור מלא: ציון, פערים ואחוז זהות",
  intro: `זה הפלט שכלי יישור מציגים: שתי השורות, שורת סימונים ביניהן וסיכום. הדוגמה משתמשת בסכמה עם עונש פער, ומונה כל סוג עמודה בנפרד.`,
  code: `
def alignment_report(top, bottom, match=1, mismatch=-1, gap=-2):
    if len(top) != len(bottom):
        raise ValueError("rows of an alignment must have equal length")
    score = matches = mismatches = gaps = 0
    marks = []
    for a, b in zip(top, bottom):
        if a == "-" or b == "-":
            score += gap
            gaps += 1
            marks.append(" ")
        elif a == b:
            score += match
            matches += 1
            marks.append("|")
        else:
            score += mismatch
            mismatches += 1
            marks.append(".")
    identity = 100 * matches / len(top) if top else 0.0
    print(top)
    print("".join(marks))
    print(bottom)
    print(f"score={score}  matches={matches}  mismatches={mismatches}  "
          f"gaps={gaps}  identity={identity:.1f}%")

alignment_report("GATTACA-GCT", "GACTACAAG-T")
`,
  steps: [
    `הפונקציה מתחילה בבדיקת תקינות: בשתי שורות של יישור חייב להיות אותו מספר עמודות. זה אותו דפוס הגנתי שתממשו בתרגיל.`,
    `<code>score = matches = mismatches = gaps = 0</code> מאתחל ארבעה צוברים בשורה אחת. בכל עמודה מתעדכנים הציון ואחד המונים.`,
    `סדר התנאים חשוב: קודם בודקים פער (<code>"-"</code> באחת השורות), ורק אחר כך התאמה. אחרת, שני פערים זה מול זה היו נספרים בטעות כהתאמה.`,
    `הרשימה <code>marks</code> בונה את שורת הסימונים: <code>|</code> להתאמה, <code>.</code> לאי-התאמה ורווח לפער, כמו בפלט של BLAST ו-EMBOSS.`,
    `<code>identity</code> מחושב רק אם השורות אינן ריקות (ביטוי תנאי בשורה אחת), כדי להימנע מחלוקה באפס, כמו בתכולת GC במודול 2.`,
    `הפרמטרים <code>match=1, mismatch=-1, gap=-2</code> הם ארגומנטי ברירת מחדל, כך שקל לנסות סכמות אחרות: <code>alignment_report(a, b, gap=-5)</code>.`,
  ],
})}

${demo({
  title: "יישור מרובה: רצף קונצנזוס ועמודות שמורות",
  intro: `ביישור מרובה (MSA) של כמה רצפים, <code>zip(*alignment)</code> מחזיר את העמודות. מכל עמודה מחשבים את הבסיס השכיח ואת מידת השימור, ומקבלים <em>רצף קונצנזוס</em> ושורת סימון בסגנון Clustal.`,
  code: `
from collections import Counter

alignment = [
    "ATGCTAGCTAG",
    "ATGCTGGCTAG",
    "ATGATAGCTGG",
    "ATGCTAGTTAG",
]

consensus, marks = [], []
for column in zip(*alignment):
    base, count = Counter(column).most_common(1)[0]
    consensus.append(base)
    share = count / len(column)
    marks.append("*" if share == 1 else ":" if share >= 0.75 else " ")

for row in alignment:
    print(row)
print("".join(marks))
print("consensus:", "".join(consensus))
print("fully conserved columns:", [i for i, m in enumerate(marks) if m == "*"])
`,
  steps: [
    `<code>zip(*alignment)</code> פורק את רשימת הרצפים לארבעה ארגומנטים נפרדים, ולכן בכל צעד מתקבלת עמודה אחת: tuple עם התו מכל רצף.`,
    `<code>Counter(column).most_common(1)</code> מחזיר רשימה עם הזוג השכיח ביותר, <code>(base, count)</code>. האינדקס <code>[0]</code> שולף את הזוג, והפירוק <code>base, count = ...</code> פותח אותו לשני משתנים.`,
    `<code>share</code> הוא החלק של הרצפים שמסכימים עם הבסיס השכיח. הביטוי התנאי המשורשר בוחר <code>*</code> לעמודה שמורה לגמרי, <code>:</code> לשמורה ברובה (75% לפחות), ורווח לשאר.`,
    `הדפסת השורות זו מעל זו, עם שורת הסימונים מתחתיהן, יוצרת תצוגה כמו של Clustal Omega: אפשר לראות במבט אחד היכן הרצפים שונים.`,
    `רצף הקונצנזוס הוא "הנציג" של המשפחה. מעמודות שמורות לגמרי נוטים לבנות פריימרים ולחפש אתרים חיוניים לתפקוד.`,
  ],
})}

${demo({
  title: "מציאת המיקום הטוב ביותר לקריאה קצרה",
  intro: `ממפי קריאות מחפשים היכן בגנום קריאה קצרה "מתיישבת" הכי טוב. הדוגמה מחליקה קריאה לאורך רצף ייחוס, מנקדת כל היסט בלי פערים ובוחרת את הציון הגבוה ביותר. זה שילוב של החלון הנע ממודול 4 עם פונקציית ניקוד.`,
  code: `
def score(a, b):
    return sum(1 if x == y else -1 for x, y in zip(a, b))

reference = "TTGACCGATTACAGGCATGCA"
read = "GATTACA"
offsets = range(len(reference) - len(read) + 1)

scores = [score(reference[o:o + len(read)], read) for o in offsets]
best = max(offsets, key=lambda o: scores[o])

print("scores:", scores)
print(f"best offset {best}: {reference[best:best + len(read)]} (score {scores[best]})")
`,
  steps: [
    `<code>score</code> היא הגרסה הקצרה של כלל הניקוד: ביטוי תנאי בתוך גנרטור, ו-<code>sum</code> מסכם את כל העמודות.`,
    `<code>offsets</code> הם כל המיקומים שבהם הקריאה נכנסת במלואה לתוך הייחוס: ${L("n − m + 1")} מיקומים, בדיוק כמו מספר החלונות במודול 4.`,
    `לכל היסט חותכים חלון מהייחוס באורך הקריאה ומנקדים אותו מולה. כך מתקבלת רשימת ציונים, אחד לכל היסט.`,
    `<code>max(offsets, key=lambda o: scores[o])</code> מחזיר את ה<em>היסט</em> עם הציון הגבוה ביותר, ולא את הציון עצמו. הפרמטר <code>key</code> קובע לפי מה משווים, ו-<code>lambda</code> היא פונקציה קצרה ואנונימית.`,
    `הציון ${L("7")} באופסט 6 הוא התאמה מושלמת. ממפים אמיתיים, כמו BWA ו-Bowtie, מאיצים את החיפוש בעזרת אינדקס (FM-index) ומאפשרים גם פערים, אבל הרעיון של "לנקד ולבחור את הטוב ביותר" זהה.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>ממשו את <code>score_alignment(seq1, seq2)</code>: ${L("+1")} לכל התאמה ו-${L("−1")} לכל אי-התאמה. הבדיקות הנסתרות כוללות יישורים ריקים, פערים, רצפי חלבון, אורכים שונים (שדורשים <code>ValueError</code>) ויישור ארוך במיוחד.</p>
`,

    problem: {
      statement: `
<p>נתונים שני רצפים <strong>מיושרים</strong>, כמחרוזות באורך שווה: התו באינדקס <code>i</code> ב-<code>seq1</code> עומד מול התו באינדקס <code>i</code> ב-<code>seq2</code>.</p>
<p>ממשו את <code>score_alignment(seq1, seq2)</code> כך שתחזיר את ציון היישור כ-<code>int</code>:</p>
<ul class="tight">
  <li><strong>${L("+1")}</strong> לכל עמודה שבה התווים זהים (התאמה).</li>
  <li><strong>${L("−1")}</strong> לכל עמודה שבה התווים שונים (אי-התאמה).</li>
  <li>כל תו מושווה כפי שהוא, כולל <code>-</code>: בתרגיל הזה פער הוא פשוט עוד תו. (בכלים אמיתיים, ובמעבדה החזותית, לפערים יש עונש נפרד.)</li>
  <li>אם האורכים שונים, הרצפים אינם יישור תקין: זרקו <code>ValueError</code>.</li>
</ul>`,
      examples: [
        { input: 'seq1 = "GATTACA", seq2 = "GATTACA"', output: "7", explanation: "שבע התאמות." },
        { input: 'seq1 = "GATTACA", seq2 = "GCTTAGA"', output: "3", explanation: "חמש התאמות ושתי אי-התאמות: 5 − 2 = 3." },
        { input: 'seq1 = "AAAA", seq2 = "TTTT"', output: "-4", explanation: "ארבע אי-התאמות." },
      ],
      constraints: [
        "<code>0 ≤ len(seq1), len(seq2) ≤ 10<sup>5</sup></code>",
        "הרצפים יכולים להכיל כל תו: בסיסים, חומצות אמינו או <code>-</code>",
        "יש להחזיר <code>int</code>, ולזרוק <code>ValueError</code> אם <code>len(seq1) != len(seq2)</code>",
      ],
      hints: [
        "התחילו בבדיקת האורכים, וזרקו <code>raise ValueError(\"...\")</code> אם הם שונים.",
        "<code>zip(seq1, seq2)</code> נותן את עמודות היישור אחת אחרי השנייה.",
        "צובר <code>score = 0</code>, ובכל עמודה <code>score += MATCH</code> או <code>score += MISMATCH</code>.",
        "יישור ריק הוא יישור תקין, והציון שלו 0.",
      ],
    },

    starter: `MATCH = 1
MISMATCH = -1


def score_alignment(seq1, seq2):
    """
    Score two aligned sequences of equal length:
    +1 for every matching column, -1 for every mismatch.
    Raise ValueError if the lengths differ.

    >>> score_alignment("GATTACA", "GCTTAGA")
    3
    """
    # Write your code here
    pass
`,
    solution: `MATCH = 1
MISMATCH = -1


def score_alignment(seq1, seq2):
    if len(seq1) != len(seq2):
        raise ValueError("Aligned sequences must have equal length")
    score = 0
    for a, b in zip(seq1, seq2):
        score += MATCH if a == b else MISMATCH
    return score
`,
    tests: [
      { args: ["GATTACA", "GATTACA"], expected: 7 },
      { args: ["GATTACA", "GCTTAGA"], expected: 3 },
      { args: ["AAAA", "TTTT"], expected: -4 },
      { args: ["ACGT", "ACG"], raises: "ValueError" },
      { args: ["", ""], expected: 0, hidden: true },
      { args: ["A", "A"], expected: 1, hidden: true },
      { args: ["A", "C"], expected: -1, hidden: true },
      { args: ["AC-GT", "ACAGT"], expected: 3, hidden: true },
      { args: ["MKTAYIAK", "MKTAHIAK"], expected: 6, hidden: true },
      { args: ["ACG", "ACGT"], raises: "ValueError", hidden: true },
      { args: ["ACGT".repeat(2500), "ACGA".repeat(2500)], expected: 5000, hidden: true },
    ],
  };

  CBB.MODULES.push(m5, m6, m7);
})();
