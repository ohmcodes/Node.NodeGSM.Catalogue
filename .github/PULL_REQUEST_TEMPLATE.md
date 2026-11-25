## What does this PR do?
- [ ] Adds a new plugin: `plugins/<id>`
- [ ] Fixes / updates an existing plugin: `plugins/<id>` (what changed in the game, with a link to patch notes / SteamDB / wiki):

## Checklist
- [ ] `npm test` passes
- [ ] Folder name equals `id`; has `icon.png`, `README.md`, `author` (maker), `version`, `description`
- [ ] Optional: `summary` (max 140 characters), `contributors`
- [ ] `docs` links added (official first, then unofficial) and I opened each one
- [ ] Bumped `version` if I changed an existing plugin
- [ ] Tested in NodeGSM: install -> start -> stop (or explain what I could not test)
- [ ] No binaries or secrets; downloads come from the official source
- [ ] `plugin.js` only if JSON can't do it (explain why):

## Tested on
Windows version / game server version / anything else reviewers should know:
