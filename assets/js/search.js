(() => {
  const input = document.querySelector("#kb-search");
  const panel = document.querySelector("#search-results");
  const clearButton = document.querySelector("[data-search-clear]");
  const status = document.querySelector("#search-status");
  const searchToggle = document.querySelector("[data-search-toggle]");
  if (!input || !panel || !window.lunr) return;

  let index;
  let docs = {};
  let active = -1;
  let results = [];
  let debounceTimer;
  let ready = false;

  Promise.all([
    fetch(`${window.KB_BASE}assets/data/search-index.json`).then((response) => {
      if (!response.ok) throw new Error(`Search index returned ${response.status}`);
      return response.json();
    }),
    fetch(`${window.KB_BASE}assets/data/search-documents.json`).then((response) => {
      if (!response.ok) throw new Error(`Search documents returned ${response.status}`);
      return response.json();
    })
  ]).then(([serialized, documents]) => {
    index = lunr.Index.load(serialized);
    docs = Object.fromEntries(documents.map((document) => [document.id, document]));
    ready = true;
    if (input.value.trim().length >= 2) executeSearch();
  }).catch((error) => {
    status.textContent = "Search could not be loaded. Use the procedure or symptom catalogue.";
    console.error(error);
  });

  document.addEventListener("keydown", (event) => {
    const editable = /input|textarea|select/i.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable;
    if (event.key === "/" && !editable) {
      event.preventDefault();
      input.focus();
      return;
    }
    if (document.activeElement !== input && !panel.contains(document.activeElement)) return;
    if (!results.length) {
      if (event.key === "Escape") closeResults(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active = Math.min(active + 1, results.length - 1);
      paint();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      active = Math.max(active - 1, 0);
      paint();
    }
    if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      location.href = results[active].url;
    }
    if (event.key === "Escape") closeResults(true);
  });

  input.addEventListener("input", () => {
    clearButton.hidden = !input.value;
    active = -1;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(executeSearch, 110);
  }, { passive: true });

  input.addEventListener("focus", () => {
    searchToggle?.setAttribute("aria-expanded", "true");
    if (input.value.trim().length >= 2 && results.length) paint();
  });

  clearButton?.addEventListener("click", () => {
    input.value = "";
    clearButton.hidden = true;
    results = [];
    closeResults(false);
    input.focus();
  });

  panel.addEventListener("mousemove", (event) => {
    const option = event.target.closest("[data-result-index]");
    if (!option) return;
    active = Number(option.dataset.resultIndex);
    updateActiveState();
  }, { passive: true });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("[data-search-region]") && !event.target.closest("[data-search-toggle]")) closeResults(false);
  }, { passive: true });

  function executeSearch() {
    const query = input.value.trim();
    if (!ready || query.length < 2) {
      results = [];
      closeResults(false);
      status.textContent = ready ? "Enter at least two characters to search." : "Search is loading.";
      return;
    }

    try {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const raw = index.query((builder) => {
        terms.forEach((term) => {
          builder.term(term, { boost: 10 });
          builder.term(term, { wildcard: lunr.Query.wildcard.TRAILING, boost: 5 });
          if (term.length > 3) builder.term(term, { editDistance: 1, boost: 3 });
        });
      });
      results = raw.slice(0, 12).map((result) => docs[result.ref]).filter(Boolean);
      if (!results.length) logZero(query);
      paint();
    } catch (error) {
      results = [];
      panel.innerHTML = '<p class="p-4 text-sm text-slate-600">That search could not be processed. Try fewer words or an exact error code.</p>';
      openResults();
      console.warn("Search query rejected", error);
    }
  }

  function paint() {
    panel.innerHTML = results.length
      ? results.map((document, indexValue) => `<a id="kb-search-result-${indexValue}" role="option" aria-selected="${indexValue === active}" data-result-index="${indexValue}" class="search-result ${indexValue === active ? "active" : ""}" href="${document.url}"><div class="search-result-heading"><strong>${escapeHtml(document.title)}</strong><span class="badge">${escapeHtml(document.type)}</span></div><p class="mt-1 text-sm text-slate-600">${escapeHtml(document.description || "")}</p></a>`).join("")
      : '<p class="p-4 text-sm text-slate-600">No results. Try an error code, device, or simpler symptom.</p>';
    status.textContent = results.length ? `${results.length} search results available.` : "No search results.";
    openResults();
    updateActiveState();
  }

  function updateActiveState() {
    panel.querySelectorAll("[data-result-index]").forEach((option) => {
      const isActive = Number(option.dataset.resultIndex) === active;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", String(isActive));
      if (isActive) {
        input.setAttribute("aria-activedescendant", option.id);
        option.scrollIntoView({ block: "nearest" });
      }
    });
    if (active < 0) input.removeAttribute("aria-activedescendant");
  }

  function openResults() {
    panel.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
    searchToggle?.setAttribute("aria-expanded", "true");
  }

  function closeResults(returnFocus) {
    panel.classList.add("hidden");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    searchToggle?.setAttribute("aria-expanded", "false");
    active = -1;
    if (returnFocus) input.focus();
  }

  function logZero(query) {
    const payload = { query, at: new Date().toISOString(), path: location.pathname, viewport: `${innerWidth}x${innerHeight}` };
    console.info("KB zero-result search", payload);
    const endpoint = window.KB_CONFIG?.zeroResultEndpoint;
    if (endpoint) fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).catch(console.warn);
  }

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
  }
})();
