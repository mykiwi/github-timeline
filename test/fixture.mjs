// A stand-in for GitHub's dashboard feed markup (as of Nov 2026), with invented
// users and repositories. Mirrors the parts the extension relies on:
//   feed-container > [data-target="feed-container.content"] > turbo-frame#conduit-feed-frame
//     > article.js-feed-item-component[data-hydro-view] … form.js-ajax-pagination
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const primitives = (p) => readFileSync(require.resolve(`@primer/primitives/dist/css/${p}`), 'utf8');

const PEOPLE = ['lena-dev', 'octavio', 'mira-k', 'jdupont', 'sam-rivers', 'yuki-t', 'nora-b', 'felix-m'];
const COLORS = ['#8250df', '#1a7f37', '#0969da', '#bf3989', '#9a6700', '#cf222e', '#1b7c83', '#6639ba'];

function avatar(login) {
  const i = PEOPLE.indexOf(login) >= 0 ? PEOPLE.indexOf(login) : login.length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${COLORS[i % COLORS.length]}"/><text x="20" y="26" font-family="sans-serif" font-size="17" font-weight="600" fill="#fff" text-anchor="middle">${login[0].toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// [card_type, resource_type, actor, verb, repo, title, label]
export const PAGE_1 = [
  ['MERGED_PULL_REQUEST', 'PULL_REQUEST', 'lena-dev', 'contributed to', 'acme/rocket', 'Cache dependency graph between builds #812', 'Merged'],
  ['STARRED_REPOSITORY', 'REPO', 'octavio', 'starred', 'tinyorg/quill', 'A tiny, fast Markdown parser written in Zig', null],
  ['RELEASE', 'REPO', 'acme/rocket', 'released', 'v3.2.0', 'Faster cold starts, a new plugin API and 40 bug fixes', 'Latest'],
  ['MERGED_PULL_REQUEST', 'PULL_REQUEST', 'mira-k', 'contributed to', 'webkitty/purr', 'Fix scroll anchoring when images load late #1290', 'Merged'],
  ['FORKED_REPOSITORY', 'REPO', 'jdupont', 'forked', 'jdupont/rocket', 'from acme/rocket', null],
  ['FOLLOWED_USER', 'USER', 'sam-rivers', 'started following', 'yuki-t', 'Yuki Tanaka · Compilers and type systems', null],
  ['STARRED_REPOSITORY', 'REPO', 'nora-b', 'starred', 'pixel-lab/dither', 'Ordered and error-diffusion dithering for the web', null],
  ['TRENDING_REPOSITORY', 'REPO', null, 'Trending repositories', null, 'pixel-lab/dither · deep-sea/sonar · tinyorg/quill', null],
  ['CREATED_REPOSITORY', 'REPO', 'felix-m', 'created a repository', 'felix-m/notes-cli', 'Take notes without leaving the terminal', null],
  // No metadata at all: exercises the text fallback.
  [null, null, 'yuki-t', 'starred', 'deep-sea/sonar', 'Underwater acoustics toolkit', null],
];

export const PAGE_2 = [
  ['OPENED_ISSUE', 'ISSUE', 'octavio', 'opened an issue in', 'tinyorg/quill', 'Tables with escaped pipes render incorrectly #77', 'Open'],
  ['NEW_DISCUSSION', 'REPO', 'acme/rocket', 'posted a discussion in', 'Announcements', 'Rocket 4.0 roadmap: tell us what you need', null],
  ['MERGED_PULL_REQUEST', 'PULL_REQUEST', 'sam-rivers', 'contributed to', 'deep-sea/sonar', 'Add WebGPU spectrogram renderer #301', 'Merged'],
];

// Older pages: one pull request, one star and one release each, so stars are
// spread thin (page 3 → 14), like on a real feed.
export const OLDER_PAGES = Array.from({ length: 12 }, (_, i) => [
  ['MERGED_PULL_REQUEST', 'PULL_REQUEST', PEOPLE[i % 8], 'contributed to', 'acme/rocket', `Older change number ${i + 1} #${700 - i}`, 'Merged'],
  ['STARRED_REPOSITORY', 'REPO', PEOPLE[(i + 3) % 8], 'starred', `tools/lib-${i + 1}`, `Library number ${i + 1}`, null],
  ['RELEASE', 'REPO', 'acme/rocket', 'released', `v2.${12 - i}.0`, `Release notes for v2.${12 - i}.0`, null],
]);
export const PAGES = [PAGE_1, PAGE_2, ...OLDER_PAGES];

const LABELS = {
  Merged: 'background:var(--bgColor-done-emphasis);color:var(--fgColor-onEmphasis)',
  Open: 'background:var(--bgColor-success-emphasis);color:var(--fgColor-onEmphasis)',
  Latest: 'color:var(--fgColor-success);border:1px solid var(--borderColor-success-emphasis)',
};

let nextId = 1000;
export function article([type, resource, actor, verb, repo, title, label], minutes) {
  const id = nextId++;
  const hydro = type
    ? ` data-hydro-view='${JSON.stringify({ event_type: 'feeds.feed_visible', payload: { feed_card: { card_type: type, resource_type: resource, record_id: id, ranking_model_id: 'chronological' } } })}'`
    : '';
  const who = actor ? `<img class="avatar" src="${avatar(actor.split('/')[0])}" alt=""><span><b>${actor}</b> ${verb} ${repo ? `<b>${repo}</b>` : ''}<br><small>${minutes} minutes ago</small></span>` : `<span><b>${verb}</b></span>`;
  return `<article id="feed-item-${id}" class="js-feed-item-component js-feed-item-view d-flex flex-column width-full"${hydro}>
  <div class="feed-item-content"><header>${who}</header>
    <h3>${title}</h3>${label ? `<span class="label" style="${LABELS[label]}">${label}</span>` : ''}
  </div>
</article>
<div id="dismissed-item-placeholder-${id}" hidden>Dismissed.</div>`;
}

export function pagination(next) {
  return `<form class="ajax-pagination-form js-ajax-pagination" action="/conduit/for_you_feed" method="get" data-next="${next}"><button type="submit" class="ajax-pagination-btn">More</button></form>`;
}

export function fixtureHTML({ mode = 'light' } = {}) {
  let minutes = 4;
  const pages = PAGES.map((page, p) => {
    const cards = page.map((item) => article(item, (minutes += 7))).join('\n');
    return p + 1 < PAGES.length ? `${cards}\n${pagination(p + 1)}` : cards;
  });
  return `<!DOCTYPE html>
<html lang="en" data-color-mode="${mode}" data-light-theme="light" data-dark-theme="dark">
<head>
<meta charset="utf-8"><meta name="user-login" content="lena-dev"><title>GitHub</title>
<style>${primitives('functional/themes/light.css')}</style>
<style>${primitives('functional/themes/dark.css')}</style>
<style>${primitives('functional/size/size.css')}${primitives('functional/size/border.css')}${primitives('functional/size/radius.css')}</style>
<style>
  :root { --fontStack-system: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
  body { margin: 0; font: 14px/1.5 var(--fontStack-system); color: var(--fgColor-default); background: var(--bgColor-default); }
  .topbar { height: 48px; background: var(--bgColor-muted); border-bottom: 1px solid var(--borderColor-muted); }
  main { max-width: var(--feed-width, 720px); margin: 24px auto; padding: 0 16px; }
  feed-container, turbo-frame { display: block; }
  .feed-header { display: flex; align-items: center; justify-content: space-between; }
  .feed-header h2 { font-size: 16px; margin: 0; }
  .btn { height: 28px; padding: 0 10px; font: inherit; font-size: 12px; font-weight: 500; color: var(--fgColor-default); background: var(--bgColor-muted); border: 1px solid var(--borderColor-default); border-radius: 6px; }
  article { padding: 8px 0; }
  .feed-item-content { padding: 16px; background: var(--bgColor-default); border: 1px solid var(--borderColor-default); border-radius: 6px; }
  header { display: flex; gap: 8px; align-items: center; line-height: 1.35; }
  header small { color: var(--fgColor-muted); font-size: 12px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; }
  h3 { margin: 12px 0 6px; font-size: 16px; }
  .label { display: inline-block; padding: 0 8px; font-size: 12px; font-weight: 500; line-height: 22px; border-radius: 2em; }
  .ajax-pagination-btn { width: 100%; height: 32px; margin-top: 8px; font: inherit; font-weight: 600; color: var(--fgColor-accent); background: var(--bgColor-default); border: 1px solid var(--borderColor-default); border-radius: 6px; }
</style>
</head>
<body>
<div class="topbar"></div>
<main>
  <div id="dashboard" class="dashboard"><div class="news">
    <feed-container data-active-topic="for-you">
      <div class="feed-header"><h2 data-target="feed-container.feedTitle">Feed</h2><button class="btn">Filter</button></div>
      <div data-target="feed-container.content">
        <turbo-frame id="conduit-feed-frame" class="js-for-you-feed-items">
          <div class="js-feed-live-region" hidden></div>
${pages[0]}
        </turbo-frame>
      </div>
    </feed-container>
  </div></div>
</main>
${pages.slice(1).map((html, i) => `<template id="page-${i + 1}">${html}</template>`).join('\n')}
<script>
  // Mimics GitHub's ajax pagination: the form is replaced by the next page,
  // wrapped in a nested turbo-frame with the same id (as github.com does).
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('.js-ajax-pagination');
    if (!form) return;
    event.preventDefault();
    setTimeout(() => {
      const next = document.getElementById('page-' + form.dataset.next);
      form.insertAdjacentHTML('beforebegin', '<turbo-frame id="conduit-feed-frame" class="js-for-you-feed-items">' + next.innerHTML + '</turbo-frame>');
      form.remove();
    }, 150);
  });
</script>
</body>
</html>`;
}
