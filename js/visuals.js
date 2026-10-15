/* ==========================================================================
   Visuals — DOM-based interactive labs mounted into lesson placeholders.
   Each factory takes a mount element and returns { destroy() } so the app
   can clean up timers when the learner switches modules.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});

  const COL = 30; // px: tile width (26) + gap (4) — keep in sync with visuals.css
  const COMP = { A: "T", T: "A", G: "C", C: "G" };
  const BASES = ["A", "C", "G", "T"];
  const PURINES = new Set(["A", "G"]);

  const cleanDNA = (s) => s.toUpperCase().replace(/[^ACGT]/g, "");
  const toRNA = (b) => (b === "T" ? "U" : b);
  const tile = (b, cls = "") => `<span class="nt nt-${b.toLowerCase()} ${cls}">${b}</span>`;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function timers() {
    const ids = new Set();
    return {
      after(ms, fn) {
        const id = setTimeout(() => {
          ids.delete(id);
          fn();
        }, ms);
        ids.add(id);
      },
      clear() {
        ids.forEach(clearTimeout);
        ids.clear();
      },
    };
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function shell(title, subtitle, body) {
    return `
      <div class="viz">
        <div class="viz-head">
          <div class="viz-title"><span class="viz-dot"></span>Visual Lab<span class="viz-sep">·</span>${title}</div>
          <div class="viz-sub">${subtitle}</div>
        </div>
        ${body}
      </div>`;
  }

  const speedSelect = `
    <select class="select select-sm" data-ref="speed" aria-label="Animation speed">
      <option value="480">0.5×</option>
      <option value="240" selected>1×</option>
      <option value="110">2×</option>
      <option value="45">4×</option>
    </select>`;

  const refs = (root) => (name) => root.querySelector(`[data-ref="${name}"]`);

  function keepInView(stage, x) {
    const pad = 80;
    if (x < stage.scrollLeft + pad || x > stage.scrollLeft + stage.clientWidth - pad) {
      stage.scrollLeft = Math.max(0, x - stage.clientWidth / 2);
    }
  }

  /* ───────────────────────── 1. Transcription ───────────────────────── */
  function transcription(root) {
    const T = timers();
    const BUBBLE = 5;
    root.innerHTML = shell(
      "Transcription",
      "RNA polymerase opens a transcription bubble, reads the template strand 3′→5′ and synthesises mRNA 5′→3′.",
      `
      <div class="viz-controls">
        <label class="field grow">
          <span class="field-label">Coding strand (5′→3′)</span>
          <input class="input mono" data-ref="seq" value="ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG" maxlength="60" spellcheck="false" autocomplete="off">
        </label>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ Transcribe</button>
          <button class="btn btn-sm" data-ref="step">Step</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">Reset</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap">
        <div class="lane-labels">
          <span style="height:26px">5′ coding 3′</span>
          <span style="height:16px"></span>
          <span style="height:26px">3′ template 5′</span>
          <span style="height:22px"></span>
          <span style="height:26px" class="lbl-rna">5′ mRNA 3′</span>
        </div>
        <div class="viz-stage" data-ref="stage"><div class="tx-track" data-ref="track"></div></div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>
      <div class="legend">
        ${tile("A")}<span>Adenine</span>${tile("T")}<span>Thymine</span>${tile("G")}<span>Guanine</span>${tile("C")}<span>Cytosine</span>${tile("U")}<span>Uracil (RNA)</span>
      </div>`
    );
    const $ = refs(root);
    let seq = "";
    let cols = [];
    let i = -1;
    let playing = false;

    function setReadout(html) {
      $("readout").innerHTML = html;
    }

    function build() {
      pause();
      seq = cleanDNA($("seq").value).slice(0, 60);
      i = -1;
      if (!seq) {
        $("track").innerHTML = "";
        cols = [];
        setReadout(`<span class="ro-warn">Enter at least one base (A, C, G, T).</span>`);
        return;
      }
      $("track").innerHTML =
        seq
          .split("")
          .map(
            (b) => `
          <div class="tx-col">
            ${tile(b, "tx-coding")}
            <span class="tx-bond ${b === "G" || b === "C" ? "b3" : "b2"}"><i></i><i></i><i></i></span>
            ${tile(COMP[b], "tx-template")}
            ${tile(toRNA(b), "tx-rna")}
          </div>`
          )
          .join("") + `<div class="rnap" data-ref="rnap"><span>RNAP</span></div>`;
      cols = [...$("track").querySelectorAll(".tx-col")];
      $("stage").scrollLeft = 0;
      setReadout(
        `Ready: <b>${seq.length}</b> bp double helix. Press <b>Transcribe</b> or <b>Step</b>. The template strand is the reverse complement of what you typed.`
      );
    }

    function step() {
      if (!cols.length) return false;
      if (i >= seq.length - 1) return false;
      i++;
      const rnap = $("rnap");
      rnap.classList.add("on");
      rnap.style.transform = `translateX(${i * COL - 3}px)`;
      cols.forEach((c, k) => c.classList.toggle("open", k > i - BUBBLE && k <= i));
      cols[i].classList.add("made");
      keepInView($("stage"), i * COL);

      const b = seq[i];
      const mrna = seq.slice(0, i + 1).split("").map(toRNA).join("");
      setReadout(
        `<b>Position ${i + 1}/${seq.length}</b> · template ${tile(COMP[b], "nt-xs")} pairs with incoming ${tile(toRNA(b), "nt-xs")}` +
          `<div class="ro-seq">mRNA 5′-<span class="mono">${mrna.length > 36 ? "…" + mrna.slice(-36) : mrna}</span>-3′</div>`
      );
      if (i === seq.length - 1) finish();
      return true;
    }

    function finish() {
      T.after(500, () => {
        cols.forEach((c) => c.classList.remove("open"));
        $("rnap") && $("rnap").classList.remove("on");
      });
      const mrna = seq.split("").map(toRNA).join("");
      const codons = mrna.match(/.{1,3}/g).join(" ");
      const start = mrna.startsWith("AUG")
        ? `<span class="ro-good">Starts with AUG, the start codon (Met), so a ribosome could begin translating here.</span>`
        : `<span class="ro-dim">No AUG start codon at position 1.</span>`;
      setReadout(
        `<b>Transcription complete.</b> The helix re-zips; the mRNA leaves for the ribosome.` +
          `<div class="ro-seq">codons: <span class="mono">${codons}</span></div>${start}`
      );
      pause();
    }

    function tick() {
      if (!playing) return;
      if (step() && i < seq.length - 1) T.after(+$("speed").value, tick);
    }
    function play() {
      if (playing) return pause();
      if (i >= seq.length - 1) build();
      playing = true;
      $("play").textContent = "❚❚ Pause";
      tick();
    }
    function pause() {
      playing = false;
      T.clear();
      $("play").textContent = "▶ Transcribe";
    }

    $("play").addEventListener("click", play);
    $("step").addEventListener("click", () => {
      pause();
      if (i >= seq.length - 1) build();
      step();
    });
    $("reset").addEventListener("click", build);
    $("seq").addEventListener("input", debounce(build, 300));
    build();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 2. GC content & melting ───────────────────────── */
  function gc(root) {
    const ROSALIND =
      "CCACCCTCGTGGTATGGCTAGGCATTCAGGAACCGGAGAACGCTTCAGACCAGCCCGGACTGGGAACCTGCGGGCAGTAGGTGGAAT";
    const MAX_DUPLEX = 120;
    root.innerHTML = shell(
      "GC content & DNA melting",
      "Composition sets stability. Raise the temperature and watch AT-rich regions melt first.",
      `
      <div class="viz-controls col">
        <label class="field">
          <span class="field-label">Sequence</span>
          <textarea class="input mono" data-ref="seq" rows="2" spellcheck="false">ATATTTATAAATGCGCGGCCGCGGCATATTAAATTTAGCGGCCCGCGGGCATTATAATTA</textarea>
        </label>
        <div class="btn-row wrap">
          <label class="inline-field">GC bias <input type="range" min="0" max="100" value="50" data-ref="bias"><output data-ref="biasOut">50%</output></label>
          <label class="inline-field">Length <input type="number" class="input input-num" min="4" max="200" value="60" data-ref="len"></label>
          <button class="btn btn-sm" data-ref="random">⟳ Random</button>
          <button class="btn btn-ghost btn-sm" data-ref="sample">Rosalind sample</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-k">Length</div><div class="stat-v" data-ref="sLen">–</div></div>
        <div class="stat stat-accent"><div class="stat-k">GC content</div><div class="stat-v" data-ref="sGC">–</div></div>
        <div class="stat"><div class="stat-k">Est. T<sub>m</sub></div><div class="stat-v" data-ref="sTm">–</div><div class="stat-n" data-ref="sTmN"></div></div>
        <div class="stat"><div class="stat-k">H-bonds</div><div class="stat-v" data-ref="sHB">–</div></div>
      </div>
      <div class="comp-bar" data-ref="comp"></div>
      <div class="melt-head">
        <label class="inline-field grow">🌡 Temperature
          <input type="range" min="30" max="100" value="37" data-ref="temp" class="temp-range">
          <output data-ref="tempOut" class="temp-out">37 °C</output>
        </label>
      </div>
      <div class="viz-stage" data-ref="stage"><div class="duplex" data-ref="duplex"></div></div>
      <div class="viz-readout" data-ref="readout"></div>
      <p class="viz-foot">Toy model: each pair melts above 45 + 50·f °C, where f is the GC fraction in a 9-bp window (+3 °C if the pair itself is G·C). Real melting is cooperative and depends on salt and nearest-neighbour stacking energies.</p>`
    );
    const $ = refs(root);
    let seq = "";
    let thresholds = [];
    let cols = [];

    function tm(s) {
      const n = s.length;
      const gcN = (s.match(/[GC]/g) || []).length;
      if (!n) return null;
      return n < 14
        ? { v: 2 * (n - gcN) + 4 * gcN, method: "Wallace rule" }
        : { v: 64.9 + (41 * (gcN - 16.4)) / n, method: "GC formula" };
    }

    function build() {
      seq = cleanDNA($("seq").value);
      const n = seq.length;
      const counts = { A: 0, C: 0, G: 0, T: 0 };
      for (const b of seq) counts[b]++;
      const gcN = counts.G + counts.C;
      const gcPct = n ? (gcN / n) * 100 : 0;
      const t = tm(seq);

      $("sLen").textContent = n ? `${n} bp` : "–";
      $("sGC").textContent = n ? `${gcPct.toFixed(1)}%` : "–";
      $("sTm").textContent = t ? `${t.v.toFixed(1)} °C` : "–";
      $("sTmN").textContent = t ? t.method : "";
      $("sHB").textContent = n ? 2 * (counts.A + counts.T) + 3 * gcN : "–";

      $("comp").innerHTML = n
        ? ["A", "T", "G", "C"]
            .filter((b) => counts[b])
            .map((b) => {
              const p = (counts[b] / n) * 100;
              return `<div class="comp-seg comp-${b.toLowerCase()}" style="width:${p}%" title="${b}: ${counts[b]} (${p.toFixed(1)}%)"><span>${p >= 7 ? `${b} ${p.toFixed(0)}%` : ""}</span></div>`;
            })
            .join("")
        : "";

      const shown = seq.slice(0, MAX_DUPLEX);
      thresholds = shown.split("").map((b, k) => {
        let g = 0;
        let c = 0;
        for (let j = Math.max(0, k - 4); j <= Math.min(shown.length - 1, k + 4); j++) {
          c++;
          if (shown[j] === "G" || shown[j] === "C") g++;
        }
        return 45 + 50 * (g / c) + (b === "G" || b === "C" ? 3 : 0);
      });
      $("duplex").innerHTML = shown
        .split("")
        .map(
          (b) => `
        <div class="dx-col">
          ${tile(b, "dx-top")}
          <span class="tx-bond ${b === "G" || b === "C" ? "b3" : "b2"}"><i></i><i></i><i></i></span>
          ${tile(COMP[b], "dx-bot")}
        </div>`
        )
        .join("");
      cols = [...$("duplex").querySelectorAll(".dx-col")];
      melt();
    }

    function melt() {
      const temp = +$("temp").value;
      $("tempOut").textContent = `${temp} °C`;
      $("tempOut").style.setProperty("--heat", (temp - 30) / 70);
      let melted = 0;
      cols.forEach((c, k) => {
        const m = temp > thresholds[k];
        c.classList.toggle("melted", m);
        if (m) melted++;
      });
      const n = cols.length;
      if (!n) {
        $("readout").innerHTML = `<span class="ro-warn">Enter a DNA sequence to analyse.</span>`;
        return;
      }
      const frac = melted / n;
      const t = tm(seq);
      const state =
        frac === 0
          ? `<span class="ro-good">Fully double-stranded.</span>`
          : frac < 0.5
            ? `<span class="ro-dim">Partially melted: "bubbles" open in AT-rich regions first.</span>`
            : frac < 1
              ? `<span class="ro-warn">Mostly single-stranded: past the midpoint of melting.</span>`
              : `<span class="ro-bad">Fully denatured: two separate single strands.</span>`;
      $("readout").innerHTML =
        `<b>${temp} °C</b> · ${melted}/${n} base pairs melted (${(frac * 100).toFixed(0)}%). ${state}` +
        (t ? `<div class="ro-dim small">Estimated T<sub>m</sub> of the whole duplex: ${t.v.toFixed(1)} °C (${t.method}).${seq.length > MAX_DUPLEX ? ` Showing first ${MAX_DUPLEX} bp.` : ""}</div>` : "");
    }

    function randomSeq() {
      const p = +$("bias").value / 100;
      const n = Math.max(4, Math.min(200, +$("len").value || 60));
      let s = "";
      for (let k = 0; k < n; k++) s += Math.random() < p ? pick(["G", "C"]) : pick(["A", "T"]);
      $("seq").value = s;
      build();
    }

    $("bias").addEventListener("input", () => ($("biasOut").textContent = `${$("bias").value}%`));
    $("random").addEventListener("click", randomSeq);
    $("sample").addEventListener("click", () => {
      $("seq").value = ROSALIND;
      build();
    });
    $("temp").addEventListener("input", melt);
    $("seq").addEventListener("input", debounce(build, 200));
    build();
    return { destroy() {} };
  }

  /* ───────────────────────── 3. Hamming distance ───────────────────────── */
  function hamming(root) {
    const T = timers();
    const DEFAULT = ["GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"];
    root.innerHTML = shell(
      "Hamming distance",
      "Aligned position by position: every mismatch is one point mutation.",
      `
      <div class="viz-controls col">
        <div class="field-pair">
          <label class="field"><span class="field-label">Sequence 1</span><input class="input mono" data-ref="s1" value="${DEFAULT[0]}" maxlength="60" spellcheck="false" autocomplete="off"></label>
          <label class="field"><span class="field-label">Sequence 2</span><input class="input mono" data-ref="s2" value="${DEFAULT[1]}" maxlength="60" spellcheck="false" autocomplete="off"></label>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="scan">▶ Scan</button>
          <button class="btn btn-sm" data-ref="mutate">⚡ Mutate</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">Reset</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap">
        <div class="lane-labels">
          <span style="height:26px">seq 1</span>
          <span style="height:22px"></span>
          <span style="height:26px">seq 2</span>
          <span style="height:16px"></span>
        </div>
        <div class="viz-stage" data-ref="stage"><div class="hm-track" data-ref="track"></div></div>
      </div>
      <div class="stat-grid stat-grid-6">
        <div class="stat stat-accent"><div class="stat-k">d<sub>H</sub></div><div class="stat-v" data-ref="d">–</div></div>
        <div class="stat"><div class="stat-k">p-distance</div><div class="stat-v" data-ref="p">–</div></div>
        <div class="stat"><div class="stat-k">Jukes–Cantor</div><div class="stat-v" data-ref="jc">–</div></div>
        <div class="stat"><div class="stat-k"><span class="dot dot-ts"></span>Transitions</div><div class="stat-v" data-ref="ts">–</div></div>
        <div class="stat"><div class="stat-k"><span class="dot dot-tv"></span>Transversions</div><div class="stat-v" data-ref="tv">–</div></div>
        <div class="stat"><div class="stat-k">Ts / Tv</div><div class="stat-v" data-ref="tstv">–</div></div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let s1 = "";
    let s2 = "";
    let cols = [];
    let scanning = false;

    const kind = (a, b) => (a === b ? "match" : PURINES.has(a) === PURINES.has(b) ? "ts" : "tv");

    function render(flashAt = -1) {
      stopScan();
      s1 = cleanDNA($("s1").value).slice(0, 60);
      s2 = cleanDNA($("s2").value).slice(0, 60);
      const n = Math.max(s1.length, s2.length);
      let html = "";
      let ts = 0;
      let tv = 0;
      for (let k = 0; k < n; k++) {
        const a = s1[k];
        const b = s2[k];
        const kd = a && b ? kind(a, b) : "gap";
        if (kd === "ts") ts++;
        if (kd === "tv") tv++;
        const mark = { match: "│", ts: "●", tv: "✕", gap: "?" }[kd];
        html += `
          <div class="hm-col hm-${kd}${k === flashAt ? " flash" : ""}">
            ${a ? tile(a) : '<span class="nt nt-gap">–</span>'}
            <span class="hm-mark">${mark}</span>
            ${b ? tile(b) : '<span class="nt nt-gap">–</span>'}
            <span class="hm-idx">${k % 5 === 0 ? k : ""}</span>
          </div>`;
      }
      $("track").innerHTML = html;
      cols = [...$("track").querySelectorAll(".hm-col")];

      const set = (r, v) => ($(r).textContent = v);
      if (s1.length !== s2.length) {
        ["d", "p", "jc", "ts", "tv", "tstv"].forEach((r) => set(r, "—"));
        $("readout").innerHTML = `<span class="ro-bad">Lengths differ (${s1.length} vs ${s2.length}).</span> Hamming distance is undefined, so your function should <code>raise ValueError</code> here. Comparing sequences with indels needs a sequence <em>alignment</em> first.`;
        return;
      }
      const d = ts + tv;
      const p = n ? d / n : 0;
      const jc = p < 0.75 ? -0.75 * Math.log(1 - (4 * p) / 3) : Infinity;
      set("d", d);
      set("p", n ? p.toFixed(3) : "–");
      set("jc", n ? (Number.isFinite(jc) ? jc.toFixed(3) : "∞ (saturated)") : "–");
      set("ts", ts);
      set("tv", tv);
      set("tstv", tv ? (ts / tv).toFixed(2) : ts ? "∞" : "–");
      if (flashAt < 0)
        $("readout").innerHTML = n
          ? `<b>${d}</b> of <b>${n}</b> aligned positions differ. Press <b>Scan</b> to watch the O(n) loop, or <b>Mutate</b> to add a random point mutation to sequence 2.`
          : `<span class="ro-warn">Enter two sequences.</span>`;
    }

    function stopScan() {
      scanning = false;
      T.clear();
      $("scan").textContent = "▶ Scan";
      cols.forEach((c) => c.classList.remove("scan", "seen"));
    }

    function scan() {
      if (scanning) return stopScan();
      if (s1.length !== s2.length || !s1.length) return;
      stopScan();
      scanning = true;
      $("scan").textContent = "❚❚ Stop";
      let k = 0;
      let d = 0;
      const tickScan = () => {
        if (!scanning) return;
        cols.forEach((c, j) => {
          c.classList.toggle("scan", j === k);
          c.classList.toggle("seen", j < k);
        });
        keepInView($("stage"), k * COL);
        const kd = kind(s1[k], s2[k]);
        if (kd !== "match") d++;
        const verdict =
          kd === "match"
            ? `<span class="ro-good">match</span>`
            : `<span class="${kd === "ts" ? "ro-warn" : "ro-bad"}">mismatch (${kd === "ts" ? "transition" : "transversion"})</span>`;
        $("readout").innerHTML = `<span class="mono">i = ${k}</span> · ${tile(s1[k], "nt-xs")} vs ${tile(s2[k], "nt-xs")} → ${verdict} · <b>distance = ${d}</b>`;
        k++;
        if (k < s1.length) T.after(+$("speed").value, tickScan);
        else
          T.after(+$("speed").value, () => {
            scanning = false;
            $("scan").textContent = "▶ Scan";
            cols.forEach((c) => c.classList.remove("scan", "seen"));
            $("readout").innerHTML = `<b>Done:</b> ${s1.length} comparisons for ${s1.length} positions, one per position, which is why the algorithm is <b>O(n)</b>. Hamming distance = <b>${d}</b>.`;
          });
      };
      tickScan();
    }

    function mutate() {
      const raw = cleanDNA($("s2").value).slice(0, 60);
      if (!raw) return;
      const k = Math.floor(Math.random() * raw.length);
      const old = raw[k];
      const nb = pick(BASES.filter((b) => b !== old));
      $("s2").value = raw.slice(0, k) + nb + raw.slice(k + 1);
      render(k);
      keepInView($("stage"), k * COL);
      const kd = kind(old, nb);
      $("readout").innerHTML = `⚡ Point mutation at position <b>${k}</b>: ${tile(old, "nt-xs")} → ${tile(nb, "nt-xs")} <span class="${kd === "ts" ? "ro-warn" : "ro-bad"}">(${kd === "ts" ? "transition" : "transversion"})</span>. ${s1[k] === nb ? "This one happened to <em>revert</em> a difference, a <b>back-mutation</b>. Multiple hits like this are why Jukes–Cantor corrects p." : ""}`;
    }

    $("scan").addEventListener("click", scan);
    $("mutate").addEventListener("click", mutate);
    $("reset").addEventListener("click", () => {
      $("s1").value = DEFAULT[0];
      $("s2").value = DEFAULT[1];
      render();
    });
    const re = debounce(() => render(), 250);
    $("s1").addEventListener("input", re);
    $("s2").addEventListener("input", re);
    render();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 4. Motif sliding window ───────────────────────── */
  function motif(root) {
    const T = timers();
    root.innerHTML = shell(
      "Sliding-window motif search",
      "The window slides one base at a time. Each step compares a single character.",
      `
      <div class="viz-controls col">
        <div class="field-pair field-pair-wide">
          <label class="field"><span class="field-label">DNA (text)</span><input class="input mono" data-ref="dna" value="GATATATGCATATACTT" maxlength="60" spellcheck="false" autocomplete="off"></label>
          <label class="field"><span class="field-label">Motif (pattern)</span><input class="input mono" data-ref="motif" value="ATAT" maxlength="12" spellcheck="false" autocomplete="off"></label>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ Scan</button>
          <button class="btn btn-sm" data-ref="step">Step</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">Reset</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage" data-ref="stage">
        <div class="mf-track" data-ref="track">
          <div class="mf-hits" data-ref="hits"></div>
          <div class="mf-row" data-ref="text"></div>
          <div class="mf-idx" data-ref="idx"></div>
          <div class="mf-window" data-ref="win"></div>
          <div class="mf-pattern" data-ref="pat"></div>
        </div>
      </div>
      <div class="stat-grid stat-grid-4">
        <div class="stat"><div class="stat-k">Window i</div><div class="stat-v" data-ref="sI">–</div></div>
        <div class="stat"><div class="stat-k">Comparisons</div><div class="stat-v" data-ref="sC">0</div></div>
        <div class="stat"><div class="stat-k">Worst case (n−m+1)·m</div><div class="stat-v" data-ref="sW">–</div></div>
        <div class="stat stat-accent"><div class="stat-k">Matches</div><div class="stat-v mono" data-ref="sM">[]</div></div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let dna = "";
    let pat = "";
    let i = 0;
    let j = 0;
    let comps = 0;
    let hits = [];
    let advance = false;
    let done = false;
    let playing = false;
    let tTiles = [];
    let pTiles = [];

    function build() {
      pause();
      dna = cleanDNA($("dna").value).slice(0, 60);
      pat = cleanDNA($("motif").value).slice(0, 12);
      i = j = comps = 0;
      hits = [];
      advance = false;
      done = false;
      $("text").innerHTML = dna.split("").map((b) => tile(b)).join("");
      $("idx").innerHTML = dna
        .split("")
        .map((_, k) => `<span>${k}</span>`)
        .join("");
      $("hits").innerHTML = "";
      $("pat").innerHTML = pat.split("").map((b) => tile(b)).join("");
      tTiles = [...$("text").children];
      pTiles = [...$("pat").children];
      $("win").style.width = `${pat.length * COL}px`;
      position();
      $("sC").textContent = "0";
      $("sM").textContent = "[]";
      const n = dna.length;
      const m = pat.length;
      $("sW").textContent = m && n >= m ? (n - m + 1) * m : "–";
      $("stage").scrollLeft = 0;
      if (!m || m > n) {
        done = true;
        $("win").style.opacity = 0;
        $("pat").style.opacity = 0;
        $("sI").textContent = "–";
        $("readout").innerHTML = !m
          ? `<span class="ro-warn">Empty motif:</span> nothing to search for, so your function should return <code>[]</code>.`
          : `<span class="ro-warn">Motif longer than the DNA:</span> zero windows fit (n − m + 1 ≤ 0), so the result is <code>[]</code>.`;
        return;
      }
      $("win").style.opacity = 1;
      $("pat").style.opacity = 1;
      $("readout").innerHTML = `${n - m + 1} windows to check (n = ${n}, m = ${m}). Press <b>Scan</b> or <b>Step</b>.`;
    }

    function position() {
      const x = `translateX(${i * COL}px)`;
      $("win").style.transform = x;
      $("pat").style.transform = x;
      $("sI").textContent = i;
    }

    function clearMarks() {
      tTiles.forEach((t) => t.classList.remove("cmp-ok", "cmp-bad"));
      pTiles.forEach((t) => t.classList.remove("cmp-ok", "cmp-bad"));
    }

    function step() {
      if (done) return false;
      const n = dna.length;
      const m = pat.length;
      if (advance) {
        clearMarks();
        advance = false;
        i++;
        j = 0;
        if (i > n - m) {
          i = n - m;
          return finish();
        }
        position();
        keepInView($("stage"), (i + m) * COL);
        $("readout").innerHTML = `Slide window → <b>i = ${i}</b>`;
        return true;
      }
      const a = dna[i + j];
      const b = pat[j];
      comps++;
      $("sC").textContent = comps;
      const ok = a === b;
      tTiles[i + j].classList.add(ok ? "cmp-ok" : "cmp-bad");
      pTiles[j].classList.add(ok ? "cmp-ok" : "cmp-bad");
      if (ok) {
        j++;
        if (j === m) {
          hits.push(i);
          for (let k = i; k < i + m; k++) tTiles[k].classList.add("hit");
          $("hits").insertAdjacentHTML("beforeend", `<span class="mf-hit" style="transform:translateX(${i * COL}px)">▼${i}</span>`);
          $("sM").textContent = `[${hits.join(", ")}]`;
          const overlap = hits.length > 1 && hits[hits.length - 2] + m > i;
          $("readout").innerHTML = `<span class="ro-good">✓ Match at index ${i}!</span> All ${m} characters agree.${overlap ? ` <b>It overlaps</b> the previous match, which <code>str.count</code> would have missed.` : ""}`;
          advance = true;
        } else {
          $("readout").innerHTML = `text[${i + j - 1}] = ${tile(a, "nt-xs")} equals motif[${j - 1}] = ${tile(b, "nt-xs")}, so extend the comparison.`;
        }
      } else {
        $("readout").innerHTML = `text[${i + j}] = ${tile(a, "nt-xs")} ≠ motif[${j}] = ${tile(b, "nt-xs")}. <span class="ro-bad">Mismatch:</span> abandon this window early.`;
        advance = true;
      }
      return true;
    }

    function finish() {
      done = true;
      clearMarks();
      position();
      const n = dna.length;
      const m = pat.length;
      const worst = (n - m + 1) * m;
      $("readout").innerHTML = `<b>Scan complete.</b> ${n - m + 1} windows, <b>${comps}</b> character comparisons (worst case ${worst}; early exits saved ${worst - comps}). Result: <code>[${hits.join(", ")}]</code>`;
      pause();
      return false;
    }

    function tick() {
      if (!playing) return;
      if (step()) T.after(+$("speed").value, tick);
    }
    function play() {
      if (playing) return pause();
      if (done) build();
      if (done) return; // invalid input
      playing = true;
      $("play").textContent = "❚❚ Pause";
      tick();
    }
    function pause() {
      playing = false;
      T.clear();
      $("play").textContent = "▶ Scan";
    }

    $("play").addEventListener("click", play);
    $("step").addEventListener("click", () => {
      pause();
      if (done) build();
      step();
    });
    $("reset").addEventListener("click", build);
    const re = debounce(build, 300);
    $("dna").addEventListener("input", re);
    $("motif").addEventListener("input", re);
    build();
    return { destroy: () => T.clear() };
  }

  CBB.Visuals = { transcription, gc, hamming, motif };
})();
