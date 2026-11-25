# ARK: Survival Evolved Dedicated Server

Dedicated server support for ARK: Survival Evolved. Install, run, configure and monitor it from NodeGSM.

## Install
Installed with SteamCMD, app id [376030](https://steamdb.info/app/376030/info/).

## Defaults
| | |
|---|---|
| Game port | 7777 |
| Query port | 27015 |
| Max players | 16 |
| Query protocol | a2s |

## Config files
- **GameUserSettings.ini** (`ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini`, ini) - Server settings, passwords, rates
- **Game.ini** (`ShooterGame/Saved/Config/WindowsServer/Game.ini`, ini) - Game rules and engram overrides

## Logs
- **ShooterGame.log** (`ShooterGame/Saved/Logs/ShooterGame.log`)

## Notes
Extra `?Key=Value` options in Start parameters are appended to the map string; other flags (e.g. `-crossplay`) go after it.

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
