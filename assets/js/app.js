(() => {
  const cfg = window.KB_CONFIG || {};
  const base = window.KB_BASE || "/";

  document.addEventListener("click", async (event) => {
    const copy = event.target.closest(".copy-command");
    if (copy) {
      const code = copy.closest(".command-block").querySelector("code").innerText;
      await navigator.clipboard.writeText(code);
      copy.textContent = "Copied";
      setTimeout(() => copy.textContent = "Copy", 1400);
    }

    const diagnostic = event.target.closest("[data-diagnostic-action]");
    if (diagnostic) {
      const block = diagnostic.closest(".command-block");
      const command = block?.querySelector("code")?.innerText || "";
      const id = diagnostic.dataset.diagnosticAction;
      if (!cfg.diagnostics?.enabled || !cfg.diagnostics?.endpoint) {
        await navigator.clipboard.writeText(command);
        diagnostic.textContent = "Copied (service off)";
        setTimeout(() => diagnostic.textContent = "Run diagnostic", 1800);
      } else {
        diagnostic.disabled = true;
        diagnostic.textContent = "Running…";
        try {
          const response = await fetch(cfg.diagnostics.endpoint, {
            method: cfg.diagnostics.method || "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ diagnosticId: id, article: location.pathname })
          });
          const result = await response.json();
          diagnostic.textContent = response.ok ? "Completed" : "Failed";
          console.info("Diagnostic result", result);
        } catch (error) {
          diagnostic.textContent = "Unavailable";
          console.error(error);
        } finally {
          diagnostic.disabled = false;
          setTimeout(() => diagnostic.textContent = "Run diagnostic", 2200);
        }
      }
    }

    const feedback = event.target.closest("[data-feedback]");
    if (feedback) {
      const payload = { vote: feedback.dataset.feedback, url: location.href, title: document.title, at: new Date().toISOString() };
      localStorage.setItem(`kb-feedback:${location.pathname}`, JSON.stringify(payload));
      document.querySelector("#feedback-status").textContent = "Feedback recorded. Thank you.";
      if (cfg.feedbackEndpoint) fetch(cfg.feedbackEndpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).catch(console.warn);
    }
  });

  const ticket = document.querySelector("[data-ticket-link]");
  if (ticket) {
    const template = cfg.ticketUrlTemplate || "#";
    ticket.href = template
      .replace("{title}", encodeURIComponent(document.querySelector("h1")?.textContent || "IT issue"))
      .replace("{category}", encodeURIComponent(document.querySelector(".badge:nth-child(2)")?.textContent || "Support"))
      .replace("{url}", encodeURIComponent(location.href));
  }

  const role = document.body.dataset.requiredRole;
  if (cfg.access?.enabled) {
    const currentRole = window.KB_USER?.role || cfg.access.defaultRole || "guest";
    document.querySelectorAll("[data-role]").forEach(el => {
      const allowed = el.dataset.role.split(",").map(x => x.trim());
      el.hidden = !allowed.includes(currentRole);
    });
    if (role && role !== "technician" && currentRole !== role) document.body.classList.add("access-limited");
  }

  const wizard = document.querySelector("#wizard-root");
  if (wizard) initWizard(wizard);

  async function initWizard(root) {
    try {
      const response = await fetch(root.dataset.source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Wizard data returned ${response.status}`);
      const data = await response.json();
      const selected = new Set();
      let query = "";
      let category = "all";

      const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
      const visibleSymptoms = () => data.symptoms.filter(s => {
        const matchesCategory = category === "all" || s.category === category;
        const haystack = `${s.title} ${s.description} ${(s.tags || []).join(" ")}`.toLowerCase();
        return matchesCategory && (!query || haystack.includes(query.toLowerCase()));
      });

      const render = () => {
        const visible = visibleSymptoms();
        const groups = new Map();
        for (const symptom of visible) {
          if (!groups.has(symptom.category)) groups.set(symptom.category, []);
          groups.get(symptom.category).push(symptom);
        }
        const selectedTitles = data.symptoms.filter(s => selected.has(s.id)).map(s => s.title);
        root.innerHTML = `
          <div class="wizard-toolbar">
            <div>
              <p class="text-sm font-semibold text-blue-700">Enterprise symptom matcher</p>
              <h3 class="!mt-1">Select every symptom that applies</h3>
              <p class="mt-2 text-sm text-slate-600">The matcher uses all selected evidence and ranks every procedure in the knowledge base. No procedure is excluded from matching.</p>
            </div>
            <div class="wizard-count"><strong>${selected.size}</strong><span>selected</span></div>
          </div>
          <div class="wizard-controls">
            <label><span>Filter symptoms</span><input id="wizard-filter" class="wizard-input" type="search" value="${escapeHtml(query)}" placeholder="Type a symptom, error or device…"></label>
            <label><span>Category</span><select id="wizard-category" class="wizard-input"><option value="all">All categories</option>${data.categories.map(c => `<option${c===category?' selected':''}>${escapeHtml(c)}</option>`).join('')}</select></label>
          </div>
          <div class="wizard-actions"><button class="btn-secondary" type="button" data-select-visible>Select all visible (${visible.length})</button><button class="btn-secondary" type="button" data-clear-selection>Clear selection</button></div>
          ${selected.size ? `<div class="selected-symptoms" aria-live="polite">${selectedTitles.map(t => `<span class="selected-chip">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          <div class="symptom-groups">${[...groups.entries()].map(([name, items]) => `<details class="symptom-group" open><summary><span>${escapeHtml(name)}</span><span>${items.length}</span></summary><div class="symptom-grid">${items.map(s => `<label class="symptom-option"><input type="checkbox" value="${escapeHtml(s.id)}" ${selected.has(s.id)?'checked':''}><span><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.description)}</small></span></label>`).join('')}</div></details>`).join('') || '<p class="card">No symptoms match this filter.</p>'}</div>
          <div class="wizard-submit"><button class="btn" type="button" data-match-procedures ${selected.size?'':'disabled'}>Find matching procedures</button><p>${data.counts.symptoms} symptoms · ${data.counts.procedures} procedures indexed</p></div>
          <div id="wizard-results" aria-live="polite"></div>`;
      };

      const rank = () => {
        const chosen = [...selected];
        const scored = data.procedures.map(proc => {
          const matched = chosen.filter(id => proc.symptoms.includes(id));
          const weighted = matched.reduce((sum,id) => sum + Number(proc.symptomWeights?.[id] || 5), 0);
          const coverage = chosen.length ? matched.length / chosen.length : 0;
          const precision = proc.symptoms.length ? matched.length / proc.symptoms.length : 0;
          const directLinks = chosen.reduce((sum,id) => {
            const symptom = data.symptoms.find(s => s.id === id);
            return sum + (symptom?.relatedProcedures?.includes(proc.id) ? 1 : 0);
          }, 0);
          const score = weighted * 10 + coverage * 35 + precision * 20 + directLinks * 8;
          return { ...proc, matched, score, coverage };
        }).filter(p => p.matched.length).sort((a,b) => b.score-a.score || b.coverage-a.coverage || a.title.localeCompare(b.title));
        return scored;
      };

      const showResults = () => {
        const target = root.querySelector('#wizard-results');
        const ranked = rank();
        if (!ranked.length) {
          target.innerHTML = `<section class="wizard-results"><h3>No exact procedure match</h3><p>Keep all selected symptoms in the ticket and start with general workstation triage or search the complete procedure catalogue.</p><div class="mt-4 flex gap-3"><a class="btn" href="${base}procedures/general-workstation-triage/">Open general triage</a><a class="btn-secondary" href="${base}procedures/">Browse all procedures</a></div></section>`;
          return;
        }
        const chosenMap = Object.fromEntries(data.symptoms.map(s => [s.id,s.title]));
        target.innerHTML = `<section class="wizard-results"><div class="flex items-end justify-between gap-4"><div><p class="text-sm font-semibold text-emerald-700">Ranked recommendations</p><h3 class="!mt-1">Start with the highest-evidence procedure</h3></div><span class="badge">${ranked.length} matches</span></div><div class="mt-5 grid gap-4">${ranked.slice(0,12).map((p,i) => `<article class="result-card ${i===0?'primary-result':''}"><div><div class="flex flex-wrap gap-2"><span class="badge">${i===0?'Primary recommendation':`Alternative ${i}`}</span><span class="badge">${escapeHtml(p.category)}</span><span class="badge">${escapeHtml(p.supportTier)}</span></div><h4>${escapeHtml(p.title)}</h4><p>${escapeHtml(p.description)}</p><p class="matched-label"><strong>Matched:</strong> ${p.matched.map(id => escapeHtml(chosenMap[id] || id)).join('; ')}</p><p class="text-xs text-slate-500">Owner: ${escapeHtml(p.ownerTeam || 'Configured resolver group')}</p></div><a class="btn" href="${escapeHtml(p.url)}">Open procedure</a></article>`).join('')}</div>${ranked.length>12?`<p class="mt-4 text-sm text-slate-600">${ranked.length-12} additional matching procedures remain available through search and the full catalogue.</p>`:''}</section>`;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      root.addEventListener('input', e => {
        if (e.target.id === 'wizard-filter') { const position=e.target.selectionStart; query=e.target.value; render(); requestAnimationFrame(()=>{const input=root.querySelector('#wizard-filter'); if(input){input.focus(); input.setSelectionRange(position,position);}}); }
        if (e.target.matches('.symptom-option input')) { e.target.checked ? selected.add(e.target.value) : selected.delete(e.target.value); render(); }
      });
      root.addEventListener('change', e => { if (e.target.id === 'wizard-category') { category=e.target.value; render(); } });
      root.addEventListener('click', e => {
        if (e.target.closest('[data-select-visible]')) { visibleSymptoms().forEach(s => selected.add(s.id)); render(); }
        if (e.target.closest('[data-clear-selection]')) { selected.clear(); render(); }
        if (e.target.closest('[data-match-procedures]')) showResults();
      });
      render();
    } catch (error) {
      root.innerHTML = `<p class="card">Could not load the symptom matcher. Use search or the complete procedure catalogue.</p>`;
      console.error(error);
    }
  }

})();
