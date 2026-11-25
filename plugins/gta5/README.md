# Grand Theft Auto V Dedicated Server (FiveM)

Dedicated server support for Grand Theft Auto V (FiveM). Install, run, configure and monitor it from NodeGSM.

## Install
Downloaded automatically by the plugin (see `plugin.js`).

## Defaults
| | |
|---|---|
| Game port | 30120 |
| Query port | 30120 |
| Max players | 32 |
| Query protocol | fivem |

## Config files
- **server.cfg** (`server/server.cfg`, cfg) - License key, endpoints, resources

## Notes
Downloads the latest Windows FiveM server artifact. Extraction uses the `tar` that ships with Windows 10/11. You need your own `server.cfg` and a Cfx.re license key.

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
