/* ==========================================================================
   Expert visual labs — reverse complement (M8), k-mer counter (M9),
   profile/consensus builder (M10) and the Needleman–Wunsch DP grid (M11).
   Built from the shared CBB.VizKit blocks; Hebrew UI, LTR sequence tracks.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const { COL, tile, ltr, timers, debounce, shell, speedSelect, refs, keepInView } = CBB.VizKit;
  const COMP = { A: "T", T: "A", G: "C", C: "G" };
  const cleanDNA = (s) => s.toUpperCase().replace(/[^ACGT]/g, "");

  /** Shared play/pause/step wiring for step-driven labs. */
  function stepper($, T, { step, reset, playLabel, speedFactor = 1 }) {
    let playing = false;
    const pause = () => {
      playing = false;
      T.clear();
      $("play").textContent = playLabel;
    };
    const tick = () => {
      if (!playing) return;
      if (step()) T.after(+$("speed").value * speedFactor, tick);
      else pause();
    };
    $("play").addEventListener("click", () => {
      if (playing) return pause();
      if (step.done()) reset();
      if (step.done()) return;
      playing = true;
      $("play").textContent = "❚❚ השהיה";
      tick();
    });
    $("step").addEventListener("click", () => {
      pause();
      if (step.done()) reset();
      step();
    });
    return { pause };
  }

  /* ───────────────────────── 8. Reverse complement ───────────────────────── */
  function revcomp(root) {
    const T = timers();
    root.innerHTML = shell(
      "השלמה הפוכה",
      "שלב 1: משלימים כל בסיס. שלב 2: קוראים את הגדיל המשלים מהסוף להתחלה.",
      `
      <div class="viz-controls">
        <label class="field grow">
          <span class="field-label">גדיל עליון <span dir="ltr">(5′→3′)</span></span>
          <input class="input mono" dir="ltr" data-ref="seq" value="ATGCCGTTAG" maxlength="40" spellcheck="false" autocomplete="off">
        </label>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ הדגמה</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage-wrap" dir="ltr">
        <div class="lane-labels">
          <span style="height:26px"><span>5′ <bdi>עליון</bdi> 3′</span></span>
          <span style="height:16px"></span>
          <span style="height:26px"><span>3′ <bdi>משלים</bdi> 5′</span></span>
          <span style="height:34px"></span>
          <span style="height:26px" class="lbl-rna"><span>5′ <bdi>השלמה הפוכה</bdi> 3′</span></span>
        </div>
        <div class="viz-stage" data-ref="stage">
          <div class="rc-duplex" data-ref="duplex"></div>
          <div class="rc-gap"><span class="rc-arrow" data-ref="arrow">← קוראים מימין לשמאל</span></div>
          <div class="rc-result" data-ref="result"></div>
        </div>
      </div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let seq = "";
    let cols = [];
    let out = [];
    let phase = "complement";
    let k = 0;

    function reset() {
      ctl && ctl.pause();
      seq = cleanDNA($("seq").value).slice(0, 40);
      phase = "complement";
      k = 0;
      $("duplex").innerHTML = seq
        .split("")
        .map(
          (b) => `
        <div class="rc-col">
          ${tile(b)}
          <span class="tx-bond ${b === "G" || b === "C" ? "b3" : "b2"}"><i></i><i></i><i></i></span>
          ${tile(COMP[b], "rc-comp")}
        </div>`
        )
        .join("");
      $("result").innerHTML = seq
        .split("")
        .map(() => '<span class="nt nt-gap rc-slot">·</span>')
        .join("");
      cols = [...$("duplex").querySelectorAll(".rc-col")];
      out = [...$("result").children];
      $("arrow").classList.remove("on");
      $("stage").scrollLeft = 0;
      $("readout").innerHTML = seq
        ? `רצף באורך <b>${seq.length}</b>. לחצו <b>הדגמה</b> או <b>צעד</b>.`
        : `<span class="ro-warn">הזינו רצף DNA.</span>`;
    }

    function step() {
      const n = seq.length;
      if (!n || phase === "done") return false;
      cols.forEach((c) => c.classList.remove("src"));
      if (phase === "complement") {
        const b = seq[k];
        cols[k].classList.add("filled");
        keepInView($("stage"), k * COL);
        $("readout").innerHTML = `<b>שלב 1 · השלמה</b>, עמדה ${k}: ${ltr(`${tile(b, "nt-xs")} ↔ ${tile(COMP[b], "nt-xs")}`)}`;
        k++;
        if (k === n) {
          phase = "reverse";
          k = 0;
          $("arrow").classList.add("on");
        }
        return true;
      }
      // phase === "reverse": result[k] = complement[n - 1 - k]
      const src = n - 1 - k;
      const b = COMP[seq[src]];
      cols[src].classList.add("src");
      out[k].outerHTML = tile(b, "rc-new");
      out = [...$("result").children];
      keepInView($("stage"), k * COL);
      $("readout").innerHTML = `<b>שלב 2 · היפוך</b>: עמדה ${k} בהשלמה ההפוכה = בסיס ${src} בגדיל המשלים (${ltr(tile(b, "nt-xs"))}). קוראים את הגדיל המשלים מהסוף, מ-5′ שלו.`;
      k++;
      if (k === n) {
        phase = "done";
        const rc = seq.split("").reverse().map((x) => COMP[x]).join("");
        $("readout").innerHTML =
          `<b>סיום.</b> ההשלמה ההפוכה: ${ltr(`<code>${rc}</code>`)}` +
          (rc === seq
            ? ` <span class="ro-good">הרצף הוא פלינדרום ביולוגי: הוא שווה להשלמה ההפוכה של עצמו.</span>`
            : ` <span class="ro-dim">שימו לב שהיא שונה גם מהרצף המקורי וגם מההשלמה בלבד.</span>`);
        return false;
      }
      return true;
    }
    step.done = () => !seq.length || phase === "done";

    const ctl = stepper($, T, { step, reset, playLabel: "▶ הדגמה" });
    $("reset").addEventListener("click", reset);
    $("seq").addEventListener("input", debounce(reset, 300));
    reset();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 9. k-mer counter ───────────────────────── */
  function kmers(root) {
    const T = timers();
    root.innerHTML = shell(
      "ספירת k-mers",
      "חלון באורך k זז לאורך הרצף, ובכל צעד הספירה של ה-k-mer שבתוכו עולה ב-1.",
      `
      <div class="viz-controls col">
        <label class="field">
          <span class="field-label">רצף</span>
          <input class="input mono" dir="ltr" data-ref="seq" value="ACGTTGCATGTCGCATGATGCATGAGAGCT" maxlength="60" spellcheck="false" autocomplete="off">
        </label>
        <div class="btn-row wrap">
          <label class="inline-field">k <input type="range" dir="ltr" min="1" max="8" value="4" data-ref="k"><output data-ref="kOut" dir="ltr">4</output></label>
          <button class="btn btn-primary btn-sm" data-ref="play">▶ סריקה</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-sm" data-ref="all">⏭ ספירה מלאה</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage" dir="ltr" data-ref="stage">
        <div class="mf-track">
          <div class="mf-row" data-ref="text"></div>
          <div class="mf-idx" data-ref="idx"></div>
          <div class="mf-window km-window" data-ref="win"></div>
        </div>
      </div>
      <div class="stat-grid stat-grid-4">
        <div class="stat"><div class="stat-k">חלונות ${ltr("n − k + 1")}</div><div class="stat-v" dir="ltr" data-ref="sW">–</div></div>
        <div class="stat stat-accent"><div class="stat-k">k-mers שונים</div><div class="stat-v" dir="ltr" data-ref="sD">0</div></div>
        <div class="stat"><div class="stat-k">אפשריים ${ltr("4<sup>k</sup>")}</div><div class="stat-v" dir="ltr" data-ref="sP">–</div></div>
        <div class="stat"><div class="stat-k">השכיח ביותר</div><div class="stat-v mono" dir="ltr" data-ref="sTop">–</div></div>
      </div>
      <div class="km-table" data-ref="table"></div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let seq = "";
    let k = 4;
    let i = 0;
    let counts = new Map();
    let tTiles = [];

    function reset() {
      ctl && ctl.pause();
      seq = cleanDNA($("seq").value).slice(0, 60);
      k = +$("k").value;
      $("kOut").textContent = k;
      i = 0;
      counts = new Map();
      $("text").innerHTML = seq.split("").map((b) => tile(b)).join("");
      $("idx").innerHTML = seq
        .split("")
        .map((_, j) => `<span>${j}</span>`)
        .join("");
      tTiles = [...$("text").children];
      $("win").style.width = `${k * COL}px`;
      $("win").style.transform = "translateX(0px)";
      $("win").style.opacity = seq.length >= k ? 1 : 0;
      const windows = Math.max(0, seq.length - k + 1);
      $("sW").textContent = windows;
      $("sP").textContent = (4 ** k).toLocaleString("en-US");
      $("stage").scrollLeft = 0;
      render(null);
      $("readout").innerHTML = windows
        ? `${windows} חלונות לבדוק. לחצו <b>סריקה</b>, <b>צעד</b> או <b>ספירה מלאה</b>.`
        : `<span class="ro-warn">k גדול מאורך הרצף: אין אף חלון, והתוצאה היא מילון ריק ${ltr("<code>{}</code>")}.</span>`;
    }

    function render(current) {
      const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
      const max = rows.length ? rows[0][1] : 1;
      $("sD").textContent = counts.size;
      $("sTop").textContent = rows.length ? `${rows[0][0]} ×${rows[0][1]}` : "–";
      $("table").innerHTML = rows.length
        ? rows
            .slice(0, 14)
            .map(
              ([kmer, c]) => `
          <div class="km-row ${kmer === current ? "just" : ""}">
            <span class="km-kmer mono" dir="ltr">${kmer}</span>
            <span class="km-bar"><i style="width:${(100 * c) / max}%"></i></span>
            <span class="km-count" dir="ltr">${c}</span>
          </div>`
            )
            .join("") + (rows.length > 14 ? `<div class="km-more">ועוד ${rows.length - 14} k-mers שמופיעים פחות</div>` : "")
        : `<div class="km-empty">המילון עדיין ריק</div>`;
    }

    function step() {
      if (i > seq.length - k) return false;
      const kmer = seq.slice(i, i + k);
      counts.set(kmer, (counts.get(kmer) || 0) + 1);
      tTiles.forEach((t, j) => t.classList.toggle("in-win", j >= i && j < i + k));
      $("win").style.transform = `translateX(${i * COL}px)`;
      keepInView($("stage"), (i + k) * COL);
      render(kmer);
      const c = counts.get(kmer);
      $("readout").innerHTML = `חלון ${i}: ${ltr(`<code>dna[${i}:${i + k}]</code> = <code>${kmer}</code>`)} → ${
        c === 1 ? `מפתח חדש במילון, ספירה 1.` : `<span class="ro-good">כבר במילון!</span> הספירה עולה ל-${c}.`
      }`;
      i++;
      if (i > seq.length - k) {
        $("readout").innerHTML += ` <b>הסריקה הסתיימה:</b> ${counts.size} k-mers שונים מתוך ${seq.length - k + 1} חלונות.`;
        return false;
      }
      return true;
    }
    step.done = () => i > seq.length - k;

    const ctl = stepper($, T, { step, reset, playLabel: "▶ סריקה" });
    $("all").addEventListener("click", () => {
      ctl.pause();
      if (step.done()) reset();
      while (step());
    });
    $("reset").addEventListener("click", reset);
    $("k").addEventListener("input", reset);
    $("seq").addEventListener("input", debounce(reset, 300));
    reset();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 10. Profile & consensus ───────────────────────── */
  function profile(root) {
    const T = timers();
    const DEFAULT = "ATCCAGCT\nGGGCAACT\nATGGATCT\nAAGCAACC\nTTGGAACT\nATGCCATT\nATGGCACT";
    root.innerHTML = shell(
      "מטריצת פרופיל וקונצנזוס",
      "סופרים כל עמודה ביישור, ובוחרים את הבסיס השכיח ביותר. בתיקו בוחרים לפי הסדר A, ‏C, ‏G, ‏T.",
      `
      <div class="viz-controls">
        <label class="field grow">
          <span class="field-label">יישור (רצף בכל שורה)</span>
          <textarea class="input mono" dir="ltr" data-ref="seqs" rows="4" spellcheck="false">${DEFAULT}</textarea>
        </label>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ סריקה</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage" dir="ltr" data-ref="stage"><div class="pf-grid" data-ref="grid"></div></div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let rows = [];
    let n = 0;
    let j = 0;
    let ok = false;

    function reset() {
      ctl && ctl.pause();
      rows = $("seqs")
        .value.split(/\n+/)
        .map(cleanDNA)
        .filter(Boolean)
        .slice(0, 12);
      n = rows.length ? rows[0].length : 0;
      ok = rows.length > 0 && rows.every((r) => r.length === n) && n <= 40;
      j = 0;
      const label = (x, cls = "") => `<span class="pf-label ${cls}">${x}</span>`;
      const line = (lab, cells, cls = "") => `<div class="pf-line ${cls}">${lab}${cells}</div>`;
      let html = rows.map((r, ri) => line(label(ri + 1), r.split("").map((b, ci) => `<span class="pf-cell" data-c="${ci}">${tile(b)}</span>`).join(""), "pf-row")).join("");
      html += `<div class="pf-divider"></div>`;
      html += "ACGT"
        .split("")
        .map((b) => line(label(tile(b)), Array.from({ length: n }, (_, ci) => `<span class="pf-count" data-c="${ci}" data-b="${b}"></span>`).join(""), "pf-prof"))
        .join("");
      html += line(label("★", "pf-star"), Array.from({ length: n }, (_, ci) => `<span class="pf-cons" data-c="${ci}"><span class="nt nt-gap">·</span></span>`).join(""), "pf-consline");
      $("grid").innerHTML = ok ? html : "";
      $("stage").scrollLeft = 0;
      $("readout").innerHTML = !rows.length
        ? `<span class="ro-warn">הזינו לפחות רצף אחד.</span>`
        : !ok
          ? `<span class="ro-bad">כל השורות ביישור חייבות להיות באותו אורך</span> (ועד 40 עמודות במעבדה). אורכים: ${ltr(rows.map((r) => r.length).join(", "))}.`
          : `${rows.length} רצפים, ${n} עמודות. לחצו <b>סריקה</b> או <b>צעד</b>.`;
    }

    function step() {
      if (!ok || j >= n) return false;
      const column = rows.map((r) => r[j]);
      const counts = { A: 0, C: 0, G: 0, T: 0 };
      column.forEach((b) => counts[b]++);
      const best = "ACGT".split("").reduce((x, b) => (counts[b] > counts[x] ? b : x), "A");
      const tied = "ACGT".split("").filter((b) => counts[b] === counts[best]);
      root.querySelectorAll(".pf-cell, .pf-count, .pf-cons").forEach((el) => el.classList.toggle("col-on", +el.dataset.c === j));
      "ACGT".split("").forEach((b) => {
        const cell = root.querySelector(`.pf-count[data-c="${j}"][data-b="${b}"]`);
        cell.textContent = counts[b];
        cell.style.setProperty("--a", counts[b] / rows.length);
        cell.classList.toggle("pf-max", b === best);
        cell.classList.toggle("pf-tie", tied.length > 1 && tied.includes(b));
      });
      root.querySelector(`.pf-cons[data-c="${j}"]`).innerHTML = tile(best);
      keepInView($("stage"), (j + 1) * COL);
      $("readout").innerHTML =
        `עמודה ${j}: ${ltr(`A=${counts.A}, C=${counts.C}, G=${counts.G}, T=${counts.T}`)} → ${ltr(tile(best, "nt-xs"))}` +
        (tied.length > 1 ? ` <span class="ro-warn">תיקו בין ${tied.join(", ")}: נבחר ${best}, הראשון באלפבית.</span>` : "");
      j++;
      if (j >= n) {
        const cons = [...root.querySelectorAll(".pf-cons")].map((c) => c.textContent.trim()).join("");
        $("readout").innerHTML += ` <b>הקונצנזוס:</b> ${ltr(`<code>${cons}</code>`)}`;
        return false;
      }
      return true;
    }
    step.done = () => !ok || j >= n;

    const ctl = stepper($, T, { step, reset, playLabel: "▶ סריקה", speedFactor: 2 });
    $("reset").addEventListener("click", reset);
    $("seqs").addEventListener("input", debounce(reset, 300));
    reset();
    return { destroy: () => T.clear() };
  }

  /* ───────────────────────── 11. Needleman–Wunsch DP grid ───────────────────────── */
  function dp(root) {
    const T = timers();
    root.innerHTML = shell(
      "מטריצת Needleman–Wunsch",
      "אתחול → מילוי → traceback. כל תא הוא המקסימום מבין שלושה שכנים.",
      `
      <div class="viz-controls col">
        <div class="field-pair">
          <label class="field"><span class="field-label">seq1 (שורות)</span><input class="input mono" dir="ltr" data-ref="s1" value="GATTACA" maxlength="10" spellcheck="false" autocomplete="off"></label>
          <label class="field"><span class="field-label">seq2 (עמודות)</span><input class="input mono" dir="ltr" data-ref="s2" value="GCATGCA" maxlength="10" spellcheck="false" autocomplete="off"></label>
        </div>
        <div class="btn-row wrap">
          <label class="inline-field">התאמה <input type="number" dir="ltr" class="input input-num" data-ref="match" value="1" min="-10" max="10"></label>
          <label class="inline-field">אי-התאמה <input type="number" dir="ltr" class="input input-num" data-ref="mismatch" value="-1" min="-10" max="10"></label>
          <label class="inline-field">פער <input type="number" dir="ltr" class="input input-num" data-ref="gap" value="-2" min="-10" max="10"></label>
        </div>
        <div class="btn-row wrap">
          <button class="btn btn-primary btn-sm" data-ref="play">▶ אתחול ומילוי</button>
          <button class="btn btn-sm" data-ref="step">צעד</button>
          <button class="btn btn-sm" data-ref="trace">↩ traceback</button>
          <button class="btn btn-ghost btn-sm" data-ref="reset">איפוס</button>
          ${speedSelect}
        </div>
      </div>
      <div class="viz-stage dp-stage" dir="ltr" data-ref="stage"><table class="dp-table dp-live" data-ref="grid"></table></div>
      <div class="dp-legend">
        <span class="lg-box dp-lg-init"></span><span>אתחול (התרגיל)</span>
        <span class="lg-box dp-lg-cur"></span><span>התא הנוכחי</span>
        <span class="lg-box dp-lg-nb"></span><span>שכנים</span>
        <span class="lg-box dp-lg-path"></span><span>מסלול ה-traceback</span>
      </div>
      <div class="viz-readout" data-ref="readout"></div>`
    );
    const $ = refs(root);
    let s1 = "";
    let s2 = "";
    let sc = {};
    let F = [];
    let order = [];
    let pos = 0;
    let cells = [];

    const num = (r, d) => (Number.isFinite(parseFloat($(r).value)) ? parseFloat($(r).value) : d);
    const cell = (i, j) => cells[i][j];
    const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

    function reset() {
      ctl && ctl.pause();
      s1 = cleanDNA($("s1").value).slice(0, 10);
      s2 = cleanDNA($("s2").value).slice(0, 10);
      sc = { match: num("match", 1), mismatch: num("mismatch", -1), gap: num("gap", -2) };
      const n = s1.length;
      const m = s2.length;
      F = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
      // Visit order: the corner, then the first row/column (initialisation), then row by row
      order = [[0, 0]];
      for (let d = 1; d <= Math.max(n, m); d++) {
        if (d <= n) order.push([d, 0]);
        if (d <= m) order.push([0, d]);
      }
      for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) order.push([i, j]);
      pos = 0;
      const head = `<tr><th class="dp-corner"></th><th>-</th>${s2.split("").map((c) => `<th>${c}</th>`).join("")}</tr>`;
      const body = F.map((row, i) => `<tr><th>${i === 0 ? "-" : s1[i - 1]}</th>${row.map((_, j) => `<td data-i="${i}" data-j="${j}"></td>`).join("")}</tr>`).join("");
      $("grid").innerHTML = head + body;
      cells = F.map((row, i) => row.map((_, j) => $("grid").querySelector(`td[data-i="${i}"][data-j="${j}"]`)));
      $("stage").scrollLeft = 0;
      $("readout").innerHTML = `מטריצה בגודל ${ltr(`${n + 1} × ${m + 1}`)} (‏${ltr("len(seq1) + 1")} שורות, ${ltr("len(seq2) + 1")} עמודות). לחצו <b>אתחול ומילוי</b> או <b>צעד</b>.`;
    }

    function clearMarks() {
      $("grid").querySelectorAll("td").forEach((td) => td.classList.remove("dp-cur", "dp-nb"));
    }

    function step() {
      if (pos >= order.length) return false;
      clearMarks();
      const [i, j] = order[pos++];
      const td = cell(i, j);
      td.classList.add("dp-cur");
      if (i === 0 || j === 0) {
        F[i][j] = (i + j) * sc.gap;
        td.textContent = fmt(F[i][j]);
        td.classList.add("dp-init");
        $("readout").innerHTML =
          i === 0 && j === 0
            ? `<b>אתחול:</b> ${ltr("F[0][0] = 0")}. יישור של שתי מחרוזות ריקות לא עולה כלום.`
            : `<b>אתחול:</b> ${ltr(i === 0 ? `F[0][${j}] = ${j} × (${sc.gap}) = ${fmt(F[i][j])}` : `F[${i}][0] = ${i} × (${sc.gap}) = ${fmt(F[i][j])}`)}: ${
                i === 0 ? `${j} תווים מ-seq2 מול פערים.` : `${i} תווים מ-seq1 מול פערים.`
              }`;
      } else {
        const s = s1[i - 1] === s2[j - 1] ? sc.match : sc.mismatch;
        const diag = F[i - 1][j - 1] + s;
        const up = F[i - 1][j] + sc.gap;
        const left = F[i][j - 1] + sc.gap;
        F[i][j] = Math.max(diag, up, left);
        td.textContent = fmt(F[i][j]);
        td.classList.add("dp-filled");
        [cell(i - 1, j - 1), cell(i - 1, j), cell(i, j - 1)].forEach((c) => c.classList.add("dp-nb"));
        const opt = (sym, v, label) => `<span class="${v === F[i][j] ? "ro-good" : "ro-dim"}">${ltr(`${sym} ${fmt(v)}`)} ${label}</span>`;
        $("readout").innerHTML =
          `${ltr(`F[${i}][${j}]`)}: ${ltr(`${s1[i - 1]} vs ${s2[j - 1]}`)} (${s === sc.match ? "התאמה" : "אי-התאמה"}). ` +
          `${opt("↖", diag, "אלכסון")} · ${opt("↑", up, "למעלה")} · ${opt("←", left, "שמאלה")} → <b>${ltr(fmt(F[i][j]))}</b>`;
      }
      keepInView($("stage"), (j + 1) * 40);
      if (pos >= order.length) {
        clearMarks();
        $("readout").innerHTML += ` <b>המטריצה מלאה.</b> ציון היישור הגלובלי הטוב ביותר: ${ltr(`F[${s1.length}][${s2.length}] = ${fmt(F[s1.length][s2.length])}`)}. לחצו <b>traceback</b>.`;
        return false;
      }
      return true;
    }
    step.done = () => pos >= order.length;

    function traceback() {
      ctl.pause();
      if (!step.done()) while (step());
      clearMarks();
      $("grid").querySelectorAll(".dp-path").forEach((td) => td.classList.remove("dp-path"));
      let i = s1.length;
      let j = s2.length;
      const top = [];
      const bottom = [];
      cell(i, j).classList.add("dp-path");
      while (i > 0 || j > 0) {
        const s = i > 0 && j > 0 && s1[i - 1] === s2[j - 1] ? sc.match : sc.mismatch;
        if (i > 0 && j > 0 && F[i][j] === F[i - 1][j - 1] + s) {
          top.push(s1[i - 1]);
          bottom.push(s2[j - 1]);
          i--;
          j--;
        } else if (i > 0 && F[i][j] === F[i - 1][j] + sc.gap) {
          top.push(s1[i - 1]);
          bottom.push("-");
          i--;
        } else {
          top.push("-");
          bottom.push(s2[j - 1]);
          j--;
        }
        cell(i, j).classList.add("dp-path");
      }
      const a = top.reverse().join("");
      const b = bottom.reverse().join("");
      const mid = [...a].map((x, k) => (x === b[k] ? "|" : x === "-" || b[k] === "-" ? " " : ".")).join("");
      $("readout").innerHTML = `<b>Traceback</b> מהפינה ל-${ltr("F[0][0]")} שחזר יישור אופטימלי עם ציון ${ltr(fmt(F[s1.length][s2.length]))}:<pre class="dp-align" dir="ltr">${a}\n${mid}\n${b}</pre>`;
    }

    const ctl = stepper($, T, { step, reset, playLabel: "▶ אתחול ומילוי" });
    $("trace").addEventListener("click", traceback);
    $("reset").addEventListener("click", reset);
    const re = debounce(reset, 300);
    ["s1", "s2", "match", "mismatch", "gap"].forEach((r) => $(r).addEventListener("input", re));
    reset();
    return { destroy: () => T.clear() };
  }

  Object.assign(CBB.Visuals, { revcomp, kmers, profile, dp });
})();
