# Team Fortress Classic Dedicated Server

Dedicated server support for Team Fortress Classic. Install, run, configure and monitor it from NodeGSM.

## Install
Installed with SteamCMD, app id [90](https://steamdb.info/app/90/info/).

## Defaults
| | |
|---|---|
| Game port | 27015 |
| Query port | 27015 |
| Max players | 24 |
| Query protocol | a2s |

## Config files
- **server.cfg** (`tfc/server.cfg`, cfg) - Main server config (hostname, rcon_password, ...)

## Logs
- **Server logs** (`tfc/logs/*.log`)

## Notes
Installed through the HLDS app (90) with `+app_set_config 90 mod tfc`; `steam_appid.txt` is written with 20.

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
