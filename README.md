# NodeGSM Catalogue

The plugin list of [NodeGSM](https://github.com/ohmcodes/Node.WGSM2026). Every game server NodeGSM can manage is a **plugin**: one folder in [`plugins/`](plugins). **Everyone is welcome to add a plugin or fix an outdated one** with a pull request ([CONTRIBUTING.md](CONTRIBUTING.md)).

This repository is independent: it needs only Node.js 18+, not NodeGSM and not Electron.

```
plugins/<id>/        the plugins (plugin.json, icon.png, README.md, optional plugin.js)
scripts/             validate-plugins.js, build-catalog.js
test/                catalogue contract tests
public/              build output (not committed; CI publishes it)
```

## Use it

```powershell
npm install
npm test                 # validates every plugin and checks the published contract
npm run validate mc      # validate one plugin
npm run build            # writes the static catalogue to public/
```

## Do we need an API service? No - it is static files

The catalogue is published as plain files on GitHub Pages (a CDN, free, nothing to run or secure). A server would only add cost and a point of failure, because the data changes only when a pull request is merged.

| URL (relative to the site root) | Purpose |
|---|---|
| `catalogue.json` | a few bytes: `{ count, hash, generatedAt }`. NodeGSM asks this first |
| `index.json` | the list (id, name, summary, maker, version, tags, sha256, URLs) |
| `plugins/<id>.json` | full detail of one plugin (README, docs, ports ...), fetched on demand |
| `zips/<id>.zip` | the downloadable plugin (verified against the `sha256` from `index.json`) |
| `media/<id>/` | icon, banner, screenshots |

Published address (after enabling GitHub Pages, see below): `https://ohmcodes.github.io/Node.NodeGSM.Catalogue/`

### Who reads it

- **NodeGSM** downloads the index **once**, keeps it on disk and only asks `catalogue.json` again when the cached copy is older than a day or the user presses *Refresh*. If the hash is unchanged nothing else is downloaded. Plugins are installed from the zip after the sha256 check, and the cached list keeps working offline.
- **The website** reads `index.json` for the plugin list and `plugins/<id>.json` for the details. It keeps its own data (ratings, comments, community info) separately.

Need server-side search, download statistics or accounts later? Put that in the website backend, which already stores ratings, and keep this repository static.

## Publishing (one-time setup)
1. Repository **Settings → Pages → Source: GitHub Actions**.
2. Merge to `main`: `.github/workflows/catalogue.yml` validates, builds and deploys `public/`.
3. The default catalogue URL in NodeGSM and in the website `config.js` is already `https://ohmcodes.github.io/Node.NodeGSM.Catalogue/`.

Pull requests run validation and the tests only; nothing is deployed from a PR.

If the deploy job fails at `actions/configure-pages` with **Get Pages site failed** / **Not Found**, a repository administrator must enable Pages in **Settings → Pages** and select **GitHub Actions** as the source. Then rerun the failed jobs from the Actions run, or run the Catalogue workflow on `main`. The workflow's `GITHUB_TOKEN` cannot enable Pages itself.

## Related repositories
- **NodeGSM** (the app): https://github.com/ohmcodes/Node.WGSM2026
- **Website**: https://github.com/ohmcodes/Node.NodeGSM.Website

## License
MIT. Game names and icons belong to their owners.
