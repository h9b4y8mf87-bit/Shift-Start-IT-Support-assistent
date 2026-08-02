const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const collections = ["procedures", "symptoms", "causes", "commands"];
const required = {
  procedure: ["title","description","content_type","category","severity","tags","tldr","escalation","permalink"],
  symptom: ["title","description","content_type","category","severity","tags","related_procedures","permalink"],
  cause: ["title","description","content_type","probability","related_symptoms","permalink"],
  command: ["title","description","content_type","platform","permalink"]
};
const errors=[]; const records={};
for(const collection of collections){const dir=`_${collection}`;records[collection]=new Map();if(!fs.existsSync(dir)){errors.push(`Missing collection directory: ${dir}`);continue;}for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.md'))){const file=path.join(dir,name);const parsed=matter(fs.readFileSync(file,'utf8'));const d=parsed.data;const slug=d.slug||path.basename(name,'.md');records[collection].set(slug,{file,data:d,content:parsed.content});for(const key of required[d.content_type]||[])if(d[key]===undefined||d[key]==="")errors.push(`${file}: missing ${key}`);if(parsed.content.includes('{% command'))errors.push(`${file}: legacy Eleventy shortcode remains`);if(d.content_type==='procedure' && !d.related_symptoms?.length)errors.push(`${file}: procedure is absent from symptom matching`);if(d.content_type==='procedure' && d.owner_team && parsed.content.length<1200)errors.push(`${file}: procedure content is too short for enterprise use`);}}
for(const [slug,p] of records.procedures){for(const s of p.data.related_symptoms||[])if(!records.symptoms.has(s))errors.push(`${p.file}: missing related symptom ${s}`);}
for(const [slug,s] of records.symptoms){if(!(s.data.related_procedures||[]).length)errors.push(`${s.file}: symptom has no related procedure`);for(const p of s.data.related_procedures||[])if(!records.procedures.has(p))errors.push(`${s.file}: missing related procedure ${p}`);}
const list=fs.readFileSync('_layouts/list.html','utf8');if(/for\s+item\s+in\s+\w+\s+limit:/i.test(list))errors.push('_layouts/list.html: catalogue must not limit or truncate items');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log(`Enterprise validation passed: ${records.procedures.size} procedures, ${records.symptoms.size} symptoms, ${records.causes.size} causes, ${records.commands.size} command articles.`);
