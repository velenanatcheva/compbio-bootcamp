/* ==========================================================================
   Curriculum — every module is pure data: lesson HTML (Hebrew), problem
   statement, starter code, reference solution and test cases.
   Lesson HTML may contain:
     <div data-viz="name"></div>   → mounted by CBB.Visuals[name]
     <pre class="code">…</pre>      → syntax-highlighted with CodeMirror.runMode
     demo(...) blocks              → runnable code examples ([data-run-example])
   Test case shape:
     { args: [...], expected: any, tol?: number, hidden?: bool }
     { args: [...], raises: "ValueError", hidden?: bool }
   Python code, identifiers and core scientific terms stay in English.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const trim = (s) => s.replace(/^\n+|\s+$/g, "");
  const py = (src) => `<pre class="code" data-lang="python" dir="ltr">${esc(trim(src))}</pre>`;
  const nt = (seq) =>
    `<span class="seq-inline" dir="ltr">${seq
      .split("")
      .map((b) => `<span class="nt-i nt-${b.toLowerCase()}">${b}</span>`)
      .join("")}</span>`;

  /** A ready-made, runnable code example with a step-by-step Hebrew walkthrough. */
  const demo = ({ title, intro, code, steps }) => `
<div class="demo">
  <div class="demo-head"><span class="demo-badge">דוגמה</span><span class="demo-title">${title}</span></div>
  <p class="demo-intro">${intro}</p>
  <div class="demo-code" dir="ltr">
    ${py(code)}
    <div class="demo-bar">
      <button class="btn btn-sm demo-run" data-run-example>
        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg>
        <span>הרצת הדוגמה</span>
      </button>
      <span class="demo-hint">פלט יוצג כאן</span>
    </div>
    <pre class="demo-out" hidden></pre>
  </div>
  <div class="demo-steps-title">איך זה עובד, שלב אחר שלב</div>
  <ol class="demo-steps">${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
</div>`;

  const examplesIntro = `<p>לפני שתכתבו פתרון משלכם, הנה דוגמאות מוכנות שמשתמשות באותם כלים ורעיונות. לחצו <strong>הרצת הדוגמה</strong> כדי להריץ את הקוד בדפדפן ולראות את הפלט, ואז קראו את ההסבר המפורט. נסו גם לשנות את הקוד בראש ולהריץ בעורך.</p>`;

  /* ─────────────────────────────── Module 1 ─────────────────────────────── */
  const m1 = {
    id: "m1",
    number: 1,
    title: "הדוגמה המרכזית ומחרוזות",
    short: "הדוגמה המרכזית",
    level: "easy",
    difficulty: "קל",
    minutes: 25,
    topics: ["שעתוק", "מחרוזות ב-Python", "str.replace"],
    fnName: "transcribe",

    lesson: `
<p class="eyebrow">מודול 1 · ביולוגיה × מדעי המחשב</p>
<h1>הדוגמה המרכזית ומחרוזות</h1>
<p class="lede">כל תא בגופכם נושא את אותו ספר הוראות, באורך של כ-3.1 מיליארד אותיות. במודול הזה תלמדו איך התא <em>קורא</em> את הספר הזה, ולמה מבחינת המחשב גנום הוא בסך הכול מחרוזת ארוכה מאוד.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>ממה בנויים DNA ו-RNA ואיך בסיסים יוצרים זוגות</li>
    <li>איך תהליך השעתוק מעתיק גן מ-DNA ל-RNA שליח (mRNA)</li>
    <li>איך Python מייצגת רצפים כמחרוזות בלתי ניתנות לשינוי</li>
    <li>ארבע דרכים להמיר מחרוזת, ומה המחיר של כל אחת</li>
  </ul>
</div>

<h2><span class="h-num">1</span>הדוגמה המרכזית של הביולוגיה המולקולרית</h2>
<p>בשנת 1958 תיאר פרנסיס קריק כיצד מידע רצפי זורם בתוך התא: מ-<strong>DNA</strong> אל <strong>RNA</strong>, ומשם אל <strong>חלבון</strong>. הכיוון ההפוך, מחלבון בחזרה לחומצת גרעין, לעולם אינו מתרחש.</p>

<div class="dogma" dir="ltr">
  <div class="dogma-node dogma-dna"><span class="dogma-icon">🧬</span>DNA<small>אחסון</small></div>
  <div class="dogma-arrow"><span>שעתוק</span></div>
  <div class="dogma-node dogma-rna"><span class="dogma-icon">〰️</span>RNA<small>שליח</small></div>
  <div class="dogma-arrow"><span>תרגום</span></div>
  <div class="dogma-node dogma-protein"><span class="dogma-icon">⬢</span>חלבון<small>מכונה</small></div>
</div>
<p class="caption">DNA גם משכפל את עצמו (<em>שכפול</em>). נגיפים רטרו כמו HIV יכולים לעבור מ-RNA בחזרה ל-DNA (<em>שעתוק לאחור</em>).</p>

<ul class="tight">
  <li><strong>שכפול</strong> (DNA → DNA): העתקת הגנום כולו לפני שהתא מתחלק.</li>
  <li><strong>שעתוק</strong> (DNA → RNA): העתקת גן אחד לשליח קצר-מועד, ה-<em>mRNA</em>.</li>
  <li><strong>תרגום</strong> (RNA → חלבון): הריבוזום קורא את ה-mRNA שלוש אותיות בכל פעם (<em>קודון</em> אחד) ובונה שרשרת של חומצות אמינו.</li>
</ul>

<h2><span class="h-num">2</span>נוקלאוטידים: האלפבית של החיים</h2>
<p>נוקלאוטיד בנוי משלושה חלקים: קבוצת פוספט, סוכר בן חמישה פחמנים (דאוקסיריבוז ב-DNA, ריבוז ב-RNA) ו<strong>בסיס</strong> חנקני. רק הבסיס משתנה מנוקלאוטיד אחד למשנהו, ולכן אפשר לכתוב כל חומצת גרעין כמחרוזת מעל אלפבית זעיר.</p>

<table class="table">
  <thead><tr><th>בסיס</th><th>סמל</th><th>סוג</th><th>נקשר אל</th><th>קשרי מימן</th><th>נמצא ב-</th></tr></thead>
  <tbody>
    <tr><td>אדנין</td><td>${nt("A")}</td><td>פורין (שתי טבעות)</td><td>T ב-DNA / U ב-RNA</td><td>2</td><td>DNA, RNA</td></tr>
    <tr><td>גואנין</td><td>${nt("G")}</td><td>פורין</td><td>C</td><td>3</td><td>DNA, RNA</td></tr>
    <tr><td>ציטוזין</td><td>${nt("C")}</td><td>פירימידין (טבעת אחת)</td><td>G</td><td>3</td><td>DNA, RNA</td></tr>
    <tr><td>תימין</td><td>${nt("T")}</td><td>פירימידין</td><td>A</td><td>2</td><td>DNA בלבד</td></tr>
    <tr><td>אורציל</td><td>${nt("U")}</td><td>פירימידין</td><td>A</td><td>2</td><td>RNA בלבד</td></tr>
  </tbody>
</table>

<div class="callout callout-bio">
  <div class="callout-title">למה RNA משתמש ב-U במקום ב-T?</div>
  <p>ציטוזין מאבד לאט קבוצת אמין והופך לאורציל. אילו DNA היה מכיל U באופן רגיל, אנזימי התיקון לא היו יכולים להבחין בין C פגום לבין U אמיתי. השימוש ב-T (שהוא U עם קבוצת מתיל) ב-DNA מסמן כל U כנזק. RNA הוא מולקולה קצרת-מועד וחד-פעמית, ולכן הוא יכול להסתפק באורציל, שזול יותר לייצור.</p>
</div>

<h3>גדילים, כיווניות והשלמה</h3>
<p>DNA הוא <strong>סליל כפול</strong> שמורכב משני גדילים. הגדילים הם:</p>
<ul class="tight">
  <li><strong>משלימים</strong>: A תמיד מול T, ו-G תמיד מול C. מי שיודע גדיל אחד, יודע גם את השני.</li>
  <li><strong>אנטי-מקביליים</strong>: לכל גדיל יש כיוון, שנכתב <span dir="ltr">5′→3′</span> לפי מספור הפחמנים בסוכר. שני הגדילים פונים לכיוונים הפוכים.</li>
</ul>
<p>במהלך השעתוק, האנזים RNA פולימראז קורא את <strong>גדיל התבנית</strong> מ-3′ ל-5′ ובונה RNA מ-5′ ל-3′, כשהוא מצמיד לכל בסיס בתבנית את הבסיס המשלים לו. לכן ה-RNA החדש משלים לגדיל התבנית, כלומר הוא <em>זהה</em> לגדיל השני, <strong>הגדיל המקודד</strong>, פרט לכך שכל T מוחלף ב-U.</p>

<div class="formula" dir="ltr">
  <div><span class="f-label">גדיל מקודד 5′</span>${nt("ATGGCCATTG")}<span class="f-label">3′</span></div>
  <div><span class="f-label">גדיל תבנית 3′</span>${nt("TACCGGTAAC")}<span class="f-label">5′</span></div>
  <div class="f-arrow">↓ RNA פולימראז</div>
  <div><span class="f-label">mRNA 5′</span>${nt("AUGGCCAUUG")}<span class="f-label">3′</span></div>
</div>

<div class="callout callout-cs">
  <div class="callout-title">התובנה החישובית</div>
  <p>בהינתן הגדיל המקודד, כל התהליך המולקולרי מצטמצם לפעולת מחרוזת אחת: <strong>להחליף כל <code>T</code> ב-<code>U</code></strong>. ביואינפורמטיקה עובדת כך לעיתים קרובות: ברגע שמבינים את הביולוגיה, תהליך מסובך הופך להמרה פשוטה ומדויקת על מחרוזות.</p>
</div>

<h2><span class="h-num">3</span>מעבדה חזותית: צפו בשעתוק בזמן אמת</h2>
<p>הקלידו רצף כלשהו של גדיל מקודד ולחצו <strong>שעתוק</strong>. צפו בפולימראז פותח <em>בועת שעתוק</em>: הסליל הכפול נסגר מחדש מאחוריו, ומולקולת ה-mRNA גדלה בסיס אחר בסיס.</p>
<div data-viz="transcription"></div>

<h2><span class="h-num">4</span>מחרוזות ב-Python</h2>
<p>מחרוזת (<code>str</code>) ב-Python היא <strong>רצף בלתי ניתן לשינוי</strong> (immutable) של תווים. זה מתאים מאוד ל-DNA: אפשר לגשת לפי אינדקס, לחתוך, לעבור בלולאה ולמדוד אורך בעזרת אותם כלים שמשמשים לרשימות.</p>
${py(`
dna = "GATTACA"

len(dna)        # 7         -> number of nucleotides
dna[0]          # 'G'       -> 0-based indexing
dna[-1]         # 'A'       -> negative index counts from the end
dna[1:4]        # 'ATT'     -> slice [start, stop) - stop is excluded
dna[::-1]       # 'ACATTAG' -> reversed (step of -1)
"TTA" in dna    # True      -> substring membership test

for base in dna:            # iterate character by character
    print(base, end=" ")    # G A T T A C A
`)}

<h3>אי-שינוי: למה <code>dna[0] = "U"</code> נכשל</h3>
<p>אי אפשר לשנות מחרוזת במקום. כל "שינוי" בונה מחרוזת <em>חדשה</em>:</p>
${py(`
dna = "GATTACA"
dna[2] = "U"          # TypeError: 'str' object does not support item assignment
rna = dna.replace("T", "U")   # OK - returns a brand-new string
print(dna, rna)               # GATTACA GAUUACA
`)}

<h3>ארבע דרכים לשעתק</h3>
<p>כל הארבע נכונות. הן נבדלות זו מזו בבהירות ובמהירות:</p>
${py(`
# 1) Built-in method - clearest, implemented in C, O(n)
rna = dna.replace("T", "U")

# 2) Translation table - best when mapping MANY characters at once
table = str.maketrans("T", "U")
rna = dna.translate(table)

# 3) Comprehension + join - flexible; join builds the result in one pass
rna = "".join("U" if b == "T" else b for b in dna)

# 4) Manual accumulation - fine for learning, but repeated += on
#    immutable strings can copy the string each time (worst case O(n^2))
rna = ""
for b in dna:
    rna += "U" if b == "T" else b
`)}

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">כל בסיס נבדק פעם אחת</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">נוצרת מחרוזת חדשה באותו אורך</span></div>
</div>

<div class="callout callout-tip">
  <div class="callout-title">טיפ מקצועי: <code>str.translate</code> הוא סוס העבודה</div>
  <p>בהמשך תצטרכו את <em>ההשלמה ההפוכה</em> (reverse complement) של גדיל: החלפה של A↔T ושל C↔G, ואז היפוך. טבלת תרגום אחת מבצעת את ארבע ההחלפות במעבר יחיד, במהירות של C: <code>dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]</code>.</p>
</div>

<div class="callout callout-warn">
  <div class="callout-title">מלכודות מהעולם האמיתי</div>
  <ul class="tight">
    <li><strong>אותיות גדולות וקטנות</strong>: קבצים מסוימים כותבים רצפים באותיות קטנות (<em>soft-masking</em>, לסימון אזורים חוזרים). <code>"t" != "T"</code>.</li>
    <li><strong>רווחים ושורות</strong>: קובצי FASTA שוברים רצפים לשורות של 60–80 תווים. הסירו את תווי השורה החדשה לפני כל ניתוח.</li>
    <li><strong>קודי עמימות</strong>: <code>N</code> פירושו "בסיס כלשהו". הקוד שלכם צריך להעביר אותו הלאה ללא שינוי, ולא לקרוס.</li>
  </ul>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "השלמה הפוכה (Reverse Complement)",
  intro: "השלמה הפוכה היא אחת הפעולות הנפוצות ביותר בביואינפורמטיקה: היא מחשבת את הרצף של הגדיל השני, כפי שהוא נקרא בכיוון <span dir='ltr'>5′→3′</span> שלו.",
  code: `
dna = "ATGCGTACCTTAG"

complement_table = str.maketrans("ACGT", "TGCA")
complement = dna.translate(complement_table)
reverse_complement = complement[::-1]

print("DNA:               ", dna)
print("Complement:        ", complement)
print("Reverse complement:", reverse_complement)
`,
  steps: [
    `<code>str.maketrans("ACGT", "TGCA")</code> בונה טבלת מיפוי: התו הראשון במחרוזת הראשונה ממופה לתו הראשון בשנייה, וכן הלאה. כך מתקבלים A→T, ‏C→G, ‏G→C ו-T→A.`,
    `<code>dna.translate(complement_table)</code> עובר על המחרוזת פעם אחת ומחליף כל תו לפי הטבלה. התוצאה היא הגדיל המשלים, שעדיין כתוב בכיוון <span dir="ltr">3′→5′</span>.`,
    `<code>complement[::-1]</code> הופך את סדר התווים (חיתוך עם צעד <code>-1</code>). כך מקבלים את הגדיל המשלים בכיוון <span dir="ltr">5′→3′</span>, כלומר את <strong>ההשלמה ההפוכה</strong>, הצורה שבה רצפים נשמרים במאגרי מידע.`,
    `שימו לב שכל פעולה יוצרת מחרוזת חדשה: <code>dna</code> המקורית לא משתנה, כי מחרוזות ב-Python אינן ניתנות לשינוי.`,
    `למה זה חשוב? גן יכול לשבת על כל אחד משני הגדילים. כלים כמו BLAST ותוכנות למיפוי קריאות בודקים תמיד גם את ההשלמה ההפוכה.`,
  ],
})}

${demo({
  title: "מ-DNA לחלבון: שעתוק ותרגום של גן זעיר",
  intro: "הדוגמה הזו מריצה את הדוגמה המרכזית מקצה לקצה: שעתוק של גדיל מקודד ל-mRNA, ואז תרגום של ה-mRNA לרצף של חומצות אמינו.",
  code: `
CODON_TABLE = {
    "AUG": "M", "GCC": "A", "AUU": "I", "GUA": "V",
    "GGC": "G", "CGC": "R", "UGA": "*", "UAA": "*", "UAG": "*",
}

def translate_rna(rna):
    protein = []
    for i in range(0, len(rna) - 2, 3):
        codon = rna[i:i + 3]
        amino_acid = CODON_TABLE.get(codon, "?")
        if amino_acid == "*":          # stop codon
            break
        protein.append(amino_acid)
    return "".join(protein)

coding_strand = "ATGGCCATTGTAATGGGCCGCTGAAAG"
mrna = coding_strand.replace("T", "U")
codons = [mrna[i:i + 3] for i in range(0, len(mrna), 3)]

print("mRNA:   ", mrna)
print("Codons: ", " ".join(codons))
print("Protein:", translate_rna(mrna))
`,
  steps: [
    `<code>CODON_TABLE</code> הוא מילון (dict) שממפה כל קודון לקוד של חומצת אמינו באות אחת. הקוד הגנטי המלא כולל 64 קודונים; כאן מופיעים רק אלה שהדוגמה צריכה, והסימן <code>*</code> מסמן קודון עצירה.`,
    `<code>range(0, len(rna) - 2, 3)</code> מייצר את האינדקסים 0, 3, 6 וכן הלאה, כלומר את תחילתו של כל קודון. החסרת 2 מבטיחה שלא נחתוך קודון חלקי בסוף הרצף.`,
    `<code>rna[i:i + 3]</code> חותך שלוש אותיות. <code>CODON_TABLE.get(codon, "?")</code> מחזיר את חומצת האמינו, או <code>"?"</code> אם הקודון לא נמצא במילון, במקום לזרוק <code>KeyError</code>.`,
    `כשמגיעים לקודון עצירה, <code>break</code> יוצא מהלולאה, בדיוק כמו שהריבוזום משתחרר מה-mRNA. לכן הקודון <code>AAG</code> שמופיע אחרי <code>UGA</code> לא מתורגם.`,
    `את החלבון בונים כרשימה ומחברים בסוף עם <code>"".join(protein)</code>. זה יעיל יותר מחיבור חוזר של מחרוזות עם <code>+=</code>.`,
    `השורה <code>coding_strand.replace("T", "U")</code> היא השעתוק עצמו, אותו רעיון שתממשו בתרגיל כפונקציה עצמאית.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>פתחו את לשונית <strong>תרגיל</strong> וממשו את <code>transcribe(dna_string)</code>. השתמשו ב<strong>הרצה</strong> כדי לבדוק את הדוגמאות הגלויות, ואז ב<strong>הגשה</strong> כדי לבדוק גם את מקרי הקצה הנסתרים.</p>
<p class="muted small">בקוד מחקרי הייתם בדרך כלל קוראים ל-<code>Bio.Seq.Seq(dna).transcribe()</code> מהספרייה Biopython. מאחורי הקלעים היא עושה בדיוק את מה שאתם עומדים לכתוב.</p>
`,

    problem: {
      statement: `
<p>מחרוזת RNA היא מחרוזת מעל האלפבית <code>{A, C, G, U}</code>. בהינתן מחרוזת DNA ‏<code>t</code> שהיא <strong>הגדיל המקודד</strong> של גן, תעתיק ה-RNA שלה, <code>u</code>, מתקבל מהחלפת כל מופע של <code>"T"</code> ב-<code>t</code> ב-<code>"U"</code>.</p>
<p>ממשו את <code>transcribe(dna_string)</code> כך שתחזיר את תעתיק ה-RNA כמחרוזת.</p>`,
      examples: [
        { input: 'dna_string = "GATGGAACTTGACTACGTAAATT"', output: '"GAUGGAACUUGACUACGUAAAUU"', explanation: "כל T הופך ל-U; ‏A, ‏C ו-G נשארים ללא שינוי." },
        { input: 'dna_string = "TTTT"', output: '"UUUU"' },
      ],
      constraints: [
        "<code>0 ≤ len(dna_string) ≤ 10<sup>5</sup></code>",
        "<code>dna_string</code> מכילה רק את האותיות הגדולות <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code>",
        "יש להחזיר <code>str</code>, לא רשימה",
      ],
      hints: [
        "מחרוזות ב-Python אינן ניתנות לשינוי, ולכן תחזירו מחרוזת <em>חדשה</em>.",
        "הציצו במתודה המובנית <code>str.replace(old, new)</code>.",
        "מקרה קצה: מה צריך להיות התעתיק של מחרוזת ריקה?",
      ],
    },

    starter: `def transcribe(dna_string):
    """
    Transcribe a DNA coding strand into messenger RNA.

    >>> transcribe("GATTACA")
    'GAUUACA'
    """
    # Write your code here
    pass
`,
    solution: `def transcribe(dna_string):
    # RNA is the coding strand with every thymine replaced by uracil.
    return dna_string.replace("T", "U")
`,
    tests: [
      { args: ["GATGGAACTTGACTACGTAAATT"], expected: "GAUGGAACUUGACUACGUAAAUU" },
      { args: ["TTTT"], expected: "UUUU" },
      { args: ["ACGACG"], expected: "ACGACG" },
      { args: [""], expected: "", hidden: true },
      { args: ["T"], expected: "U", hidden: true },
      { args: ["AAAACCCCGGGGTTTT"], expected: "AAAACCCCGGGGUUUU", hidden: true },
      { args: ["ATGC".repeat(2500)], expected: "AUGC".repeat(2500), hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 2 ─────────────────────────────── */
  const m2 = {
    id: "m2",
    number: 2,
    title: "ניתוח רצפים ותכולת GC",
    short: "תכולת GC",
    level: "easy",
    difficulty: "קל",
    minutes: 30,
    topics: ["יציבות DNA", "טמפרטורת התכה", "לולאות וספירה"],
    fnName: "gc_content",

    lesson: `
<p class="eyebrow">מודול 2 · ביולוגיה × מדעי המחשב</p>
<h1>ניתוח רצפים ותכולת GC</h1>
<p class="lede">השיעור היחסי של G ו-C בקטע DNA הוא אחד המספרים הפשוטים ביותר בגנומיקה, וגם אחד השימושיים ביותר. הוא מנבא עד כמה חזק שני הגדילים נצמדים זה לזה, עוזר לקבוע אם תגובת PCR תצליח, ומשתנה בין מינים ואפילו בין אזורים שונים באותו גנום.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>למה DNA עשיר ב-GC יציב יותר בחום</li>
    <li>מהי טמפרטורת התכה (T<sub>m</sub>) ואיך מעריכים אותה</li>
    <li>תבנית הצובר: לולאות, מונים ו-<code>Counter</code></li>
    <li>איך לטפל במקרי קצה בצורה הגנתית (קלט ריק, אותיות מעורבות)</li>
  </ul>
</div>

<h2><span class="h-num">1</span>מה מחזיק את הסליל הכפול?</h2>
<p>שני סוגים של כוחות לא-קוולנטיים מחזיקים את שני גדילי ה-DNA יחד:</p>
<ul class="tight">
  <li><strong>קשרי מימן</strong> בין בסיסים מזווגים: <span class="pill pill-at">ל-A=T יש 2</span> ו<span class="pill pill-gc">ל-G≡C יש 3</span>.</li>
  <li><strong>ערימת בסיסים</strong> (base stacking): הבסיסים השטוחים והארומטיים נערמים כמו מטבעות ומושכים את שכניהם מלמעלה ומלמטה. הערימה תורמת למעשה <em>יותר</em> ליציבות מאשר קשרי המימן, וערימות שמכילות G·C הן מהחזקות ביותר.</li>
</ul>
<p>שני האפקטים פועלים באותו כיוון: <strong>ככל שיש יותר G ו-C, נדרשת יותר אנרגיה כדי להפריד את הגדילים.</strong></p>

<div class="bond-demo">
  <div class="bond-pair">
    <span class="bond-row" dir="ltr"><span class="nt nt-a">A</span><span class="hb hb-2"><i></i><i></i></span><span class="nt nt-t">T</span></span>
    <span class="bond-cap">2 קשרי מימן</span>
  </div>
  <div class="bond-pair">
    <span class="bond-row" dir="ltr"><span class="nt nt-g">G</span><span class="hb hb-3"><i></i><i></i><i></i></span><span class="nt nt-c">C</span></span>
    <span class="bond-cap">3 קשרי מימן</span>
  </div>
</div>

<h2><span class="h-num">2</span>טמפרטורת התכה (T<sub>m</sub>)</h2>
<p>כשמחממים DNA דו-גדילי, הגדילים נפרדים בסופו של דבר (<em>דנטורציה</em>, או "התכה"). <strong>טמפרטורת ההתכה</strong> היא הטמפרטורה שבה מחצית מהמולקולות הפכו לחד-גדיליות. שני קירובים קלאסיים:</p>

<div class="formula-card">
  <div class="fc-row"><span class="fc-name">כלל Wallace</span><span class="fc-when">אוליגונוקלאוטידים קצרים, פחות מ-14 נוקלאוטידים</span></div>
  <div class="fc-eq" dir="ltr">T<sub>m</sub> = 2·(A + T) + 4·(G + C) &nbsp;°C</div>
  <div class="fc-row"><span class="fc-name">נוסחת תכולת GC</span><span class="fc-when">רצפים ארוכים יותר</span></div>
  <div class="fc-eq" dir="ltr">T<sub>m</sub> = 64.9 + 41 · (G + C − 16.4) / N &nbsp;°C</div>
</div>
<p class="muted small">כלים מקצועיים (למשל Primer3) משתמשים ב<em>תרמודינמיקה של שכנים קרובים</em> (nearest-neighbour): הם מסכמים את אנרגיית הערימה של כל זוג בסיסים סמוכים ומתקנים לפי ריכוז המלח. הנוסחאות שלמעלה הן הערכה ראשונה טובה.</p>

<h3>למה זה חשוב לביולוגים</h3>
<table class="table">
  <thead><tr><th>הקשר</th><th>למה תכולת GC חשובה</th></tr></thead>
  <tbody>
    <tr><td><strong>תכנון פריימרים ל-PCR</strong></td><td>פריימרים מתוכננים עם 40–60% GC וטמפרטורת T<sub>m</sub> של כ-52–65 °C, ולשני הפריימרים בזוג צריכות להיות טמפרטורות דומות. פריימר עשיר מדי ב-AT נופל מהתבנית; פריימר עשיר מדי ב-GC נקשר למקומות הלא נכונים.</td></tr>
    <tr><td><strong>ביולוגיה של גנומים</strong></td><td>תכולת GC משתנה מאוד בין מינים: <em>Plasmodium falciparum</em> (טפיל המלריה) כ-19%, האדם כ-41%, <em>Streptomyces coelicolor</em> כ-72%. אפשר להשתמש בה כ"טביעת אצבע" כדי לזהות גנים שהגיעו בהעברה אופקית.</td></tr>
    <tr><td><strong>בקרת ביטוי גנים</strong></td><td><em>איי CpG</em> הם מקטעים עשירים ב-GC ליד הפרומוטורים של גנים אנושיים רבים. מצב המתילציה שלהם עוזר להפעיל או לכבות את הגנים האלה.</td></tr>
    <tr><td><strong>בקרת איכות בריצוף</strong></td><td>קריאות Illumina עם GC קיצוני מיוצגות בחסר (GC bias). כלים כמו FastQC משרטטים את אחוז ה-GC בכל קריאה כדי לזהות זיהומים.</td></tr>
  </tbody>
</table>

<h2><span class="h-num">3</span>מעבדה חזותית: תכולת GC והתכת DNA</h2>
<p>ערכו את הרצף, או צרו רצף אקראי עם הטיית GC לבחירתכם. אחר כך <strong>העלו את הטמפרטורה</strong>. במודל המפושט הזה, כל זוג בסיסים נמס כשהטמפרטורה עוברת סף מקומי שנקבע לפי תכולת ה-GC בסביבתו. אזורים עשירים ב-AT נפתחים ראשונים, בדומה ל"נשימה" של DNA אמיתי.</p>
<div data-viz="gc"></div>

<h2><span class="h-num">4</span>לולאות, ספירה ותבנית הצובר</h2>
<p>רוב הסטטיסטיקות על רצפים פועלות לפי אותה תבנית: <strong>מאתחלים מונה, עוברים על הרצף פעם אחת, מעדכנים את המונה ובסוף משלבים את התוצאה.</strong></p>
${py(`
dna = "AGCTATAG"

gc = 0                      # 1. initialise an accumulator
for base in dna:            # 2. visit every element once
    if base == "G" or base == "C":
        gc += 1             # 3. update the accumulator
percent = gc / len(dna) * 100   # 4. combine -> 37.5
`)}

<h3>חלופות בסגנון Python</h3>
${py(`
# Membership test on a small string instead of chained ==
gc = sum(1 for base in dna if base in "GC")

# str.count runs in C - two quick passes
gc = dna.count("G") + dna.count("C")

# Count every symbol at once (handy for full composition)
from collections import Counter
counts = Counter(dna)       # Counter({'A': 3, 'T': 2, 'G': 2, 'C': 1})
gc = counts["G"] + counts["C"]
`)}

<div class="callout callout-cs">
  <div class="callout-title">חילוק ב-Python 3</div>
  <p><code>/</code> הוא <em>חילוק אמיתי</em> ותמיד מחזיר <code>float</code>: <code>3 / 8 == 0.375</code>. ואילו <code>//</code> הוא חילוק שלמים (עיגול כלפי מטה): <code>3 // 8 == 0</code>. סקריפטים ביואינפורמטיים רבים מתקופת Python 2 דיווחו בשקט על תכולת GC של 0 בגלל ההבדל הזה.</p>
</div>

<h3>תכנות הגנתי: חשבו על הקצוות</h3>
<p>לפני שכותבים את הלוגיקה המרכזית, כדאי לרשום את הקלטים שעלולים לשבור אותה:</p>
<ul class="tight">
  <li><strong>רצף ריק</strong>: <code>len(dna) == 0</code> גורם ל-<code>ZeroDivisionError</code>. החליטו על תשובה הגיונית (כאן: <code>0.0</code>).</li>
  <li><strong>אותיות קטנות</strong>: <code>"gc"</code> הם עדיין G ו-C. נרמלו קודם בעזרת <code>dna.upper()</code>.</li>
  <li><strong>נקודה צפה</strong>: <code>1/3*100</code> שווה <code>33.33333333333333</code>. הבדיקות משוות עם סובלנות, ולכן אל תעגלו בתוך הפונקציה. עגלו רק כשמציגים ערך.</li>
</ul>

<h3>פענוח FASTA, שפת האם של קובצי רצפים</h3>
${py(`
fasta = """>Rosalind_6404
CCTGCGGAAGATCGGCACTAGAATAGCCAGAACCGTTTCTCTGAGGCTTCCGGCCTTCCC
TCCCACTAATAATTCTGAGG"""

lines = fasta.strip().splitlines()
header = lines[0][1:]              # drop the '>'
seq = "".join(lines[1:])           # sequence lines are wrapped - re-join them
print(header, len(seq))            # Rosalind_6404 80
`)}

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">מעבר אחד (או שני מעברים מהירים עם str.count)</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(1)</span><span class="cx-note">מספר קבוע של מונים, בלי קשר לגודל הקלט</span></div>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "חישוב טמפרטורת התכה לפריימרים",
  intro: "בתכנון ניסוי PCR צריך לוודא שלפריימרים יש טמפרטורת התכה מתאימה. הפונקציה הזו בוחרת אוטומטית את הנוסחה המתאימה לאורך הפריימר.",
  code: `
def melting_temp(primer):
    primer = primer.upper()
    n = len(primer)
    at = primer.count("A") + primer.count("T")
    gc = primer.count("G") + primer.count("C")
    if n < 14:
        return 2 * at + 4 * gc            # Wallace rule
    return 64.9 + 41 * (gc - 16.4) / n    # GC-based formula

primers = {
    "short":   "ATGCGTAC",
    "M13_fwd": "GTAAAACGACGGCCAGT",
    "M13_rev": "AGCGGATAACAATTTCACACAGG",
}

for name, seq in primers.items():
    print(f"{name:<8} {seq:<24} len={len(seq):>2}  Tm={melting_temp(seq):5.1f} C")
`,
  steps: [
    `<code>primer.upper()</code> מנרמל את הרצף לאותיות גדולות, כך שגם פריימר שנכתב באותיות קטנות ייספר נכון.`,
    `<code>primer.count(...)</code> סופר כל בסיס במעבר מהיר שממומש ב-C. את A ו-T סוכמים יחד (2 קשרי מימן לכל זוג), ואת G ו-C יחד (3 קשרי מימן).`,
    `<code>if n &lt; 14</code> בוחר בין הנוסחאות: לפריימרים קצרים משתמשים בכלל Wallace, ולארוכים בנוסחה שמבוססת על תכולת ה-GC ביחס לאורך.`,
    `המילון <code>primers</code> מחזיק שם ורצף לכל פריימר, והלולאה <code>for name, seq in primers.items()</code> עוברת על הזוגות לפי סדר ההכנסה.`,
    `ה-f-string מעצב את הפלט כטבלה: <code>{name:&lt;8}</code> מיישר לשמאל ברוחב 8 תווים, ו-<code>{...:5.1f}</code> מציג מספר עשרוני עם ספרה אחת אחרי הנקודה.`,
    `קראו את התוצאה: לזוג פריימרים שעובד יחד צריכות להיות טמפרטורות קרובות, בדרך כלל בהפרש של עד כ-5 מעלות. בין שני פריימרי M13 מתקבל כאן הפרש של כ-6 מעלות, אבל הנוסחאות הפשוטות האלה גסות. לפני שמתכננים מחדש, בודקים עם כלי מדויק יותר כמו Primer3.`,
  ],
})}

${demo({
  title: "GC skew: איתור נקודת ההתחלה של השכפול",
  intro: "<em>GC skew</em> הוא ההפרש המצטבר בין מספר ה-G למספר ה-C לאורך הגנום. בחיידקים, הנקודה שבה הוא מגיע למינימום מסמנת לרוב את <strong>ori</strong>, נקודת ההתחלה של השכפול.",
  code: `
genome = "CATGGGCATCGGCCATACGCC"

skew = [0]
for base in genome:
    if base == "G":
        skew.append(skew[-1] + 1)
    elif base == "C":
        skew.append(skew[-1] - 1)
    else:
        skew.append(skew[-1])

print("Skew:", skew)

lowest = min(skew)
positions = [i for i, value in enumerate(skew) if value == lowest]
print("Minimum skew", lowest, "at positions", positions)
`,
  steps: [
    `הרשימה <code>skew</code> מתחילה ב-<code>[0]</code>: לפני שקראנו בסיס כלשהו, ההפרש הוא אפס. לכן בסוף יהיו בה <code>len(genome) + 1</code> ערכים.`,
    `בכל צעד לוקחים את הערך האחרון, <code>skew[-1]</code>, ומוסיפים 1 עבור G, מחסירים 1 עבור C, או משאירים אותו כפי שהוא עבור A ו-T. זו שוב תבנית הצובר, רק שהפעם שומרים את כל ערכי הביניים.`,
    `<code>min(skew)</code> מוצא את הערך הנמוך ביותר במעבר אחד על הרשימה.`,
    `רשימת ההבנה (list comprehension) עם <code>enumerate</code> אוספת את <em>כל</em> העמדות שבהן מתקבל המינימום, כי ייתכן שיש יותר מאחת.`,
    `הרעיון הביולוגי: במהלך השכפול, אחד הגדילים נשאר חד-גדילי זמן רב יותר, ובו ציטוזין נוטה לעבור דאמינציה. כך נוצר מחסור ב-C בחצי אחד של הגנום, והמעבר בין החצאים מסמן את ה-ori.`,
  ],
})}

${demo({
  title: "קריאת קובץ multi-FASTA וספירת הרכב הבסיסים",
  intro: "בקבצים אמיתיים יש בדרך כלל כמה רצפים, וכל אחד מהם שבור לכמה שורות. הדוגמה קוראת קובץ multi-FASTA ומדפיסה את הרכב הבסיסים של כל רשומה.",
  code: `
from collections import Counter

fasta = """>seq_alpha
ATATTTAAGC
GCATAT
>seq_beta
GGCCGCGTAA
CCGG
>seq_gamma
ATGCATGCAT"""

records = {}
name = None
for line in fasta.splitlines():
    line = line.strip()
    if not line:
        continue
    if line.startswith(">"):
        name = line[1:]
        records[name] = []
    else:
        records[name].append(line)

for name, parts in records.items():
    seq = "".join(parts)
    counts = Counter(seq)
    composition = ", ".join(f"{b}={counts[b]}" for b in "ACGT")
    print(f"{name:<10} length={len(seq):>2}  {composition}")
`,
  steps: [
    `<code>fasta.splitlines()</code> מפרק את הטקסט לשורות, ו-<code>line.strip()</code> מסיר רווחים ותווי שורה חדשה. שורות ריקות מדולגות בעזרת <code>continue</code>.`,
    `שורה שמתחילה ב-<code>&gt;</code> היא כותרת: <code>line[1:]</code> מסיר את התו <code>&gt;</code>, ובמילון <code>records</code> נפתחת רשימה ריקה עבור הרשומה החדשה.`,
    `כל שורה אחרת שייכת לרשומה האחרונה שנפתחה, ולכן מוסיפים אותה לרשימה <code>records[name]</code>.`,
    `אחרי הקריאה, <code>"".join(parts)</code> מחבר את השורות השבורות לרצף רציף אחד.`,
    `<code>Counter(seq)</code> סופר את כל התווים במעבר אחד ומחזיר מילון מיוחד. <code>counts[b]</code> מחזיר 0 עבור בסיס שלא הופיע, בלי <code>KeyError</code>.`,
    `מכאן הדרך לתכולת GC קצרה: מחברים את <code>counts["G"]</code> ו-<code>counts["C"]</code> ומחלקים באורך. את זה תממשו בתרגיל, כולל מקרי הקצה.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>ממשו את <code>gc_content(dna)</code>. <strong>הבדיקות הנסתרות</strong> כוללות מחרוזת ריקה וקלט עם אותיות גדולות וקטנות, אז טפלו במקרי הקצה שתוארו למעלה.</p>
`,

    problem: {
      statement: `
<p><strong>תכולת ה-GC</strong> של מחרוזת DNA היא אחוז הסמלים בה שהם <code>"C"</code> או <code>"G"</code>. לדוגמה, <code>"AGCTATAG"</code> מכילה 3 בסיסי G/C מתוך 8, ולכן תכולת ה-GC שלה היא <code>37.5</code>.</p>
<p>ממשו את <code>gc_content(dna)</code> כך שתחזיר את תכולת ה-GC <strong>כאחוז</strong> (<code>float</code> בין 0 ל-100).</p>
<ul class="tight">
  <li>ספרו בלי תלות בגודל האות: גם <code>"g"</code> ו-<code>"c"</code> נספרים.</li>
  <li>אם הרצף ריק, החזירו <code>0.0</code>. אל תזרקו חריגה.</li>
</ul>`,
      examples: [
        { input: 'dna = "AGCTATAG"', output: "37.5", explanation: "G, ‏C ו-G הם 3 מתוך 8 בסיסים, כלומר 3 / 8 × 100 = 37.5" },
        { input: 'dna = "GGCC"', output: "100.0" },
        { input: 'dna = ""', output: "0.0", explanation: "אין בסיסים, ולכן אין במה לחלק. הגנו מפני ZeroDivisionError." },
      ],
      constraints: [
        "<code>0 ≤ len(dna) ≤ 10<sup>5</sup></code>",
        "התווים לקוחים מתוך <code>ACGTacgt</code>",
        "תשובות מתקבלות בשגיאה מוחלטת של עד <code>10<sup>-3</sup></code>",
      ],
      hints: [
        "ספרו כמה תווים הם G או C, וחלקו באורך הכולל.",
        "<code>dna.upper()</code> מנרמלת את גודל האותיות בצעד אחד.",
        "בדקו <code>if not dna:</code> לפני החילוק.",
      ],
    },

    starter: `def gc_content(dna):
    """
    Return the GC content of a DNA sequence as a percentage (0-100).

    >>> gc_content("AGCTATAG")
    37.5
    """
    # Write your code here
    pass
`,
    solution: `def gc_content(dna):
    if not dna:                 # guard: avoid ZeroDivisionError
        return 0.0
    dna = dna.upper()           # make the count case-insensitive
    gc = sum(1 for base in dna if base in "GC")
    return gc / len(dna) * 100
`,
    tests: [
      { args: ["AGCTATAG"], expected: 37.5, tol: 1e-3 },
      { args: ["GGCC"], expected: 100.0, tol: 1e-3 },
      { args: ["ATATAT"], expected: 0.0, tol: 1e-3 },
      { args: [""], expected: 0.0, tol: 1e-3, hidden: true },
      { args: ["CCACCCTCGTGGTATGGCTAGGCATTCAGGAACCGGAGAACGCTTCAGACCAGCCCGGACTGGGAACCTGCGGGCAGTAGGTGGAAT"], expected: 60.91954, tol: 1e-3, hidden: true },
      { args: ["gcGCat"], expected: 66.666667, tol: 1e-3, hidden: true },
      { args: ["G"], expected: 100.0, tol: 1e-3, hidden: true },
      { args: ["ACGT".repeat(2500)], expected: 50.0, tol: 1e-3, hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 3 ─────────────────────────────── */
  const m3 = {
    id: "m3",
    number: 3,
    title: "מוטציות ומרחק המינג",
    short: "מרחק המינג",
    level: "easy",
    difficulty: "קל",
    minutes: 30,
    topics: ["SNPs", "מרחק אבולוציוני", "zip ו-Big-O"],
    fnName: "hamming_distance",

    lesson: `
<p class="eyebrow">מודול 3 · ביולוגיה × מדעי המחשב</p>
<h1>מוטציות ומרחק המינג</h1>
<p class="lede">אין שני עותקים זהים לחלוטין של גנום. מדידת <em>מידת</em> השוני בין שני רצפים היא נקודת המוצא לזיהוי וריאנטים, לגנטיקה של אוכלוסיות ולבניית עץ החיים. המדד הפשוט ביותר מהסוג הזה הוא מרחק המינג.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>סוגי מוטציות: טרנזיציות, טרנסברזיות ואינדלים</li>
    <li>מהו SNP ולמה יש מיליונים כאלה אצל כל אחד מאיתנו</li>
    <li>איך ספירת אי-התאמות הופכת למרחק אבולוציוני</li>
    <li>מעבר על שני רצפים במקביל, ומה באמת פירוש O(n)</li>
  </ul>
</div>

<h2><span class="h-num">1</span>מוטציות נקודתיות</h2>
<p><strong>מוטציה נקודתית</strong> משנה נוקלאוטיד בודד. היא נגרמת משגיאות של הפולימראז, מנזק כימי, מקרינת UV ומכשלים במנגנוני התיקון. התמרות (substitutions) מתחלקות לשני סוגים:</p>

<div class="mut-grid">
  <div class="mut-card mut-ts">
    <div class="mut-title">טרנזיציה (Transition)</div>
    <div class="mut-ex" dir="ltr">${nt("A")} ↔ ${nt("G")} &nbsp; ${nt("C")} ↔ ${nt("T")}</div>
    <p>פורין מוחלף בפורין, או פירימידין בפירימידין. הצורות דומות, ולכן בפועל הן <strong>שכיחות פי 2 בערך</strong>.</p>
  </div>
  <div class="mut-card mut-tv">
    <div class="mut-title">טרנסברזיה (Transversion)</div>
    <div class="mut-ex" dir="ltr">${nt("A")} ↔ ${nt("C")} &nbsp; ${nt("G")} ↔ ${nt("T")} …</div>
    <p>פורין מוחלף בפירימידין, או להפך. יש פי שניים טרנסברזיות אפשריות, ובכל זאת הן מתרחשות לעיתים רחוקות יותר.</p>
  </div>
</div>

<p>בתוך גן שמקודד לחלבון, ההשפעה של התמרה תלויה בקוד הגנטי:</p>
<ul class="tight">
  <li><strong>סינונימית (שקטה)</strong>: הקודון משתנה, אבל חומצת האמינו לא (למשל <code>GAA</code>→<code>GAG</code>, שניהם Glu).</li>
  <li><strong>Missense</strong>: חומצת האמינו משתנה. הדוגמה הקלאסית היא <strong>אנמיה חרמשית</strong>: טרנסברזיה אחת של A→T בגן <em>HBB</em> הופכת את <code>GAG</code> (Glu) ל-<code>GTG</code> (Val) בעמדה 6 של β-גלובין.</li>
  <li><strong>Nonsense</strong>: קודון עצירה מוקדם קוטע את החלבון.</li>
</ul>
<p>קיימים גם <strong>אינדלים</strong> (indels: הכנסות והשמטות), אבל הם מזיזים את היישור. מרחק המינג מניח ששני הרצפים כבר מיושרים ובאותו אורך, ולכן הוא סופר רק התמרות. אינדלים דורשים אלגוריתמי יישור שתפגשו בהמשך (Needleman–Wunsch, ‏Smith–Waterman).</p>

<h2><span class="h-num">2</span>SNP: השונות שהופכת אתכם לייחודיים</h2>
<p><strong>פולימורפיזם של נוקלאוטיד בודד (SNP)</strong> הוא עמדה בגנום שבה אנשים שונים נושאים לעיתים קרובות בסיסים שונים (לפי המוסכמה, לאלל הנדיר יש שכיחות של 1% לפחות באוכלוסייה). כל גנום אנושי שונה מגנום הייחוס בכ-<strong>4–5 מיליון</strong> עמדות. SNPs עומדים בבסיס מחקרי אסוציאציה גנומיים (GWAS), הסקת מוצא, פרמקוגנומיקה וזיהוי פורנזי.</p>

<h2><span class="h-num">3</span>מאי-התאמות למרחק אבולוציוני</h2>
<p>מחלקים את מרחק המינג <em>d</em> באורך היישור <em>L</em> ומקבלים את <strong>p-distance</strong>, שיעור העמדות השונות:</p>
<div class="formula-card">
  <div class="fc-eq" dir="ltr">p = d<sub>H</sub> / L</div>
  <div class="fc-row"><span class="fc-name">תיקון Jukes–Cantor ‏(1969)</span><span class="fc-when">מתחשב בפגיעות מרובות</span></div>
  <div class="fc-eq" dir="ltr">d<sub>JC</sub> = −¾ · ln(1 − 4p/3)</div>
</div>
<p>למה בכלל לתקן? לאורך זמנים ארוכים, אותה עמדה יכולה לעבור מוטציה יותר מפעם אחת (A→G→A). שינויים כאלה בלתי נראים, ולכן <em>p</em> הגולמי <em>מעריך בחסר</em> את המספר האמיתי של ההתמרות. מודל JC69 הופך שרשרת מרקוב פשוטה כדי לשחזר אותו. כש-<em>p</em> מתקרב ל-0.75, הערך הצפוי בין שני רצפים אקראיים, המרחק שואף לאינסוף: האות רווי.</p>

<h2><span class="h-num">4</span>מעבדה חזותית: השוואת שני גדילים</h2>
<p>ערכו כל אחד מהגדילים, לחצו <strong>מוטציה</strong> כדי להוסיף מוטציה נקודתית אקראית, או <strong>סריקה</strong> כדי לצפות באלגוריתם עובר על שתי המחרוזות וסופר הבדלים. טרנזיציות מסומנות בכתום, וטרנסברזיות באדום.</p>
<div data-viz="hamming"></div>

<h2><span class="h-num">5</span>מעבר על שתי מחרוזות במקביל</h2>
${py(`
s, t = "GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"

# Index-based - works everywhere, but noisy
d = 0
for i in range(len(s)):
    if s[i] != t[i]:
        d += 1

# zip() pairs elements: ('G','C'), ('A','A'), ...
d = 0
for a, b in zip(s, t):
    if a != b:
        d += 1

# Idiomatic one-liner: True counts as 1 when summed
d = sum(a != b for a, b in zip(s, t))     # 7

# Need positions too? enumerate + zip
diffs = [i for i, (a, b) in enumerate(zip(s, t)) if a != b]
`)}

<div class="callout callout-warn">
  <div class="callout-title">המלכודת השקטה של <code>zip</code></div>
  <p><code>zip</code> <strong>עוצר בקלט הקצר יותר בלי שום אזהרה</strong>. הביטוי <code>sum(a != b for a, b in zip("ACGT", "AC"))</code> מחזיר <code>0</code>, וזה שגוי. מרחק המינג אינו מוגדר לרצפים באורכים שונים, ולכן בדקו זאת במפורש וזרקו <code>raise ValueError(...)</code>. ב-Python ‏3.10 ומעלה אפשר גם לכתוב <code>zip(s, t, strict=True)</code>.</p>
</div>

<h3>Big-O: איך העבודה גדלה?</h3>
<p><strong>סיבוכיות זמן</strong> מתארת איך זמן הריצה גדל ביחס לגודל הקלט <em>n</em>, תוך התעלמות מגורמים קבועים. מרחק המינג בודק כל עמדה בדיוק פעם אחת, ולכן הוא <strong>O(n)</strong>, כלומר <em>לינארי</em>: אם מכפילים את אורך הרצף, העבודה בערך מוכפלת.</p>
<table class="table">
  <thead><tr><th>מחלקה</th><th>דוגמה</th><th>n = 3×10⁹ (הגנום האנושי)</th></tr></thead>
  <tbody>
    <tr><td><code>O(1)</code></td><td>קריאת <code>dna[42]</code></td><td>מיידי</td></tr>
    <tr><td><code>O(n)</code></td><td>מרחק המינג, תכולת GC</td><td>שניות</td></tr>
    <tr><td><code>O(n log n)</code></td><td>מיון k-mers</td><td>דקות</td></tr>
    <tr><td><code>O(n²)</code></td><td>השוואה נאיבית של כל הזוגות</td><td>יותר מגיל היקום</td></tr>
  </tbody>
</table>

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n)</span><span class="cx-note">השוואה אחת לכל עמדה מיושרת</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(1)</span><span class="cx-note">zip וגנרטורים הם עצלים, ולכן לא נוצרים עותקים</span></div>
</div>

<h2><span class="h-num">6</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "דוח מוטציות: מיקום וסוג של כל שינוי",
  intro: "בניתוח וריאנטים לא מספיק לדעת <em>כמה</em> הבדלים יש; רוצים לדעת <em>איפה</em> הם ומאיזה סוג. הדוגמה מפיקה דוח מוטציות ומחשבת את היחס בין טרנזיציות לטרנסברזיות (Ts/Tv).",
  code: `
PURINES = {"A", "G"}

def classify(a, b):
    if a == b:
        return None
    same_class = (a in PURINES) == (b in PURINES)
    return "transition" if same_class else "transversion"

ref = "GAGCCTACTAACGGGAT"
alt = "CATCGTAATGACGGCCT"

ts = tv = 0
for i, (a, b) in enumerate(zip(ref, alt)):
    kind = classify(a, b)
    if kind:
        print(f"pos {i:>2}: {a} -> {b}  {kind}")
        if kind == "transition":
            ts += 1
        else:
            tv += 1

print(f"transitions={ts}, transversions={tv}, Ts/Tv={ts / tv:.2f}")
`,
  steps: [
    `<code>PURINES</code> היא קבוצה (set), ולכן בדיקת השייכות <code>a in PURINES</code> מהירה מאוד. כל בסיס שאינו פורין הוא פירימידין.`,
    `<code>classify(a, b)</code> מחזירה <code>None</code> כשהבסיסים זהים. אחרת היא בודקת אם שניהם מאותה מחלקה: הביטוי <code>(a in PURINES) == (b in PURINES)</code> הוא <code>True</code> כששניהם פורינים או ששניהם פירימידינים, כלומר כשמדובר בטרנזיציה.`,
    `<code>enumerate(zip(ref, alt))</code> מחזיר בכל צעד את האינדקס יחד עם זוג התווים המיושרים. הפירוק <code>i, (a, b)</code> פותח את שני המבנים בבת אחת.`,
    `<code>if kind:</code> מדלג על התאמות, כי <code>None</code> נחשב ערך שקרי. עבור כל אי-התאמה מדפיסים שורה ומגדילים את המונה המתאים.`,
    `בסוף מחשבים את יחס Ts/Tv. בנתוני אדם אמיתיים הוא בדרך כלל כ-2.0–2.1 בגנום כולו, וערך נמוך בהרבה הוא סימן אזהרה לשגיאות ריצוף. כאן היחס נמוך כי מדובר ברצפים קצרים לדוגמה, ולא בנתונים ביולוגיים.`,
  ],
})}

${demo({
  title: "מטריצת מרחקים אבולוציוניים (Jukes–Cantor)",
  intro: "בפילוגנטיקה בונים מטריצה של מרחקים בין כל זוג מינים, ומשם עץ. הדוגמה מחשבת מטריצה כזו עם תיקון Jukes–Cantor.",
  code: `
import math

species = {
    "human":   "ACGTTGCAAGTCCATGCATA",
    "chimp":   "ACGTTGCAAGTCCATGCGTA",
    "gorilla": "ACGTTGCATGTCCATACGTA",
    "mouse":   "ACCTTGGAAGTACCTGAGTC",
}

def p_distance(s, t):
    diffs = sum(a != b for a, b in zip(s, t))
    return diffs / len(s)

def jukes_cantor(p):
    if p == 0:
        return 0.0
    if p >= 0.75:
        return float("inf")
    return -0.75 * math.log(1 - 4 * p / 3)

names = list(species)
print(" " * 8 + "".join(f"{n:>9}" for n in names))
for a in names:
    row = [jukes_cantor(p_distance(species[a], species[b])) for b in names]
    print(f"{a:<8}" + "".join(f"{d:>9.3f}" for d in row))
`,
  steps: [
    `<code>p_distance</code> סופרת אי-התאמות בעזרת <code>sum(a != b for ...)</code> ומחלקת באורך. זהו מרחק המינג מנורמל.`,
    `<code>jukes_cantor</code> מיישמת את הנוסחה <code>-0.75 * log(1 - 4p/3)</code>. כש-<code>p</code> מגיע ל-0.75 הלוגריתם אינו מוגדר, ולכן מחזירים <code>float("inf")</code>, כלומר אות רווי. כש-<code>p</code> שווה 0 מחזירים <code>0.0</code> ישירות, כדי שהאלכסון לא יוצג כ-<code>-0.000</code>.`,
    `<code>list(species)</code> מחזיר את שמות המינים לפי סדר ההכנסה למילון, וכך סדר השורות זהה לסדר העמודות.`,
    `הלולאה החיצונית עוברת על השורות, ורשימת ההבנה הפנימית מחשבת את המרחק לכל עמודה. הסיבוכיות היא O(k²·L) עבור k מינים ברצפים באורך L.`,
    `העיצוב <code>{d:&gt;9.3f}</code> מיישר כל מספר לימין ברוחב 9 תווים, עם שלוש ספרות אחרי הנקודה, כך שהטבלה יוצאת מסודרת.`,
    `קראו את התוצאה: האדם והשימפנזה הכי קרובים, הגורילה מעט רחוקה יותר, והעכבר רחוק מכולם, בדיוק כמו בעץ האמיתי. מטריצה כזו היא הקלט לאלגוריתמים כמו UPGMA ו-Neighbor-Joining.`,
  ],
})}

<h2><span class="h-num">7</span>המשימה שלכם</h2>
<p>ממשו את <code>hamming_distance(seq1, seq2)</code>. הבדיקות הנסתרות בודקות שאתם <strong>זורקים <code>ValueError</code></strong> כשהאורכים שונים.</p>
`,

    problem: {
      statement: `
<p>בהינתן שתי מחרוזות DNA ‏<code>s</code> ו-<code>t</code> באורך שווה, <strong>מרחק המינג</strong> <code>d<sub>H</sub>(s, t)</code> הוא מספר העמדות שבהן הסמלים שלהן שונים.</p>
<p>ממשו את <code>hamming_distance(seq1, seq2)</code> כך שתחזיר את הספירה הזו כ-<code>int</code>.</p>
<p>אם לשני הרצפים יש <strong>אורכים שונים</strong>, המרחק אינו מוגדר: זרקו <code>ValueError</code>.</p>`,
      examples: [
        {
          input: 'seq1 = "GAGCCTACTAACGGGAT"\nseq2 = "CATCGTAATGACGGCCT"',
          output: "7",
          explanation: "אי-התאמות באינדקסים 0, 2, 4, 7, 9, 14, 15.",
        },
        { input: 'seq1 = "AAAA", seq2 = "AAAA"', output: "0" },
        { input: 'seq1 = "ACGT", seq2 = "ACG"', output: "ValueError", explanation: "האורכים 4 ו-3 שונים." },
      ],
      constraints: [
        "<code>0 ≤ len(seq1), len(seq2) ≤ 10<sup>5</sup></code>",
        "יש להחזיר <code>int</code>",
        "יש לזרוק <code>ValueError</code> אם <code>len(seq1) != len(seq2)</code>",
      ],
      hints: [
        "השוו קודם את האורכים, וזרקו <code>raise ValueError(\"...\")</code> אם הם שונים.",
        "<code>zip(seq1, seq2)</code> מחזיר זוגות של תווים מיושרים.",
        "ב-Python ‏<code>True + True == 2</code>, ולכן <code>sum()</code> על ערכים בוליאניים סופר אותם.",
      ],
    },

    starter: `def hamming_distance(seq1, seq2):
    """
    Count point mutations between two aligned sequences of equal length.
    Raise ValueError if the lengths differ.

    >>> hamming_distance("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT")
    7
    """
    # Write your code here
    pass
`,
    solution: `def hamming_distance(seq1, seq2):
    if len(seq1) != len(seq2):
        raise ValueError(
            f"Sequences must have equal length ({len(seq1)} != {len(seq2)})"
        )
    return sum(a != b for a, b in zip(seq1, seq2))
`,
    tests: [
      { args: ["GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"], expected: 7 },
      { args: ["AAAA", "AAAA"], expected: 0 },
      { args: ["ACGT", "TGCA"], expected: 4 },
      { args: ["ACGT", "ACG"], raises: "ValueError" },
      { args: ["", ""], expected: 0, hidden: true },
      { args: ["A", "G"], expected: 1, hidden: true },
      { args: ["GGACGGATTCTG", "AGGACGGATTCT"], expected: 9, hidden: true },
      { args: ["AC", "ACGT"], raises: "ValueError", hidden: true },
      { args: ["A".repeat(10000), "A".repeat(9999) + "T"], expected: 1, hidden: true },
    ],
  };

  /* ─────────────────────────────── Module 4 ─────────────────────────────── */
  const m4 = {
    id: "m4",
    number: 4,
    title: "חיפוש מוטיבים",
    short: "חיפוש מוטיבים",
    level: "medium",
    difficulty: "בינוני",
    minutes: 40,
    topics: ["אתרי קישור", "חלון נע", "חיפוש במחרוזות"],
    fnName: "find_motif",

    lesson: `
<p class="eyebrow">מודול 4 · ביולוגיה × מדעי המחשב</p>
<h1>חיפוש מוטיבים</h1>
<p class="lede">בתוך הגנום מסתתרות "מילים" קצרות, באורך 6 עד 20 אותיות, שחלבונים מזהים ונקשרים אליהן. מציאת כל המופעים של מילה כזו היא הצעד הראשון במיפוי האופן שבו גנים מופעלים ומכובים, והיא גם בעיה קלאסית במדעי המחשב.</p>

<div class="objectives">
  <div class="objectives-title">מה תלמדו</div>
  <ul>
    <li>מהם גורמי שעתוק ואיך הם מוצאים את אתרי הקישור שלהם</li>
    <li>רצפי קונצנזוס, ניוון (degeneracy) ומטריצות משקל-עמדה</li>
    <li>אלגוריתם החלון הנע והמחיר שלו, O(n·m)</li>
    <li>למה כלים מובנים מפספסים התאמות <em>חופפות</em>, ואילו אלגוריתמים מהירים יותר קיימים (KMP, ‏Boyer–Moore)</li>
  </ul>
</div>

<h2><span class="h-num">1</span>גורמי שעתוק ואתרי קישור</h2>
<p>כמעט לכל תא בגופכם יש אותו גנום, ובכל זאת תא עצב ותא כבד מייצרים חלבונים שונים מאוד. אחת הסיבות העיקריות לכך היא <strong>גורמי שעתוק</strong> (transcription factors, ‏TFs). החלבונים האלה נקשרים לרצפי DNA קצרים ליד גנים, שנקראים <strong>אתרי קישור לגורמי שעתוק</strong> (TFBS), ועוזרים לגייס את RNA פולימראז או לחסום אותו.</p>
<p>דפוס קצר וחוזר בעל תפקיד ביולוגי נקרא <strong>מוטיב</strong>. כמה מוטיבים מפורסמים:</p>
<table class="table">
  <thead><tr><th>מוטיב</th><th>קונצנזוס</th><th>תפקיד</th></tr></thead>
  <tbody>
    <tr><td>TATA box</td><td>${nt("TATAAA")}</td><td>רכיב בפרומוטור הליבה, כ-25–35 bp במעלה הזרם של גנים איקריוטיים רבים. נקשר על ידי TATA-binding protein ‏(TBP).</td></tr>
    <tr><td>E-box</td><td>${nt("CACGTG")}</td><td>נקשר על ידי גורמי bHLH כמו MYC ו-CLOCK. שולט בשגשוג תאים ובשעון הצירקדי.</td></tr>
    <tr><td>אתר EcoRI</td><td>${nt("GAATTC")}</td><td>נחתך על ידי אנזים ההגבלה EcoRI. זהו <em>פלינדרום</em>: הוא זהה להשלמה ההפוכה של עצמו.</td></tr>
    <tr><td>Shine–Dalgarno</td><td>${nt("AGGAGG")}</td><td>אתר קישור הריבוזום בחיידקים, ממש לפני קודון ההתחלה.</td></tr>
  </tbody>
</table>

<div class="callout callout-bio">
  <div class="callout-title">מוטיבים הם מטושטשים</div>
  <p>אתרי קישור אמיתיים סובלים שונות, כך שגורם שעתוק עשוי להיקשר ל-<code>TATAAA</code>, ל-<code>TATATA</code> וגם ל-<code>TATAAT</code>. ביולוגים מתארים זאת בעזרת <strong>קודי IUPAC</strong> (<code>W</code> = ‏A או T, כלומר <code>TATAWA</code>) או בעזרת <strong>מטריצת משקל-עמדה (PWM)</strong>, שנותנת ציון לכל בסיס בכל עמדה. כלים כמו MEME ו-HOMER <em>מגלים</em> מוטיבים; כלים כמו FIMO <em>סורקים</em> גנומים בחיפוש אחריהם. כולם נשענים על החיפוש המדויק שאתם עומדים לכתוב.</p>
</div>

<h3>למה מופעים חופפים חשובים</h3>
<p>DNA חזרתי כמו <code>ATATATAT</code> מכיל את <code>ATAT</code> בעמדות 0, 2 ו-4. ההתאמות האלה <em>חופפות</em>, וכל אחת מהן היא מקום נפרד שבו חלבון יכול להיקשר. כלי טוב לחיפוש מוטיבים חייב לדווח על כולן.</p>

<h2><span class="h-num">2</span>אלגוריתם החלון הנע</h2>
<p>מציבים חלון בגודל המוטיב (<em>m</em>) בתחילת ה-DNA (שאורכו <em>n</em>). משווים את החלון למוטיב תו אחר תו, ואז מזיזים את החלון עמדה אחת קדימה. עוצרים כשהחלון היה גולש מעבר לסוף, כך שבסך הכול יש <strong>n − m + 1</strong> חלונות.</p>
${py(`
def naive_search(text, pattern):
    n, m = len(text), len(pattern)
    hits = []
    for i in range(n - m + 1):          # every possible start position
        j = 0
        while j < m and text[i + j] == pattern[j]:
            j += 1                       # extend the match
        if j == m:                       # all m characters matched
            hits.append(i)
    return hits
`)}

<h2><span class="h-num">3</span>מעבדה חזותית: החלון הנע</h2>
<p>צפו בכל השוואה. ירוק פירושו שהתווים תואמים; אדום פירושו אי-התאמה, שאחריה החלון קופץ קדימה. המונים מראים כמה עבודה האלגוריתם הנאיבי עושה. נסו רצף ומוטיב חזרתיים כמו <code>AAAAAAAA</code> ו-<code>AAAT</code> כדי לראות את המקרה הגרוע.</p>
<div data-viz="motif"></div>

<h2><span class="h-num">4</span>מימוש ב-Python</h2>
${py(`
dna, motif = "GATATATGCATATACTT", "ATAT"
m = len(motif)

# Slicing compares a whole window at once (still O(m) inside)
hits = [i for i in range(len(dna) - m + 1) if dna[i:i + m] == motif]
print(hits)       # [1, 3, 9]

# str.find with a moving start - jumps between matches using fast C code
hits, i = [], dna.find(motif)
while i != -1:
    hits.append(i)
    i = dna.find(motif, i + 1)   # +1, not +m, to allow overlaps!
`)}

<div class="callout callout-warn">
  <div class="callout-title">כלים מובנים שמדלגים בשקט על חפיפות</div>
  ${py(`
"ATATAT".count("ATA")                  # 1  - non-overlapping!
import re
[m.start() for m in re.finditer("ATA", "ATATAT")]        # [0]
[m.start() for m in re.finditer("(?=ATA)", "ATATAT")]    # [0, 2]  lookahead fixes it
`)}
</div>

<h3>סיבוכיות ואלגוריתמים טובים יותר</h3>
<p>החיפוש הנאיבי מבצע עד <em>m</em> השוואות לכל אחד מ-<em>n − m + 1</em> החלונות, ולכן המקרה הגרוע הוא <strong>O(n·m)</strong>. עבור מוטיב באורך 20 מול גנום של 3 מיליארד בסיסים זה בסדר ב-C, אבל איטי ב-Python טהור. אלגוריתמים קלאסיים מהירים יותר:</p>
<table class="table">
  <thead><tr><th>אלגוריתם</th><th>רעיון</th><th>זמן</th></tr></thead>
  <tbody>
    <tr><td>נאיבי / חלון נע</td><td>לנסות כל יישור אפשרי</td><td dir="ltr">O(n·m)</td></tr>
    <tr><td>Knuth–Morris–Pratt</td><td>לחשב מראש טבלת כישלון, כך שאף תו בטקסט לא נקרא פעמיים</td><td dir="ltr">O(n + m)</td></tr>
    <tr><td>Boyer–Moore</td><td>להשוות מהסוף להתחלה ולדלג קדימה בעזרת כללי "התו הרע" ו"הסיפא הטובה"</td><td>תת-לינארי בממוצע</td></tr>
    <tr><td>Rabin–Karp</td><td>גיבוב מתגלגל (rolling hash) לכל חלון; מאמתים רק כשיש התאמת גיבוב</td><td>O(n + m) בתוחלת</td></tr>
    <tr><td>Suffix array / FM-index</td><td>בונים אינדקס לגנום פעם אחת, ואז עונים מהר על כל שאילתה (כך BWA ו-Bowtie ממפים קריאות)</td><td>O(m) לשאילתה</td></tr>
  </tbody>
</table>

<div class="complexity">
  <div><span class="cx-label">זמן</span><span class="cx-val" dir="ltr">O(n·m)</span><span class="cx-note">המקרה הגרוע של האלגוריתם הנאיבי; בערך O(n) על DNA טיפוסי</span></div>
  <div><span class="cx-label">זיכרון</span><span class="cx-val" dir="ltr">O(k)</span><span class="cx-note">k הוא מספר ההתאמות המוחזרות</span></div>
</div>

<div class="callout callout-tip">
  <div class="callout-title">קואורדינטות מבוססות 0 לעומת מבוססות 1</div>
  <p>Python מתחילה לספור מ-0. פורמטים ביולוגיים רבים סופרים מ-1 (GFF, ‏VCF, ‏SAM, וגם התשובות ב-Rosalind). קובצי BED מבוססי 0 וחצי-פתוחים, כמו חיתוכים ב-Python. באגים של "אחד יותר מדי" בקואורדינטות הם כנראה הבאג הנפוץ ביותר בגנומיקה, ולכן תמיד בדקו באיזו מוסכמה קובץ משתמש. במודול הזה, החזירו אינדקסים <strong>מבוססי 0</strong>.</p>
</div>

<h2><span class="h-num">5</span>דוגמאות קוד</h2>
${examplesIntro}

${demo({
  title: "חיפוש אתרי הגבלה בפלסמיד",
  intro: "לפני שמשבטים גן לתוך פלסמיד, בודקים היכן אנזימי הגבלה יחתכו אותו. הדוגמה מוצאת את כל אתרי החיתוך של שלושה אנזימים נפוצים, ובודקת שהאתרים פלינדרומיים.",
  code: `
def reverse_complement(seq):
    return seq.translate(str.maketrans("ACGT", "TGCA"))[::-1]

def is_palindrome(site):
    return site == reverse_complement(site)

ENZYMES = {"EcoRI": "GAATTC", "BamHI": "GGATCC", "HindIII": "AAGCTT"}
plasmid = "TTGAATTCGGATCCAAGCTTGCGAATTCAT"

for enzyme, site in ENZYMES.items():
    hits = []
    start = plasmid.find(site)
    while start != -1:
        hits.append(start)
        start = plasmid.find(site, start + 1)
    print(f"{enzyme:<8} {site}  palindrome={is_palindrome(site)}  positions={hits}")
`,
  steps: [
    `<code>reverse_complement</code> משתמשת בטבלת התרגום ממודול 1 ואז הופכת את סדר התווים.`,
    `<code>is_palindrome</code> בודקת אם אתר זהה להשלמה ההפוכה של עצמו. רוב אנזימי ההגבלה מסוג II מזהים אתרים פלינדרומיים, ולכן מספיק לחפש בגדיל אחד: ההתאמה בגדיל השני נמצאת בדיוק באותה עמדה.`,
    `<code>plasmid.find(site)</code> מחזיר את האינדקס של המופע הראשון, או <code>-1</code> אם אין כזה.`,
    `בלולאת ה-<code>while</code> ממשיכים לחפש מ-<code>start + 1</code>, ולא מ-<code>start + len(site)</code>, כדי לא לפספס מופעים חופפים.`,
    `<code>str.find</code> ממומש ב-C, ולכן הקפיצה בין התאמות מהירה הרבה יותר מבדיקה של כל חלון בלולאת Python.`,
  ],
})}

${demo({
  title: "מוטיבים מנוונים עם קודי IUPAC וביטויים רגולריים",
  intro: "גורמי שעתוק נקשרים למשפחה של רצפים דומים, ולא לרצף מדויק אחד. קודי IUPAC מאפשרים לתאר מוטיב מנוון, ו<em>ביטוי רגולרי</em> מאפשר לחפש אותו.",
  code: `
import re

IUPAC = {
    "A": "A", "C": "C", "G": "G", "T": "T",
    "W": "[AT]", "S": "[CG]", "R": "[AG]", "Y": "[CT]", "N": "[ACGT]",
}

def motif_to_regex(motif):
    return "".join(IUPAC[ch] for ch in motif)

promoter = "GCTATAAAAGGCTATATAAAGCCTATAAATG"
motif = "TATAWA"
pattern = motif_to_regex(motif)
print("regex:", pattern)

for m in re.finditer(f"(?=({pattern}))", promoter):
    print(f"index {m.start():>2}: {m.group(1)}")
`,
  steps: [
    `המילון <code>IUPAC</code> ממפה כל קוד למחלקת תווים של ביטוי רגולרי: <code>W</code> (מלשון weak, קשר חלש) הופך ל-<code>[AT]</code>, ו-<code>N</code> לכל אחד מארבעת הבסיסים.`,
    `<code>motif_to_regex("TATAWA")</code> מחליפה כל תו במוטיב ומחברת את התוצאות, כך שמתקבל הביטוי <code>TATA[AT]A</code>.`,
    `המבנה <code>(?=(...))</code> הוא <em>lookahead</em>: הוא בודק התאמה בלי "לצרוך" תווים, ולכן מנוע הביטויים מתקדם תו אחד בכל פעם ומוצא גם מופעים חופפים.`,
    `הקבוצה הפנימית <code>(...)</code> לוכדת את הרצף שהתאים בפועל, ו-<code>m.group(1)</code> מחזיר אותו. <code>m.start()</code> נותן את אינדקס ההתחלה.`,
    `שימו לב לפלט: מופיעים בו גם <code>TATAAA</code> וגם <code>TATATA</code>, שני רצפים שונים שמתאימים לאותו מוטיב מנוון. ההתאמות בעמדות 12 ו-14 חופפות, ושתיהן נמצאו.`,
  ],
})}

${demo({
  title: "המילים השכיחות ביותר (k-mers)",
  intro: "כשלא יודעים מראש מהו המוטיב, מתחילים בספירת כל המילים באורך k ‏(k-mers) ומחפשים את אלה שחוזרות באופן חשוד. זהו הרעיון שמאחורי כלים לגילוי מוטיבים.",
  code: `
from collections import Counter

def kmer_counts(seq, k):
    return Counter(seq[i:i + k] for i in range(len(seq) - k + 1))

dna = "ACGTTGCATGTCGCATGATGCATGAGAGCT"
counts = kmer_counts(dna, 4)

print("distinct 4-mers:", len(counts))
for kmer, n in counts.most_common(3):
    print(kmer, n)
`,
  steps: [
    `<code>range(len(seq) - k + 1)</code> מייצר את כל עמדות ההתחלה האפשריות, אותו מספר חלונות כמו באלגוריתם החלון הנע.`,
    `<code>seq[i:i + k]</code> חותך כל חלון, והגנרטור מעביר את החלונות ישר אל <code>Counter</code>, בלי לבנות רשימת ביניים.`,
    `<code>len(counts)</code> הוא מספר ה-k-mers <em>השונים</em> שנמצאו, ו-<code>counts.most_common(3)</code> מחזיר את שלושת השכיחים ביותר כזוגות <code>(kmer, count)</code>, ממוינים מהשכיח ביותר.`,
    `הסיבוכיות היא O(n·k): יש n חלונות, ובכל אחד מתבצעים חיתוך וגיבוב של מחרוזת באורך k.`,
    `באזור ה-ori של חיידקים, k-mers שחוזרים פעמים רבות בחלון קצר הם לרוב אתרי קישור של החלבון DnaA, שמתחיל את השכפול.`,
  ],
})}

<h2><span class="h-num">6</span>המשימה שלכם</h2>
<p>ממשו את <code>find_motif(dna, motif)</code> כך שתחזיר <strong>כל</strong> אינדקס התחלה, כולל חפיפות. הבדיקות הנסתרות מכסות מוטיב ריק, מוטיב ארוך מה-DNA ומקרה גרוע באורך 1,000 בסיסים.</p>
`,

    problem: {
      statement: `
<p>בהינתן מחרוזת DNA ‏<code>dna</code> ומחרוזת קצרה יותר <code>motif</code>, מצאו את <strong>כל</strong> המיקומים שבהם <code>motif</code> מופיעה כתת-מחרוזת של <code>dna</code>.</p>
<p>ממשו את <code>find_motif(dna, motif)</code> כך שתחזיר <code>list</code> של אינדקסי ההתחלה, <strong>מבוססי 0</strong>, בסדר עולה. יש לדווח על כל המופעים, כולל מופעים <strong>חופפים</strong>.</p>
<ul class="tight">
  <li>אם <code>motif</code> לא מופיעה, או ארוכה מ-<code>dna</code>, החזירו <code>[]</code>.</li>
  <li>אם <code>motif</code> היא מחרוזת ריקה, החזירו <code>[]</code>.</li>
</ul>`,
      examples: [
        { input: 'dna = "GATATATGCATATACTT"\nmotif = "ATAT"', output: "[1, 3, 9]", explanation: "המופעים בעמדות 1 ו-3 חופפים (ATATAT), ושניהם נספרים." },
        { input: 'dna = "AAAA", motif = "AA"', output: "[0, 1, 2]" },
        { input: 'dna = "ACGT", motif = "TTT"', output: "[]" },
      ],
      constraints: [
        "<code>0 ≤ len(motif)</code>, <code>0 ≤ len(dna) ≤ 10<sup>4</sup></code>",
        "יש להחזיר <code>list</code> של <code>int</code> בסדר עולה",
        "האינדקסים מבוססי 0 (בבעיית SUBS של Rosalind הם מבוססי 1, ולכן שם מוסיפים 1)",
      ],
      hints: [
        "יש <code>len(dna) - len(motif) + 1</code> חלונות אפשריים.",
        "<code>dna[i:i + m] == motif</code> בודק חלון אחד.",
        "טפלו במוטיב ריק לפני הלולאה הראשית.",
        "<em>אל</em> תשתמשו ב-<code>str.count</code> או ב-<code>re.finditer</code> רגיל: הם מדלגים על חפיפות.",
      ],
    },

    starter: `def find_motif(dna, motif):
    """
    Return all 0-based start indices where motif occurs in dna
    (overlapping occurrences included).

    >>> find_motif("GATATATGCATATACTT", "ATAT")
    [1, 3, 9]
    """
    # Write your code here
    pass
`,
    solution: `def find_motif(dna, motif):
    m = len(motif)
    if m == 0:
        return []
    # Slide a window of width m across dna; record every exact match.
    return [i for i in range(len(dna) - m + 1) if dna[i:i + m] == motif]
`,
    tests: [
      { args: ["GATATATGCATATACTT", "ATAT"], expected: [1, 3, 9] },
      { args: ["AAAA", "AA"], expected: [0, 1, 2] },
      { args: ["ACGT", "TTT"], expected: [] },
      { args: ["ACGT", "ACGT"], expected: [0], hidden: true },
      { args: ["AC", "ACGT"], expected: [], hidden: true },
      { args: ["ACGTACGT", ""], expected: [], hidden: true },
      { args: ["GAATTCGAATTC", "GAATTC"], expected: [0, 6], hidden: true },
      { args: ["TATAAAGGTATAAA", "TATAAA"], expected: [0, 8], hidden: true },
      { args: ["A".repeat(1000), "AAA"], expected: Array.from({ length: 998 }, (_, i) => i), hidden: true },
    ],
  };

  CBB.MODULES = [m1, m2, m3, m4];
  // Shared authoring helpers for additional curriculum files (curriculum-advanced.js)
  CBB.lessonKit = { esc, py, nt, demo, examplesIntro };
  CBB.getModule = (id) => CBB.MODULES.find((m) => m.id === id) || null;
})();
