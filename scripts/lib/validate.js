'use strict';
// Standalone plugin.json validator (same rules the NodeGSM app applies when it loads a plugin).
// Extracted from NodeGSM src/main/plugins.js so the catalogue can validate pull requests without the app.
// When the plugin format changes in NodeGSM, port the change here (see CONTRIBUTING.md).
const fs = require('fs');
const path = require('path');

const PLATFORMS = ['windows', 'linux'];
const platform = { ALL: PLATFORMS };
const ID_RE = /^[a-z0-9][a-z0-9_-]{1,31}$/;
const STEP_TYPES = ['steamcmd', 'download', 'extract', 'run', 'write', 'mkdir', 'script'];
const FORMATS = ['ini', 'json', 'xml', 'properties', 'cfg', 'yaml', 'text'];
const QUERIES = ['a2s', 'ut3', 'fivem'];
const DOC_TYPES = ['official', 'unofficial'];
const CONSOLE_TYPES = ['process', 'log', 'rcon'];
const LOG_LEVELS = ['info', 'warn', 'error'];
const safeRel = (p) => typeof p === 'string' && p.length > 0 && !path.isAbsolute(p) && !/^[a-zA-Z]:/.test(p) && !p.split(/[\\/]/).includes('..');
function normalizeInstall(i) {
  if (!i) return null;
  if (Array.isArray(i.steps)) return i.steps;
  if (i.type === 'steamcmd') return [{ type: 'steamcmd', appId: i.appId, mod: i.mod, repeat: i.repeat }];
  if (i.type === 'manual') return [];
  if (i.type === 'script') return [{ type: 'script' }];
  return null;
}

/** Returns { errors:[], warnings:[] } */
function validate(m, dir) {
  const errors = []; const warnings = [];
  const e = (s) => errors.push(s); const w = (s) => warnings.push(s);
  if (!m || typeof m !== 'object') return { errors: ['plugin.json must be a JSON object'], warnings };
  if (!m.id || !ID_RE.test(m.id)) e('"id" must be 2-32 chars of a-z 0-9 _ -');
  if (!m.name) e('"name" is required');
  if (!m.description) w('"description" is empty (shown in the game browser)');
  if (!m.author) w('"author" is empty');
  if (!m.version) w('"version" is empty');
  const run = m.run || {};
  if (!run.exe) e('"run.exe" (path of the server executable, relative to the server files folder) is required');
  if (run.exe && !safeRel(run.exe)) e('"run.exe" must be a relative path without ".."');
  if (run.workingDir && !safeRel(run.workingDir)) e('"run.workingDir" must be a relative path without ".."');
  if (run.args !== undefined && !Array.isArray(run.args)) e('"run.args" must be an array');
  (run.args || []).forEach((a, i) => {
    const ok = typeof a === 'string' || (Array.isArray(a) && a.every((x) => typeof x === 'string'));
    if (!ok) e(`run.args[${i}] must be a string or an array of strings`);
  });
  const steps = normalizeInstall(m.install);
  if (!steps) e('"install" is required: { "type": "steamcmd", "appId": "..." } or { "type": "manual" } or { "steps": [...] }');
  else validateSteps(steps, 'install.steps', dir, e);
  // ---- platforms / Linux overrides (all optional; plugins without "platforms" are Windows only) ----
  if (m.platforms !== undefined) {
    if (!Array.isArray(m.platforms) || !m.platforms.length || m.platforms.some((p) => !platform.ALL.includes(p))) e(`"platforms" must be a non-empty array of ${platform.ALL.join(' / ')}`);
    else if (m.platforms.includes('linux') && !m.platforms.includes('windows')) w('"platforms" lists linux but not windows - Windows users will not see this game');
  }
  if (run.stopRcon !== undefined && (typeof run.stopRcon !== 'string' || !run.stopRcon.trim() || run.stopRcon.length > 200)) e('"run.stopRcon" must be a short RCON command such as "stop" (sent through the first rcon console when the server is stopped)');
  else if (run.stopRcon !== undefined && !(m.consoles || []).some((c) => c && c.type === 'rcon')) e('"run.stopRcon" needs a console of type "rcon" in consoles[]');
  if (run.env !== undefined && !(run.env && typeof run.env === 'object' && !Array.isArray(run.env) && Object.values(run.env).every((v) => typeof v === 'string'))) e('"run.env" must be an object of text values');
  if (run.linux !== undefined) {
    const l = run.linux; const at = 'run.linux';
    if (!l || typeof l !== 'object' || Array.isArray(l)) e(`"${at}" must be an object`);
    else {
      if (l.exe !== undefined && !safeRel(l.exe)) e(`"${at}.exe" must be a relative path without ".."`);
      if (l.workingDir !== undefined && !safeRel(l.workingDir)) e(`"${at}.workingDir" must be a relative path without ".."`);
      if (l.command !== undefined && typeof l.command !== 'string') e(`"${at}.command" must be text`);
      if (l.stopCommand !== undefined && typeof l.stopCommand !== 'string') e(`"${at}.stopCommand" must be text`);
      if (l.stdin !== undefined && typeof l.stdin !== 'boolean') e(`"${at}.stdin" must be true or false`);
      if (l.args !== undefined && !Array.isArray(l.args)) e(`"${at}.args" must be an array`);
      (Array.isArray(l.args) ? l.args : []).forEach((a, i) => { if (!(typeof a === 'string' || (Array.isArray(a) && a.every((x) => typeof x === 'string')))) e(`${at}.args[${i}] must be a string or an array of strings`); });
      if (l.env !== undefined && !(l.env && typeof l.env === 'object' && !Array.isArray(l.env) && Object.values(l.env).every((v) => typeof v === 'string'))) e(`"${at}.env" must be an object of text values`);
    }
  }
  if (m.install && m.install.linux !== undefined) {
    const ls = normalizeInstall(m.install.linux);
    if (!m.install.linux || typeof m.install.linux !== 'object' || !ls) e('"install.linux" must be { "type": "steamcmd", "appId": "..." } or { "steps": [...] }');
    else validateSteps(ls, 'install.linux.steps', dir, e);
  }
  if (Array.isArray(m.platforms) && m.platforms.includes('linux') && !run.linux && run.exe && /\.(exe|bat|cmd)$/i.test(run.exe) && !run.command) w('plugin declares linux but run.exe looks like a Windows executable and there is no "run.linux" override');
  if (m.docs !== undefined) {
    if (!Array.isArray(m.docs)) e('"docs" must be an array of { title, url, type }');
    else m.docs.forEach((d, i) => {
      const at = `docs[${i}]`;
      if (!d || typeof d !== 'object') return e(`${at} must be an object`);
      if (!d.title || typeof d.title !== 'string') e(`${at}.title is required`);
      if (typeof d.url !== 'string' || !/^https?:\/\/[^\s]+$/i.test(d.url)) e(`${at}.url must be an http(s) link`);
      if (!DOC_TYPES.includes(d.type)) e(`${at}.type must be "official" or "unofficial"`);
      if (d.description !== undefined && typeof d.description !== 'string') e(`${at}.description must be text`);
    });
  } else w('no "docs" links (official / unofficial guides for creating this server)');
  if (m.metrics !== undefined) {
    if (!Array.isArray(m.metrics)) e('"metrics" must be an array');
    else {
      const seen = new Set(); const logIds = new Set((m.logs || []).map((l) => l.id));
      m.metrics.forEach((x, i) => {
        const at = `metrics[${i}]`;
        if (!x || typeof x !== 'object') return e(`${at} must be an object`);
        if (!x.id || !/^[a-z0-9_-]+$/i.test(x.id)) e(`${at}.id is required (letters, digits, _ -)`);
        else if (seen.has(x.id)) e(`${at}.id "${x.id}" is duplicated`);
        seen.add(x.id);
        if (!x.name) e(`${at}.name is required`);
        const src = String(x.source);
        if (src.startsWith('rcon:')) {
          // source "rcon:<command>": the command is sent through RCON (the game's rcon console, or an inline rconSource)
          const cmd = src.slice(5);
          if (!cmd.trim()) e(`${at}.source "rcon:<command>" needs a command, e.g. "rcon:tps"`);
          else if (Buffer.byteLength(cmd, 'utf8') > 4096) e(`${at}.source command is too long (limit 4096 bytes)`);
          const rc = (m.consoles || []).filter((c) => c && c.type === 'rcon');
          if (x.rconSource !== undefined && !/^(web)?rcon:(\{[^}]+\}|\d{1,5}):/.test(String(x.rconSource))) e(`${at}.rconSource must look like "rcon:<port>:<password>" (each part a literal or a {placeholder})`);
          else if (x.rconSource === undefined && x.rconConsole !== undefined && !rc.some((c) => c.id === x.rconConsole)) e(`${at}.rconConsole "${x.rconConsole}" is not a declared console of type "rcon"`);
          else if (x.rconSource === undefined && x.rconConsole === undefined && !rc.length) e(`${at}.source "rcon:..." needs a console of type "rcon" in consoles[] (or an inline "rconSource")`);
        } else if (src !== 'console' && !/^log:[a-z0-9_-]+$/i.test(src)) e(`${at}.source must be "console", "log:<id of a declared log>" or "rcon:<command>"`);
        else if (src !== 'console' && !logIds.has(src.slice(4))) e(`${at}.source refers to an undeclared log "${src.slice(4)}"`);
        if (x.patternFlags !== undefined) { try { if (typeof x.patternFlags !== 'string') throw new Error('type'); new RegExp('', x.patternFlags); } catch { e(`${at}.patternFlags must be regular expression flags such as "i" or "is"`); } }
        if (x.kind !== undefined && x.kind !== 'tick') e(`${at}.kind must be "tick" (or omitted)`);
        for (const k of ['tickTarget', 'warnBelow', 'badBelow', 'warnAbove', 'badAbove']) if (x[k] !== undefined && !(typeof x[k] === 'number' && Number.isFinite(x[k]) && (k !== 'tickTarget' || x[k] > 0))) e(`${at}.${k} must be a ${k === 'tickTarget' ? 'positive ' : ''}number`);
        if (x.higherIsBetter !== undefined && typeof x.higherIsBetter !== 'boolean') e(`${at}.higherIsBetter must be true or false`);
        if (x.kind !== 'tick') for (const k of ['tickTarget', 'higherIsBetter', 'warnBelow', 'badBelow', 'warnAbove', 'badAbove']) if (x[k] !== undefined) e(`${at}.${k} only applies to "kind": "tick"`);
        if (typeof x.warnBelow === 'number' && typeof x.badBelow === 'number' && x.badBelow > x.warnBelow) e(`${at}.badBelow must not be above warnBelow`);
        if (typeof x.warnAbove === 'number' && typeof x.badAbove === 'number' && x.badAbove < x.warnAbove) e(`${at}.badAbove must not be below warnAbove`);
        if (x.kind === 'tick' && x.higherIsBetter !== false && (x.warnAbove !== undefined || x.badAbove !== undefined)) w(`${at}: warnAbove / badAbove only apply with "higherIsBetter": false (use warnBelow / badBelow)`);
        if (x.kind === 'tick' && x.higherIsBetter === false && (x.warnBelow !== undefined || x.badBelow !== undefined)) w(`${at}: warnBelow / badBelow only apply when higher is better (use warnAbove / badAbove)`);
        if (x.kind === 'tick' && src === 'console' && !x.command) w(`${at}: a tick metric on the console without "command" only updates when the game prints the value by itself`);
        try { const re = new RegExp(x.pattern); if (new RegExp(re.source + '|').exec('').length < 2) e(`${at}.pattern needs one capture group, e.g. "fps=([0-9.]+)"`); }
        catch { e(`${at}.pattern is not a valid regular expression`); }
        if (x.command !== undefined && typeof x.command !== 'string') e(`${at}.command must be text`);
        if (x.intervalSec !== undefined && !(Number(x.intervalSec) >= 2)) e(`${at}.intervalSec must be a number >= 2`);
      });
    }
  }
  if (m.query !== undefined && m.query !== null && !QUERIES.includes(m.query)) e(`"query" must be one of ${QUERIES.join(', ')} or null`);
  for (const [key, list] of [['configs', m.configs], ['logs', m.logs]]) {
    if (list === undefined) continue;
    if (!Array.isArray(list)) { e(`"${key}" must be an array`); continue; }
    const seen = new Set();
    list.forEach((x, i) => {
      const at = `${key}[${i}]`;
      if (!x.id || !/^[a-z0-9_-]+$/i.test(x.id)) e(`${at}.id is required (letters, digits, _ -)`);
      else if (seen.has(x.id)) e(`${at}.id "${x.id}" is duplicated`);
      seen.add(x.id);
      if (!x.name) e(`${at}.name is required`);
      if (!safeRel(x.path)) e(`${at}.path must be a relative path without ".." (wildcards * ? allowed in the file name)`);
      if (key === 'configs' && x.format && !FORMATS.includes(x.format)) e(`${at}.format must be one of ${FORMATS.join(', ')}`);
      if (key === 'configs' && x.template && dir && !fs.existsSync(path.join(dir, x.template))) w(`${at}.template "${x.template}" not found in the plugin folder`);
    });
  }
  validateExtensions(m, e);
  if (dir) {
    const media = m.media || {};
    const need = [media.icon || 'icon.png'];
    if (media.banner) need.push(media.banner);
    if (media.readme) need.push(media.readme);
    (media.screenshots || []).forEach((s) => need.push(s));
    for (const f of need) {
      if (!safeRel(f)) e(`media path "${f}" must be relative without ".."`);
      else if (!fs.existsSync(path.join(dir, f))) (f === (media.icon || 'icon.png') ? w : e)(`media file "${f}" not found`);
    }
    if (!fs.existsSync(path.join(dir, 'README.md')) && !media.readme) w('no README.md (shown in the game browser and on the website)');
  }
  return { errors, warnings };
}

function validateSteps(steps, name, dir, e) {
  steps.forEach((s, i) => {
    const at = `${name}[${i}]`;
    if (!STEP_TYPES.includes(s.type)) return e(`${at}.type must be one of ${STEP_TYPES.join(', ')}`);
    if (s.type === 'steamcmd' && !/^\d+$/.test(String(s.appId || ''))) e(`${at}.appId must be a numeric Steam app id`);
    if (s.type === 'steamcmd' && s.platform !== undefined && !['windows', 'linux'].includes(s.platform)) e(`${at}.platform must be "windows" or "linux" (forces +@sSteamCmdForcePlatformType)`);
    if (s.type === 'download' && (!s.url || !s.to)) e(`${at} (download) needs "url" and "to"`);
    if (s.type === 'extract' && (!s.from || !s.to)) e(`${at} (extract) needs "from" and "to"`);
    if (s.type === 'run' && !s.exe) e(`${at} (run) needs "exe"`);
    if (s.type === 'write' && (!s.path || s.content === undefined)) e(`${at} (write) needs "path" and "content"`);
    if (s.type === 'mkdir' && !s.path) e(`${at} (mkdir) needs "path"`);
    for (const k of ['to', 'from', 'path']) if (s[k] !== undefined && !safeRel(s[k]) && s[k] !== '.') e(`${at}.${k} must be a relative path without ".."`);
    if (s.type === 'script' && !(dir && fs.existsSync(path.join(dir, 'plugin.js')))) e(`${at} (script) needs a plugin.js with install()`);
  });
}

/** Validation of the optional cluster / backup / events / logging / consoles / update / files fields. */
function validateExtensions(m, e) {
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  const strList = (v, at, rel) => {
    if (!Array.isArray(v)) return e(`${at} must be an array of text`);
    v.forEach((x, i) => {
      if (typeof x !== 'string' || !x) e(`${at}[${i}] must be text`);
      else if (rel && !safeRel(x)) e(`${at}[${i}] must be a relative path without ".." (no absolute paths)`);
    });
  };
  const idOk = (x) => typeof x === 'string' && /^[a-z0-9_-]+$/i.test(x);
  const regexOk = (r) => { try { new RegExp(r); return typeof r === 'string' && r.length > 0; } catch { return false; } };
  const num = (v, at, min) => { if (v !== undefined && !(Number(v) >= min)) e(`${at} must be a number >= ${min}`); };
  const clearRule = (r, at) => {
    if (!isObj(r)) return e(`${at} must be an object`);
    if (!safeRel(r.path)) e(`${at}.path must be a relative path without ".."`);
    if (r.pattern !== undefined && typeof r.pattern !== 'string') e(`${at}.pattern must be text (wildcards * ?)`);
    num(r.olderThanDays, `${at}.olderThanDays`, 0);
    num(r.intervalMin, `${at}.intervalMin`, 1);
    if (r.default !== undefined && typeof r.default !== 'boolean') e(`${at}.default must be true or false`);
    if (r.recursive !== undefined && typeof r.recursive !== 'boolean') e(`${at}.recursive must be true or false`);
  };
  const list = (v, name, each) => { if (v === undefined) return; if (!Array.isArray(v)) e(`"${name}" must be an array`); else v.forEach((x, i) => each(x, `${name}[${i}]`)); };
  const uniqueId = (x, at, seen) => {
    if (!idOk(x.id)) e(`${at}.id is required (letters, digits, _ -)`); else if (seen.has(x.id)) e(`${at}.id "${x.id}" is duplicated`);
    seen.add(x.id);
  };

  if (m.cluster !== undefined) {
    if (!isObj(m.cluster)) e('"cluster" must be an object');
    else {
      if (m.cluster.protectedConfigKeys !== undefined) strList(m.cluster.protectedConfigKeys, 'cluster.protectedConfigKeys', false);
      if (m.cluster.preserve !== undefined) strList(m.cluster.preserve, 'cluster.preserve', true);
      list(m.cluster.clearFolders, 'cluster.clearFolders', clearRule);
    }
  }
  if (Array.isArray(m.configs)) m.configs.forEach((c, i) => { if (c && c.protect !== undefined) strList(c.protect, `configs[${i}].protect`, false); });
  if (m.backup !== undefined) {
    if (!isObj(m.backup)) e('"backup" must be an object');
    else {
      if (m.backup.exclude !== undefined) strList(m.backup.exclude, 'backup.exclude', true);
      const seen = new Set();
      list(m.backup.presets, 'backup.presets', (p, at) => {
        if (!isObj(p)) return e(`${at} must be an object`);
        uniqueId(p, at, seen);
        if (!p.name || typeof p.name !== 'string') e(`${at}.name is required`);
        if (p.paths === undefined) e(`${at}.paths is required`); else strList(p.paths, `${at}.paths`, true);
      });
    }
  }
  if (m.events !== undefined) {
    const seen = new Set();
    list(m.events, 'events', (x, at) => {
      if (!isObj(x)) return e(`${at} must be an object`);
      uniqueId(x, at, seen);
      if (!x.label || typeof x.label !== 'string') e(`${at}.label is required`);
      if (x.default !== undefined && typeof x.default !== 'boolean') e(`${at}.default must be true or false`);
    });
  }
  if (m.logging !== undefined) {
    if (!isObj(m.logging)) e('"logging" must be an object');
    else {
      if (m.logging.logFiles !== undefined) strList(m.logging.logFiles, 'logging.logFiles', true);
      const seen = new Set();
      list(m.logging.patterns, 'logging.patterns', (x, at) => {
        if (!isObj(x)) return e(`${at} must be an object`);
        uniqueId(x, at, seen);
        if (!regexOk(x.regex)) e(`${at}.regex is not a valid regular expression`);
        if (x.level !== undefined && !LOG_LEVELS.includes(x.level)) e(`${at}.level must be one of ${LOG_LEVELS.join(', ')}`);
      });
    }
  }
  if (m.consoles !== undefined) {
    const seen = new Set(); const logIds = new Set((Array.isArray(m.logs) ? m.logs : []).map((l) => l && l.id));
    list(m.consoles, 'consoles', (x, at) => {
      if (!isObj(x)) return e(`${at} must be an object`);
      uniqueId(x, at, seen);
      if (!x.name || typeof x.name !== 'string') e(`${at}.name is required`);
      if (!CONSOLE_TYPES.includes(x.type)) e(`${at}.type must be one of ${CONSOLE_TYPES.join(', ')}`);
      if (x.source !== undefined && typeof x.source !== 'string') e(`${at}.source must be text`);
      if (x.type === 'log' && !logIds.has(x.source)) e(`${at}.source must be the id of a declared log`);
      if (x.id === 'main' && x.type !== 'process') e(`${at}.id "main" is reserved for the game console`);
      if (x.type === 'rcon' && !/^(web)?rcon:({[^}]+}|\d{1,5}):/.test(String(x.source || ''))) e(`${at}.source must look like rcon:<port>:<password> or webrcon:<port>:<password> (each part a literal or a {placeholder})`);
      if (x.commands !== undefined) {
        if (x.type !== 'rcon') e(at + '.commands is only for consoles of type "rcon"');
        else if (!Array.isArray(x.commands) || x.commands.length > 30) e(at + '.commands must be a list of at most 30 buttons');
        else x.commands.forEach((c, i) => {
          if (!isObj(c) || typeof c.label !== 'string' || !c.label.trim() || c.label.length > 40) e(at + '.commands[' + i + '].label is required (text, up to 40 characters)');
          if (!isObj(c) || typeof c.command !== 'string' || !c.command.trim() || c.command.length > 4096) e(at + '.commands[' + i + '].command is required (text)');
          if (isObj(c) && c.confirm !== undefined && typeof c.confirm !== 'boolean') e(at + '.commands[' + i + '].confirm must be true or false');
        });
      }
    });
  }
  if (m.update !== undefined) {
    if (!isObj(m.update)) e('"update" must be an object');
    else if (m.update.validateArgs !== undefined) {
      if (!isObj(m.update.validateArgs)) e('"update.validateArgs" must be an object');
      else for (const [k, v] of Object.entries(m.update.validateArgs)) if (typeof v !== 'string') e(`update.validateArgs.${k} must be text`);
    }
  }
  if (m.files !== undefined) {
    if (!isObj(m.files)) e('"files" must be an object');
    else list(m.files.autoClear, 'files.autoClear', clearRule);
  }
}


module.exports = { validate, safeRel, normalizeInstall, STEP_TYPES, FORMATS, PLATFORMS };
