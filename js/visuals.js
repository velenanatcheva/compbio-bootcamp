/* ==========================================================================
   Visuals — DOM-based interactive labs mounted into lesson placeholders.
   Each factory takes a mount element and returns { destroy() } so the app
   can clean up timers when the learner switches modules.
   UI text is Hebrew (RTL); sequence tracks, inputs and sliders are pinned
   to LTR because DNA is read 5′→3′ left-to-right.
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
  const ltr = (html) => `<span dir="ltr" class="ltr-inline">${html}</span>`;
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
          <div class="viz-title"><span class="viz-dot"></span>מעבדה חזותית<span class="viz-sep">·</span>${title}</div>
          <div class="viz-sub">${subtitle}</div>
        </div>
        ${body}
      </div>`;
  }

  const speedSelect = `
    <select class="select select-sm" data-ref="speed" aria-label="מהירות האנימציה" dir="ltr">
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
      "שעתוק",
      "RNA פולימראז פותח בועת שעתוק, קורא את גדיל התבנית מ-3′ ל-5′ ומסנתז mRNA מ-5′ ל-3′.",
      `
      <div class="viz-controls">
        <label class="field grow">
          <span class="field-label">גדיל מקודד (<span dir="ltr">5′→3′</span>)</span>
          <input class="input mono" dir="ltr" data-ref="seq" value="ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG" maxlength="60" spellcheck="false" autocomplete="off">
        </label>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ שעתוק</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap" dir="ltr">
        <div class="lane-labels">
          <span style="height:26px"><span>5′ <bdi>מקודד</bdi> 3′</span></span>
          <span style="height:16px"></span>
          <span style="height:26px"><span>3′ <bdi>תבנית</bdi> 5′</span></span>
          <span style="height:22px"></span>
          <span style="height:26px" class="lbl-rna">5′ mRNA 3′</span>
        </div>
        <div class="viz-stage" data-ref="stage"><div class="tx-track" data-ref="track"></div></div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>
      <div class="legend">
        ${tile("A")}<span>אדנין</span>${tile("T")}<span>תימין</span>${tile("G")}<span>גואנין</span>${tile("C")}<span>ציטוזין</span>${tile("U")}<span>אורציל (RNA)</span>
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
        setReadout(`<span class="ro-warn">הזינו לפחות בסיס אחד (A, ‏C, ‏G, ‏T).</span>`);
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
        `מוכן: סליל כפול באורך <b>${seq.length}</b> bp. לחצו <b>שעתוק</b> או <b>צעד</b>. גדיל התבנית הוא ההשלמה של מה שהקלדתם.`
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
        `<b>עמדה ${i + 1}/${seq.length}</b> · בסיס התבנית ${tile(COMP[b], "nt-xs")} מזדווג עם ${tile(toRNA(b), "nt-xs")} הנכנס` +
          `<div class="ro-seq">mRNA: ${ltr(`5′-<span class="mono">${mrna.length > 36 ? "…" + mrna.slice(-36) : mrna}</span>-3′`)}</div>`
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
        ? `<span class="ro-good">הרצף מתחיל ב-AUG, קודון ההתחלה (Met), ולכן ריבוזום יכול להתחיל לתרגם מכאן.</span>`
        : `<span class="ro-dim">אין קודון התחלה AUG בעמדה 1.</span>`;
      setReadout(
        `<b>השעתוק הושלם.</b> הסליל נסגר מחדש, וה-mRNA יוצא לדרכו אל הריבוזום.` +
          `<div class="ro-seq">קודונים: ${ltr(`<span class="mono">${codons}</span>`)}</div>${start}`
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
      $("play").textContent = "❚❚ השהיה";
      tick();
    }
    function pause() {
      playing = false;
      T.clear();
      $("play").textContent = "▶ שעתוק";
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
      "תכולת GC והתכת DNA",
      "ההרכב קובע את היציבות. העלו את הטמפרטורה וצפו באזורים העשירים ב-AT נמסים ראשונים.",
      `
      <div class="viz-controls col">
        <label class="field">
          <span class="field-label">רצף</span>
          <textarea class="input mono" dir="ltr" data-ref="seq" rows="2" spellcheck="false">ATATTTATAAATGCGCGGCCGCGGCATATTAAATTTAGCGGCCCGCGGGCATTATAATTA</textarea>
        </label>
        <div class="btn-row wrap">
          <label class="inline-field">הטיית GC <input type="range" dir="ltr" min="0" max="100" value="50" data-ref="bias"><output data-ref="biasOut" dir="ltr">50%</output></label>
          <label class="inline-field">אורך <input type="number" dir="ltr" class="input input-num" min="4" max="200" value="60" data-ref="len"></label>
          <button class="btn btn-sm" data-ref="random">⟳ רצף אקראי</button>
          <button class="btn btn-ghost btn-sm" data-ref="sample">דוגמה מ-Rosalind</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-k">אורך</div><div class="stat-v" dir="ltr" data-ref="sLen">–</div></div>
        <div class="stat stat-accent"><div class="stat-k">תכולת GC</div><div class="stat-v" dir="ltr" data-ref="sGC">–</div></div>
        <div class="stat"><div class="stat-k">T<sub>m</sub> משוערת</div><div class="stat-v" dir="ltr" data-ref="sTm">–</div><div class="stat-n" data-ref="sTmN"></div></div>
        <div class="stat"><div class="stat-k">קשרי מימן</div><div class="stat-v" dir="ltr" data-ref="sHB">–</div></div>
      </div>
      <div class="comp-bar" dir="ltr" data-ref="comp"></div>
      <div class="melt-head">
        <label class="inline-field grow">🌡 טמפרטורה
          <input type="range" dir="ltr" min="30" max="100" value="37" data-ref="temp" class="temp-range">
          <output data-ref="tempOut" class="temp-out" dir="ltr">37 °C</output>
        </label>
      </div>
      <div class="viz-stage" dir="ltr" data-ref="stage"><div class="duplex" data-ref="duplex"></div></div>
      <div class="viz-readout" data-ref="readout"></div>
      <p class="viz-foot">מודל מפושט: כל זוג נמס מעל ‎45 + 50·f °C, כאשר f הוא שיעור ה-GC בחלון של 9 bp (ועוד 3 °C אם הזוג עצמו הוא G·C). התכה אמיתית היא תהליך שיתופי, שתלוי בריכוז המלח ובאנרגיות הערימה של שכנים קרובים.</p>`
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
        ? { v: 2 * (n - gcN) + 4 * gcN, method: "כלל Wallace" }
        : { v: 64.9 + (41 * (gcN - 16.4)) / n, method: "נוסחת GC" };
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
        $("readout").innerHTML = `<span class="ro-warn">הזינו רצף DNA לניתוח.</span>`;
        return;
      }
      const frac = melted / n;
      const t = tm(seq);
      const state =
        frac === 0
          ? `<span class="ro-good">דו-גדילי לחלוטין.</span>`
          : frac < 0.5
            ? `<span class="ro-dim">נמס חלקית: "בועות" נפתחות קודם באזורים העשירים ב-AT.</span>`
            : frac < 1
              ? `<span class="ro-warn">ברובו חד-גדילי: עברנו את נקודת האמצע של ההתכה.</span>`
              : `<span class="ro-bad">דנטורציה מלאה: שני גדילים בודדים ונפרדים.</span>`;
      $("readout").innerHTML =
        `<b>${ltr(`${temp} °C`)}</b> · ${melted}/${n} זוגות בסיסים נמסו (${(frac * 100).toFixed(0)}%). ${state}` +
        (t ? `<div class="ro-dim small">טמפרטורת ההתכה המשוערת של הסליל כולו: ${ltr(`${t.v.toFixed(1)} °C`)} (${t.method}).${seq.length > MAX_DUPLEX ? ` מוצגים ${MAX_DUPLEX} ה-bp הראשונים.` : ""}</div>` : "");
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
    const KIND_HE = { ts: "טרנזיציה", tv: "טרנסברזיה" };
    root.innerHTML = shell(
      "מרחק המינג",
      "השוואה עמדה אחר עמדה: כל אי-התאמה היא מוטציה נקודתית אחת.",
      `
      <div class="viz-controls col">
        <div class="field-pair">
          <label class="field"><span class="field-label">רצף 1</span><input class="input mono" dir="ltr" data-ref="s1" value="${DEFAULT[0]}" maxlength="60" spellcheck="false" autocomplete="off"></label>
          <label class="field"><span class="field-label">רצף 2</span><input class="input mono" dir="ltr" data-ref="s2" value="${DEFAULT[1]}" maxlength="60" spellcheck="false" autocomplete="off"></label>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="scan">▶ סריקה</button>
          <button class="btn btn-sm" data-ref="mutate">⚡ מוטציה</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap" dir="ltr">
        <div class="lane-labels">
          <span style="height:26px"><bdi>רצף 1</bdi></span>
          <span style="height:22px"></span>
          <span style="height:26px"><bdi>רצף 2</bdi></span>
          <span style="height:16px"></span>
        </div>
        <div class="viz-stage" data-ref="stage"><div class="hm-track" data-ref="track"></div></div>
      </div>
      <div class="stat-grid stat-grid-6">
        <div class="stat stat-accent"><div class="stat-k">d<sub>H</sub></div><div class="stat-v" dir="ltr" data-ref="d">–</div></div>
        <div class="stat"><div class="stat-k">p-distance</div><div class="stat-v" dir="ltr" data-ref="p">–</div></div>
        <div class="stat"><div class="stat-k">Jukes–Cantor</div><div class="stat-v" dir="ltr" data-ref="jc">–</div></div>
        <div class="stat"><div class="stat-k"><span class="dot dot-ts"></span>טרנזיציות</div><div class="stat-v" dir="ltr" data-ref="ts">–</div></div>
        <div class="stat"><div class="stat-k"><span class="dot dot-tv"></span>טרנסברזיות</div><div class="stat-v" dir="ltr" data-ref="tv">–</div></div>
        <div class="stat"><div class="stat-k">Ts / Tv</div><div class="stat-v" dir="ltr" data-ref="tstv">–</div></div>
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
        $("readout").innerHTML = `<span class="ro-bad">האורכים שונים (${s1.length} לעומת ${s2.length}).</span> מרחק המינג אינו מוגדר במקרה הזה, ולכן הפונקציה שלכם צריכה לזרוק <code>ValueError</code>. כדי להשוות רצפים עם אינדלים צריך קודם לבצע <em>יישור</em> רצפים.`;
        return;
      }
      const d = ts + tv;
      const p = n ? d / n : 0;
      const jc = p < 0.75 ? -0.75 * Math.log(1 - (4 * p) / 3) : Infinity;
      set("d", d);
      set("p", n ? p.toFixed(3) : "–");
      set("jc", n ? (Number.isFinite(jc) ? jc.toFixed(3) : "∞") : "–");
      set("ts", ts);
      set("tv", tv);
      set("tstv", tv ? (ts / tv).toFixed(2) : ts ? "∞" : "–");
      if (flashAt < 0)
        $("readout").innerHTML = n
          ? `<b>${d}</b> מתוך <b>${n}</b> העמדות המיושרות שונות. לחצו <b>סריקה</b> כדי לצפות בלולאת ה-${ltr("O(n)")}, או <b>מוטציה</b> כדי להוסיף מוטציה נקודתית אקראית לרצף 2.`
          : `<span class="ro-warn">הזינו שני רצפים.</span>`;
    }

    function stopScan() {
      scanning = false;
      T.clear();
      $("scan").textContent = "▶ סריקה";
      cols.forEach((c) => c.classList.remove("scan", "seen"));
    }

    function scan() {
      if (scanning) return stopScan();
      if (s1.length !== s2.length || !s1.length) return;
      stopScan();
      scanning = true;
      $("scan").textContent = "❚❚ עצירה";
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
            ? `<span class="ro-good">התאמה</span>`
            : `<span class="${kd === "ts" ? "ro-warn" : "ro-bad"}">אי-התאמה (${KIND_HE[kd]})</span>`;
        $("readout").innerHTML = `${ltr(`<span class="mono">i = ${k}</span> · ${tile(s1[k], "nt-xs")} vs ${tile(s2[k], "nt-xs")}`)} ← ${verdict} · <b>מרחק עד כה = ${d}</b>`;
        k++;
        if (k < s1.length) T.after(+$("speed").value, tickScan);
        else
          T.after(+$("speed").value, () => {
            scanning = false;
            $("scan").textContent = "▶ סריקה";
            cols.forEach((c) => c.classList.remove("scan", "seen"));
            $("readout").innerHTML = `<b>הסריקה הסתיימה:</b> ${s1.length} השוואות עבור ${s1.length} עמדות, השוואה אחת לכל עמדה. לכן האלגוריתם הוא <b>${ltr("O(n)")}</b>. מרחק המינג = <b>${d}</b>.`;
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
      $("readout").innerHTML = `⚡ מוטציה נקודתית בעמדה <b>${k}</b>: ${ltr(`${tile(old, "nt-xs")} → ${tile(nb, "nt-xs")}`)} <span class="${kd === "ts" ? "ro-warn" : "ro-bad"}">(${KIND_HE[kd]})</span>. ${s1[k] === nb ? "המוטציה הזו דווקא <em>ביטלה</em> הבדל קיים: זו <b>מוטציה חוזרת</b> (back-mutation). פגיעות מרובות כאלה הן הסיבה שתיקון Jukes–Cantor נחוץ." : ""}`;
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
      "חיפוש מוטיב בחלון נע",
      "החלון זז בסיס אחד בכל פעם. כל צעד משווה תו בודד.",
      `
      <div class="viz-controls col">
        <div class="field-pair field-pair-wide">
          <label class="field"><span class="field-label">DNA (טקסט)</span><input class="input mono" dir="ltr" data-ref="dna" value="GATATATGCATATACTT" maxlength="60" spellcheck="false" autocomplete="off"></label>
          <label class="field"><span class="field-label">מוטיב (תבנית)</span><input class="input mono" dir="ltr" data-ref="motif" value="ATAT" maxlength="12" spellcheck="false" autocomplete="off"></label>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ סריקה</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage" dir="ltr" data-ref="stage">
        <div class="mf-track" data-ref="track">
          <div class="mf-hits" data-ref="hits"></div>
          <div class="mf-row" data-ref="text"></div>
          <div class="mf-idx" data-ref="idx"></div>
          <div class="mf-window" data-ref="win"></div>
          <div class="mf-pattern" data-ref="pat"></div>
        </div>
      </div>
      <div class="stat-grid stat-grid-4">
        <div class="stat"><div class="stat-k">חלון i</div><div class="stat-v" dir="ltr" data-ref="sI">–</div></div>
        <div class="stat"><div class="stat-k">השוואות</div><div class="stat-v" dir="ltr" data-ref="sC">0</div></div>
        <div class="stat"><div class="stat-k">מקרה גרוע ${ltr("(n−m+1)·m")}</div><div class="stat-v" dir="ltr" data-ref="sW">–</div></div>
        <div class="stat stat-accent"><div class="stat-k">התאמות</div><div class="stat-v mono" dir="ltr" data-ref="sM">[]</div></div>
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
          ? `<span class="ro-warn">מוטיב ריק:</span> אין מה לחפש, ולכן הפונקציה שלכם צריכה להחזיר <code>[]</code>.`
          : `<span class="ro-warn">המוטיב ארוך מה-DNA:</span> אף חלון לא נכנס (${ltr("n − m + 1 ≤ 0")}), ולכן התוצאה היא <code>[]</code>.`;
        return;
      }
      $("win").style.opacity = 1;
      $("pat").style.opacity = 1;
      $("readout").innerHTML = `יש ${n - m + 1} חלונות לבדוק (${ltr(`n = ${n}, m = ${m}`)}). לחצו <b>סריקה</b> או <b>צעד</b>.`;
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
        $("readout").innerHTML = `מזיזים את החלון ← <b>${ltr(`i = ${i}`)}</b>`;
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
          $("readout").innerHTML = `<span class="ro-good">✓ התאמה באינדקס ${i}!</span> כל ${m} התווים זהים.${overlap ? ` <b>היא חופפת</b> להתאמה הקודמת, כזו ש-<code>str.count</code> היה מפספס.` : ""}`;
          advance = true;
        } else {
          $("readout").innerHTML = `${ltr(`text[${i + j - 1}] = ${tile(a, "nt-xs")} = motif[${j - 1}] = ${tile(b, "nt-xs")}`)}: התווים שווים, ממשיכים להשוות.`;
        }
      } else {
        $("readout").innerHTML = `${ltr(`text[${i + j}] = ${tile(a, "nt-xs")} ≠ motif[${j}] = ${tile(b, "nt-xs")}`)}: <span class="ro-bad">אי-התאמה.</span> נוטשים את החלון הזה מוקדם.`;
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
      $("readout").innerHTML = `<b>הסריקה הסתיימה.</b> ${n - m + 1} חלונות, <b>${comps}</b> השוואות תווים (במקרה הגרוע ${worst}; יציאות מוקדמות חסכו ${worst - comps}). התוצאה: <code>[${hits.join(", ")}]</code>`;
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
      $("play").textContent = "❚❚ השהיה";
      tick();
    }
    function pause() {
      playing = false;
      T.clear();
      $("play").textContent = "▶ סריקה";
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
  // Shared building blocks for additional labs (visuals-advanced.js)
  CBB.VizKit = { COL, tile, ltr, pick, timers, debounce, shell, speedSelect, refs, keepInView };
})();
