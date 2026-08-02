const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const baseurl = (process.env.BASEURL || "").replace(/\/$/, "");
const readCollection = (dir) => fs.readdirSync(dir).filter(n => n.endsWith(".md")).map(name => {
  const file = path.join(dir, name);
  const parsed = matter(fs.readFileSync(file, "utf8"));
  return { file, slug: parsed.data.slug || path.basename(name, ".md"), data: parsed.data };
});

const symptoms = readCollection("_symptoms");
const procedures = readCollection("_procedures");
const inferred = new Map(symptoms.map(s => [s.slug, new Set(s.data.related_procedures || [])]));
for (const p of procedures) for (const s of (p.data.related_symptoms || [])) {
  if (!inferred.has(s)) inferred.set(s, new Set());
  inferred.get(s).add(p.slug);
}

const payload = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  counts: { symptoms: symptoms.length, procedures: procedures.length },
  categories: [...new Set(symptoms.map(s => s.data.category || "Other"))].sort(),
  symptoms: symptoms.map(s => ({
    id: s.slug,
    title: s.data.title,
    description: s.data.description || "",
    category: s.data.category || "Other",
    severity: s.data.severity || "medium",
    tags: s.data.tags || [],
    relatedProcedures: [...(inferred.get(s.slug) || [])].sort()
  })).sort((a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)),
  procedures: procedures.map(p => ({
    id: p.slug,
    title: p.data.title,
    description: p.data.description || "",
    category: p.data.category || "Other",
    severity: p.data.severity || "medium",
    supportTier: p.data.support_tier || "",
    ownerTeam: p.data.owner_team || "",
    platforms: p.data.platforms || [],
    symptoms: p.data.related_symptoms || [],
    symptomWeights: p.data.symptom_weights || {},
    url: `${baseurl}/procedures/${p.slug}/`.replace(/\/{2,}/g, "/")
  })).sort((a,b) => a.title.localeCompare(b.title))
};

const output = path.join("assets", "data", "wizard-data.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(payload, null, 2));
console.log(`Generated multi-select wizard with ${payload.counts.symptoms} symptoms and ${payload.counts.procedures} procedures`);
