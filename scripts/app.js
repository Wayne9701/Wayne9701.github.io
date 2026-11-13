(function () {
  "use strict";

  const DATA = window.PORTFOLIO_DATA;
  let currentLang = "zh";
  let currentFilter = "all";
  let currentAiosId = "memory";
  let hitboxMode = "raw"; // "raw" | "dp18"
  let funnelMode = "trap"; // "trap" | "fixed"

  function t(obj) {
    if (obj && typeof obj === "object" && ("zh" in obj || "en" in obj)) {
      return obj[currentLang] || obj.zh;
    }
    return obj;
  }

  function svgOriginIcon(type) {
    if (type === "watch") {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><polyline points="12 9 12 12 14 13.5"/><path d="M9.5 6.3 10 3h4l.5 3.3"/><path d="M9.5 17.7 10 21h4l.5-3.3"/></svg>`;
    }
    if (type === "widget") {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/></svg>`;
    }
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
  }

  function renderI18nText() {
    const dict = DATA.i18n[currentLang];
    document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key in dict) {
        if (el.hasAttribute("data-i18n-html")) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === currentLang);
    });
  }

  function renderFlagships() {
    const container = document.getElementById("flagship-stack");
    const dict = DATA.i18n[currentLang];
    container.innerHTML = DATA.flagships
      .map((item) => {
        const chipsHtml = item.chips
          .map((c) => `<span class="chip ${c.accent}">${t(c.text)}</span>`)
          .join("");
        const shotsHtml = item.shots
          .map(
            (s) => `
          <div class="shot-frame" data-modal-title="${t(item.title)}" data-modal-shots='${JSON.stringify(item.shots.map((x) => x.src))}'>
            <img src="${s.src}" alt="${s.alt}" loading="lazy" />
          </div>`
          )
          .join("");

        return `
        <article class="flagship-card">
          <div>
            <div class="flagship-meta">${t(item.badge)}</div>
            <h3>${t(item.title)}</h3>
            <p>${t(item.desc)}</p>
            <div class="flagship-tags">${chipsHtml}</div>
            <a class="text-link" href="${item.storeUrl}" target="_blank" rel="noopener noreferrer">${dict.viewStore}</a>
          </div>
          <div class="flagship-shots">${shotsHtml}</div>
        </article>`;
      })
      .join("");
  }

  function renderCatalog() {
    const container = document.getElementById("apps-grid");
    const dict = DATA.i18n[currentLang];
    const filtered = DATA.catalog.filter((app) =>
      currentFilter === "all" ? true : app.category === currentFilter
    );

    container.innerHTML = filtered
      .map((app) => {
        const iconHtml = app.icon
          ? `<img class="app-icon" src="${app.icon}" alt="${t(app.name)}" loading="lazy" />`
          : `<div class="app-icon-svg">${svgOriginIcon(app.svgType)}</div>`;

        const shotsBtn =
          app.shots && app.shots.length > 0
            ? `<button type="button" class="text-link" data-modal-title="${t(app.name)}" data-modal-shots='${JSON.stringify(app.shots)}'>${dict.inspectShots}</button>`
            : "";

        const storeLink = app.url
          ? `<a class="text-link" href="${app.url}" target="_blank" rel="noopener noreferrer">${dict.viewStore}</a>`
          : "";

        const countText = typeof app.count === "object" ? t(app.count) : `${app.count} ${currentLang === "zh" ? "条评分" : "ratings"}`;

        return `
        <article class="app-tile">
          <div>
            <div class="app-tile-top">
              ${iconHtml}
              <div>
                <h4 class="app-name">${t(app.name)}</h4>
                <div class="app-role">${t(app.role)}</div>
              </div>
            </div>
            <p class="app-note" style="margin-top:12px;">${t(app.note)}</p>
          </div>
          <div class="app-tile-foot">
            <span class="rating-badge tabular">
              <span class="rating-star">★</span> ${app.rating}
              <span style="color:var(--ink-muted);font-weight:500;">(${countText})</span>
            </span>
            <div class="app-actions">${shotsBtn}${storeLink}</div>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderCaseCards() {
    const container = document.getElementById("case-tabs-grid");
    container.innerHTML = DATA.experiments
      .map(
        (ex) => `
      <article class="case-mini-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
            <span class="chip">${t(ex.badge)}</span>
          </div>
          <div class="case-big-num tabular">${ex.metric}</div>
        </div>
        <div>
          <h4>${t(ex.title)}</h4>
          <p>${t(ex.desc)}</p>
        </div>
      </article>`
      )
      .join("");
  }

  /* ---------- Interactive Toy 1: 18dp Hitbox Simulator ---------- */
  function renderTouchToy() {
    const titleEl = document.getElementById("toy1-title");
    const descEl = document.getElementById("toy1-desc");
    const gridEl = document.getElementById("paint-grid");
    const readoutEl = document.getElementById("toy1-readout");
    const statusEl = document.getElementById("toy1-status");

    titleEl.textContent =
      currentLang === "zh"
        ? "涂色微操：18dp 触控容错 A/B"
        : "Micro-Interaction: 18dp Touch-Tolerance A/B";
    descEl.textContent =
      currentLang === "zh"
        ? "试着点按下面虚线边框的小色块（#2、#5、#7）。传统严格边界极易点歪；开启 18dp 容错光晕后指尖吸附直接着彩。"
        : "Try tapping the tiny dashed cells (#2, #5, #7). Strict hitboxes trigger frustrating edge misses; +18dp halos snap taps cleanly.";

    readoutEl.innerHTML =
      currentLang === "zh"
        ? `<div><strong>${hitboxMode === "raw" ? "Baseline（严格边缘）" : "+18dp 容错策略"}</strong></div>
           <div style="margin-top:4px;">${
             hitboxMode === "raw"
               ? "线上监测：<code>retry_after_miss = 3.07%</code>，极小区块需放大两指重对准。"
               : "实验结果：<code>retry_after_miss = 1.86%</code>（<strong style='color:var(--cobalt);'>-39% 误触重试</strong>）。"
           }</div>`
        : `<div><strong>${hitboxMode === "raw" ? "Baseline (Strict Hitbox)" : "+18dp Smart Halo"}</strong></div>
           <div style="margin-top:4px;">${
             hitboxMode === "raw"
               ? "Telemetry: <code>retry_after_miss = 3.07%</code>; small cells cause zoom frustration."
               : "Verified Lift: <code>retry_after_miss = 1.86%</code> (<strong style='color:var(--cobalt);'>-39% mis-taps</strong>)."
           }</div>`;

    document.querySelectorAll("[data-hitbox-mode]").forEach((b) => {
      b.classList.toggle("active", b.dataset.hitboxMode === hitboxMode);
    });

    const tinyIndices = new Set([1, 4, 6]); // Cells 2, 5, 7
    gridEl.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const isTiny = tinyIndices.has(i);
      const wrap = document.createElement("div");
      wrap.style.padding = "2px";
      wrap.style.cursor = "pointer";
      const cell = document.createElement("div");
      cell.className = "paint-cell";
      if (isTiny) {
        cell.classList.add("tiny");
        if (hitboxMode === "dp18") cell.classList.add("has-halo");
      }
      cell.textContent = `#${i + 1}`;
      wrap.appendChild(cell);

      wrap.addEventListener("click", (ev) => {
        if (cell.classList.contains("filled")) {
          cell.classList.remove("filled");
          statusEl.textContent =
            currentLang === "zh" ? `已重置色块 #${i + 1}` : `Reset cell #${i + 1}`;
          return;
        }
        // Simulate realistic edge miss on tiny cells in raw mode if click isn't dead-center
        if (isTiny && hitboxMode === "raw") {
          const rect = cell.getBoundingClientRect();
          const dx = Math.abs(ev.clientX - (rect.left + rect.width / 2));
          const dy = Math.abs(ev.clientY - (rect.top + rect.height / 2));
          if (dx > rect.width * 0.24 || dy > rect.height * 0.24) {
            cell.classList.remove("shake");
            void cell.offsetWidth;
            cell.classList.add("shake");
            statusEl.textContent =
              currentLang === "zh"
                ? `MISS! #${i + 1} 边缘未命中 → 玩家被迫重试 (retry_after_miss +1)`
                : `MISS! Edge slip on tiny cell #${i + 1} → player forced to retry`;
            return;
          }
        }
        cell.classList.add("filled");
        statusEl.textContent =
          currentLang === "zh"
            ? `✓ 命中着色 #${i + 1}（${hitboxMode === "dp18" ? "+18dp 容错光晕吸附" : "精确点中中心"}）`
            : `✓ Filled #${i + 1} (${hitboxMode === "dp18" ? "+18dp halo snap" : "center hit"})`;
      });

      gridEl.appendChild(wrap);
    }

    statusEl.textContent =
      currentLang === "zh"
        ? "等待点击上方小色块，对比严格判定 vs +18dp 容错..."
        : "Click a tiny dashed cell above to test strict vs +18dp hitbox...";
  }

  /* ---------- Interactive Toy 2: Hidden Object Funnel ---------- */
  function renderFunnelToy() {
    const titleEl = document.getElementById("toy2-title");
    const descEl = document.getElementById("toy2-desc");
    const barsEl = document.getElementById("toy2-bars");
    const statusEl = document.getElementById("toy2-status");

    titleEl.textContent =
      currentLang === "zh"
        ? "390 关找物漏斗与异常清零"
        : "Hidden Object Forensics: 390-Level Funnel";
    descEl.textContent =
      currentLang === "zh"
        ? "按 M0–M4 梳理 390 关节奏后，切换对比「原始尾盘流失 + 2秒秒过污染」与「治理后健康曲线」。"
        : "Compare raw baseline (80%–99% endgame abandonment + 2s speed-clear telemetry noise) vs stabilized curve.";

    document.querySelectorAll("[data-funnel-mode]").forEach((b) => {
      b.classList.toggle("active", b.dataset.funnelMode === funnelMode);
    });

    const steps =
      funnelMode === "trap"
        ? [
            { label: { zh: "M0 首关引导", en: "M0 Onboarding" }, pct: 95, cls: "" },
            { label: { zh: "M1–M2 前中段", en: "M1–M2 Early Flow" }, pct: 84, cls: "" },
            { label: { zh: "M3 高密遮挡", en: "M3 Dense clutter" }, pct: 71, cls: "" },
            { label: { zh: "80–99% 尾盘!", en: "80–99% Endgame!" }, pct: 52, cls: "warn" }
          ]
        : [
            { label: { zh: "M0 首关引导", en: "M0 Onboarding" }, pct: 97, cls: "fixed" },
            { label: { zh: "M1–M2 前中段", en: "M1–M2 Early Flow" }, pct: 91, cls: "fixed" },
            { label: { zh: "M3 高密遮挡", en: "M3 Dense clutter" }, pct: 83, cls: "fixed" },
            { label: { zh: "80–99% 尾盘收口", en: "80–99% Relief" }, pct: 78, cls: "fixed" }
          ];

    barsEl.innerHTML = steps
      .map(
        (s) => `
      <div class="funnel-row">
        <span style="color:var(--ink-secondary);font-weight:600;">${t(s.label)}</span>
        <div class="funnel-track">
          <div class="funnel-fill ${s.cls}" style="width:${s.pct}%"></div>
        </div>
        <span class="mono tabular" style="font-weight:750;text-align:right;">${s.pct}%</span>
      </div>`
      )
      .join("");

    statusEl.textContent =
      funnelMode === "trap"
        ? currentLang === "zh"
          ? "预警：最后 2 件物体无提示线索触发集体弃关；且 31.2% 异常为「2秒秒过」假阳性。"
          : "Alert: Players stalled at last 1–2 items; 31.2% of edge anomalies traced to a 2s speed-clear bug."
        : currentLang === "zh"
          ? "治理后：修复 2秒误触发逻辑、校准 M0–M4 密度梯度，尾盘平滑完成且口径可信。"
          : "Stabilized: Fixed 2s false-clear root cause & calibrated M0–M4 pacing cues.";
  }

  /* ---------- Interactive AI OS Dispatch Bench ---------- */
  function renderAios() {
    const menuEl = document.getElementById("aios-menu");
    const detailEl = document.getElementById("aios-detail");
    const reposEl = document.getElementById("repo-links");

    menuEl.innerHTML = DATA.aiosModules
      .map(
        (mod) => `
      <button type="button" class="aios-node-btn ${mod.id === currentAiosId ? "active" : ""}" data-aios-id="${mod.id}">
        <div>
          <div class="aios-node-idx">${mod.index} · ${mod.tag}</div>
          <div class="aios-node-title">${t(mod.title)}</div>
          <div class="aios-node-sub">${t(mod.sub)}</div>
        </div>
        <span class="aios-node-tag">→</span>
      </button>`
      )
      .join("");

    const active = DATA.aiosModules.find((m) => m.id === currentAiosId) || DATA.aiosModules[0];
    const whyHeading = currentLang === "zh" ? "系统设计与边界约束" : "Architecture & Guardrails";
    const impactHeading = currentLang === "zh" ? "真实带来的杠杆收益" : "Observed Leverage";

    detailEl.innerHTML = `
      <div>
        <div class="aios-detail-head">
          <span class="aios-pill">${active.index} / ${active.tag}</span>
          <span class="mono" style="font-size:11.5px;color:var(--ink-on-dark-muted);">${t(active.sub)}</span>
        </div>
        <h3 style="margin-top:14px;">${t(active.title)}</h3>
        <blockquote class="aios-quote">${t(active.quote)}</blockquote>
      </div>
      <div class="aios-cols">
        <div class="aios-subcard">
          <div class="aios-subcard-title">${whyHeading}</div>
          <ul>${t(active.why).map((w) => `<li>${w}</li>`).join("")}</ul>
        </div>
        <div class="aios-subcard">
          <div class="aios-subcard-title">${impactHeading}</div>
          <ul>${t(active.impact).map((i) => `<li>${i}</li>`).join("")}</ul>
        </div>
      </div>`;

    reposEl.innerHTML = DATA.openRepos
      .map(
        (r) => `
      <a class="repo-link-row" href="${r.url}" target="_blank" rel="noopener noreferrer">
        <div>
          <strong style="color:#fff;">${r.name}</strong>
          <div style="font-size:12px;color:var(--ink-on-dark-muted);">${t(r.desc)}</div>
        </div>
        <span class="mono" style="font-size:11px;color:var(--marigold);white-space:nowrap;">${r.lang} ↗</span>
      </a>`
      )
      .join("");
  }

  function renderTimelineAndPrinciples() {
    const timelineEl = document.getElementById("timeline-list");
    const principlesEl = document.getElementById("principles-stack");

    timelineEl.innerHTML = DATA.timeline
      .map(
        (item) => `
      <div class="timeline-item ${item.current ? "current" : ""}">
        <div class="timeline-year">${item.year}</div>
        <h3>${t(item.title)}</h3>
        <p>${t(item.desc)}</p>
      </div>`
      )
      .join("");

    principlesEl.innerHTML = DATA.principles
      .map(
        (p) => `
      <article class="note-card ${p.accent}">
        <div class="note-num">${p.num}</div>
        <h4>${t(p.title)}</h4>
        <p>${t(p.desc)}</p>
      </article>`
      )
      .join("");
  }

  function openModal(title, shots) {
    const backdrop = document.getElementById("shot-modal");
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-shots").innerHTML = shots
      .map((src) => `<img src="${src}" alt="${title}" />`)
      .join("");
    backdrop.classList.add("open");
  }

  function closeModal() {
    document.getElementById("shot-modal").classList.remove("open");
  }

  function updateBeijingClock() {
    const clockEl = document.getElementById("bjt-clock");
    if (!clockEl) return;
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(now);
      clockEl.textContent = `Beijing CST ${fmt}`;
    } catch (_) {
      clockEl.textContent = "Beijing CST";
    }
  }

  function bindEvents() {
    // Scroll reading progress + active nav highlight
    window.addEventListener("scroll", () => {
      const h = document.documentElement;
      const scrollMax = Math.max(1, h.scrollHeight - h.clientHeight);
      const pct = Math.min(100, Math.round((window.scrollY / scrollMax) * 100));
      document.getElementById("progress-fill").style.width = pct + "%";
    });

    // Language switch
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentLang = btn.dataset.lang;
        renderAll();
      });
    });

    // Catalog filter tabs
    document.getElementById("filter-bar").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((el) => {
        el.classList.toggle("active", el.dataset.filter === currentFilter);
      });
      renderCatalog();
    });

    // AI OS Dispatch clicks
    document.getElementById("aios-menu").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-aios-id]");
      if (!btn) return;
      currentAiosId = btn.dataset.aiosId;
      renderAios();
    });

    // Toy 1 toggles
    document.getElementById("toy1-controls").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-hitbox-mode]");
      if (!btn) return;
      hitboxMode = btn.dataset.hitboxMode;
      renderTouchToy();
    });

    // Toy 2 toggles
    document.getElementById("toy2-controls").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-funnel-mode]");
      if (!btn) return;
      funnelMode = btn.dataset.funnelMode;
      renderFunnelToy();
    });

    // Modal triggers (delegated)
    document.body.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-modal-shots]");
      if (!trigger) return;
      const title = trigger.getAttribute("data-modal-title") || "App Screenshots";
      const shots = JSON.parse(trigger.getAttribute("data-modal-shots") || "[]");
      if (shots.length > 0) openModal(title, shots);
    });

    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("shot-modal").addEventListener("click", (e) => {
      if (e.target.id === "shot-modal") closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Anti-scraper Copy Email button
    const copyBtn = document.getElementById("copy-email-btn");
    const toast = document.getElementById("copy-toast");
    copyBtn.addEventListener("click", async () => {
      const addr = ["hewei19970101", "gmail.com"].join("@");
      try {
        await navigator.clipboard.writeText(addr);
      } catch (_) {
        const tmp = document.createElement("textarea");
        tmp.value = addr;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
      }
      toast.textContent = `${DATA.i18n[currentLang].copiedNotice}: ${addr}`;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3200);
    });
  }

  function renderAll() {
    renderI18nText();
    renderFlagships();
    renderCatalog();
    renderCaseCards();
    renderTouchToy();
    renderFunnelToy();
    renderAios();
    renderTimelineAndPrinciples();
  }

  renderAll();
  bindEvents();
  updateBeijingClock();
  setInterval(updateBeijingClock, 30000);
})();
