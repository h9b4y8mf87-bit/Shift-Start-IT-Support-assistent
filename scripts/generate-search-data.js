const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const lunr = require("lunr");

const collections = ["procedures", "symptoms", "causes", "commands"];
const baseurl = (process.env.BASEURL || "").replace(/\/$/, "");
const files = collections.flatMap(collection => {
  const dir = `_${collection}`;
  return fs.readdirSync(dir)
    .filter(name => name.endsWith(".md"))
    .map(name => path.join(dir, name));
});

const docs = files.map((file, id) => {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data;
  const type = data.content_type || path.basename(path.dirname(file)).replace(/^_/, "").replace(/s$/, "");
  const slug = data.slug || path.basename(file, ".md");
  const section = type === "procedure" ? "procedures" : `${type}s`;
  const content = parsed.content
    .replace(/{%[\s\S]*?%}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`\[\]()|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: String(id),
    title: data.title,
    description: data.description || "",
    type,
    category: data.category || "",
    tags: (data.tags || []).join(" "),
    error_codes: (data.error_codes || []).join(" "),
    content,
    url: `${baseurl}/${section}/${slug}/`.replace(/\/{2,}/g, "/")
  };
});

const index = lunr(function () {
  this.ref("id");
  this.field("title", { boost: 15 });
  this.field("error_codes", { boost: 14 });
  this.field("tags", { boost: 9 });
  this.field("category", { boost: 6 });
  this.field("description", { boost: 5 });
  this.field("content");
  docs.forEach(doc => this.add(doc));
});

const output = path.join("assets", "data");
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "search-index.json"), JSON.stringify(index));
fs.writeFileSync(path.join(output, "search-documents.json"), JSON.stringify(docs, null, 2));
console.log(`Indexed ${docs.length} Markdown articles`);
