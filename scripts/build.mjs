#!/usr/bin/env node
// Builds dist/ from src/ with no dependencies:
//   dist/github-timeline.user.js     userscript (Tampermonkey, Violentmonkey, Greasemonkey, Userscripts)
//   dist/github-timeline-<v>.zip     extension package (Chrome Web Store, Firefox Add-ons, Edge)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const read = (p) => readFileSync(join(ROOT, p));
const manifest = JSON.parse(read('manifest.json'));
const { version } = manifest;
const REPO = 'https://github.com/mykiwi/github-timeline';
const RAW = 'https://raw.githubusercontent.com/mykiwi/github-timeline/master/dist/github-timeline.user.js';

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// ---- Userscript -------------------------------------------------------------

const css = read('src/github-timeline.css').toString().trim();
const js = read('src/github-timeline.js').toString().trim();
const header = `// ==UserScript==
// @name         GitHub Timeline
// @namespace    ${REPO}
// @version      ${version}
// @description  ${manifest.description}
// @author       mykiwi
// @license      MIT
// @homepageURL  ${REPO}
// @supportURL   ${REPO}/issues
// @updateURL    ${RAW}
// @downloadURL  ${RAW}
// @match        https://github.com/*
// @icon         https://raw.githubusercontent.com/mykiwi/github-timeline/master/icons/icon-48.png
// @grant        GM_addStyle
// @run-at       document-idle
// @noframes
// ==/UserScript==`;

const injectStyle = `(function (css) {
  'use strict';
  if (document.documentElement.hasAttribute('data-ght-loaded')) return;
  if (typeof GM_addStyle === 'function') return void GM_addStyle(css);
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).append(style);
  }
})(${JSON.stringify(css)});`;

writeFileSync(join(DIST, 'github-timeline.user.js'), `${header}\n\n${injectStyle}\n\n${js}\n`);

// ---- Extension zip (store-ready, same package for Chrome and Firefox) ----------

const files = [
  'manifest.json',
  'src/github-timeline.js',
  'src/github-timeline.css',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
  'LICENSE',
];

writeFileSync(join(DIST, `github-timeline-${version}.zip`), zip(files.map((name) => ({ name, data: read(name) }))));

console.log(`Built GitHub Timeline ${version}:`);
console.log('  dist/github-timeline.user.js');
console.log(`  dist/github-timeline-${version}.zip`);

// ---- Minimal ZIP writer (deflate, no dependencies) ------------------------------

function zip(entries) {
  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  // Fixed timestamp (1 Jan 2026) so builds are reproducible.
  const DOS_TIME = 0;
  const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4); // made by: Unix, v2.0
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // -rw-r--r--
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}
