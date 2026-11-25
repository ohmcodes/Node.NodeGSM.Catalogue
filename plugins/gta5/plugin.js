'use strict';
// FiveM (GTA V): download the latest Windows server artifact and extract it to <server files>/server
const BASE = 'https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/';
const VERSION_FILE = '.nodegsm-version';

async function latestBuild(fetchText) {
  const html = await fetchText(BASE);
  const m = [...html.matchAll(/href="\.\/(\d+-[0-9a-f]+)\/server\.7z"/g)].map((x) => x[1]);
  if (!m.length) throw new Error('Could not find a FiveM server artifact');
  return m.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).pop();
}

module.exports = {
  async install(h) {
    const build = await latestBuild(h.fetchText);
    h.log(`Downloading FiveM build ${build} ...`);
    await h.download(`${BASE}${build}/server.7z`, 'server.7z');
    h.log('Extracting server.7z (uses the tar shipped with Windows) ...');
    h.extract('server.7z', 'server');
    h.fs.unlinkSync(h.inside('server.7z'));
    h.fs.writeFileSync(h.inside(VERSION_FILE), build);
    h.log('FiveM installed. Create server/server.cfg (see Config Files) and add your Cfx.re license key.');
  },
  latest: (h) => latestBuild(h.fetchText),
  local: (dir) => { try { return require('fs').readFileSync(require('path').join(dir, VERSION_FILE), 'utf8').trim(); } catch { return null; } },
};
