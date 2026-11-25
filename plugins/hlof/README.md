# Half-Life: Opposing Force Dedicated Server

Dedicated server support for Half-Life: Opposing Force. Install, run, configure and monitor it from NodeGSM.

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
- **server.cfg** (`gearbox/server.cfg`, cfg) - Main server config (hostname, rcon_password, ...)

## Logs
- **Server logs** (`gearbox/logs/*.log`)

## Notes
Installed through the HLDS app (90) with `+app_set_config 90 mod gearbox`; `steam_appid.txt` is written with 50.

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
