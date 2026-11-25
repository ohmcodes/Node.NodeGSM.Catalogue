'use strict';
// Minecraft Java: download the latest release server.jar from Mojang.
const MANIFEST = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const VERSION_FILE = '.nodegsm-version';

module.exports = {
  async install(h) {
    h.log('Querying Mojang version manifest ...');
    const manifest = await h.fetchJson(MANIFEST);
    const latest = manifest.latest.release;
    const ver = await h.fetchJson(manifest.versions.find((v) => v.id === latest).url);
    h.log(`Downloading Minecraft server ${latest} ...`);
    await h.download(ver.downloads.server.url, 'server.jar');
    h.fs.writeFileSync(h.inside('eula.txt'), 'eula=true\n');
    h.fs.writeFileSync(h.inside(VERSION_FILE), latest);
    h.log("eula.txt written with eula=true - by using this server you accept Mojang's EULA.");
  },
  latest: async (h) => (await h.fetchJson(MANIFEST)).latest.release,
  local: (dir) => { try { return require('fs').readFileSync(require('path').join(dir, VERSION_FILE), 'utf8').trim(); } catch { return null; } },
};

