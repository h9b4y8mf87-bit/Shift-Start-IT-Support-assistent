# ShiftStart IT Support KB — Jekyll Edition

A technician-first internal IT support knowledge base built with **Jekyll 4**, **Tailwind CSS**, **Lunr.js**, and vanilla JavaScript. It deploys as a static site to GitHub Pages and keeps all knowledge articles in Markdown with YAML front matter.

## What is included

- Four Jekyll collections: `_procedures`, `_symptoms`, `_causes`, and `_commands`
- Full-text Lunr search generated from Markdown during every build
- Typo-tolerant search, `/` focus shortcut, arrow navigation, and Enter-to-open
- YAML-driven diagnostic wizard generated as `assets/data/wizard-data.json`
- Automatic command blocks through `_includes/command.html`
- Copy buttons, optional diagnostic API calls, feedback hooks, ITSM ticket links, and role gates
- GitHub Actions deployment to GitHub Pages
- Netlify Function and Cloudflare Worker placeholders under `api/`
- A Decap CMS configuration example under `admin/`

## Requirements

- Ruby 3.2 or newer
- Bundler
- Node.js 22 or newer
- npm

## Run locally

```bash
bundle install
npm install
npm run dev
```

Jekyll will display the local URL, normally `http://127.0.0.1:4000`.

For a production build:

```bash
npm run test
```

The generated site is written to `_site/`.

## Repository structure

```text
.github/workflows/deploy.yml  GitHub Pages build and deployment
_config.yml                  Jekyll configuration
Gemfile                      Ruby dependencies
_data/                       Site settings and wizard source
_layouts/                    Page layouts
_includes/                   Header, footer and command partial
_procedures/                 Step-by-step troubleshooting articles
_symptoms/                   User-visible symptoms
_causes/                     Likely root causes
_commands/                   Reusable diagnostic commands
assets/js/                   Search, wizard and feedback behaviour
_assets/css/tailwind.css      Tailwind source
scripts/                     Validation and JSON generation
api/                         Future serverless endpoints
templates/                   Authoring templates
```

## Add a procedure

1. Copy `templates/procedure-template.md` into `_procedures/`.
2. Rename it to a descriptive filename such as `wifi-connected-no-internet.md`.
3. Update every front-matter value, especially `slug`, `permalink`, `tldr`, relationships, and `escalation`.
4. Write the troubleshooting steps and expected results.
5. Validate and build:

```bash
npm run test
```

### Add a copyable command

Use a Liquid capture and the reusable include:

```liquid
{% raw %}{% capture kb_command_1 %}
Get-NetIPConfiguration
Test-NetConnection example.com -Port 443
{% endcapture %}
{% include command.html shell="powershell" label="PowerShell" command=kb_command_1 %}{% endraw %}
```

For a future remote diagnostic button, add a configured diagnostic ID:

```liquid
{% raw %}{% include command.html shell="powershell" label="PowerShell" command=kb_command_1 diagnostic_id="network-baseline" %}{% endraw %}
```

## Update the wizard

Edit `_data/wizard-questions.yml`. Each non-terminal node has `question`, `yes`, and `no`. Each terminal node has `procedure`, `title`, and an optional `summary`.

Then run:

```bash
npm run generate
```

The build converts the YAML to `assets/data/wizard-data.json` automatically.

## Search index

`scripts/generate-search-data.js` reads all four Jekyll collections and creates:

- `assets/data/search-index.json`
- `assets/data/search-documents.json`

These JSON files can also be consumed by a Slack or Teams bot. A bot endpoint can load `search-documents.json` for article metadata and `search-index.json` with Lunr.js to reproduce site search.

## Configure the ITSM ticket link

Edit `_data/kb.yml`:

```yaml
ticketUrlTemplate: "https://itsm.example.com/new?title={title}&category={category}&article={url}"
```

Supported placeholders are `{title}`, `{category}`, and `{url}`.

## Feedback and zero-result analytics

Set these values in `_data/kb.yml`:

```yaml
feedbackEndpoint: "https://api.example.com/feedback"
zeroResultEndpoint: "https://api.example.com/search-zero"
```

When blank, feedback is stored in the browser and zero-result searches are logged to the console.

## Dynamic diagnostics

Configure `_data/kb.yml`:

```yaml
diagnostics:
  enabled: true
  endpoint: "https://api.example.com/diagnostics"
  method: POST
```

The front end posts a diagnostic ID and article path. Never execute arbitrary commands supplied by a browser. The server must map approved diagnostic IDs to allowlisted, authenticated operations.

## Role-based access hook

The default site is open. To enable UI role gates, edit `_data/kb.yml`:

```yaml
access:
  enabled: true
  defaultRole: guest
```

Your identity layer can set `window.KB_USER = { role: "technician" }` before `app.js` loads. Elements using `data-role="technician,admin"` will then be filtered. This is only a presentation hook; use Cloudflare Access, an authenticated proxy, or private hosting for real access control.

## GitHub Pages deployment

1. Push this repository to the `main` branch.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. The workflow installs Ruby and Node dependencies, validates content, generates data, builds Tailwind and Jekyll, uploads `_site`, and deploys it.

The deployed project site will normally be:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

## Optional serverless functions

- Netlify examples: `api/netlify/functions/`
- Cloudflare Worker example: `api/cloudflare/worker.js`

`netlify.toml` and `wrangler.toml` are included as starting points. Add authentication, request validation, rate limiting, audit logging and allowlists before enabling any diagnostic function.

## Optional Decap CMS

1. Copy `admin/config.yml.example` to `admin/config.yml`.
2. Replace `YOUR-ORG/YOUR-REPO`.
3. Add the Decap CMS admin page and configure an authentication provider.
4. Expand the collection definitions for symptoms, causes and commands.

Decap CMS commits Markdown directly to this repository, so the existing validation and deployment workflow remains unchanged.

## Security notes

- A public GitHub Pages site is not suitable for secrets, internal IP addresses, credentials, recovery keys or confidential infrastructure details.
- Client-side role hiding is not access control.
- Remote diagnostics must require authentication and use approved diagnostic IDs rather than raw commands.
- Review procedures regularly and keep escalation ownership current.

## Enterprise coverage and completeness

This edition contains **421 complete procedure files** across **19 technical-support domains**. The existing authored procedures were preserved and the catalogue is not paginated or limited. The build validator fails when a procedure has no symptom relationship, a linked procedure or symptom is missing, or a generated enterprise procedure is too short.

The multi-select wizard reads every Markdown symptom and procedure during the build. Technicians may select any number of symptoms, filter the full list, select all visible symptoms, and receive ranked procedures based on weighted direct relationships. No procedure is hard-coded into the browser and none is excluded from the generated wizard data.

“Complete enterprise baseline” means broad L1-L3 workplace, identity, endpoint, network, collaboration, security, infrastructure, cloud, application, voice, data and lifecycle coverage. Organisation-specific systems, contracts, emergency contacts, regulatory controls, approval matrices and proprietary application runbooks must still be added as Markdown for the environment in which the KB is deployed.
