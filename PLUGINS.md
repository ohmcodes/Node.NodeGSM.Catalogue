# Writing a NodeGSM plugin

**Every game in NodeGSM is a plugin** - a folder with a `plugin.json`. The games live in [`plugins/`](plugins) of this **Catalogue** repository and are contributed by pull request ([CONTRIBUTING.md](CONTRIBUTING.md)); you can also add your own locally. No compiling, no app update.

```
plugins/palworld/
  plugin.json     required - the whole definition (this guide)
  icon.png        required - square PNG, 64-256 px
  README.md       required - shown in the in-app catalogue and on the website
  banner.png      optional - wide image
  screenshots/    optional - 1.png, 2.png ...
  templates/      optional - default config files users can create with one click
  plugin.js       optional - custom code when JSON is not enough
```
Start by copying [`plugins/_template`](plugins/_template). A complete real example: [`plugins/palworld`](plugins/palworld). Editors that understand JSON Schema (VS Code) give auto-complete and errors from [`plugins/plugin.schema.json`](plugins/plugin.schema.json).

**Install a plugin locally:** in the app, **Games → Install plugin (ZIP / folder)**, or copy the folder into the plugins folder (**Games → Plugins folder**) and click **Reload**.
A local plugin with the **same id as a built-in one overrides it** - handy for fixing an obsolete game before your PR is merged.

**Check it:** `npm run validate <id>`.

## plugin.json

### Listing (shown in the game browser and on the website)
| Field | Required | |
|---|---|---|
| `id` | yes | unique, `a-z 0-9 _ -`, 2-32 chars. **Must equal the folder name** |
| `name` | yes | title, e.g. `Palworld Dedicated Server` |
| `description` | yes* | one or two sentences (shown in the "more info" view) |
| `author` | yes* | the **maker** of the plugin, shown on every catalogue card |
| `contributors` | no | other people who improved it, e.g. `["Alice", "Bob"]` |
| `version` | yes* | semver version; bump it when you change the plugin |
| `summary` | no | one line (max 140 characters) for the catalogue card; defaults to the start of `description` |
| `url` | no | homepage / docs / SteamDB link |
| `tags` | no | search tags, e.g. `["survival", "steamcmd"]` |
| `color` | no | accent colour `#RRGGBB` |
| `media.icon` | yes | default `icon.png` |
| `media.readme` | yes* | default `README.md` |
| `media.banner` | no | wide image shown at the top of the website detail view, e.g. `banner.png` |
| `media.screenshots` | no | e.g. `["screenshots/1.png", "screenshots/2.png"]` |
| `docs` | yes* | **documentation links** - official and unofficial guides for creating the server (see below) |

\* required for plugins submitted to the repository; local plugins only get warnings.

#### docs - official and unofficial guides
Links to everything a server admin might need to set this game up. Shown under **Documentation** in the in-app game browser (grouped *Official* / *Unofficial*) and on the website; also published in the catalogue.
```json
"docs": [
  { "title": "Palworld dedicated server guide", "url": "https://tech.palworldgame.com/dedicated-server-guide", "type": "official", "description": "Official setup, ports and settings" },
  { "title": "How to create a Palworld server", "url": "https://www.survivalservers.com/wiki/index.php?title=How_to_Create_a_Palworld_Server_Guide", "type": "unofficial" }
]
```
| Field | Required | |
|---|---|---|
| `title` | yes | link text |
| `url` | yes | `http(s)://` link (anything else is rejected) |
| `type` | yes | `official` = published by the game/server developer; `unofficial` = community wiki, forum, guide, video |
| `description` | no | one line about what the page covers |

Plugins in the repository need **at least one** link. Put official links first, only add links you opened and checked, and prefer stable pages (wiki / docs) over social posts.

### install - get the server files
Shorthands:
```json
"install": { "type": "steamcmd", "appId": "2394010" }
"install": { "type": "manual" }
```
`manual` means the user must use **Import** (no automatic installer).

Or a list of **steps**, run in order. Everything happens inside the server's files folder; paths are relative and may not contain `..`.
```json
"install": {
  "steps": [
    { "type": "steamcmd", "appId": "90", "mod": "cstrike", "repeat": 5 },
    { "type": "download", "url": "https://example.com/tool.zip", "to": "tool.zip", "extract": true, "extractTo": "tools" },
    { "type": "run", "exe": "tools/vcredist_x64.exe", "args": ["/quiet", "/norestart"] },
    { "type": "mkdir", "path": "Game/Saved/Config" },
    { "type": "write", "path": "Game/Saved/Config/server.ini", "content": "[Server]\nName={name}\nPort={port}\n" },
    { "type": "script" }
  ]
}
```
| Step | Fields | What it does |
|---|---|---|
| `steamcmd` | `appId`, `mod`, `repeat`, `validate`, `beta` | install/update a Steam app. `mod` = GoldSource game via HLDS (`+app_set_config 90 mod X`); `repeat` runs the update several times |
| `download` | `url`, `to`, `extract`, `extractTo`, `deleteAfter` | download a file; optionally extract it (zip built in; 7z/tar.gz via Windows `tar`) and delete the archive |
| `extract` | `from`, `to` | extract an archive that is already there |
| `run` | `exe`, `args`, `cwd`, `ignoreExit` | run an installer (e.g. a redistributable) and wait for it |
| `write` | `path`, `content`, `overwrite` | create a file (only if missing, unless `overwrite`) |
| `mkdir` | `path` | create a folder |
| `script` | | call `install(h)` from `plugin.js` |

`url`, `to`, `path`, `content` ... accept the placeholders `{name} {ip} {port} {queryPort} {map} {maxPlayers} {serverFiles}`.
**Updates** re-run the `steamcmd` step only (when the game has one); otherwise all steps run again.

### run - start the server
```json
"run": {
  "exe": "Pal/Binaries/Win64/PalServer-Win64-Shipping-Cmd.exe",
  "workingDir": "",
  "args": ["{param}", "-port={port}", ["-queryport", "{queryPort}"], "-servername={name}"],
  "stdin": true,
  "stopCommand": "quit"
}
```
- `exe` - relative to the server files folder; use `/`. `command` runs another program instead (e.g. `"java"`), `exe` is then only used to check the install.
- `stdin: false` for srcds/hlds (a redirected console input breaks them). Console commands are disabled for those.
- `stopCommand` is written to the console to stop gracefully; NodeGSM then sends a soft `taskkill`, and force-kills after 15 s.

#### Platforms and Linux
Plugins are **Windows only** unless they declare otherwise. All of these fields are optional:
```json
"platforms": ["windows", "linux"],
"run": {
  "exe": "srcds.exe",
  "stdin": false,
  "linux": { "exe": "srcds_run", "env": { "LD_LIBRARY_PATH": "{serverFiles}/bin" } },
  "args": ["-console", ["-game", "csgo"]]
},
"install": {
  "type": "steamcmd", "appId": "740",
  "linux": { "steps": [ { "type": "steamcmd", "appId": "740", "platform": "linux" } ] }
}
```
- `platforms` - `windows` and / or `linux` (default `["windows"]`). NodeGSM refuses to create or import a server of a game that does not list the current OS, and shows a **not available on this platform** badge in the game browser and *Add Server*. Only declare `linux` when the game has a Linux server build you checked; say in the plugin README what you tested.
- `run.linux` - overrides on Linux: `exe`, `command`, `workingDir`, `args`, `stdin`, `stopCommand`, `env`. Keys you leave out fall back to the plain `run` values; setting `exe` without `command` drops the plain `command`.
- `run.env` - extra environment variables for the server process (any OS; `{serverFiles}` is replaced by the files folder).
- `install.linux` - same shape as `install` (`{ "steps": [...] }` or a shorthand), used instead of it on Linux.
- A `steamcmd` step may set `"platform": "linux"` (or `"windows"`): NodeGSM then adds `+@sSteamCmdForcePlatformType <platform>` as the first SteamCMD argument, but only when it differs from the host OS (for depots that exist for one platform only).
- On Linux NodeGSM makes the executable runnable (`chmod 755`) before it starts it and starts the server in its own process group (stop = console command, `SIGTERM`, then `SIGKILL`).
- the catalogue lists `platforms` for every plugin. Currently declared for Linux (**declared, untested**): `mc`, `csgo`, `rust`, `palworld`.

#### Argument templates (`run.args`)
Each list item becomes one command-line argument.
| Item | Meaning |
|---|---|
| `"-port={port}"` | placeholder inside text. If the value is empty the **whole argument is dropped** |
| `["-ip", "{ip}"]` | a **group**: all parts kept, or all dropped if any placeholder is empty |
| `"{param}"` | the user's *Start parameters*, split on spaces (quotes respected) |
| `"{paramRaw}"` | the raw parameter string pasted into the text (for ARK-style `Map?listen?Key=Value`) |
| `"[?Port={port}]"` | `[ ... ]` marks an **optional part** of one argument |
| `"{port+10}"` | placeholder plus a number |

Placeholders: `{name} {ip} {port} {queryPort} {map} {maxPlayers} {gslt} {param} {paramRaw} {serverFiles} {appId}`.
Values with spaces are passed safely as one argument - do not add quotes yourself.

### defaults
```json
"defaults": { "port": "8211", "queryPort": "8212", "map": "MainWorld5", "maxPlayers": "32",
              "additional": "-publiclobby", "portIncrement": 2 }
```
`additional` is the default *Start parameters*. `portIncrement` reserves several ports per instance when NodeGSM suggests free ports.

### query / gslt
`"query": "a2s" | "ut3" | "fivem" | null` - protocol used to show player counts and detect *Started*. `"gslt": true` shows a Game Server Login Token field.

### configs - editable config files (INI, JSON, ... any number)
```json
"configs": [
  { "id": "settings", "name": "PalWorldSettings.ini", "path": "Pal/Saved/Config/WindowsServer/PalWorldSettings.ini",
    "format": "ini", "description": "World options", "template": "templates/PalWorldSettings.ini" },
  { "id": "admins", "name": "admins.json", "path": "Saved/admins.json", "format": "json" }
]
```
They appear in the **Config Files** tab: edit, save (the previous version is kept as `.bak`), format/validate JSON, and **Create** a missing file (from `template` in the plugin folder, or empty).
`format`: `ini json xml properties cfg yaml text`. JSON is validated before saving.

### logs - live log viewer (any number)
```json
"logs": [
  { "id": "server", "name": "Server log", "path": "Pal/Saved/Logs/*.log", "description": "Newest file is followed" },
  { "id": "chat",   "name": "Chat log",   "path": "logs/chat.txt" }
]
```
They appear in the **Logs** tab as a list; click one to follow it live (filter, pause, errors/warnings highlighted). `*` and `?` are allowed in the **file name**; the newest match is followed, and it switches automatically when the game rotates its logs.

### metrics - extra live numbers (FPS, tick rate, entities ...)
Every server already gets **CPU, memory (whole process tree), threads, uptime, PID, players, map** on the Table and Dashboard views. A plugin can add game-specific numbers; they appear as extra columns the user can switch on in **Settings -> Server table columns**.
```json
"metrics": [
  { "id": "fps", "name": "Server FPS", "unit": "fps", "source": "console", "pattern": "fps[:= ]+([0-9.]+)", "command": "fps", "intervalSec": 10 },
  { "id": "entities", "name": "Entities", "source": "log:server-log", "pattern": "entities[:= ]+(\\d+)" }
]
```
| Field | Required | |
|---|---|---|
| `id`, `name` | yes | column id and title; `unit` is optional (shown in the title) |
| `source` | yes | `console` (the server's output) or `log:<id>` of a log declared in `logs` |
| `pattern` | yes | JavaScript regex with **one capture group** holding the number; the newest match wins |
| `command` | no | console command sent every `intervalSec` (min 2, default 10) so the game prints the value (needs `run.stdin`, not for srcds/hlds) |
| `staleSec` | no | show nothing when no new value arrived for this long (default 120) |
| `patternFlags` | no | RegExp flags, default `i` (`g` / `y` are ignored); e.g. `m` when the pattern uses `^` on a multi-line reply |
| `kind` | no | `"tick"` marks the server's tick rate / tick time (see below). Omit for ordinary metrics (unchanged) |

NodeGSM cannot read FPS from a game by itself - the game has to print it (or answer a command). Check what your server prints (or which console command reports it) and describe it here. Only add metrics you have verified.

#### Tick metric (`"kind": "tick"`) and the Latency fallback
A metric with `kind: "tick"` is the server's tick rate (TPS, tick rate, FPS) or tick time (ms per tick). It is shown as the **Tick** column on the Table / Dashboard, the **Tick** header stat (worst value of the running servers that have one, server names in the tooltip, `n/a` when none does), a **Server tick** dashboard tile, the **Tick** history chart and the **Tick** row of the details panel, coloured green / yellow / red. A game *without* a tick metric gets the built-in **Latency** (ms, the query round trip, never called "tick") instead - column / chart `Latency`, no header stat.

| Field (tick metrics only) | |
|---|---|
| `tickTarget` | healthy value, e.g. `20` (TPS), `64` (tick rate), `50` (ms per tick); gives default colours: higher is better = yellow below 90 %, red below 75 %; lower is better = yellow above the target, red above 2 x the target |
| `higherIsBetter` | default `true`; `false` for times (ms per tick) |
| `warnBelow`, `badBelow` | thresholds when higher is better (`badBelow` <= `warnBelow`); override the `tickTarget` defaults |
| `warnAbove`, `badAbove` | thresholds when `higherIsBetter` is `false` (`badAbove` >= `warnAbove`) |

`source` for a tick metric (any metric) can be:
- `console` - the server's output; with `command` the command is written to the console every `intervalSec` (needs `run.stdin`; not for srcds / hlds).
- `log:<id>` - a log declared in `logs[]`.
- `rcon:<command>` - the command is sent **through RCON** every `intervalSec` and the first matching line of the reply is parsed (silent: nothing in the Console tab or the NGSM log; the password is never logged). It uses the game's first console of type `rcon` (`consoles[]`), or `rconConsole` (the id of one), or an inline `rconSource` (`rcon:<port>:<password>`, same `{placeholder}` rules as consoles). The server must be running and RCON enabled; a failing poll simply shows no value.

The `pattern` has **one capture group**; its text is parsed tolerantly (ANSI colours like `ESC[32m`, Minecraft `§a` codes, `*` markers, `1,234.5`, `20,0`, units like `12.3ms` - the first number counts).
```json
"metrics": [
  { "id": "tps", "name": "Server TPS", "unit": "TPS", "kind": "tick", "source": "rcon:tps",
    "pattern": "TPS from last[^:]*:\\s*\\D*?([0-9.]+)", "intervalSec": 15, "tickTarget": 20, "warnBelow": 18, "badBelow": 15 },
  { "id": "mspt", "name": "Average tick time", "unit": "ms", "kind": "tick", "source": "rcon:tick query",
    "pattern": "Average (?:time per )?tick(?: time)?:\\s*([0-9.,]+)\\s*ms", "higherIsBetter": false, "tickTarget": 50, "warnAbove": 40, "badAbove": 50 }
]
```
Bundled examples (check what your game version prints before copying):
| Game | Metric | How |
|---|---|---|
| `mc` | `tps` | `rcon:tps` - **Paper / Spigot / Purpur only** (`/tps`, the first value is the last minute). Needs `enable-rcon=true` + `rcon.password` in `server.properties` |
| `mc` | `mspt` (ms, lower is better) | `rcon:tick query` - **vanilla 1.20.3+** (`/tick query`, "Average time per tick"). 50 ms = 20 TPS. Older vanilla has no tick command: use a mod / Spark (see [docs/GUIDE-metrics.md](https://github.com/ohmcodes/Node.NodeGSM/blob/main/docs/GUIDE-metrics.md)) |
| `csgo` | `fps` | `rcon:stats` - the Source `stats` command (CPU / NetIn / NetOut / Uptime / Maps / **FPS** / Players); srcds has no stdin, so RCON is used. Needs `rcon_password` in `server.cfg`. `tickTarget` 64 (raise it for 128-tick servers) |
| `rust` | `fps` | console `fps` (output like `60 FPS`); Rust's console must be reachable (stdin) |
Other Source games (tf2, css, gmod ...) can use the same `stats` pattern as csgo; they currently show Latency only.

### Optional fields for clusters, backups, events, logging, consoles, update and auto-clear
All of these are optional. They are validated (by NodeGSM `src/main/plugins.js`, mirrored in `scripts/lib/validate.js`), described in [`plugin.schema.json`](plugins/plugin.schema.json) and carried onto the game object. All of them are used by the app (see [FEATURES.md](https://github.com/ohmcodes/Node.NodeGSM/blob/main/FEATURES.md)) except `logging.logFiles`. Ids inside these lists (`events`, `backup.presets`, `logging.patterns`, `consoles`) use letters, digits, `_` and `-` and must be unique within their list. **Every path must be relative to the server files folder, without `..`, never absolute.**
```json
"cluster": {
  "protectedConfigKeys": ["Port", "RCONPort"],
  "clearFolders": [{ "path": "Saved/Logs", "pattern": "*.log", "olderThanDays": 7 }],
  "preserve": ["Saved/SaveGames"]
},
"configs": [{ "id": "server-ini", "name": "server.ini", "path": "Saved/Config/server.ini", "protect": ["Port", "rcon.*"] }],
"backup": {
  "presets": [{ "id": "saves", "name": "Save games only", "paths": ["Saved/SaveGames"] }],
  "exclude": ["Saved/Logs", "*.tmp"]
},
"events": [{ "id": "player-join", "label": "Player joined", "default": false }],
"logging": {
  "logFiles": ["Saved/Logs/*.log"],
  "patterns": [{ "id": "sudden-stop", "regex": "stopped suddenly", "level": "error" }]
},
"consoles": [
  { "id": "game", "name": "Game console", "type": "process" },
  { "id": "server-log", "name": "Server log", "type": "log", "source": "server-log" }
],
"update": { "validateArgs": { "steamcmd": "validate" } },
"files": { "autoClear": [{ "path": "Saved/Crashes", "pattern": "*", "olderThanDays": 14, "intervalMin": 1440, "default": false }] }
```
| Field | Meaning |
|---|---|
| `cluster.protectedConfigKeys` | keys never overwritten when a config is synced from a cluster parent to its members (ports, RCON password ...) |
| `cluster.clearFolders[]` | `{ path, pattern, olderThanDays, recursive? }` folders cleaned by the cluster "clear folders" action: files in `path` whose **name** matches `pattern` (`*` `?`, default `*`) and that were last modified more than `olderThanDays` ago. Only files are deleted, never the folder; sub-folders only with `"recursive": true`; links are never followed |
| `cluster.preserve[]` | paths never overwritten by a cluster update (saves, per-server data). A folder covers everything below it. Anchored at the server files folder; a pattern without `/` that contains `*` or `?` (for example `*.sav`) matches by name anywhere. All `configs[].path` files are preserved automatically |
| `configs[].protect[]` | keys of that config kept during cluster config sync. Case-insensitive globs (`port`, `rcon.*`, `Server?Name`); ini keys can be written `Section.Key`, json / yaml keys by path `network.port`; a name without a dot also matches the last part of a longer key. Lines containing `NGSM:ignore` (any comment style) are kept too |
| `backup.presets[]` | `{ id, name, paths[] }` named "neat-pick" selections shown as tick-boxes in the server's **Backups** tab; `paths` are files or folders relative to the server files folder (missing ones are skipped) |
| `backup.exclude[]` | patterns left out of **every** backup (full and neat pick): no `/` = any file or folder with that name, with `/` = a path from the server root; `*`, `**`, `?` wildcards, case-insensitive |
| `events[]` | `{ id, label, default }` extra game-specific events. They show up in the Discord view as `game:<id>` (label shown as "<Game>: <label>", `default` = initial toggle). They fire when a `logging.patterns` entry with the same `id` matches |
| `logging.logFiles[]` | log files (relative to the server files, wildcards allowed in the file name, the newest match is used) the game writes. NodeGSM reads their **new lines** every 2 seconds while the server runs and matches them with the same `patterns` as console lines (a rotated or truncated file is followed; history from before the server started is not replayed). Use it for games that log to a file instead of the console |
| `logging.patterns[]` | `{ id, regex, level }` (`info` / `warn` / `error`); a matching **console line** becomes an event log entry (case-insensitive, at most once per pattern per server per 10 s); `regex` must compile. If the pattern `id` equals an `events[].id`, the entry is the event `game:<id>` and can be sent to Discord |
| `consoles[]` | `{ id, name, type, source }` consoles of the **Console** tab; `type` is `process` (the game console, always present as `main`; an entry only renames it), `log` (`source` = id of a declared `logs[]` entry, read-only) or `rcon` (`source` = `rcon:<port>:<password>`, see below). A game without `consoles[]` shows only the game console. The id `main` is reserved |
| `update.validateArgs` | per-installer text used by **Validate** (not by Update). Supported key: `steamcmd` - the words placed after `+app_update <id>` (default `validate`; plain words like `validate`, `-x1` only, `+commands` are refused and fall back to `validate`). For `plugin.js` installers the helpers get `helpers.validate` (true for Validate) and `helpers.validateArgs` (the whole object) so a script can do its own check |
| `files.autoClear[]` | `{ path, pattern, olderThanDays, intervalMin, default, recursive? }` rules that delete old **files** periodically (`olderThanDays` >= 0, `intervalMin` >= 1 minutes, `pattern` is a file-name wildcard `*` `?`, `default` = enabled when first copied to a server). They are copied once into each server's own rule list; users can edit, disable or delete them, and later plugin changes do not overwrite those edits (new rules are added). See below |

#### `consoles[].source` for `rcon` consoles
`rcon:<port>:<password>` - the part after the second `:` is the password (it may contain `:`). Each of the two parts is either a literal or a `{placeholder}` that NodeGSM resolves in the main process whenever a command is sent:

| Placeholder | Value |
|---|---|
| `{port}`, `{queryPort}`, `{maxPlayers}`, `{map}`, `{ip}` | that server setting (secrets such as the GSLT are not available) |
| `{configId:key}` | the value of `key` in the plugin config file `configId` (`format` ini / properties / cfg / json / yaml; ini keys can be `Section.Key`, json / yaml nested keys `a.b.c`; case-insensitive) |
| `{key}` | the value of `key` in the first declared config file that contains it |

Examples: `rcon:{server-properties:rcon.port}:{server-properties:rcon.password}` (Minecraft), `rcon:{port}:{server-cfg:rcon_password}` (Source: RCON runs on the game port), `rcon:25575:{rcon.password}`. NodeGSM always connects to `127.0.0.1`; the host cannot be set. The password is never logged, shown or returned to the UI. Source RCON and Minecraft RCON are supported (not the Rust / ARK web-socket variants). The game has to have RCON enabled in its own config; the **RCON** sub-tab shows the reason when a value is missing.

#### `files.autoClear` and the `update` object
```json
"files": { "autoClear": [{ "path": "logs", "pattern": "*.log.gz", "olderThanDays": 14, "intervalMin": 1440, "default": true }] },
"update": { "validateArgs": { "steamcmd": "validate" } }
```
Auto-clear deletes only files (never folders), never follows links, never leaves the server files folder and skips locked files. Plugin authors: use `default: true` only for things that are always safe to delete (old compressed logs, crash dumps); otherwise leave it `false` so users opt in.

#### Example: cluster rules (Minecraft Java, `plugins/mc/plugin.json`)
```json
"configs": [
  { "id": "server-properties", "name": "server.properties", "path": "server.properties", "format": "properties",
    "protect": ["server-port", "server-ip", "query.port", "rcon.*"] }
],
"cluster": {
  "protectedConfigKeys": ["server-port", "query.port", "rcon.*"],
  "preserve": ["world", "world_nether", "world_the_end", "ops.json", "whitelist.json", "banned-players.json", "banned-ips.json", "usercache.json"],
  "clearFolders": [
    { "path": "logs", "pattern": "*.log*", "olderThanDays": 14 },
    { "path": "crash-reports", "pattern": "*.txt", "olderThanDays": 30 }
  ]
}
```
`protectedConfigKeys` apply to **every** config file of the game, `configs[].protect` only to that file. During a cluster update every `configs[].path` is skipped automatically, so only list the saves and per-server data in `preserve`. Always declare the config `format` correctly: it decides how the file is merged (`ini`, `properties`, `cfg`, `yaml`, `json` are key-aware; `text` and `xml` are copied whole except `NGSM:ignore` lines). Bundled examples: `mc`, `arkse`, `rust`. See [docs/GUIDE-clusters.md](https://github.com/ohmcodes/Node.NodeGSM/blob/main/docs/GUIDE-clusters.md).

#### Example: backup presets (Minecraft Java, `plugins/mc/plugin.json`)
```json
"backup": {
  "presets": [
    { "id": "world", "name": "World saves", "paths": ["world", "world_nether", "world_the_end"] },
    { "id": "settings", "name": "Settings and player lists", "paths": ["server.properties", "ops.json", "whitelist.json", "banned-players.json", "banned-ips.json", "usercache.json"] },
    { "id": "plugins", "name": "Plugins and mods", "paths": ["plugins", "mods", "config"] }
  ],
  "exclude": ["logs", "crash-reports", "*.tmp"]
}
```
Also shipped: `csgo` (configs, addons, custom content), `rust` (server data, Oxide), `palworld` and `arkse` (saves, settings). Tips: put the folders players care about (saves, configs) in presets and keep `exclude` for logs, crash dumps and caches. Presets only name paths - absolute paths and `..` are rejected. See [docs/GUIDE-backups.md](https://github.com/ohmcodes/Node.NodeGSM/blob/main/docs/GUIDE-backups.md).

## Complete example (every optional field)
All fields in one valid `plugin.json` (compare [`plugins/_template`](plugins/_template), which you copy to start). Leave out whatever the game does not need - everything except `id`, `name`, `install` and `run` is optional for local plugins. Where each field is explained: listing and `docs` above, `install` / `run` / `defaults` / `query` above, `configs` (+ `protect`), `logs`, `metrics` (incl. `kind: "tick"` and `rcon:` sources) above, and `cluster`, `backup`, `events`, `logging`, `consoles`, `update.validateArgs`, `files.autoClear` in the optional-fields section.
```json
{
  "$schema": "../plugin.schema.json",
  "id": "mygame",
  "name": "My Game Dedicated Server",
  "description": "Dedicated server for My Game (Steam app 123456).",
  "author": "you",
  "version": "1.0.0",
  "url": "https://store.steampowered.com/app/123456",
  "tags": ["survival", "steamcmd"],
  "color": "#4f8cff",
  "media": { "icon": "icon.png", "readme": "README.md", "banner": "banner.png", "screenshots": ["screenshots/1.png"] },
  "docs": [
    { "title": "Official server guide", "url": "https://example.com/docs/server", "type": "official" },
    { "title": "Community setup wiki", "url": "https://example.com/wiki/server", "type": "unofficial", "description": "Ports and settings explained" }
  ],
  "install": { "type": "steamcmd", "appId": "123456" },
  "run": {
    "exe": "Game/Binaries/Win64/GameServer.exe",
    "args": ["{param}", "-port={port}", ["-queryport", "{queryPort}"], "-servername={name}"],
    "stdin": true,
    "stopCommand": "quit"
  },
  "defaults": { "port": "7777", "queryPort": "27015", "map": "World", "maxPlayers": "16", "additional": "-log", "portIncrement": 2 },
  "query": "a2s",
  "gslt": false,

  "configs": [
    { "id": "server-ini", "name": "server.ini", "path": "Saved/Config/server.ini", "format": "ini",
      "description": "Main settings", "template": "templates/server.ini",
      "protect": ["Port", "QueryPort", "rcon.*"] }
  ],
  "logs": [
    { "id": "server-log", "name": "Server log", "path": "Saved/Logs/*.log", "description": "Newest file is followed" }
  ],
  "metrics": [
    { "id": "tps", "name": "Server TPS", "unit": "TPS", "kind": "tick", "source": "rcon:tps",
      "pattern": "TPS[:= ]+([0-9.]+)", "intervalSec": 15, "tickTarget": 20, "warnBelow": 18, "badBelow": 15 },
    { "id": "entities", "name": "Entities", "source": "log:server-log", "pattern": "entities[:= ]+(\\d+)" }
  ],

  "cluster": {
    "protectedConfigKeys": ["Port", "QueryPort", "rcon.*"],
    "preserve": ["Saved/SaveGames", "Saved/admins.json"],
    "clearFolders": [{ "path": "Saved/Logs", "pattern": "*.log", "olderThanDays": 7 }]
  },
  "backup": {
    "presets": [
      { "id": "saves", "name": "Save games only", "paths": ["Saved/SaveGames"] },
      { "id": "settings", "name": "Settings", "paths": ["Saved/Config", "Saved/admins.json"] }
    ],
    "exclude": ["Saved/Logs", "Saved/Crashes", "*.tmp"]
  },
  "events": [{ "id": "player-join", "label": "Player joined", "default": false }],
  "logging": {
    "logFiles": ["Saved/Logs/*.log"],
    "patterns": [
      { "id": "player-join", "regex": "(\\S+) joined the game", "level": "info" },
      { "id": "sudden-stop", "regex": "stopped suddenly", "level": "error" }
    ]
  },
  "consoles": [
    { "id": "game", "name": "Game console", "type": "process" },
    { "id": "log", "name": "Server log", "type": "log", "source": "server-log" },
    { "id": "rcon", "name": "RCON", "type": "rcon", "source": "rcon:{server-ini:RCONPort}:{server-ini:RCONPassword}" }
  ],
  "update": { "validateArgs": { "steamcmd": "validate" } },
  "files": {
    "autoClear": [
      { "path": "Saved/Crashes", "pattern": "*", "olderThanDays": 14, "intervalMin": 1440, "default": true },
      { "path": "Saved/Logs", "pattern": "*.log", "olderThanDays": 30, "intervalMin": 1440, "default": false, "recursive": false }
    ]
  }
}
```
Checklist: every path relative to the server files folder and without `..`; every regex compiles (`npm run validate <id>` checks); `rcon:` sources look like `rcon:<port>:<password>`; `consoles[].source` of a `log` console is the id of a declared `logs[]` entry; a metric with `source: "rcon:<command>"` needs an `rcon` console (or `rconSource`); `files.autoClear[].default: true` only for files that are always safe to delete.

## plugin.js (optional)
Use it only when JSON cannot do the job (for example resolving the latest download URL). It runs with **full Node.js access** - only install plugins you trust; repository plugins get a security review.
```js
module.exports = {
  // install.steps contains { "type": "script" }  ->  this runs. h = helpers:
  //   h.dir, h.cfg, h.log(line), h.fetchJson(url), h.fetchText(url),
  //   h.download(url, relPath), h.extract(relFile, relDir), h.inside(relPath), h.steamcmd(appId, opts), h.fs, h.path
  async install(h) {
    const info = await h.fetchJson('https://example.com/latest.json');
    await h.download(info.url, 'server.zip');
    h.extract('server.zip', '.');
  },
  // update checks: latest(h) -> string, local(dir) -> string; shown as "update available" when they differ
  latest: async (h) => (await h.fetchJson('https://example.com/latest.json')).version,
  local: (dir) => '1.2.0',
  // replace run.args entirely: return an array of argv strings
  args: (cfg, ctx) => ['-port=' + cfg.port],
};
```
Real examples: [`plugins/mc`](plugins/mc), [`plugins/mcbe`](plugins/mcbe), [`plugins/vts`](plugins/vts), [`plugins/gta5`](plugins/gta5).

## Migrating a WindowsGSM C# plugin
The website converter (`/convert.html`, Website repository) writes a `plugin.json` from a WindowsGSM plugin: metadata, `AppId` / `SteamCMDAgent`, `StartPath`, `AllowsEmbedConsole`, default ports / map / players, `QueryMethod`, and the `Start()` command line as `run.args` templates (`ServerPort` -> `{port}`, `ServerQueryPort` -> `{queryPort}`, `ServerMap` -> `{map}`, `ServerMaxPlayer` -> `{maxPlayers}`, `ServerName` -> `{name}`, `ServerIP` -> `{ip}`, `ServerParam` -> `{param}`, `ServerGSLT` -> `{gslt}`). Custom `Install()` / `Update()` / `GetLocalBuild()` / `GetRemoteBuild()` / `CreateServerCFG()` code is **not** converted: it becomes a TODO that points at install steps or the `plugin.js` hooks above. When the placeholders or run fields change, update `public/convert-cs.js` in the Website repository (its tests compare the placeholders with this file).

## How the catalogue is published
`npm run build` turns `plugins/` into static files in `public/` (CI does this on every merge to `main` and publishes them with GitHub Pages):

| File | What |
|---|---|
| `catalogue.json` | tiny change marker `{ schema, generatedAt, count, hash }`; NodeGSM checks this before downloading anything else |
| `index.json` | lean list: id, name, summary, maker, contributors, version, tags, platforms, install type, sha256, size, URLs of zip / icon / banner / detail |
| `plugins/<id>.json` | full detail: README, docs links, ports, configs, logs, screenshots, source link |
| `zips/<id>.zip` | the plugin folder (deterministic; sha256 only changes when the plugin changes) |
| `media/<id>/` | icon, banner, screenshots |

All URLs inside are relative to `index.json`. Ratings, comments and editable game info are **not** here: they live in the website backend (see the Website repository). Write a useful `README.md`, `summary` and `description`: they are what visitors see.
