'use strict';
// Validates every plugins/<id>/ folder. Used locally (`npm run validate [id]`) and by CI on pull requests.
const fs = require('fs');
const path = require('path');
const { validate } = require('./lib/validate');

const ROOT = path.join(__dirname, '..', 'plugins');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const folders = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).filter((n) => !only.length || only.includes(n));

let bad = 0; let warns = 0; const ids = new Map();
for (const f of folders) {
  const dir = path.join(ROOT, f);
  const mf = path.join(dir, 'plugin.json');
  if (!fs.existsSync(mf)) { console.log(`✖ ${f}: plugin.json missing`); bad++; continue; }
  let m;
  try { m = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { console.log(`✖ ${f}: invalid JSON - ${e.message}`); bad++; continue; }
  const { errors, warnings } = validate(m, dir);
  if (f !== '_template') {
    if (m.id !== f) errors.push(`folder name "${f}" must equal id "${m.id}"`);
    const media = m.media || {};
    if (!fs.existsSync(path.join(dir, media.icon || 'icon.png'))) errors.push('icon.png is required');
    if (!fs.existsSync(path.join(dir, media.readme || 'README.md'))) errors.push('README.md is required');
    for (const k of ['description', 'author', 'version']) if (!m[k]) errors.push(`"${k}" is required`);
    if (!Array.isArray(m.docs) || !m.docs.length) errors.push('"docs" needs at least one link (official or unofficial guide)');
    if (m.summary !== undefined && (typeof m.summary !== 'string' || m.summary.length > 140)) errors.push('"summary" must be text of at most 140 characters');
    if (m.contributors !== undefined && (!Array.isArray(m.contributors) || m.contributors.some((c) => typeof c !== 'string'))) errors.push('"contributors" must be an array of names');
    for (const s of (media.screenshots || [])) if (!fs.existsSync(path.join(dir, s))) errors.push(`screenshot not found: ${s}`);
    if (media.banner && !fs.existsSync(path.join(dir, media.banner))) errors.push(`banner not found: ${media.banner}`);
    if (ids.has(m.id)) errors.push(`duplicate id (also in ${ids.get(m.id)})`);
    ids.set(m.id, f);
  }
  console.log(errors.length ? `✖ ${f}` : `✔ ${f}`);
  if (errors.length) { bad++; console.log(errors.map((e) => `  ✖ ${e}`).join('\n')); } else if (warnings.length) console.log(warnings.map((w) => `  ! ${w}`).join('\n'));
  warns += warnings.length;
}
console.log(`\n${folders.length} plugin(s) checked, ${bad} with errors, ${warns} warning(s).`);
process.exit(bad ? 1 : 0);
