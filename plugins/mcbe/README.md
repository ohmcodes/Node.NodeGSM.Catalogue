# Minecraft: Bedrock Edition Server

Dedicated server support for Minecraft: Bedrock Edition. Install, run, configure and monitor it from NodeGSM.

## Install
Downloaded automatically by the plugin (see `plugin.js`).

## Defaults
| | |
|---|---|
| Game port | 19132 |
| Query port | 19132 |
| Max players | 10 |
| Query protocol | none |

## Config files
- **server.properties** (`server.properties`, properties) - Port (server-port), world name, difficulty, ...
- **allowlist.json** (`allowlist.json`, json)
- **permissions.json** (`permissions.json`, json)

## Notes
Downloads the latest Windows server from minecraft.net. Updates keep your `server.properties`, `allowlist.json` and `permissions.json`. Set the port and max players in `server.properties` (the Bedrock server has no command-line options for them).

## Contributing
Found something outdated (exe path, ports, arguments)? Edit `plugin.json` and open a pull request - see [CONTRIBUTING.md](../../CONTRIBUTING.md).
