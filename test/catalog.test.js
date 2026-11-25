'use strict';
// Builds the catalogue into a temp folder and checks the published contract that the NodeGSM app and the website rely on.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { buildCatalog, shorten } = require('../scripts/build-catalog');

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'nodegsm-cat-'));
const list = buildCatalog(out);
const read = (f) => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8'));

const index = read('index.json');
assert.strictEqual(index.schema, 1);
assert.strictEqual(index.count, list.length);
assert(index.count >= 46, 'plugins present: ' + index.count);
assert(!index.plugins.some((p) => 'readme' in p || 'docs' in p), 'index.json stays lean (no README / docs)');

const meta = read('catalogue.json');
assert.strictEqual(meta.count, index.count);
assert.strictEqual(meta.hash, crypto.createHash('sha256').update(fs.readFileSync(path.join(out, 'index.json'))).digest('hex'));

for (const p of index.plugins) {
  for (const k of ['id', 'name', 'summary', 'maker', 'version', 'sha256', 'zip', 'icon', 'detail']) assert(p[k], `${p.id}: ${k}`);
  assert(p.summary.length <= 141, `${p.id}: summary length`);
  assert(fs.existsSync(path.join(out, p.icon)), `${p.id}: icon file`);
  const buf = fs.readFileSync(path.join(out, p.zip));
  assert.strictEqual(crypto.createHash('sha256').update(buf).digest('hex'), p.sha256, `${p.id}: sha256`);
  assert(new AdmZip(buf).getEntry(`${p.id}/plugin.json`), `${p.id}: zip contains plugin.json`);
  const d = read(p.detail);
  assert.strictEqual(d.id, p.id);
  assert(typeof d.readme === 'string' && Array.isArray(d.docs), `${p.id}: detail`);
}

// the build is deterministic: the same plugins give the same zips
const out2 = fs.mkdtempSync(path.join(os.tmpdir(), 'nodegsm-cat-'));
const list2 = buildCatalog(out2);
assert.deepStrictEqual(list2.map((p) => p.sha256), list.map((p) => p.sha256), 'deterministic zips');

assert(shorten('a '.repeat(200)).length <= 140);
assert.strictEqual(shorten('Short.'), 'Short.');

fs.rmSync(out, { recursive: true, force: true }); fs.rmSync(out2, { recursive: true, force: true });
console.log(`catalogue tests passed (${index.count} plugins)`);
