'use strict';
// Vintage Story: download the latest stable server zip from vintagestory.at.
const VERSION_FILE = '.nodegsm-version';
const API = 'https://api.vintagestory.at/stable.json';
const newest = (data) => Object.keys(data).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];

module.exports = {
  async install(h) {
    h.log('Querying Vintage Story versions ...');
    const v = newest(await h.fetchJson(API));
    h.log(`Downloading Vintage Story ${v} ...`);
    await h.download(`https://cdn.vintagestory.at/gamefiles/stable/vs_server_win-x64_${v}.zip`, 'vs.zip');
    h.extract('vs.zip', '.');
    h.fs.unlinkSync(h.inside('vs.zip'));
    h.fs.writeFileSync(h.inside(VERSION_FILE), v);
  },
  latest: async (h) => newest(await h.fetchJson(API)),
  local: (dir) => { try { return require('fs').readFileSync(require('path').join(dir, VERSION_FILE), 'utf8').trim(); } catch { return null; } },
};
