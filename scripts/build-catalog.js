'use strict';
// Builds the published CATALOGUE from plugins/. Needs only Node 18+ and adm-zip (no NodeGSM, no Electron).
//   node scripts/build-catalog.js [outDir]        default outDir: public/
//
// Output (every URL is relative to index.json, so the folder can be hosted anywhere: GitHub Pages, S3, a CDN, a USB stick):
//   index.json          lean list used by the app and the website: one small entry per plugin (no README)
//   plugins/<id>.json   full detail of one plugin (README, docs, ports, configs, logs, screenshots ...), fetched on demand
//   zips/<id>.zip       the plugin folder, deterministic (sha256 only changes when the plugin changes)
//   media/<id>/...      icon.png, banner and screenshots
//   catalogue.json      tiny "has anything changed?" file: { schema, generatedAt, count, hash }  (the app polls this one)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const ROOT = path.join(__dirname, '..');
const PLUGINS = path.join(ROOT, 'plugins');
const FIXED_TIME = new Date(Date.UTC(2020, 0, 1)); // deterministic zips
const SCHEMA = 1;

// "owner/name" when the plugin's url is a GitHub repository (the website shows its stars), else ''
const githubRepo = (u) => { const g = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(String(u || '')); return g ? g[1] + '/' + g[2] : ''; };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const exists = (f) => fs.existsSync(f);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out); else out.push(f);
  }
  return out;
}

function zipPlugin(dir, id) {
  const zip = new AdmZip();
  for (const f of walk(dir)) zip.addFile(`${id}/${path.relative(dir, f).split(path.sep).join('/')}`, fs.readFileSync(f));
  zip.getEntries().forEach((e) => { e.header.time = FIXED_TIME; });
  return zip.toBuffer();
}

// first words of the description, max 140 chars, used when plugin.json has no "summary"
function shorten(text, max = 140) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).replace(/[,;:.\-]+$/, '') + '…';
}

function installInfo(m) {
  const i = m.install;
  const steps = i && Array.isArray(i.steps) ? i.steps : i && i.type === 'steamcmd' ? [{ type: 'steamcmd', appId: i.appId }] : [];
  const steam = steps.find((s) => s.type === 'steamcmd');
  return { kind: steam ? 'steamcmd' : steps.length ? 'download' : 'manual', steamAppId: steam ? String(steam.appId) : null };
}

function listPluginDirs() {
  return fs.readdirSync(PLUGINS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.') && exists(path.join(PLUGINS, e.name, 'plugin.json')))
    .map((e) => e.name).sort();
}

function buildCatalog(outDir, opts = {}) {
  const repo = opts.repo || process.env.CATALOGUE_REPO || 'https://github.com/ohmcodes/Node.NodeGSM.Catalogue';
  for (const d of ['zips', 'plugins', 'media']) { fs.rmSync(path.join(outDir, d), { recursive: true, force: true }); fs.mkdirSync(path.join(outDir, d), { recursive: true }); }

  const list = [];
  for (const folder of listPluginDirs()) {
    const dir = path.join(PLUGINS, folder);
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'plugin.json'), 'utf8'));
    const media = m.media || {};
    const d = m.defaults || {};
    const buf = zipPlugin(dir, m.id);
    fs.writeFileSync(path.join(outDir, 'zips', `${m.id}.zip`), buf);

    // media: icon, optional banner, optional screenshots (copied as-is, relative to the catalogue root)
    const mdir = path.join(outDir, 'media', m.id);
    fs.mkdirSync(mdir, { recursive: true });
    const copy = (rel, to) => { const s = path.join(dir, rel); if (!exists(s)) return null; const t = path.join(mdir, to); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(s, t); return `media/${m.id}/${to}`; };
    const icon = copy(media.icon || 'icon.png', 'icon.png');
    const banner = media.banner ? copy(media.banner, 'banner' + path.extname(media.banner)) : null;
    const shots = (media.screenshots || []).map((s, i) => copy(s, `screenshots/${i + 1}${path.extname(s)}`)).filter(Boolean);
    const readmeFile = path.join(dir, media.readme || 'README.md');

    const inst = installInfo(m);
    const platforms = Array.isArray(m.platforms) && m.platforms.length ? m.platforms : ['windows'];
    const contributors = Array.isArray(m.contributors) ? m.contributors.filter((x) => typeof x === 'string' && x.trim()) : [];
    const lean = {
      id: m.id,
      name: String(m.name || m.id).replace(/ Dedicated Server$/, ''),
      fullName: m.name,
      summary: m.summary ? String(m.summary) : shorten(m.description),
      maker: m.author || '',            // who made the plugin
      contributors,                      // everyone else who improved it ("@login" shows their GitHub picture on the website)
      repo: githubRepo(m.url),           // "owner/name" of the plugin's source repository when it is on GitHub (the website shows its stars)
      version: m.version || '',
      tags: m.tags || [],
      platforms,
      install: inst.kind, steamAppId: inst.steamAppId,
      maxPlayers: d.maxPlayers || null,
      hasScript: exists(path.join(dir, 'plugin.js')),
      minAppVersion: m.minAppVersion || null,
      sha256: sha(buf), size: buf.length,
      zip: `zips/${m.id}.zip`, icon, banner, detail: `plugins/${m.id}.json`,
    };
    const detail = {
      ...lean,
      description: m.description || '',
      url: m.url || '',
      docs: (m.docs || []).map((x) => ({ title: x.title, url: x.url, type: x.type, description: x.description || '' })),
      ports: { game: d.port || null, query: d.queryPort || null },
      query: m.query || null,
      configs: (m.configs || []).map((c) => ({ name: c.name, path: c.path, format: c.format || 'text' })),
      logs: (m.logs || []).map((l) => ({ name: l.name, path: l.path })),
      metrics: (m.metrics || []).map((x) => ({ id: x.id, name: x.name, unit: x.unit || '' })),
      screenshots: shots,
      readme: exists(readmeFile) ? fs.readFileSync(readmeFile, 'utf8') : '',
      source: `${repo}/tree/main/plugins/${folder}`,
    };
    fs.writeFileSync(path.join(outDir, 'plugins', `${m.id}.json`), JSON.stringify(detail));
    list.push(lean);
  }

  const tags = [...new Set(list.flatMap((p) => p.tags))].sort();
  const makers = [...new Set(list.flatMap((p) => [p.maker, ...p.contributors]).filter(Boolean))].sort();
  const index = JSON.stringify({ schema: SCHEMA, count: list.length, tags, makers, plugins: list }, null, 1);
  fs.writeFileSync(path.join(outDir, 'index.json'), index);
  // the hash only covers content, not the time, so it changes exactly when a plugin does
  fs.writeFileSync(path.join(outDir, 'catalogue.json'), JSON.stringify({ schema: SCHEMA, generatedAt: new Date().toISOString(), count: list.length, hash: sha(index) }));
  return list;
}

module.exports = { buildCatalog, shorten };

if (require.main === module) {
  const out = path.resolve(process.argv[2] || path.join(ROOT, 'public'));
  fs.mkdirSync(out, { recursive: true });
  const l = buildCatalog(out);
  console.log(`catalogue built: ${l.length} plugins (${l.filter((p) => p.hasScript).length} with plugin.js) -> ${out}`);
}
