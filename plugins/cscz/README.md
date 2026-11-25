# Counter-Strike: Condition Zero Dedicated Server

Dedicated server support for Counter-Strike: Condition Zero. Install, run, configure and monitor it from NodeGSM.

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
- **server.cfg** (`czero/server.cfg`, cfg) - Main server config (hostname, rcon_password, ...)

## Logs
- **Server logs** (`czero/logs/*.log`)

## Notes
Installed through the HLDS app (90) with `+app_set_config 90 mod czero`; `steam_appid.txt` is written with 80.

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
