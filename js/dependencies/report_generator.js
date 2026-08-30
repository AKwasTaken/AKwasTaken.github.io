(function () {
  "use strict";

  /* ---------------- demo data (fallback if data.csv can't be read) ---------------- */
  const DEMO_CSV = `Name,Username,Password,Upload,Download,Total traffic
Aanandee,aanandee23,aanims2300323,254678.06,1472685.94,1727364.0
Abdul,abdul23,abdims2300423,91913.34,1344664.94,1436578.28
Abdulla,abdulla23,amaims2302923,146976.9,1381131.68,1528108.58
Abhija,abhija23,abhims2300523,41432.18,292613.4,334045.59
Abhijith,abhijith23,abhims2300623,0.0,0.0,0.0
Abhisu,abhisu23,abhims2301223,285994.87,2012464.12,2298458.99
Able,able23,ablims2301323,244299.25,1286295.57,1530594.83
Achuth,achuth23,achims2301423,0.0,0.0,0.0
Adrija,adrija23,adrims2301923,74030.77,746215.02,820245.79
Adrita,adrita23,adrims2302023,75135.54,737435.94,812571.47
Agnivesh,agnivesh23,agnims2302123,48822.4,952914.98,1001737.38
Ajin,ajin23,ajiims2302223,185180.18,2817320.0,3002500.18
Ajit,ajit23,ajiims2302323,0.0,0.0,0.0
Akhil,akhil23,akhims2302623,72598.75,1833000.85,1905599.6
Akshat,akshat23,aksims2302723,289126.45,2674769.0,2963895.45`;

  const CSV_PATH = "data.csv";
  const COLS = [
    "Name",
    "Username",
    "Password",
    "Upload",
    "Download",
    "Total traffic",
  ];
  const NUM_COLS = ["Upload", "Download", "Total traffic"];
  const METRIC_COLOR = {
    Upload: "#3D5A80",
    Download: "#C97A46",
    "Total traffic": "#4F7A5E",
  };
  const CHART_TEXT = "#4A473F";
  const CHART_GRID = "#E2DDD0";
  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = CHART_TEXT;

  /* ---------------- state ---------------- */
  let RAW = [];
  let sortKey = "Total traffic";
  let sortDir = "desc";
  let searchTerm = "";
  let showPasswords = false;
  let currentPage = 1;
  const PAGE_SIZE = 15;
  let topN = 15;
  let histMetric = "Upload";
  let charts = {};

  /* ---------------- helpers ---------------- */
  function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : 0;
  }
  function abbr(n) {
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n >= 1e9) return sign + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return sign + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return sign + (n / 1e3).toFixed(2) + "K";
    return sign + n.toFixed(2);
  }
  function full(n) {
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function normalizeRow(r) {
    const out = {};
    COLS.forEach((c) => {
      if (NUM_COLS.includes(c)) out[c] = num(r[c]);
      else out[c] = (r[c] ?? "").toString().trim();
    });
    return out;
  }
  function parseDemo() {
    const res = Papa.parse(DEMO_CSV, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    return res.data.map(normalizeRow);
  }
  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }
  function mean(arr) {
    return arr.length ? sum(arr) / arr.length : 0;
  }
  function stddev(arr) {
    const n = arr.length;
    if (n < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((a, v) => a + (v - m) * (v - m), 0) / (n - 1));
  }
  function quantile(sortedArr, q) {
    if (!sortedArr.length) return 0;
    const pos = (sortedArr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedArr[base + 1] !== undefined)
      return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
    return sortedArr[base];
  }
  function gini(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const total = sum(sorted);
    if (total <= 0 || n === 0) return 0;
    let weighted = 0;
    sorted.forEach((v, i) => {
      weighted += (i + 1) * v;
    });
    return Math.max(0, Math.min(1, (2 * weighted) / (n * total) - (n + 1) / n));
  }
  function pearson(xs, ys) {
    const n = xs.length;
    if (n < 2) return 0;
    const mx = mean(xs),
      my = mean(ys);
    let numr = 0,
      dx2 = 0,
      dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx,
        dy = ys[i] - my;
      numr += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    const denom = Math.sqrt(dx2 * dy2);
    return denom === 0 ? 0 : numr / denom;
  }
  function linreg(xs, ys) {
    const n = xs.length;
    const sumX = sum(xs),
      sumY = sum(ys);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumXX = xs.reduce((a, x) => a + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / (n || 1);
    return { slope, intercept };
  }
  function makeBins(values, binCount) {
    const min = Math.min(...values),
      max = Math.max(...values);
    const width = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      x0: min + i * width,
      x1: min + (i + 1) * width,
      count: 0,
    }));
    values.forEach((v) => {
      let idx = width ? Math.floor((v - min) / width) : 0;
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });
    return bins;
  }
  function destroy(key) {
    if (charts[key]) {
      charts[key].destroy();
      delete charts[key];
    }
  }

  /* ---------------- load ---------------- */
  function loadData(rows) {
    RAW = rows.filter((r) => r && r.Name).map(normalizeRow);
    currentPage = 1;
    // document.getElementById("metaN").textContent = full(RAW.length);
    // document.getElementById("metaDate").textContent = new Date().toLocaleString(
    //   undefined,
    //   { dateStyle: "medium", timeStyle: "short" },
    // );
    renderAll();
  }

  /* ---------------- 1. summary stats ---------------- */
  function renderStats(data) {
    const body = document.getElementById("statsTableBody");
    body.innerHTML = NUM_COLS.map((metric) => {
      const vals = data.map((d) => d[metric]);
      const sorted = [...vals].sort((a, b) => a - b);
      return `<tr>
      <td>${metric}</td>
      <td>${full(data.length)}</td>
      <td>${full(mean(vals))}</td>
      <td>${full(quantile(sorted, 0.5))}</td>
      <td>${full(stddev(vals))}</td>
      <td>${full(sorted[0] ?? 0)}</td>
      <td>${full(sorted[sorted.length - 1] ?? 0)}</td>
      <td>${full(sum(vals))}</td>
    </tr>`;
    }).join("");

    const upload = data.map((d) => d.Upload),
      download = data.map((d) => d.Download);
    const r = pearson(upload, download);
    const g = gini(data.map((d) => d["Total traffic"]));
    const ghosts = data.filter((d) => d["Total traffic"] === 0).length;
    document.getElementById("corrInline").textContent = r.toFixed(3);
    document.getElementById("giniInline").textContent = g.toFixed(3);
    document.getElementById("ghostInline").textContent =
      `${full(ghosts)} (${data.length ? ((ghosts / data.length) * 100).toFixed(1) : "0.0"}%)`;
  }

  /* ---------------- 2. top consumers table ---------------- */
  function renderTopTable(data) {
    const body = document.getElementById("topTableBody");
    const totalAll = sum(data.map((d) => d["Total traffic"])) || 1;
    const top10 = [...data]
      .sort((a, b) => b["Total traffic"] - a["Total traffic"])
      .slice(0, 10);
    body.innerHTML =
      top10
        .map(
          (u, i) => `
    <tr>
      <td class="rank-col">${i + 1}</td>
      <td class="name-col">${escapeHtml(u.Name)}</td>
      <td>${escapeHtml(u.Username)}</td>
      <td>${full(u.Upload)}</td>
      <td>${full(u.Download)}</td>
      <td>${full(u["Total traffic"])}</td>
      <td>${((u["Total traffic"] / totalAll) * 100).toFixed(1)}%</td>
    </tr>`,
        )
        .join("") ||
      `<tr><td colspan="7"><div class="empty-hint">No data.</div></td></tr>`;
  }

  /* ---------------- Figure 1: share by metric (Doughnut) ---------------- */
  function renderShareCharts(data) {
    const ids = {
      Upload: "shareUploadChart",
      Download: "shareDownloadChart",
      "Total traffic": "shareTotalChart",
    };

    // Color palette that stays legible against the theme
    const sliceColors = [
      "#3D5A80", "#C97A46", "#4F7A5E", "#B8863B", "#A6444B", 
      "#6172A8", "#407455", "#8B8678", "#D4A373", "#588157", 
      "#D8D3C4" // "Other"
    ];

    NUM_COLS.forEach((metric) => {
      const sorted = [...data].sort((a, b) => b[metric] - a[metric]);
      const top5 = sorted.slice(0, 5); // Keep top 5 to prevent unreadable micro-slices
      const otherSum = sum(sorted.slice(5).map((d) => d[metric]));
      
      const labels = top5.map((d) => d.Username).concat(otherSum > 0 ? ["Other"] : []);
      const values = top5.map((d) => d[metric]).concat(otherSum > 0 ? [otherSum] : []);
      const totalMetric = sum(values) || 1;

      const key = "share_" + metric;
      destroy(key);
      const ctx = document.getElementById(ids[metric]);
      if (!ctx) return;

      charts[key] = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: sliceColors.slice(0, labels.length),
              borderWidth: 2,
              borderColor: "#ffffff",
              hoverOffset: 6
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                boxWidth: 10,
                padding: 10,
                font: { size: 10, family: "'IBM Plex Mono', monospace" }
              }
            },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const pct = ((c.raw / totalMetric) * 100).toFixed(1);
                  return ` ${c.label}: ${abbr(c.raw)} (${pct}%)`;
                }
              }
            },
          },
        },
      });
    });
  }

  /* ---------------- Figure 2: ranked bar ---------------- */
  function renderBarChart(data) {
    const sorted = [...data]
      .sort((a, b) => b["Total traffic"] - a["Total traffic"])
      .slice(0, topN);
    destroy("bar");
    charts.bar = new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: sorted.map((d) => d.Username),
        datasets: [
          {
            data: sorted.map((d) => d["Total traffic"]),
            backgroundColor: sorted.map((_, i) =>
              i < 3 ? "#B8863B" : "#4F7A5E",
            ),
            borderRadius: 2,
            maxBarThickness: 16,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => full(c.raw) + " total traffic" },
          },
        },
        scales: {
          x: {
            grid: { color: CHART_GRID },
            ticks: { callback: (v) => abbr(v) },
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: "'IBM Plex Mono', monospace", size: 10.5 },
            },
          },
        },
      },
    });
  }

  /* ---------------- Figure 3: scatter ---------------- */
  function renderScatter(data) {
    const xs = data.map((d) => d.Upload),
      ys = data.map((d) => d.Download);
    const maxTotal = Math.max(1, ...data.map((d) => d["Total traffic"]));
    const r = pearson(xs, ys);
    document.getElementById("corrValue").textContent = r.toFixed(3);
    document.getElementById("r2Value").textContent = (r * r).toFixed(3);

    const { slope, intercept } = linreg(xs, ys);
    const minX = Math.min(...xs, 0),
      maxX = Math.max(...xs, 1);

    destroy("scatter");
    charts.scatter = new Chart(document.getElementById("scatterChart"), {
      type: "bubble",
      data: {
        datasets: [
          {
            label: "Accounts",
            data: data.map((d) => ({
              x: d.Upload,
              y: d.Download,
              r: 3 + (d["Total traffic"] / maxTotal) * 13,
              name: d.Name,
            })),
            backgroundColor: "rgba(61,90,128,0.45)",
            borderColor: "rgba(61,90,128,0.9)",
            borderWidth: 1,
          },
          {
            type: "line",
            label: "Fit",
            data: [
              { x: minX, y: slope * minX + intercept },
              { x: maxX, y: slope * maxX + intercept },
            ],
            borderColor: "#A6444B",
            borderDash: [6, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                c.dataset.label === "Fit"
                  ? ""
                  : `${c.raw.name}: ↑${full(c.raw.x)} / ↓${full(c.raw.y)}`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Upload" },
            grid: { color: CHART_GRID },
            ticks: { callback: (v) => abbr(v) },
          },
          y: {
            title: { display: true, text: "Download" },
            grid: { color: CHART_GRID },
            ticks: { callback: (v) => abbr(v) },
          },
        },
      },
    });
  }

  /* ---------------- Figure 4: histogram ---------------- */
  function renderHistogram(data) {
    const values = data.map((d) => d[histMetric]);
    const bins = makeBins(values, 12);
    destroy("hist");
    charts.hist = new Chart(document.getElementById("histChart"), {
      type: "bar",
      data: {
        labels: bins.map((b) => abbr(b.x0) + "–" + abbr(b.x1)),
        datasets: [
          {
            data: bins.map((b) => b.count),
            backgroundColor: METRIC_COLOR[histMetric],
            borderRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => items[0].label,
              label: (c) => c.raw + " account" + (c.raw === 1 ? "" : "s"),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 9 }, maxRotation: 60, minRotation: 60 },
          },
          y: { grid: { color: CHART_GRID }, ticks: { precision: 0 } },
        },
      },
    });
    document.getElementById("histCaptionMetric").textContent =
      histMetric.toLowerCase();
  }

  /* ---------------- Figure 5: box plot (D3) ---------------- */
  function renderBoxplot(data) {
    const svg = d3.select("#boxplotSvg");
    svg.selectAll("*").remove();
    const W = 560,
      H = 320,
      M = { top: 20, right: 24, bottom: 40, left: 64 };
    const metrics = NUM_COLS;
    const allVals = metrics.flatMap((m) => data.map((d) => d[m]));
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allVals) || 1])
      .nice()
      .range([H - M.bottom, M.top]);
    const x = d3
      .scaleBand()
      .domain(metrics)
      .range([M.left, W - M.right])
      .padding(0.42);

    svg
      .append("g")
      .attr("transform", `translate(${M.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickFormat((d) => abbr(d)),
      )
      .call((g) =>
        g
          .selectAll("text")
          .attr("fill", CHART_TEXT)
          .attr("font-family", "IBM Plex Mono")
          .attr("font-size", "10px"),
      )
      .call((g) => g.selectAll("line,path").attr("stroke", CHART_GRID));

    metrics.forEach((m) => {
      const vals = data.map((d) => d[m]).sort((a, b) => a - b);
      if (!vals.length) return;
      const q1 = quantile(vals, 0.25),
        med = quantile(vals, 0.5),
        q3 = quantile(vals, 0.75);
      const iqr = q3 - q1;
      const lowFence = q1 - 1.5 * iqr,
        highFence = q3 + 1.5 * iqr;
      const inFence = vals.filter((v) => v >= lowFence && v <= highFence);
      const whiskerMin = inFence.length ? Math.min(...inFence) : vals[0];
      const whiskerMax = inFence.length
        ? Math.max(...inFence)
        : vals[vals.length - 1];
      const outliers = vals.filter((v) => v < lowFence || v > highFence);
      const cx = x(m) + x.bandwidth() / 2;
      const bw = x.bandwidth();
      const color = METRIC_COLOR[m];

      const g = svg.append("g");
      g.append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", y(whiskerMin))
        .attr("y2", y(q1))
        .attr("stroke", CHART_TEXT);
      g.append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", y(q3))
        .attr("y2", y(whiskerMax))
        .attr("stroke", CHART_TEXT);
      g.append("line")
        .attr("x1", cx - bw * 0.18)
        .attr("x2", cx + bw * 0.18)
        .attr("y1", y(whiskerMin))
        .attr("y2", y(whiskerMin))
        .attr("stroke", CHART_TEXT);
      g.append("line")
        .attr("x1", cx - bw * 0.18)
        .attr("x2", cx + bw * 0.18)
        .attr("y1", y(whiskerMax))
        .attr("y2", y(whiskerMax))
        .attr("stroke", CHART_TEXT);
      g.append("rect")
        .attr("x", x(m))
        .attr("width", bw)
        .attr("y", y(q3))
        .attr("height", Math.max(1, y(q1) - y(q3)))
        .attr("fill", color)
        .attr("fill-opacity", 0.18)
        .attr("stroke", color)
        .attr("stroke-width", 1.4);
      g.append("line")
        .attr("x1", x(m))
        .attr("x2", x(m) + bw)
        .attr("y1", y(med))
        .attr("y2", y(med))
        .attr("stroke", color)
        .attr("stroke-width", 2.2);
      outliers.forEach((o) => {
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", y(o))
          .attr("r", 2.4)
          .attr("fill", "none")
          .attr("stroke", "#A6444B")
          .attr("stroke-width", 1.3);
      });
      svg
        .append("text")
        .attr("x", cx)
        .attr("y", H - 14)
        .attr("text-anchor", "middle")
        .attr("fill", CHART_TEXT)
        .attr("font-family", "IBM Plex Mono")
        .attr("font-size", "10.5px")
        .text(m);
    });
  }

  /* ---------------- Figure 6: Lorenz curve + Gini ---------------- */
  function renderLorenz(data) {
    const vals = data
      .map((d) => d["Total traffic"])
      .filter((v) => v >= 0)
      .sort((a, b) => a - b);
    const g = gini(vals);
    document.getElementById("giniValue").innerHTML =
      g.toFixed(3) + "<span>/ 1.00</span>";
    document.getElementById("giniMarker").style.left =
      (g * 100).toFixed(1) + "%";
    let readout;
    if (g < 0.3) readout = "Traffic is fairly evenly spread across accounts.";
    else if (g < 0.55)
      readout =
        "Moderate imbalance — some accounts use noticeably more than average.";
    else
      readout =
        "Highly concentrated — a small group of accounts accounts for most of the traffic.";
    document.getElementById("giniReadout").textContent = readout;

    const total = sum(vals);
    let cum = 0;
    const points = [[0, 0]];
    vals.forEach((v, i) => {
      cum += v;
      points.push([(i + 1) / vals.length, total ? cum / total : 0]);
    });

    const svg = d3.select("#lorenzSvg");
    svg.selectAll("*").remove();
    const W = 520,
      H = 300,
      M = { top: 16, right: 16, bottom: 36, left: 44 };
    const x = d3
      .scaleLinear()
      .domain([0, 1])
      .range([M.left, W - M.right]);
    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([H - M.bottom, M.top]);

    svg
      .append("g")
      .attr("transform", `translate(${M.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
      .call((sel) =>
        sel
          .selectAll("text")
          .attr("fill", CHART_TEXT)
          .attr("font-family", "IBM Plex Mono")
          .attr("font-size", "10px"),
      )
      .call((sel) => sel.selectAll("line,path").attr("stroke", CHART_GRID));
    svg
      .append("g")
      .attr("transform", `translate(0,${H - M.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")))
      .call((sel) =>
        sel
          .selectAll("text")
          .attr("fill", CHART_TEXT)
          .attr("font-family", "IBM Plex Mono")
          .attr("font-size", "10px"),
      )
      .call((sel) => sel.selectAll("line,path").attr("stroke", CHART_GRID));

    svg
      .append("line")
      .attr("x1", x(0))
      .attr("y1", y(0))
      .attr("x2", x(1))
      .attr("y2", y(1))
      .attr("stroke", CHART_TEXT)
      .attr("stroke-dasharray", "3,4");

    const area = d3
      .area()
      .x((p) => x(p[0]))
      .y0((p) => y(p[0]))
      .y1((p) => y(p[1]))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(points)
      .attr("d", area)
      .attr("fill", "#3D5A80")
      .attr("fill-opacity", 0.12);

    const line = d3
      .line()
      .x((p) => x(p[0]))
      .y((p) => y(p[1]))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(points)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#3D5A80")
      .attr("stroke-width", 2.2);

    svg
      .append("text")
      .attr("x", W / 2)
      .attr("y", H - 2)
      .attr("text-anchor", "middle")
      .attr("fill", CHART_TEXT)
      .attr("font-family", "IBM Plex Mono")
      .attr("font-size", "10px")
      .text("Cumulative share of accounts");
  }

  /* ---------------- Section 4: full dataset table ---------------- */
  function getFilteredSorted() {
    let rows = RAW;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.Name.toLowerCase().includes(q) ||
          r.Username.toLowerCase().includes(q),
      );
    }
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey],
        bv = b[sortKey];
      if (typeof av === "string") {
        av = av.toLowerCase();
        bv = bv.toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }
  function renderTableHead() {
    const row = document.getElementById("tableHeadRow");
    row.innerHTML = COLS.map((c) => {
      const isSorted = c === sortKey;
      const arrow = isSorted ? (sortDir === "asc" ? "↑" : "↓") : "↕";
      const cls = c === "Name" ? "name-col" : NUM_COLS.includes(c) ? "num" : "";
      return `<th data-col="${c}" class="${isSorted ? "sorted " : ""}${cls}" tabindex="0">${c}<span class="arrow">${arrow}</span></th>`;
    }).join("");
    row.querySelectorAll("th").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.col;
        if (sortKey === col) sortDir = sortDir === "asc" ? "desc" : "asc";
        else {
          sortKey = col;
          sortDir = NUM_COLS.includes(col) ? "desc" : "asc";
        }
        currentPage = 1;
        renderTableHead();
        renderTableBody();
      });
    });
  }
  function renderTableBody() {
    const rows = getFilteredSorted();
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    document.getElementById("tableBody").innerHTML =
      pageRows
        .map(
          (r) => `
    <tr>
      <td class="name-col">${escapeHtml(r.Name)}${r["Total traffic"] === 0 ? '<span class="zero-flag">idle</span>' : ""}</td>
      <td>${escapeHtml(r.Username)}</td>
      <td class="pw">${showPasswords ? escapeHtml(r.Password) : "•".repeat(Math.min(10, r.Password.length || 8))}</td>
      <td class="num">${full(r.Upload)}</td>
      <td class="num">${full(r.Download)}</td>
      <td class="num">${full(r["Total traffic"])}</td>
    </tr>`,
        )
        .join("") ||
      `<tr><td colspan="6"><div class="empty-hint">No accounts match your search.</div></td></tr>`;

    document.getElementById("rowCount").textContent =
      `${rows.length} account${rows.length === 1 ? "" : "s"}`;
    document.getElementById("pageLabel").textContent =
      `${currentPage} / ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage <= 1;
    document.getElementById("nextPage").disabled = currentPage >= totalPages;
  }

  /* ---------------- master render ---------------- */
  function renderAll() {
    renderStats(RAW);
    renderTopTable(RAW);
    renderShareCharts(RAW);
    renderBarChart(RAW);
    renderScatter(RAW);
    renderHistogram(RAW);
    renderBoxplot(RAW);
    renderLorenz(RAW);
    renderTableHead();
    renderTableBody();
  }

  /* ---------------- events ---------------- */
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    currentPage = 1;
    renderTableBody();
  });
  document.getElementById("showPwToggle").addEventListener("change", (e) => {
    showPasswords = e.target.checked;
    renderTableBody();
  });
  document.getElementById("prevPage").addEventListener("click", () => {
    currentPage--;
    renderTableBody();
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    currentPage++;
    renderTableBody();
  });
  document.getElementById("downloadCsvBtn").addEventListener("click", () => {
    const rows = getFilteredSorted();
    const csv = [COLS.join(",")]
      .concat(
        rows.map((r) =>
          COLS.map((c) => {
            const v = r[c];
            return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
          }).join(","),
        ),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "filtered_traffic.csv";
    a.click();
  });
  document.getElementById("topNRange").addEventListener("input", (e) => {
    topN = Number(e.target.value);
    document.getElementById("topNLabel").textContent = topN;
    renderBarChart(RAW);
  });
  document.getElementById("histChips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    document
      .querySelectorAll("#histChips .chip")
      .forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    histMetric = btn.dataset.metric;
    renderHistogram(RAW);
  });

  /* ---------------- init: read data from JS variable ---------------- */
  try {
    if (typeof Papa === "undefined") {
      alert(
        "Error: PapaParse library didn't load! Check your internet connection or adblocker.",
      );
      return;
    }

    let sourceData;
    if (typeof MY_REAL_DATA !== "undefined") {
      sourceData = MY_REAL_DATA;
    } else if (typeof window.MY_REAL_DATA !== "undefined") {
      sourceData = window.MY_REAL_DATA;
    } else {
      alert(
        "Error: Could not find MY_REAL_DATA. Make sure data.js is formatted correctly.",
      );
      return;
    }

    const parsed = Papa.parse(sourceData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    if (!parsed.data.length) throw new Error("Parsed data is empty");
    loadData(parsed.data);
  } catch (error) {
    console.error("Data loading failed:", error);
    alert(
      "Something went wrong parsing the data. Check the Developer Console (F12) for details.",
    );
    loadData(parseDemo());
  }
})();
