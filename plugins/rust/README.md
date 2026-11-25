# Rust Dedicated Server

Dedicated server support for Rust. Install, run, configure and monitor it from NodeGSM.

## Install
Installed with SteamCMD, app id [258550](https://steamdb.info/app/258550/info/).

## Defaults
| | |
|---|---|
| Game port | 28015 |
| Query port | 28016 |
| Max players | 50 |
| Query protocol | a2s |

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Linux (declared, untested)
This plugin declares `platforms: ["windows", "linux"]` for the NodeGSM web / headless server on Linux. It was written from public knowledge of the game's Linux server build and has **not** been run on a real Linux machine. Linux uses `RustDedicated`; NodeGSM sets `LD_LIBRARY_PATH` to the bundled `RustDedicated_Data/Plugins/x86_64` folder. See `docs/GUIDE-web-linux.md`.
