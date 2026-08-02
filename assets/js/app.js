(() => {
  const cfg = window.KB_CONFIG || {};
  const base = window.KB_BASE || "/";
  const statusLabels = {
    verified: "Verified",
    under_review: "Under review",
    draft: "Draft",
    deprecated: "Deprecated"
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));

  document.addEventListener("click", async (event) => {
    const copy = event.target.closest(".copy-command");
    if (copy) {
      const code = copy.closest(".command-block")?.querySelector("code")?.innerText || "";
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
      const payload = {
        vote: feedback.dataset.feedback,
        url: location.href,
        title: document.title,
        contentStatus: document.body.dataset.contentStatus || "",
        at: new Date().toISOString()
      };
      localStorage.setItem(`kb-feedback:${location.pathname}`, JSON.stringify(payload));
      const status = document.querySelector("#feedback-status");
      if (status) status.textContent = "Feedback recorded. Thank you.";
      if (cfg.feedbackEndpoint) {
        fetch(cfg.feedbackEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(console.warn);
      }
    }

    const procedureLink = event.target.closest("[data-procedure-link]");
    if (procedureLink?.dataset.selectedSymptoms) {
      sessionStorage.setItem("kb:last-symptoms", procedureLink.dataset.selectedSymptoms);
    }
  });

  configureTicketLink();
  configureAccess();

  const wizard = document.querySelector("#wizard-root");
  if (wizard) initWizard(wizard);

  function configureTicketLink() {
    const ticket = document.querySelector("[data-ticket-link]");
    if (!ticket) return;
    const itsm = cfg.itsm || {};
    const template = itsm.ticketUrlTemplate || cfg.ticketUrlTemplate || "";
    if (!itsm.enabled || !template) {
      ticket.removeAttribute("href");
      ticket.setAttribute("aria-disabled", "true");
      ticket.classList.add("is-disabled");
      ticket.textContent = "ITSM integration not configured";
      ticket.addEventListener("click", (event) => event.preventDefault());
      return;
    }

    const selectedSymptoms = sessionStorage.getItem("kb:last-symptoms") || "";
    const replacements = {
      title: ticket.dataset.title || document.querySelector("h1")?.textContent || "IT issue",
      category: ticket.dataset.category || "Support",
      url: location.href,
      severity: ticket.dataset.severity || "",
      owner_team: ticket.dataset.ownerTeam || "",
      symptoms: selectedSymptoms
    };
    ticket.href = Object.entries(replacements).reduce(
      (url, [key, value]) => url.replaceAll(`{${key}}`, encodeURIComponent(value)),
      template
    );
    ticket.target = itsm.openInNewTab === false ? "_self" : "_blank";
    if (ticket.target === "_blank") ticket.rel = "noopener noreferrer";
  }

  function configureAccess() {
    const role = document.body.dataset.requiredRole;
    if (!cfg.access?.enabled) return;
    const currentRole = window.KB_USER?.role || cfg.access.defaultRole || "guest";
    document.querySelectorAll("[data-role]").forEach((element) => {
      const allowed = element.dataset.role.split(",").map((value) => value.trim());
      element.hidden = !allowed.includes(currentRole);
    });
    if (role && role !== "technician" && currentRole !== role) document.body.classList.add("access-limited");
  }

  async function initWizard(root) {
    try {
      const response = await fetch(root.dataset.source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Wizard data returned ${response.status}`);
      const data = await response.json();
      const selected = new Set();
      let query = "";
      let category = "all";

      const visibleSymptoms = () => data.symptoms.filter((symptom) => {
        const matchesCategory = category === "all" || symptom.category === category;
        const haystack = `${symptom.title} ${symptom.description} ${(symptom.tags || []).join(" ")}`.toLowerCase();
        return matchesCategory && (!query || haystack.includes(query.toLowerCase()));
      });

      const render = () => {
        const visible = visibleSymptoms();
        const groups = new Map();
        for (const symptom of visible) {
          if (!groups.has(symptom.category)) groups.set(symptom.category, []);
          groups.get(symptom.category).push(symptom);
        }
        const selectedTitles = data.symptoms.filter((symptom) => selected.has(symptom.id)).map((symptom) => symptom.title);
        root.innerHTML = `
          <div class="wizard-toolbar">
            <div>
              <p class="text-sm font-semibold text-blue-700">Enterprise symptom matcher</p>
              <h3 class="!mt-1">Select every symptom that applies</h3>
              <p class="mt-2 text-sm text-slate-600">Every procedure is evaluated. Verified guidance is prioritised; under-review guidance is clearly labelled and never presented as approved without a warning.</p>
            </div>
            <div class="wizard-count"><strong>${selected.size}</strong><span>selected</span></div>
          </div>
          <div class="wizard-controls">
            <label><span>Filter symptoms</span><input id="wizard-filter" class="wizard-input" type="search" value="${escapeHtml(query)}" placeholder="Type a symptom, error or device…"></label>
            <label><span>Category</span><select id="wizard-category" class="wizard-input"><option value="all">All categories</option>${data.categories.map((item) => `<option value="${escapeHtml(item)}"${item === category ? " selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>
          </div>
          <div class="wizard-actions"><button class="btn-secondary" type="button" data-select-visible>Select all visible (${visible.length})</button><button class="btn-secondary" type="button" data-clear-selection>Clear selection</button></div>
          ${selected.size ? `<div class="selected-symptoms" aria-live="polite">${selectedTitles.map((title) => `<span class="selected-chip">${escapeHtml(title)}</span>`).join("")}</div>` : ""}
          <div class="symptom-groups">${[...groups.entries()].map(([name, items]) => `<details class="symptom-group" open><summary><span>${escapeHtml(name)}</span><span>${items.length}</span></summary><div class="symptom-grid">${items.map((symptom) => `<label class="symptom-option"><input type="checkbox" value="${escapeHtml(symptom.id)}" ${selected.has(symptom.id) ? "checked" : ""}><span><strong>${escapeHtml(symptom.title)}</strong><small>${escapeHtml(symptom.description)}</small></span></label>`).join("")}</div></details>`).join("") || '<p class="card">No symptoms match this filter.</p>'}</div>
          <div class="wizard-submit"><button class="btn" type="button" data-match-procedures ${selected.size ? "" : "disabled"}>Find matching procedures</button><p>${data.counts.symptoms} symptoms · ${data.counts.procedures} procedures indexed · ${data.counts.statuses?.verified || 0} verified</p></div>
          <div id="wizard-results" aria-live="polite"></div>`;
      };

      const rank = () => {
        const chosen = [...selected];
        return data.procedures.map((procedure) => {
          if (procedure.contentStatus === "deprecated") return null;
          const matched = chosen.filter((id) => procedure.symptoms.includes(id));
          if (!matched.length) return null;
          const weighted = matched.reduce((sum, id) => sum + Number(procedure.symptomWeights?.[id] || 5), 0);
          const coverage = chosen.length ? matched.length / chosen.length : 0;
          const precision = procedure.symptoms.length ? matched.length / procedure.symptoms.length : 0;
          const directLinks = chosen.reduce((sum, id) => {
            const symptom = data.symptoms.find((item) => item.id === id);
            return sum + (symptom?.relatedProcedures?.includes(procedure.id) ? 1 : 0);
          }, 0);
          const statusBoost = { verified: 45, under_review: 0, draft: -60 }[procedure.contentStatus] ?? -10;
          const score = weighted * 10 + coverage * 35 + precision * 20 + directLinks * 8 + statusBoost;
          const confidence = coverage >= 0.75 && (matched.length >= 2 || directLinks >= 1)
            ? "high"
            : coverage >= 0.5 || directLinks >= 1
              ? "medium"
              : "low";
          return { ...procedure, matched, score, coverage, precision, directLinks, confidence };
        }).filter(Boolean).sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.title.localeCompare(b.title));
      };

      const showResults = () => {
        const target = root.querySelector("#wizard-results");
        const ranked = rank();
        if (!ranked.length) {
          target.innerHTML = `<section class="wizard-results"><h3>No exact procedure match</h3><p>Keep all selected symptoms in the ticket and start with general workstation triage or search the complete procedure catalogue.</p><div class="mt-4 flex gap-3"><a class="btn" href="${base}procedures/general-workstation-triage/">Open general triage</a><a class="btn-secondary" href="${base}procedures/">Browse all procedures</a></div></section>`;
          return;
        }

        const chosenMap = Object.fromEntries(data.symptoms.map((symptom) => [symptom.id, symptom.title]));
        const selectedIds = [...selected];
        const selectedText = selectedIds.map((id) => chosenMap[id] || id).join("; ");
        const cards = ranked.map((procedure, index) => {
          const unmatched = selectedIds.filter((id) => !procedure.matched.includes(id));
          const status = statusLabels[procedure.contentStatus] || procedure.contentStatus;
          return `<article class="result-card ${index === 0 ? "primary-result" : ""}" data-result-extra="${index >= 12 ? "true" : "false"}" ${index >= 12 ? "hidden" : ""}>
            <div>
              <div class="flex flex-wrap gap-2">
                <span class="badge">${index === 0 ? "Primary recommendation" : `Alternative ${index}`}</span>
                <span class="badge status-${escapeHtml(procedure.contentStatus)}">${escapeHtml(status)}</span>
                <span class="badge confidence-${escapeHtml(procedure.confidence)}">${escapeHtml(procedure.confidence)} confidence</span>
                <span class="badge">${escapeHtml(procedure.category)}</span>
                <span class="badge">${escapeHtml(procedure.supportTier)}</span>
              </div>
              <h4>${escapeHtml(procedure.title)}</h4>
              <p>${escapeHtml(procedure.description)}</p>
              <p class="matched-label"><strong>Matched:</strong> ${procedure.matched.map((id) => escapeHtml(chosenMap[id] || id)).join("; ")}</p>
              ${unmatched.length ? `<p class="unmatched-label"><strong>Not explained:</strong> ${unmatched.map((id) => escapeHtml(chosenMap[id] || id)).join("; ")}</p>` : ""}
              <p class="text-xs text-slate-500">Owner: ${escapeHtml(procedure.ownerTeam || "Configured resolver group")} · Score: ${Math.round(procedure.score)}</p>
              ${procedure.contentStatus !== "verified" ? '<p class="review-warning">Validate under-review guidance against organisational policy before making a production change.</p>' : ""}
            </div>
            <a class="btn" data-procedure-link data-selected-symptoms="${escapeHtml(selectedText)}" href="${escapeHtml(procedure.url)}">Open procedure</a>
          </article>`;
        }).join("");

        target.innerHTML = `<section class="wizard-results">
          <div class="flex items-end justify-between gap-4"><div><p class="text-sm font-semibold text-emerald-700">Ranked recommendations</p><h3 class="!mt-1">Start with the highest-evidence procedure</h3></div><span class="badge">${ranked.length} matches</span></div>
          ${ranked[0].contentStatus !== "verified" ? '<div class="quality-warning"><strong>No verified procedure fully matched.</strong> The primary result is under review. Use it for structured evidence gathering and obtain technical-owner approval before material production changes.</div>' : ""}
          <div class="mt-5 grid gap-4">${cards}</div>
          ${ranked.length > 12 ? `<button class="btn-secondary mt-5" type="button" data-show-all-results>Show all ${ranked.length} matching procedures</button>` : ""}
        </section>`;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      root.addEventListener("input", (event) => {
        if (event.target.id === "wizard-filter") {
          const position = event.target.selectionStart;
          query = event.target.value;
          render();
          requestAnimationFrame(() => {
            const input = root.querySelector("#wizard-filter");
            if (input) {
              input.focus();
              input.setSelectionRange(position, position);
            }
          });
        }
        if (event.target.matches(".symptom-option input")) {
          event.target.checked ? selected.add(event.target.value) : selected.delete(event.target.value);
          render();
        }
      });
      root.addEventListener("change", (event) => {
        if (event.target.id === "wizard-category") {
          category = event.target.value;
          render();
        }
      });
      root.addEventListener("click", (event) => {
        if (event.target.closest("[data-select-visible]")) {
          visibleSymptoms().forEach((symptom) => selected.add(symptom.id));
          render();
        }
        if (event.target.closest("[data-clear-selection]")) {
          selected.clear();
          render();
        }
        if (event.target.closest("[data-match-procedures]")) showResults();
        if (event.target.closest("[data-show-all-results]")) {
          root.querySelectorAll("[data-result-extra='true']").forEach((element) => element.hidden = false);
          event.target.closest("[data-show-all-results]").remove();
        }
      });
      render();
    } catch (error) {
      root.innerHTML = '<p class="card">Could not load the symptom matcher. Use search or the complete procedure catalogue.</p>';
      console.error(error);
    }
  }
})();
