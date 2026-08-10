(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initDomainMenu();
    initProcedureHardening();
  });

  function initDomainMenu() {
    const menu = document.querySelector("[data-domain-menu]");
    if (!menu) return;
    document.addEventListener("pointerdown", (event) => {
      if (menu.open && !event.target.closest("[data-domain-menu]")) menu.open = false;
    }, { passive: true });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    });
  }

  function initProcedureHardening() {
    const article = document.querySelector("[data-article-page]");
    const body = article?.querySelector("[data-article-body]");
    if (!article || !body || article.dataset.procedure !== "true") return;
    groupProcedureSections(body);
    initFocusMode(article);
  }

  function groupProcedureSections(body) {
    if (body.dataset.sectionGrouping === "done") return;
    const headings = [...body.children].filter((node) => node.tagName === "H2");
    if (!headings.length) return;

    for (const heading of headings) {
      if (heading.parentElement !== body) continue;
      const section = document.createElement("section");
      section.className = "rd-procedure-section";
      section.dataset.sectionType = classifySection(heading.textContent);
      body.insertBefore(section, heading);

      section.appendChild(heading);
      let node = section.nextElementSibling;
      while (node && node.tagName !== "H2") {
        const next = node.nextElementSibling;
        section.appendChild(node);
        node = next;
      }
    }
    body.dataset.sectionGrouping = "done";
  }

  function classifySection(text) {
    const value = String(text || "").toLowerCase();
    if (/(evidence|information to collect|capture)/.test(value)) return "evidence";
    if (/(safety|risk|prerequisite|before you begin|permission|approval)/.test(value)) return "safety";
    if (/(diagnostic|diagnosis|triage|investigat|check|identify)/.test(value)) return "diagnostic";
    if (/(remediation|resolution|resolve|fix|repair|implement)/.test(value)) return "remediation";
    if (/(rollback|backout|revert|restore)/.test(value)) return "rollback";
    if (/(verification|verify|validate|expected result|confirm outcome|test result)/.test(value)) return "verification";
    if (/(escalat|handover|next resolver)/.test(value)) return "escalation";
    return "general";
  }

  function initFocusMode(article) {
    const button = article.querySelector("[data-focus-mode]");
    if (!button) return;
    let enabled = false;

    const apply = () => {
      document.body.classList.toggle("rd-focus-mode", enabled);
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = enabled ? "Exit focus mode" : "Focus mode";
    };

    button.addEventListener("click", () => {
      enabled = !enabled;
      apply();
      announce(enabled ? "Procedure focus mode enabled." : "Procedure focus mode disabled.");
    });

    document.addEventListener("keydown", (event) => {
      const editable = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable;
      if (!editable && event.key.toLowerCase() === "f" && event.altKey) {
        event.preventDefault();
        enabled = !enabled;
        apply();
      }
      if (event.key === "Escape" && enabled) {
        enabled = false;
        apply();
      }
    });

    apply();
  }

  function announce(message) {
    const region = document.querySelector("[data-toast-region]");
    if (!region) return;
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = message;
      region.classList.add("is-visible");
      setTimeout(() => region.classList.remove("is-visible"), 1600);
    });
  }
})();
