# CompBio Bootcamp: From Zero to Research Assistant

An interactive computational biology course that runs entirely in the browser. Each module pairs a lesson on the biology and the algorithm with an interactive Visual Lab and a LeetCode-style coding challenge, executed by real CPython compiled to WebAssembly ([Pyodide](https://pyodide.org)).

No backend and no build step: it's static HTML, CSS and JS, ready for GitHub Pages.

**Language:** the course is in **Hebrew** with a right-to-left (RTL) layout. Python code, the code editor, the test console, inline code and DNA sequence tracks stay left-to-right, and scientific terms (DNA, RNA, FASTA, Pyodide…) stay in English.

## Run locally

The Python runtime lives in a Web Worker, and browsers block workers on `file://`. Serve the folder over HTTP instead:

```bash
cd compbio-lab
python3 -m http.server 8000
# open http://localhost:8000
```

The first load downloads Pyodide (~10 MB) from the jsDelivr CDN, and the browser caches it after that.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. **Settings → Pages → Build and deployment → Deploy from a branch**, choose `main` and `/ (root)`.
3. Your site will be at `https://<user>.github.io/<repo>/`.

All paths are relative, so it also works from a project subpath.

## Curriculum

| # | Module | Visual Lab | Task |
|---|--------|-----------|------|
| 1 | The Central Dogma & Strings | Transcription bubble animation | `transcribe(dna_string)` |
| 2 | Sequence Analysis & GC Content | Composition stats + temperature-driven DNA melting | `gc_content(dna)` |
| 3 | Mutations & Hamming Distance | Strand comparison, transitions/transversions, Jukes–Cantor | `hamming_distance(seq1, seq2)` |
| 4 | Motif Finding | Step-through sliding-window search with comparison counter | `find_motif(dna, motif)` |
| 5 | Translating RNA to Protein | Ribosome walking codons, amino-acid chain, genetic-code table | `translate_rna(rna_sequence)` |
| 6 | Open Reading Frames (ORFs) | Three reading frames with start/stop codons and a step-through ORF scanner | `find_first_orf(rna)` |
| 7 | Sequence Alignment Scoring | Column-by-column scoring with editable match/mismatch/gap and a cumulative-score chart | `score_alignment(seq1, seq2)` |
| 8 | Reverse Complement | Complement-then-reverse animation with 5′/3′ strand labels and palindrome detection | `reverse_complement(dna)` |
| 9 | K-mer Frequencies | Sliding k-window with a live, sorted frequency table | `count_kmers(dna, k)` |
| 10 | Profile Matrices & Consensus | Column-by-column profile matrix with tie highlighting and consensus row | `consensus_sequence(dna_list)` |
| 11 | Dynamic Programming: Alignment Matrix | Needleman–Wunsch grid: initialisation, cell-by-cell fill and traceback | `init_dp_matrix(seq1, seq2, gap_penalty)` |

Each module also has a **Code Examples** (דוגמאות קוד) section right before the coding task: ready-made Python programs you can run in the browser, each with a step-by-step Hebrew walkthrough.

**Run** checks the visible examples. **Submit** also runs the hidden edge-case tests and marks the module complete.

## Architecture

```
index.html          App shell: sidebar, topbar, dual-pane IDE
css/styles.css      Design tokens, layout, editor theme, console
css/visuals.css     Lesson typography + Visual Lab components
js/storage.js       localStorage persistence (code, progress, pane sizes)
js/curriculum.js    Modules 1–4 as data: lessons, problems, tests, solutions
js/curriculum-advanced.js  Modules 5–7 (appended to CBB.MODULES) + the shared genetic code
js/curriculum-expert.js    Modules 8–11 (appended after 5–7)
js/visuals.js       DOM-based interactive labs (one factory per lab)
js/visuals-advanced.js     Labs for modules 5–7 (translation, ORF scanner, alignment scoring)
js/visuals-expert.js       Labs for modules 8–11 (reverse complement, k-mers, profile, DP grid)
js/pyworker.js      Web Worker: loads Pyodide and runs the Python test harness
js/runner.js        Worker lifecycle, 8 s time limit (kills + restarts on infinite loops)
js/editor.js        CodeMirror 5 wrapper (per-module undo history) + textarea fallback
js/console.js       Verdict / test case / traceback / stdout rendering
js/app.js           Routing (#/m1…), Run/Submit flow, resizable panes, shortcuts
```

### Adding a module

Add an object to `CBB.MODULES` in `js/curriculum.js` with `id`, `title`, `lesson` (HTML), `problem`, `starter`, `solution`, `fnName` and `tests`. Test cases look like:

```js
{ args: ["ACGT"], expected: "ACGU" }                 // exact match (type-checked)
{ args: ["GGCC"], expected: 100.0, tol: 1e-3 }      // float comparison
{ args: ["AAAA", 2], expected: { AA: 3 } }           // dict (any mapping: dict, Counter, defaultdict)
{ args: ["AC", "ACG"], raises: "ValueError" }        // expects an exception
{ args: [...], expected: ..., hidden: true }         // only runs on Submit
```

To embed a new visualization, add a factory to `CBB.Visuals` and put `<div data-viz="name"></div>` in the lesson HTML.

## Keyboard shortcuts

| Action | macOS | Windows/Linux |
|---|---|---|
| Run visible tests | ⌘ ↵ | Ctrl ↵ |
| Submit | ⌘ ⇧ ↵ | Ctrl ⇧ ↵ |
| Toggle comment | ⌘ / | Ctrl / |
