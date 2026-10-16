/* ==========================================================================
   Advanced visual labs — translation (M5), ORF scanner (M6) and alignment
   scoring (M7). Built from the shared CBB.VizKit blocks; Hebrew UI with
   sequence tracks pinned LTR, exactly like the core labs.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const { COL, tile, ltr, timers, debounce, shell, speedSelect, refs, keepInView } = CBB.VizKit;
  const CODE = CBB.GENETIC_CODE;
  const AA3 = CBB.AA3;
  const STOPS = new Set(["UAA", "UAG", "UGA"]);
  const CODON_W = 3 * COL + 8; // three tiles + group gap (see .tl-codon in visuals.css)

  const cleanRNA = (s) => s.toUpperCase().replace(/T/g, "U").replace(/[^ACGU]/g, "");
  const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

  /* ───────────────────────── 5. Translation ───────────────────────── */
  function translation(root) {
    const T = timers();
    root.innerHTML = shell(
      "תרגום",
      "הריבוזום קורא את ה-mRNA קודון אחר קודון, ומחבר לשרשרת את חומצת האמינו של כל קודון.",
      `
      <div class="viz-controls">
        <label class="field grow">
          <span class="field-label">mRNA <span dir="ltr">(5′→3′)</span></span>
          <input class="input mono" dir="ltr" data-ref="seq" value="AUGGCCAUGGCGCCCAGAACUGAGAUCAAUAGUACCCGUAUUAACGGGUGA" maxlength="90" spellcheck="false" autocomplete="off">
        </label>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ תרגום</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage" dir="ltr" data-ref="stage"><div class="tl-track" data-ref="track"></div></div>
      <div class="protein-bar">
        <span class="pb-label">חלבון</span>
        <span class="pb-seq mono" dir="ltr" data-ref="protein">—</span>
        <span class="pb-len" data-ref="plen"></span>
      </div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let codons = [];
    let groups = [];
    let k = -1;
    let protein = "";
    let done = false;
    let playing = false;

    function build() {
      pause();
      const seq = cleanRNA($("seq").value).slice(0, 90);
      codons = [];
      for (let i = 0; i + 3 <= seq.length; i += 3) codons.push(seq.slice(i, i + 3));
      const rest = seq.slice(codons.length * 3);
      k = -1;
      protein = "";
      done = false;
      $("track").innerHTML =
        codons
          .map((c, i) => {
            const aa = CODE[c];
            return `
            <div class="tl-codon">
              <div class="tl-bases">${c.split("").map((b) => tile(b)).join("")}</div>
              <div class="tl-idx">${i * 3}</div>
              <div class="aa-chip ${aa === "*" ? "aa-stop" : aa === "M" ? "aa-met" : ""}" title="${AA3[aa]}">
                <b>${aa === "*" ? "STOP" : aa}</b><span>${aa === "*" ? "" : AA3[aa]}</span>
              </div>
            </div>`;
          })
          .join("") + (rest ? `<div class="tl-codon tl-rest"><div class="tl-bases">${rest.split("").map((b) => tile(b)).join("")}</div><div class="tl-idx">${codons.length * 3}</div></div>` : "");
      groups = [...$("track").querySelectorAll(".tl-codon:not(.tl-rest)")];
      $("stage").scrollLeft = 0;
      renderProtein();
      $("readout").innerHTML = codons.length
        ? `${codons.length} קודונים שלמים${rest ? `, ועוד ${rest.length === 1 ? "אות אחת" : "שתי אותיות"} בסוף שאינן קודון` : ""}. לחצו <b>תרגום</b> או <b>צעד</b>.`
        : `<span class="ro-warn">הזינו לפחות קודון אחד (שלוש אותיות מתוך A, ‏C, ‏G, ‏U).</span>`;
    }

    function renderProtein() {
      $("protein").textContent = protein || "—";
      $("plen").textContent = protein ? `${protein.length} חומצות אמינו` : "";
    }

    function step() {
      if (done) return false;
      if (k >= codons.length - 1) return finish("end");
      k++;
      groups.forEach((g, i) => g.classList.toggle("active", i === k));
      groups[k].classList.add("made");
      keepInView($("stage"), k * CODON_W);
      const codon = codons[k];
      const aa = CODE[codon];
      if (aa === "*") {
        groups.slice(k + 1).forEach((g) => g.classList.add("after-stop"));
        return finish("stop", codon);
      }
      protein += aa;
      renderProtein();
      $("readout").innerHTML = `קודון ${k + 1}: ${ltr(`<span class="mono">${codon}</span> → ${AA3[aa]} (${aa})`)}${aa === "M" && k === 0 ? ` · <span class="ro-good">מתיונין, חומצת האמינו הראשונה בכמעט כל חלבון.</span>` : ""}`;
      return true;
    }

    function finish(reason, codon) {
      done = true;
      pause();
      groups.forEach((g) => g.classList.remove("active"));
      if (reason === "stop") groups[k].classList.add("active");
      const result = `התוצאה: ${ltr(`<code>"${protein}"</code>`)}`;
      $("readout").innerHTML =
        reason === "stop"
          ? `<span class="ro-bad">קודון עצירה ${ltr(codon)}:</span> אין tRNA שמתאים לו, והחלבון משתחרר. הקודונים שאחריו לא נקראים. ${result}`
          : `<b>הרצף נגמר בלי קודון עצירה.</b> בתא אמיתי זה בעייתי, אבל בתרגיל פשוט מחזירים את מה שתורגם. ${result}`;
      return false;
    }

    function tick() {
      if (!playing) return;
      if (step()) T.after(+$("speed").value * 1.6, tick);
    }
    function play() {
      if (playing) return pause();
      if (done) build();
      if (!codons.length) return;
      playing = true;
      $("play").textContent = "❚❚ השהיה";
      tick();
    }
    function pause() {
      playing = false;
      T.clear();
      $("play").textContent = "▶ תרגום";
    }

    $("play").addEventListener("click", play);
    $("step").addEventListener("click", () => {
      pause();
      if (done) build();
      step();
    });
    $("reset").addEventListener("click", build);
    $("seq").addEventListener("input", debounce(build, 300));
    build();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 6. ORF scanner ───────────────────────── */
  function orf(root) {
    const T = timers();
    root.innerHTML = shell(
      "מסגרות קריאה ו-ORF",
      "שלוש מסגרות קריאה של אותו רצף. AUG בירוק, קודוני עצירה באדום, ואזורי ORF מוצללים.",
      `
      <div class="viz-controls">
        <label class="field grow">
          <span class="field-label">RNA</span>
          <input class="input mono" dir="ltr" data-ref="seq" value="GGAUGAAUGCCCUGAGGCCAUGUUUGGCUAAGC" maxlength="60" spellcheck="false" autocomplete="off">
        </label>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ סריקה</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap" dir="ltr">
        <div class="lane-labels">
          <span style="height:26px">RNA</span>
          <span style="height:16px"></span>
          <span style="height:32px"><bdi>מסגרת 0</bdi></span>
          <span style="height:32px"><bdi>מסגרת 1</bdi></span>
          <span style="height:32px"><bdi>מסגרת 2</bdi></span>
        </div>
        <div class="viz-stage" data-ref="stage">
          <div class="of-track" data-ref="track">
            <div class="of-seq" data-ref="seqRow"></div>
            <div class="of-idx" data-ref="idx"></div>
            <div class="of-frame" data-frame="0"></div>
            <div class="of-frame" data-frame="1"></div>
            <div class="of-frame" data-frame="2"></div>
          </div>
        </div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>
      <div class="legend">
        <span class="lg-box lg-start"></span><span>קודון התחלה AUG</span>
        <span class="lg-box lg-stop"></span><span>קודון עצירה</span>
        <span class="lg-box lg-orf"></span><span>ORF</span>
        <span class="lg-box lg-found"></span><span>ה-ORF הראשון (תשובת התרגיל)</span>
      </div>`
    );
    const $ = refs(root);
    let seq = "";
    let tiles = [];
    let frameRows = [];
    let mode = "search";
    let i = 0;
    let start = -1;
    let j = 0;
    let done = false;
    let playing = false;

    function build() {
      pause();
      seq = cleanRNA($("seq").value).slice(0, 60);
      const n = seq.length;
      $("seqRow").innerHTML = seq.split("").map((b) => tile(b)).join("");
      $("idx").innerHTML = seq
        .split("")
        .map((_, k) => `<span>${k % 3 === 0 || k === n - 1 ? k : ""}</span>`)
        .join("");
      tiles = [...$("seqRow").children];
      frameRows = [...root.querySelectorAll(".of-frame")];
      frameRows.forEach((row, f) => {
        let html = "";
        // ORF bands: every AUG in this frame to its first in-frame stop
        for (let a = f; a + 3 <= n; a += 3) {
          if (seq.slice(a, a + 3) !== "AUG") continue;
          for (let s = a + 3; s + 3 <= n; s += 3) {
            if (STOPS.has(seq.slice(s, s + 3))) {
              html += `<div class="of-band" data-start="${a}" style="left:${a * COL - 2}px;width:${(s + 3 - a) * COL}px"></div>`;
              break;
            }
          }
        }
        for (let a = f; a + 3 <= n; a += 3) {
          const c = seq.slice(a, a + 3);
          const cls = c === "AUG" ? "of-start" : STOPS.has(c) ? "of-stop" : "";
          html += `<div class="of-codon ${cls}" data-at="${a}" style="left:${a * COL}px;width:${3 * COL - 4}px">${c}</div>`;
        }
        row.innerHTML = html;
        row.style.width = `${n * COL}px`;
      });
      mode = "search";
      i = 0;
      start = -1;
      done = false;
      $("stage").scrollLeft = 0;
      $("readout").innerHTML =
        n >= 3
          ? `לחצו <b>סריקה</b> או <b>צעד</b> כדי לצפות באלגוריתם מחפש את ה-ORF הראשון.`
          : `<span class="ro-warn">הזינו רצף RNA באורך 3 לפחות.</span>`;
      if (n < 3) done = true;
    }

    function mark(from, len, cls) {
      tiles.forEach((t) => t.classList.remove(cls));
      for (let k = from; k < from + len && k < tiles.length; k++) tiles[k].classList.add(cls);
    }
    function markCodon(frame, at) {
      root.querySelectorAll(".of-codon.reading").forEach((c) => c.classList.remove("reading"));
      const cell = frameRows[frame] && frameRows[frame].querySelector(`.of-codon[data-at="${at}"]`);
      if (cell) cell.classList.add("reading");
    }

    function step() {
      if (done) return false;
      const n = seq.length;
      if (mode === "search") {
        if (i > n - 3) return finish(null);
        const c = seq.slice(i, i + 3);
        mark(i, 3, "probe");
        keepInView($("stage"), i * COL);
        if (c === "AUG") {
          mode = "read";
          start = i;
          j = i + 3;
          markCodon(start % 3, start);
          $("readout").innerHTML = `<span class="ro-good">נמצא AUG באינדקס ${i}.</span> קוראים קדימה בשלישיות, במסגרת ${start % 3}.`;
        } else {
          $("readout").innerHTML = `אינדקס ${i}: ${ltr(`<span class="mono">${c}</span>`)} אינו AUG. ממשיכים.`;
          i++;
        }
        return true;
      }
      // mode === "read": walk codons in the frame of `start`
      if (j + 3 > n) {
        $("readout").innerHTML = `<span class="ro-warn">הגענו לסוף הרצף בלי קודון עצירה במסגרת ${start % 3}.</span> ה-AUG באינדקס ${start} אינו ORF תקין, ולכן ממשיכים לחפש מאינדקס ${start + 1}.`;
        mode = "search";
        i = start + 1;
        mark(0, 0, "reading");
        markCodon(-1, -1);
        return true;
      }
      const c = seq.slice(j, j + 3);
      mark(j, 3, "probe");
      mark(start, j + 3 - start, "reading");
      markCodon(start % 3, j);
      keepInView($("stage"), j * COL);
      if (STOPS.has(c)) return finish({ start, end: j + 3, stop: c });
      $("readout").innerHTML = `קודון באינדקס ${j}: ${ltr(`<span class="mono">${c}</span>`)} אינו קודון עצירה. ממשיכים 3 עמדות קדימה.`;
      j += 3;
      return true;
    }

    function finish(found) {
      done = true;
      pause();
      mark(0, 0, "probe");
      if (!found) {
        mark(0, 0, "reading");
        $("readout").innerHTML = `<b>הסריקה הסתיימה.</b> אין ברצף ORF תקין, ולכן התוצאה היא ${ltr('<code>""</code>')}.`;
        return false;
      }
      const band = frameRows[found.start % 3].querySelector(`.of-band[data-start="${found.start}"]`);
      if (band) band.classList.add("found");
      const orfSeq = seq.slice(found.start, found.end);
      $("readout").innerHTML = `<span class="ro-good">✓ קודון עצירה ${ltr(found.stop)} באינדקס ${found.end - 3}!</span> ה-ORF הראשון הוא אינדקסים ${found.start}–${found.end - 1} (${(found.end - found.start) / 3} קודונים). התוצאה: ${ltr(`<code>"${orfSeq}"</code>`)}`;
      return false;
    }

    function tick() {
      if (!playing) return;
      if (step()) T.after(+$("speed").value, tick);
    }
    function play() {
      if (playing) return pause();
      if (done) build();
      if (done) return;
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
    $("seq").addEventListener("input", debounce(build, 300));
    build();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 7. Alignment scoring ───────────────────────── */
  function alignment(root) {
    const T = timers();
    const DEFAULT = ["GATTACA-GCTAG", "GACTACATGC-AG"];
    const CHART_H = 70;
    root.innerHTML = shell(
      "ניקוד יישור",
      "כל עמודה מקבלת ציון. הסכום המצטבר הוא ציון היישור כולו.",
      `
      <div class="viz-controls col">
        <div class="field-pair">
          <label class="field"><span class="field-label">שורה 1</span><input class="input mono" dir="ltr" data-ref="s1" value="${DEFAULT[0]}" maxlength="40" spellcheck="false" autocomplete="off"></label>
          <label class="field"><span class="field-label">שורה 2</span><input class="input mono" dir="ltr" data-ref="s2" value="${DEFAULT[1]}" maxlength="40" spellcheck="false" autocomplete="off"></label>
        </div>
        <div class="btn-row wrap">
          <label class="inline-field">התאמה <input type="number" dir="ltr" class="input input-num" data-ref="match" value="1" min="-10" max="10"></label>
          <label class="inline-field">אי-התאמה <input type="number" dir="ltr" class="input input-num" data-ref="mismatch" value="-1" min="-10" max="10"></label>
          <label class="inline-field">פער <input type="number" dir="ltr" class="input input-num" data-ref="gap" value="-2" min="-10" max="10"></label>
          <button class="btn btn-primary btn-sm" data-ref="scan">▶ סריקה</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap" dir="ltr">
        <div class="lane-labels">
          <span style="height:26px"><bdi>שורה 1</bdi></span>
          <span style="height:18px"></span>
          <span style="height:26px"><bdi>שורה 2</bdi></span>
          <span style="height:24px"><bdi>ציון</bdi></span>
          <span style="height:${CHART_H + 8}px"><bdi>מצטבר</bdi></span>
        </div>
        <div class="viz-stage" data-ref="stage"><div class="al-track al-live" data-ref="track"></div><div data-ref="chart"></div></div>
      </div>
      <div class="stat-grid stat-grid-6">
        <div class="stat stat-accent"><div class="stat-k">ציון</div><div class="stat-v" dir="ltr" data-ref="score">–</div></div>
        <div class="stat"><div class="stat-k">אחוז זהות</div><div class="stat-v" dir="ltr" data-ref="ident">–</div></div>
        <div class="stat"><div class="stat-k">ציון בתרגיל ${ltr("(+1/−1)")}</div><div class="stat-v" dir="ltr" data-ref="task">–</div></div>
        <div class="stat"><div class="stat-k">התאמות</div><div class="stat-v" dir="ltr" data-ref="nm">–</div></div>
        <div class="stat"><div class="stat-k">אי-התאמות</div><div class="stat-v" dir="ltr" data-ref="nx">–</div></div>
        <div class="stat"><div class="stat-k">פערים</div><div class="stat-v" dir="ltr" data-ref="ng">–</div></div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let s1 = "";
    let s2 = "";
    let cols = [];
    let cumulative = [];
    let kinds = [];
    let scanning = false;

    const clean = (s) => s.toUpperCase().replace(/[^A-Z-]/g, "");
    const num = (r, d) => (Number.isFinite(parseFloat($(r).value)) ? parseFloat($(r).value) : d);
    const scheme = () => ({ match: num("match", 1), mismatch: num("mismatch", -1), gap: num("gap", -2) });
    const kindOf = (a, b) => (a === "-" || b === "-" ? "gap" : a === b ? "match" : "mismatch");
    const KIND_HE = { match: "התאמה", mismatch: "אי-התאמה", gap: "פער" };
    const tileOf = (x) => (x === "-" ? '<span class="nt nt-gap">–</span>' : tile(x));

    function chart(upto) {
      const n = cumulative.length;
      if (!n) return "";
      const vals = [0, ...cumulative];
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const span = hi - lo || 1;
      const y = (v) => 6 + (CHART_H - 12) * (1 - (v - lo) / span);
      const x = (k) => k * COL + 13; // centre of column k
      const pts = cumulative.map((v, k) => `${x(k)},${y(v)}`);
      const shown = upto === undefined ? pts : pts.slice(0, upto + 1);
      const zero = y(0);
      return `
        <svg class="al-chart" width="${n * COL}" height="${CHART_H}" viewBox="0 0 ${n * COL} ${CHART_H}">
          <line x1="0" x2="${n * COL}" y1="${zero}" y2="${zero}" class="al-zero"/>
          <text x="2" y="${zero - 3}" class="al-zero-label">0</text>
          <polyline points="${shown.join(" ")}" class="al-line"/>
          ${shown.map((p, k) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="3" class="al-dot al-dot-${kinds[k]}"/>`).join("")}
        </svg>`;
    }

    function render() {
      stopScan();
      s1 = clean($("s1").value).slice(0, 40);
      s2 = clean($("s2").value).slice(0, 40);
      const sc = scheme();
      const n = Math.max(s1.length, s2.length);
      let total = 0;
      let task = 0;
      let nm = 0;
      let nx = 0;
      let ng = 0;
      cumulative = [];
      kinds = [];
      let html = "";
      for (let k = 0; k < n; k++) {
        const a = s1[k];
        const b = s2[k];
        if (a === undefined || b === undefined) {
          html += `<div class="al-col al-missing">${a ? tileOf(a) : '<span class="nt nt-gap">?</span>'}<span class="al-mark"> </span>${b ? tileOf(b) : '<span class="nt nt-gap">?</span>'}<span class="al-score">?</span></div>`;
          continue;
        }
        const kind = kindOf(a, b);
        const s = sc[kind];
        total += s;
        task += a === b ? 1 : -1;
        if (kind === "match") nm++;
        else if (kind === "mismatch") nx++;
        else ng++;
        cumulative.push(total);
        kinds.push(kind);
        html += `<div class="al-col al-${kind}">${tileOf(a)}<span class="al-mark">${kind === "match" ? "│" : kind === "mismatch" ? "·" : " "}</span>${tileOf(b)}<span class="al-score">${signed(s)}</span></div>`;
      }
      $("track").innerHTML = html;
      cols = [...$("track").querySelectorAll(".al-col")];
      const set = (r, v) => ($(r).textContent = v);
      if (s1.length !== s2.length) {
        $("chart").innerHTML = "";
        ["score", "ident", "task", "nm", "nx", "ng"].forEach((r) => set(r, "—"));
        $("readout").innerHTML = `<span class="ro-bad">האורכים שונים (${s1.length} לעומת ${s2.length}).</span> בשתי שורות של יישור חייב להיות אותו מספר עמודות: השלימו פערים (<code>-</code>), או שהפונקציה שלכם צריכה לזרוק <code>ValueError</code>.`;
        return;
      }
      $("chart").innerHTML = chart();
      set("score", n ? signed(total) : "–");
      set("ident", n ? `${((100 * nm) / n).toFixed(1)}%` : "–");
      set("task", n ? signed(task) : "–");
      set("nm", nm);
      set("nx", nx);
      set("ng", ng);
      $("readout").innerHTML = n
        ? `ציון היישור בסכמה הנוכחית: <b>${ltr(signed(total))}</b>. בסכמת התרגיל, שבה כל תו (כולל <code>-</code>) מושווה כפי שהוא, הציון הוא <b>${ltr(signed(task))}</b>. לחצו <b>סריקה</b> כדי לצפות בחישוב.`
        : `<span class="ro-warn">הזינו שתי שורות של יישור.</span>`;
    }

    function stopScan() {
      scanning = false;
      T.clear();
      $("scan").textContent = "▶ סריקה";
      cols.forEach((c) => c.classList.remove("scan", "pending"));
    }

    function scan() {
      if (scanning) return render();
      if (s1.length !== s2.length || !s1.length) return;
      stopScan();
      scanning = true;
      $("scan").textContent = "❚❚ עצירה";
      const sc = scheme();
      cols.forEach((c) => c.classList.add("pending"));
      let k = 0;
      const tickScan = () => {
        if (!scanning) return;
        cols.forEach((c, j) => {
          c.classList.toggle("scan", j === k);
          c.classList.toggle("pending", j > k);
        });
        $("chart").innerHTML = chart(k);
        keepInView($("stage"), k * COL);
        const kind = kinds[k];
        const cls = kind === "match" ? "ro-good" : kind === "mismatch" ? "ro-warn" : "ro-bad";
        $("readout").innerHTML = `עמודה ${k}: ${ltr(`${tileOf(s1[k])} vs ${tileOf(s2[k])}`)} ← <span class="${cls}">${KIND_HE[kind]}, ${ltr(signed(sc[kind]))}</span> · סכום מצטבר = <b>${ltr(signed(cumulative[k]))}</b>`;
        k++;
        if (k < cols.length) T.after(+$("speed").value * 1.4, tickScan);
        else
          T.after(+$("speed").value * 1.4, () => {
            scanning = false;
            $("scan").textContent = "▶ סריקה";
            cols.forEach((c) => c.classList.remove("scan", "pending"));
            $("readout").innerHTML = `<b>הסריקה הסתיימה:</b> ${cols.length} עמודות, ופעולת חיבור אחת לכל עמודה, ולכן ${ltr("O(n)")}. ציון היישור = <b>${ltr(signed(cumulative[cumulative.length - 1]))}</b>.`;
          });
      };
      tickScan();
    }

    $("scan").addEventListener("click", scan);
    $("reset").addEventListener("click", () => {
      $("s1").value = DEFAULT[0];
      $("s2").value = DEFAULT[1];
      $("match").value = 1;
      $("mismatch").value = -1;
      $("gap").value = -2;
      render();
    });
    const re = debounce(render, 250);
    ["s1", "s2", "match", "mismatch", "gap"].forEach((r) => $(r).addEventListener("input", re));
    render();
    return { destroy: () => T.clear() };
  }

  Object.assign(CBB.Visuals, { translation, orf, alignment });
})();
