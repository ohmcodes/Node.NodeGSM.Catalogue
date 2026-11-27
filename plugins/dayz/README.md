# DayZ Dedicated Server

Dedicated server support for DayZ. Install, run, configure and monitor it from NodeGSM.

## Install
Installed with SteamCMD, app id [223350](https://steamdb.info/app/223350/info/).

## Defaults
| | |
|---|---|
| Game port | 2302 |
| Query port | 27016 |
| Max players | 60 |
| Query protocol | a2s |

## Config files
- **serverDZ.cfg** (`serverDZ.cfg`, cfg) - Hostname, password, max players, mission template

## Steam account
This server only downloads for a Steam account that owns DayZ. In NodeGSM open **Settings > Steam account** and sign in once (Steam Guard code if asked), then install. NodeGSM keeps only the account name; SteamCMD keeps its own login.

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
