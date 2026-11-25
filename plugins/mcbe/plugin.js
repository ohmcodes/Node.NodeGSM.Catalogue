'use strict';
// Minecraft Bedrock: download the latest Windows server from minecraft.net.
// Updates keep the user's server.properties / allowlist.json / permissions.json.
const API = 'https://net-secondary.web.minecraft-services.net/api/v1.0/download/links';
const VERSION_FILE = '.nodegsm-version';
const KEEP = ['server.properties', 'allowlist.json', 'permissions.json'];

async function latestLink(fetchJson) {
  const data = await fetchJson(API);
  const link = ((data.result && data.result.links) || []).find((l) => l.downloadType === 'serverBedrockWindows');
  if (!link) throw new Error('Could not find the Bedrock Windows server download');
  const m = /bedrock-server-([\d.]+)\.zip/.exec(link.downloadUrl);
  return { url: link.downloadUrl, version: m ? m[1] : 'latest' };
}

module.exports = {
  async install(h) {
    const { url, version } = await latestLink(h.fetchJson);
    h.log(`Downloading Bedrock server ${version} ...`);
    const saved = {};
    for (const f of KEEP) { const p = h.inside(f); if (h.fs.existsSync(p)) saved[f] = h.fs.readFileSync(p); }
    await h.download(url, 'bedrock.zip');
    h.extract('bedrock.zip', '.');
    h.fs.unlinkSync(h.inside('bedrock.zip'));
    for (const [f, data] of Object.entries(saved)) h.fs.writeFileSync(h.inside(f), data); // restore user files
    h.fs.writeFileSync(h.inside(VERSION_FILE), version);
  },
  latest: async (h) => (await latestLink(h.fetchJson)).version,
  local: (dir) => { try { return require('fs').readFileSync(require('path').join(dir, VERSION_FILE), 'utf8').trim(); } catch { return null; } },
};
