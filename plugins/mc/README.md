# Minecraft: Java Edition Server

Dedicated server support for Minecraft: Java Edition. Install, run, configure and monitor it from NodeGSM.

## Install
Downloaded automatically by the plugin (see `plugin.js`).

## Defaults
| | |
|---|---|
| Game port | 25565 |
| Query port | 25565 |
| Max players | 20 |
| Query protocol | ut3 |

## Config files
- **server.properties** (`server.properties`, properties) - Ports, difficulty, MOTD, whitelist, ...
- **ops.json** (`ops.json`, json) - Operators
- **whitelist.json** (`whitelist.json`, json)

## Logs
- **latest.log** (`logs/latest.log`)

## Notes
Needs Java on the PATH. The installer downloads the latest release server.jar from Mojang and writes `eula.txt` with `eula=true` - using it means you accept the [Minecraft EULA](https://aka.ms/MinecraftEULA).

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Linux (declared, untested)
This plugin declares `platforms: ["windows", "linux"]` for the NodeGSM web / headless server on Linux. It was written from public knowledge of the game's Linux server build and has **not** been run on a real Linux machine. Install uses the same Mojang `server.jar` download; run it with Java 17+ (`apt install openjdk-21-jre-headless` or similar). See `docs/GUIDE-web-linux.md`.
