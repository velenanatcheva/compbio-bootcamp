/* ==========================================================================
   Curriculum — every module is pure data: lesson HTML, problem statement,
   starter code, reference solution and test cases.
   Lesson HTML may contain:
     <div data-viz="name"></div>   → mounted by CBB.Visuals[name]
     <pre class="code">…</pre>      → syntax-highlighted with CodeMirror.runMode
   Test case shape:
     { args: [...], expected: any, tol?: number, hidden?: bool }
     { args: [...], raises: "ValueError", hidden?: bool }
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const py = (src) => `<pre class="code" data-lang="python">${esc(src.replace(/^\n+|\s+$/g, ""))}</pre>`;
  const out = (src) => `<pre class="code code-out">${esc(src.replace(/^\n+|\s+$/g, ""))}</pre>`;
  const nt = (seq) =>
    `<span class="seq-inline">${seq
      .split("")
      .map((b) => `<span class="nt-i nt-${b.toLowerCase()}">${b}</span>`)
      .join("")}</span>`;

  /* ─────────────────────────────── Module 1 ─────────────────────────────── */
  const m1 = {
    id: "m1",
    number: 1,
    title: "The Central Dogma & Strings",
    short: "Central Dogma & Strings",
    difficulty: "Easy",
    minutes: 25,
    topics: ["Transcription", "Python strings", "str.replace"],
    fnName: "transcribe",

    lesson: `
<p class="eyebrow">Module 1 · Biology × Computer Science</p>
<h1>The Central Dogma &amp; Strings</h1>
<p class="lede">Every cell in your body carries the same ~3.1 billion-letter instruction manual. In this module you will learn how that manual is <em>read</em>, and why, to a computer, a genome is just a very long string.</p>

<div class="objectives">
  <div class="objectives-title">You will learn</div>
  <ul>
    <li>What DNA and RNA are made of, and how bases pair</li>
    <li>How transcription copies a gene from DNA into messenger RNA</li>
    <li>How Python represents sequences as immutable strings</li>
    <li>Four ways to transform a string, and what each one costs</li>
  </ul>
</div>

<h2><span class="h-num">1</span>The Central Dogma of molecular biology</h2>
<p>In 1958 Francis Crick described how sequence information moves inside a cell. Information flows from <strong>DNA</strong> to <strong>RNA</strong> to <strong>protein</strong>. The reverse step, from protein back to nucleic acid, never happens.</p>

<div class="dogma">
  <div class="dogma-node dogma-dna"><span class="dogma-icon">🧬</span>DNA<small>storage</small></div>
  <div class="dogma-arrow"><span>transcription</span></div>
  <div class="dogma-node dogma-rna"><span class="dogma-icon">〰️</span>RNA<small>message</small></div>
  <div class="dogma-arrow"><span>translation</span></div>
  <div class="dogma-node dogma-protein"><span class="dogma-icon">⬢</span>Protein<small>machine</small></div>
</div>
<p class="caption">DNA also copies itself (<em>replication</em>). Retroviruses such as HIV can go from RNA back to DNA (<em>reverse transcription</em>).</p>

<ul class="tight">
  <li><strong>Replication</strong> (DNA → DNA): copying the whole genome before a cell divides.</li>
  <li><strong>Transcription</strong> (DNA → RNA): copying one gene into a short-lived messenger, the <em>mRNA</em>.</li>
  <li><strong>Translation</strong> (RNA → protein): the ribosome reads the mRNA three letters (one <em>codon</em>) at a time and builds a chain of amino acids.</li>
</ul>

<h2><span class="h-num">2</span>Nucleotides: the alphabet of life</h2>
<p>A nucleotide has three parts: a phosphate group, a five-carbon sugar (deoxyribose in DNA, ribose in RNA) and a nitrogenous <strong>base</strong>. Only the base changes from one nucleotide to the next, so we can write any nucleic acid as a string over a tiny alphabet.</p>

<table class="table">
  <thead><tr><th>Base</th><th>Symbol</th><th>Class</th><th>Pairs with</th><th>H-bonds</th><th>Found in</th></tr></thead>
  <tbody>
    <tr><td>Adenine</td><td>${nt("A")}</td><td>Purine (two rings)</td><td>T (DNA) / U (RNA)</td><td>2</td><td>DNA, RNA</td></tr>
    <tr><td>Guanine</td><td>${nt("G")}</td><td>Purine</td><td>C</td><td>3</td><td>DNA, RNA</td></tr>
    <tr><td>Cytosine</td><td>${nt("C")}</td><td>Pyrimidine (one ring)</td><td>G</td><td>3</td><td>DNA, RNA</td></tr>
    <tr><td>Thymine</td><td>${nt("T")}</td><td>Pyrimidine</td><td>A</td><td>2</td><td>DNA only</td></tr>
    <tr><td>Uracil</td><td>${nt("U")}</td><td>Pyrimidine</td><td>A</td><td>2</td><td>RNA only</td></tr>
  </tbody>
</table>

<div class="callout callout-bio">
  <div class="callout-title">Why does RNA use U instead of T?</div>
  <p>Cytosine slowly loses an amino group and turns into uracil. If DNA normally contained U, repair enzymes could not tell a damaged C from a real U. Using T (a methylated U) in DNA marks every U as damage. RNA is short-lived and disposable, so it can use the cheaper uracil.</p>
</div>

<h3>Strands, direction and complementarity</h3>
<p>DNA is a <strong>double helix</strong> of two strands. They are:</p>
<ul class="tight">
  <li><strong>Complementary</strong>: A always faces T and G always faces C. If you know one strand, you know the other.</li>
  <li><strong>Antiparallel</strong>: each strand has a direction, written 5′→3′ after the sugar carbons. The two strands run in opposite directions.</li>
</ul>
<p>During transcription, RNA polymerase reads the <strong>template strand</strong> from 3′ to 5′ and builds RNA from 5′ to 3′, pairing each template base with its complement. The new RNA is therefore complementary to the template, which makes it <em>identical</em> to the other strand, the <strong>coding strand</strong>, except that every T becomes a U.</p>

<div class="formula">
  <div><span class="f-label">coding  5′</span>${nt("ATGGCCATTG")}<span class="f-label">3′</span></div>
  <div><span class="f-label">template 3′</span>${nt("TACCGGTAAC")}<span class="f-label">5′</span></div>
  <div class="f-arrow">↓ RNA polymerase</div>
  <div><span class="f-label">mRNA  5′</span>${nt("AUGGCCAUUG")}<span class="f-label">3′</span></div>
</div>

<div class="callout callout-cs">
  <div class="callout-title">The computational insight</div>
  <p>Given the coding strand, the whole molecular process reduces to one string operation: <strong>replace every <code>T</code> with <code>U</code></strong>. Bioinformatics often works like this. Once you understand the biology, a complicated process becomes a simple, exact transformation on strings.</p>
</div>

<h2><span class="h-num">3</span>Visual Lab: watch transcription happen</h2>
<p>Type any coding-strand sequence and press <strong>Transcribe</strong>. Watch the polymerase open a <em>transcription bubble</em>. The double helix re-zips behind it, and the mRNA grows one base at a time.</p>
<div data-viz="transcription"></div>

<h2><span class="h-num">4</span>Strings in Python</h2>
<p>A Python <code>str</code> is an <strong>immutable sequence</strong> of characters. That makes it a good fit for DNA: you can index it, slice it, loop over it and measure it with the same tools you use for lists.</p>
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

<h3>Immutability: why <code>dna[0] = "U"</code> fails</h3>
<p>You cannot change a string in place. Every "modification" builds a <em>new</em> string:</p>
${py(`
dna = "GATTACA"
dna[2] = "U"          # TypeError: 'str' object does not support item assignment
rna = dna.replace("T", "U")   # OK - returns a brand-new string
print(dna, rna)               # GATTACA GAUUACA
`)}

<h3>Four ways to transcribe</h3>
<p>All four are correct. They differ in clarity and speed:</p>
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
  <div><span class="cx-label">Time</span><span class="cx-val">O(n)</span><span class="cx-note">each base is examined once</span></div>
  <div><span class="cx-label">Space</span><span class="cx-val">O(n)</span><span class="cx-note">a new string of equal length is produced</span></div>
</div>

<div class="callout callout-tip">
  <div class="callout-title">Pro tip: <code>str.translate</code> is the workhorse</div>
  <p>Next you will need the <em>reverse complement</em> of a strand (A↔T, C↔G, then reverse). One translation table handles all four swaps in a single C-speed pass: <code>dna.translate(str.maketrans("ACGT", "TGCA"))[::-1]</code>.</p>
</div>

<div class="callout callout-warn">
  <div class="callout-title">Real-world pitfalls</div>
  <ul class="tight">
    <li><strong>Case</strong>: some files write sequence in lowercase (<em>soft-masking</em>, used to mark repeats). <code>"t" != "T"</code>.</li>
    <li><strong>Whitespace</strong>: FASTA files wrap sequences at 60–80 characters. Strip the newlines before you analyse anything.</li>
    <li><strong>Ambiguity codes</strong>: <code>N</code> means "any base". Your code should pass it through unchanged rather than crash.</li>
  </ul>
</div>

<h2><span class="h-num">5</span>Your task</h2>
<p>Open the <strong>Problem</strong> tab and implement <code>transcribe(dna_string)</code>. Use <strong>Run</strong> to check the visible examples, then <strong>Submit</strong> to check the hidden edge cases as well.</p>
<p class="muted small">In research code you would usually call <code>Bio.Seq.Seq(dna).transcribe()</code> from Biopython. Under the hood it does exactly what you are about to write.</p>
`,

    problem: {
      statement: `
<p>An RNA string is a string over the alphabet <code>{A, C, G, U}</code>. Given a DNA string <code>t</code> that is the <strong>coding strand</strong> of a gene, its transcribed RNA <code>u</code> is formed by replacing every occurrence of <code>"T"</code> in <code>t</code> with <code>"U"</code>.</p>
<p>Implement <code>transcribe(dna_string)</code> so it returns the RNA transcript as a string.</p>`,
      examples: [
        { input: 'dna_string = "GATGGAACTTGACTACGTAAATT"', output: '"GAUGGAACUUGACUACGUAAAUU"', explanation: "Every T becomes U; A, C and G are unchanged." },
        { input: 'dna_string = "TTTT"', output: '"UUUU"' },
      ],
      constraints: [
        "<code>0 ≤ len(dna_string) ≤ 10<sup>5</sup></code>",
        "<code>dna_string</code> contains only uppercase <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code>",
        "Return a <code>str</code>, not a list",
      ],
      hints: [
        "Python strings are immutable, so you will return a <em>new</em> string.",
        "Have a look at the built-in <code>str.replace(old, new)</code> method.",
        "Edge case: what should an empty string transcribe to?",
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
    title: "Sequence Analysis & GC Content",
    short: "GC Content",
    difficulty: "Easy",
    minutes: 30,
    topics: ["DNA stability", "Melting temperature", "Loops & counting"],
    fnName: "gc_content",

    lesson: `
<p class="eyebrow">Module 2 · Biology × Computer Science</p>
<h1>Sequence Analysis &amp; GC Content</h1>
<p class="lede">The proportion of G and C in a stretch of DNA is one of the simplest numbers in genomics, and one of the most useful. It predicts how strongly two strands hold together, it helps decide whether a PCR works, and it differs between species and even between regions of the same genome.</p>

<div class="objectives">
  <div class="objectives-title">You will learn</div>
  <ul>
    <li>Why GC-rich DNA is more thermally stable</li>
    <li>What melting temperature (T<sub>m</sub>) is and how to estimate it</li>
    <li>The accumulator pattern: loops, counters and <code>Counter</code></li>
    <li>How to handle edge cases defensively (empty input, mixed case)</li>
  </ul>
</div>

<h2><span class="h-num">1</span>What holds the double helix together?</h2>
<p>Two kinds of non-covalent force keep the two DNA strands together:</p>
<ul class="tight">
  <li><strong>Hydrogen bonds</strong> between paired bases: <span class="pill pill-at">A=T has 2</span> and <span class="pill pill-gc">G≡C has 3</span>.</li>
  <li><strong>Base stacking</strong>: the flat aromatic bases stack like coins and attract their neighbours above and below. Stacking actually contributes <em>more</em> stability than hydrogen bonding, and stacks that contain G·C are among the strongest.</li>
</ul>
<p>Both effects point the same way: <strong>the more G and C, the more energy it takes to pull the strands apart.</strong></p>

<div class="bond-demo">
  <div class="bond-pair">
    <span class="nt nt-a">A</span><span class="hb hb-2"><i></i><i></i></span><span class="nt nt-t">T</span>
    <span class="bond-cap">2 hydrogen bonds</span>
  </div>
  <div class="bond-pair">
    <span class="nt nt-g">G</span><span class="hb hb-3"><i></i><i></i><i></i></span><span class="nt nt-c">C</span>
    <span class="bond-cap">3 hydrogen bonds</span>
  </div>
</div>

<h2><span class="h-num">2</span>Melting temperature (T<sub>m</sub>)</h2>
<p>Heat double-stranded DNA and the strands eventually separate (<em>denature</em>, or "melt"). The <strong>melting temperature</strong> is the temperature at which half of the molecules are single-stranded. Two classic approximations:</p>

<div class="formula-card">
  <div class="fc-row"><span class="fc-name">Wallace rule</span><span class="fc-when">short oligos, &lt; 14 nt</span></div>
  <div class="fc-eq">T<sub>m</sub> = 2·(A + T) + 4·(G + C) &nbsp;°C</div>
  <div class="fc-row"><span class="fc-name">GC-content formula</span><span class="fc-when">longer sequences</span></div>
  <div class="fc-eq">T<sub>m</sub> = 64.9 + 41 · (G + C − 16.4) / N &nbsp;°C</div>
</div>
<p class="muted small">Professional tools (Primer3, for example) use <em>nearest-neighbour thermodynamics</em>, which add up the stacking energy of every adjacent pair of bases and correct for salt concentration. The formulas above are good first estimates.</p>

<h3>Why biologists care</h3>
<table class="table">
  <thead><tr><th>Context</th><th>Why GC content matters</th></tr></thead>
  <tbody>
    <tr><td><strong>PCR primer design</strong></td><td>Primers are designed for 40–60% GC and a T<sub>m</sub> around 52–65 °C, and the two primers of a pair should have similar T<sub>m</sub>. Too AT-rich and they fall off; too GC-rich and they bind to the wrong places.</td></tr>
    <tr><td><strong>Genome biology</strong></td><td>GC content varies a lot between species: <em>Plasmodium falciparum</em> (malaria) ≈ 19%, human ≈ 41%, <em>Streptomyces coelicolor</em> ≈ 72%. It can be used as a "fingerprint" to spot horizontally transferred genes.</td></tr>
    <tr><td><strong>Gene regulation</strong></td><td><em>CpG islands</em> are GC-rich stretches near the promoters of many human genes. Whether they are methylated helps switch those genes on or off.</td></tr>
    <tr><td><strong>Sequencing QC</strong></td><td>Illumina reads with extreme GC are under-represented (GC bias). Tools like FastQC plot per-read GC% to catch contamination.</td></tr>
  </tbody>
</table>

<h2><span class="h-num">3</span>Visual Lab: GC content and DNA melting</h2>
<p>Edit the sequence or generate a random one with a chosen GC bias. Then <strong>raise the temperature</strong>. In this simplified model each base pair melts once the temperature passes a local threshold set by the GC content of its neighbourhood. AT-rich regions open first, the same "breathing" seen in real DNA.</p>
<div data-viz="gc"></div>

<h2><span class="h-num">4</span>Loops, counting and the accumulator pattern</h2>
<p>Most sequence statistics follow one pattern: <strong>start a counter, walk the sequence once, update the counter, then combine the result.</strong></p>
${py(`
dna = "AGCTATAG"

gc = 0                      # 1. initialise an accumulator
for base in dna:            # 2. visit every element once
    if base == "G" or base == "C":
        gc += 1             # 3. update the accumulator
percent = gc / len(dna) * 100   # 4. combine -> 37.5
`)}

<h3>More Pythonic alternatives</h3>
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
  <div class="callout-title">Division in Python 3</div>
  <p><code>/</code> is <em>true division</em> and always returns a <code>float</code>: <code>3 / 8 == 0.375</code>. <code>//</code> is floor division: <code>3 // 8 == 0</code>. Many Python 2-era bioinformatics scripts silently reported a GC content of 0 because of this.</p>
</div>

<h3>Defensive programming: think about the edges</h3>
<p>Before you write the main logic, list the inputs that could break it:</p>
<ul class="tight">
  <li><strong>Empty sequence</strong>: <code>len(dna) == 0</code> leads to <code>ZeroDivisionError</code>. Decide on a sensible answer (here: <code>0.0</code>).</li>
  <li><strong>Lowercase</strong>: <code>"gc"</code> is still G and C. Normalise first with <code>dna.upper()</code>.</li>
  <li><strong>Floating point</strong>: <code>1/3*100</code> is <code>33.33333333333333</code>. Tests compare with a tolerance, so do not round inside the function. Round only when you display a value.</li>
</ul>

<h3>Parsing FASTA, the lingua franca of sequence files</h3>
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
  <div><span class="cx-label">Time</span><span class="cx-val">O(n)</span><span class="cx-note">one pass (or two quick passes with str.count)</span></div>
  <div><span class="cx-label">Space</span><span class="cx-val">O(1)</span><span class="cx-note">a fixed number of counters, whatever the input size</span></div>
</div>

<h2><span class="h-num">5</span>Your task</h2>
<p>Implement <code>gc_content(dna)</code>. The <strong>hidden tests</strong> include an empty string and mixed-case input, so handle the edge cases above.</p>
`,

    problem: {
      statement: `
<p>The <strong>GC content</strong> of a DNA string is the percentage of its symbols that are <code>"C"</code> or <code>"G"</code>. For example, <code>"AGCTATAG"</code> contains 3 G/C out of 8 bases, so its GC content is <code>37.5</code>.</p>
<p>Implement <code>gc_content(dna)</code> so it returns the GC content as a <strong>percentage</strong> (a <code>float</code> between 0 and 100).</p>
<ul class="tight">
  <li>Count case-insensitively: <code>"g"</code> and <code>"c"</code> count too.</li>
  <li>If the sequence is empty, return <code>0.0</code>. Do not raise.</li>
</ul>`,
      examples: [
        { input: 'dna = "AGCTATAG"', output: "37.5", explanation: "G, C, G are 3 of 8 bases → 3 / 8 × 100 = 37.5" },
        { input: 'dna = "GGCC"', output: "100.0" },
        { input: 'dna = ""', output: "0.0", explanation: "No bases, so there is nothing to divide. Guard against ZeroDivisionError." },
      ],
      constraints: [
        "<code>0 ≤ len(dna) ≤ 10<sup>5</sup></code>",
        "Characters are drawn from <code>ACGTacgt</code>",
        "Answers are accepted within an absolute error of <code>10<sup>-3</sup></code>",
      ],
      hints: [
        "Count how many characters are G or C, then divide by the total length.",
        "<code>dna.upper()</code> normalises the case in one step.",
        "Check <code>if not dna:</code> before dividing.",
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
    title: "Mutations & Hamming Distance",
    short: "Hamming Distance",
    difficulty: "Easy",
    minutes: 30,
    topics: ["SNPs", "Evolutionary distance", "zip & Big-O"],
    fnName: "hamming_distance",

    lesson: `
<p class="eyebrow">Module 3 · Biology × Computer Science</p>
<h1>Mutations &amp; Hamming Distance</h1>
<p class="lede">Two copies of a genome are never exactly the same. Measuring <em>how</em> different two sequences are is the starting point for variant calling, population genetics and building the tree of life. The simplest such measure is the Hamming distance.</p>

<div class="objectives">
  <div class="objectives-title">You will learn</div>
  <ul>
    <li>Types of mutations: transitions, transversions, indels</li>
    <li>What a SNP is and why there are millions of them in you</li>
    <li>How mismatch counts become evolutionary distance</li>
    <li>Iterating over two sequences together, and what O(n) really means</li>
  </ul>
</div>

<h2><span class="h-num">1</span>Point mutations</h2>
<p>A <strong>point mutation</strong> changes a single nucleotide. Polymerase errors, chemical damage, UV light and failed repair all cause them. Substitutions come in two kinds:</p>

<div class="mut-grid">
  <div class="mut-card mut-ts">
    <div class="mut-title">Transition</div>
    <div class="mut-ex">${nt("A")} ↔ ${nt("G")} &nbsp; ${nt("C")} ↔ ${nt("T")}</div>
    <p>A purine is swapped for a purine, or a pyrimidine for a pyrimidine. The shapes are similar, so these are about <strong>2× more frequent</strong> in practice.</p>
  </div>
  <div class="mut-card mut-tv">
    <div class="mut-title">Transversion</div>
    <div class="mut-ex">${nt("A")} ↔ ${nt("C")} &nbsp; ${nt("G")} ↔ ${nt("T")} …</div>
    <p>A purine is swapped for a pyrimidine, or the reverse. There are twice as many possible transversions, yet they happen less often.</p>
  </div>
</div>

<p>Inside a protein-coding gene, the effect of a substitution depends on the genetic code:</p>
<ul class="tight">
  <li><strong>Synonymous (silent)</strong>: the codon changes but the amino acid does not (e.g. <code>GAA</code>→<code>GAG</code>, both Glu).</li>
  <li><strong>Missense</strong>: the amino acid changes. The classic example is <strong>sickle-cell disease</strong>: one A→T transversion in the <em>HBB</em> gene turns <code>GAG</code> (Glu) into <code>GTG</code> (Val) at position 6 of β-globin.</li>
  <li><strong>Nonsense</strong>: a premature stop codon cuts the protein short.</li>
</ul>
<p><strong>Indels</strong> (insertions and deletions) also exist, but they shift the alignment. Hamming distance assumes the two sequences are already aligned and the same length, so it only counts substitutions. Indels need the alignment algorithms you will meet later (Needleman–Wunsch, Smith–Waterman).</p>

<h2><span class="h-num">2</span>SNPs: the variation that makes you, you</h2>
<p>A <strong>single-nucleotide polymorphism (SNP)</strong> is a position where different people commonly carry different bases (by convention, the minor allele has ≥ 1% frequency in a population). Any human genome differs from the reference at roughly <strong>4–5 million</strong> sites. SNPs are behind genome-wide association studies (GWAS), ancestry inference, pharmacogenomics and forensic identification.</p>

<h2><span class="h-num">3</span>From mismatches to evolutionary distance</h2>
<p>Divide the Hamming distance <em>d</em> by the alignment length <em>L</em> to get the <strong>p-distance</strong>, the proportion of sites that differ:</p>
<div class="formula-card">
  <div class="fc-eq">p = d<sub>H</sub> / L</div>
  <div class="fc-row"><span class="fc-name">Jukes–Cantor correction (1969)</span><span class="fc-when">accounts for multiple hits</span></div>
  <div class="fc-eq">d<sub>JC</sub> = −¾ · ln(1 − 4p/3)</div>
</div>
<p>Why correct at all? Over long timescales the same site can mutate more than once (A→G→A). Those changes are invisible, so the raw <em>p</em> <em>underestimates</em> the true number of substitutions. The JC69 model inverts a simple Markov chain to recover it. As <em>p</em> nears 0.75, the value you would expect between two random sequences, the distance goes to infinity: the signal is saturated.</p>

<h2><span class="h-num">4</span>Visual Lab: compare two strands</h2>
<p>Edit either strand, click <strong>Mutate</strong> to add a random point mutation, or <strong>Scan</strong> to watch the algorithm walk both strings and count differences. Transitions are shown in amber, transversions in red.</p>
<div data-viz="hamming"></div>

<h2><span class="h-num">5</span>Iterating over two strings at once</h2>
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
  <div class="callout-title">The silent <code>zip</code> trap</div>
  <p><code>zip</code> <strong>stops at the shorter input without warning</strong>. <code>sum(a != b for a, b in zip("ACGT", "AC"))</code> returns <code>0</code>, which is wrong. Hamming distance is undefined for sequences of different lengths, so check explicitly and <code>raise ValueError(...)</code>. On Python ≥ 3.10 you can also write <code>zip(s, t, strict=True)</code>.</p>
</div>

<h3>Big-O: how does the work grow?</h3>
<p><strong>Time complexity</strong> describes how running time grows with the input size <em>n</em>, ignoring constant factors. Hamming distance looks at each position exactly once, so it is <strong>O(n)</strong>, or <em>linear</em>: double the sequence length and the work roughly doubles.</p>
<table class="table">
  <thead><tr><th>Class</th><th>Example</th><th>n = 3×10⁹ (human genome)</th></tr></thead>
  <tbody>
    <tr><td><code>O(1)</code></td><td>read <code>dna[42]</code></td><td>instant</td></tr>
    <tr><td><code>O(n)</code></td><td>Hamming distance, GC content</td><td>seconds</td></tr>
    <tr><td><code>O(n log n)</code></td><td>sorting k-mers</td><td>minutes</td></tr>
    <tr><td><code>O(n²)</code></td><td>naive all-pairs comparison</td><td>longer than the age of the universe</td></tr>
  </tbody>
</table>

<div class="complexity">
  <div><span class="cx-label">Time</span><span class="cx-val">O(n)</span><span class="cx-note">one comparison per aligned position</span></div>
  <div><span class="cx-label">Space</span><span class="cx-val">O(1)</span><span class="cx-note">zip and generators are lazy, so no copies are made</span></div>
</div>

<h2><span class="h-num">6</span>Your task</h2>
<p>Implement <code>hamming_distance(seq1, seq2)</code>. Hidden tests check that you <strong>raise <code>ValueError</code></strong> when the lengths differ.</p>
`,

    problem: {
      statement: `
<p>Given two DNA strings <code>s</code> and <code>t</code> of equal length, the <strong>Hamming distance</strong> <code>d<sub>H</sub>(s, t)</code> is the number of positions at which their symbols differ.</p>
<p>Implement <code>hamming_distance(seq1, seq2)</code> so it returns that count as an <code>int</code>.</p>
<p>If the two sequences have <strong>different lengths</strong>, the distance is undefined: raise a <code>ValueError</code>.</p>`,
      examples: [
        {
          input: 'seq1 = "GAGCCTACTAACGGGAT"\nseq2 = "CATCGTAATGACGGCCT"',
          output: "7",
          explanation: "Mismatches at indices 0, 2, 4, 7, 9, 14, 15.",
        },
        { input: 'seq1 = "AAAA", seq2 = "AAAA"', output: "0" },
        { input: 'seq1 = "ACGT", seq2 = "ACG"', output: "ValueError", explanation: "Lengths 4 and 3 differ." },
      ],
      constraints: [
        "<code>0 ≤ len(seq1), len(seq2) ≤ 10<sup>5</sup></code>",
        "Return an <code>int</code>",
        "Raise <code>ValueError</code> if <code>len(seq1) != len(seq2)</code>",
      ],
      hints: [
        "Compare lengths first and <code>raise ValueError(\"...\")</code> if they differ.",
        "<code>zip(seq1, seq2)</code> yields pairs of aligned characters.",
        "In Python, <code>True + True == 2</code>, so <code>sum()</code> over booleans counts them.",
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
    title: "Motif Finding",
    short: "Motif Finding",
    difficulty: "Medium",
    minutes: 40,
    topics: ["TF binding sites", "Sliding window", "String search"],
    fnName: "find_motif",

    lesson: `
<p class="eyebrow">Module 4 · Biology × Computer Science</p>
<h1>Motif Finding</h1>
<p class="lede">Hidden in the genome are short "words" (6 to 20 letters) that proteins recognise and bind. Finding every occurrence of such a word is the first step in mapping how genes are switched on and off, and it is a classic problem in computer science.</p>

<div class="objectives">
  <div class="objectives-title">You will learn</div>
  <ul>
    <li>What transcription factors are and how they find their binding sites</li>
    <li>Consensus sequences, degeneracy and position weight matrices</li>
    <li>The sliding-window algorithm and its O(n·m) cost</li>
    <li>Why built-in tools miss <em>overlapping</em> matches, and faster algorithms (KMP, Boyer–Moore)</li>
  </ul>
</div>

<h2><span class="h-num">1</span>Transcription factors and binding sites</h2>
<p>Almost every cell in your body has the same genome, yet a neuron and a liver cell make very different proteins. One major reason is <strong>transcription factors (TFs)</strong>. These proteins bind to short DNA sequences near genes, called <strong>transcription factor binding sites (TFBS)</strong>, and help recruit RNA polymerase or block it.</p>
<p>A recurring short pattern with a biological function is called a <strong>motif</strong>. Some famous ones:</p>
<table class="table">
  <thead><tr><th>Motif</th><th>Consensus</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>TATA box</td><td>${nt("TATAAA")}</td><td>Core promoter element ~25–35 bp upstream of many eukaryotic genes; bound by TATA-binding protein (TBP).</td></tr>
    <tr><td>E-box</td><td>${nt("CACGTG")}</td><td>Bound by bHLH factors such as MYC and CLOCK. Controls proliferation and circadian rhythm.</td></tr>
    <tr><td>EcoRI site</td><td>${nt("GAATTC")}</td><td>Cut by the restriction enzyme EcoRI. It is a <em>palindrome</em>: it reads the same as its reverse complement.</td></tr>
    <tr><td>Shine–Dalgarno</td><td>${nt("AGGAGG")}</td><td>Bacterial ribosome binding site just upstream of the start codon.</td></tr>
  </tbody>
</table>

<div class="callout callout-bio">
  <div class="callout-title">Motifs are fuzzy</div>
  <p>Real binding sites tolerate variation, so a TF may bind <code>TATAAA</code>, <code>TATATA</code> and <code>TATAAT</code>. Biologists capture this with <strong>IUPAC codes</strong> (<code>W</code> = A or T, so <code>TATAWA</code>) or a <strong>position weight matrix (PWM)</strong> that scores each base at each position. Tools like MEME and HOMER <em>discover</em> motifs; tools like FIMO <em>scan</em> genomes for them. Each of these builds on the exact-match search you are about to write.</p>
</div>

<h3>Why overlapping occurrences matter</h3>
<p>Repetitive DNA such as <code>ATATATAT</code> contains <code>ATAT</code> at positions 0, 2 and 4. These matches <em>overlap</em>, and each one is a separate place where a protein could land. A correct motif finder must report all of them.</p>

<h2><span class="h-num">2</span>The sliding-window algorithm</h2>
<p>Place a window the size of the motif (<em>m</em>) at the start of the DNA (length <em>n</em>). Compare the window with the motif character by character, then slide the window one position to the right. Stop when the window would run off the end, which gives <strong>n − m + 1</strong> windows in total.</p>
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

<h2><span class="h-num">3</span>Visual Lab: the sliding window</h2>
<p>Watch every comparison. Green means the characters match; red means a mismatch, after which the window jumps ahead. The counters show how much work the naive algorithm does. Try a repetitive sequence and motif such as <code>AAAAAAAA</code> / <code>AAAB</code> to trigger the worst case.</p>
<div data-viz="motif"></div>

<h2><span class="h-num">4</span>Doing it in Python</h2>
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
  <div class="callout-title">Built-ins that silently skip overlaps</div>
  ${py(`
"ATATAT".count("ATA")                  # 1  - non-overlapping!
import re
[m.start() for m in re.finditer("ATA", "ATATAT")]        # [0]
[m.start() for m in re.finditer("(?=ATA)", "ATATAT")]    # [0, 2]  lookahead fixes it
`)}
</div>

<h3>Complexity and better algorithms</h3>
<p>The naive search does up to <em>m</em> comparisons for each of the <em>n − m + 1</em> windows, so the worst case is <strong>O(n·m)</strong>. For a 20-mer against a 3-billion-base genome that is fine in C, but slow in pure Python. Classic faster algorithms:</p>
<table class="table">
  <thead><tr><th>Algorithm</th><th>Idea</th><th>Time</th></tr></thead>
  <tbody>
    <tr><td>Naive / sliding window</td><td>Try every alignment</td><td>O(n·m)</td></tr>
    <tr><td>Knuth–Morris–Pratt</td><td>Precompute a failure table so you never re-read a text character</td><td>O(n + m)</td></tr>
    <tr><td>Boyer–Moore</td><td>Compare right-to-left and skip ahead using bad-character / good-suffix rules</td><td>sublinear on average</td></tr>
    <tr><td>Rabin–Karp</td><td>Rolling hash of each window; only verify on a hash hit</td><td>O(n + m) expected</td></tr>
    <tr><td>Suffix array / FM-index</td><td>Index the genome once, then answer every query fast (this is how BWA and Bowtie map reads)</td><td>O(m) per query</td></tr>
  </tbody>
</table>

<div class="complexity">
  <div><span class="cx-label">Time</span><span class="cx-val">O(n·m)</span><span class="cx-note">naive worst case; ≈ O(n) on typical DNA</span></div>
  <div><span class="cx-label">Space</span><span class="cx-val">O(k)</span><span class="cx-note">k = number of matches returned</span></div>
</div>

<div class="callout callout-tip">
  <div class="callout-title">0-based vs 1-based coordinates</div>
  <p>Python indexes from 0. Many biological formats count from 1 (GFF, VCF, SAM, and Rosalind answers). BED files are 0-based and half-open, like Python slices. Off-by-one coordinate bugs are probably the most common bug in genomics, so always check which convention a file uses. In this module, return <strong>0-based</strong> indices.</p>
</div>

<h2><span class="h-num">5</span>Your task</h2>
<p>Implement <code>find_motif(dna, motif)</code> so it returns <strong>every</strong> starting index, overlaps included. Hidden tests cover empty motifs, motifs longer than the DNA, and a 1,000-base worst case.</p>
`,

    problem: {
      statement: `
<p>Given a DNA string <code>dna</code> and a shorter string <code>motif</code>, find <strong>all</strong> locations where <code>motif</code> occurs as a substring of <code>dna</code>.</p>
<p>Implement <code>find_motif(dna, motif)</code> so it returns a <code>list</code> of the <strong>0-based</strong> starting indices in increasing order. <strong>Overlapping</strong> occurrences must all be reported.</p>
<ul class="tight">
  <li>If <code>motif</code> does not occur, or is longer than <code>dna</code>, return <code>[]</code>.</li>
  <li>If <code>motif</code> is the empty string, return <code>[]</code>.</li>
</ul>`,
      examples: [
        { input: 'dna = "GATATATGCATATACTT"\nmotif = "ATAT"', output: "[1, 3, 9]", explanation: "Occurrences at 1 and 3 overlap (ATATAT); both count." },
        { input: 'dna = "AAAA", motif = "AA"', output: "[0, 1, 2]" },
        { input: 'dna = "ACGT", motif = "TTT"', output: "[]" },
      ],
      constraints: [
        "<code>0 ≤ len(motif)</code>, <code>0 ≤ len(dna) ≤ 10<sup>4</sup></code>",
        "Return a <code>list</code> of <code>int</code> in ascending order",
        "Indices are 0-based (Rosalind's SUBS problem uses 1-based, so add 1 there)",
      ],
      hints: [
        "There are <code>len(dna) - len(motif) + 1</code> candidate windows.",
        "<code>dna[i:i + m] == motif</code> checks one window.",
        "Handle the empty motif before the main loop.",
        "Do <em>not</em> use <code>str.count</code> or plain <code>re.finditer</code>: they skip overlaps.",
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
  CBB.getModule = (id) => CBB.MODULES.find((m) => m.id === id) || null;
})();
