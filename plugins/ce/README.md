# Conan Exiles Dedicated Server

Dedicated server support for Conan Exiles. Install, run, configure and monitor it from NodeGSM.

## Install
Installed with SteamCMD, app id [443030](https://steamdb.info/app/443030/info/).

## Defaults
| | |
|---|---|
| Game port | 7777 |
| Query port | 27015 |
| Max players | 40 |
| Query protocol | a2s |

## Config files
- **ServerSettings.ini** (`ConanSandbox/Saved/Config/WindowsServer/ServerSettings.ini`, ini) - Server name, passwords, gameplay
- **Engine.ini** (`ConanSandbox/Saved/Config/WindowsServer/Engine.ini`, ini) - Engine overrides (server name, mods)
- **Game.ini** (`ConanSandbox/Saved/Config/WindowsServer/Game.ini`, ini)

## Logs
- **ConanSandbox.log** (`ConanSandbox/Saved/Logs/ConanSandbox.log`)

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
