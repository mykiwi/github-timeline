// End-to-end test: loads the real unpacked extension (and, separately, the built
// userscript) in Chrome against a stand-in GitHub feed served at https://github.com/.
//
//   CHROME=/path/to/chrome node test/run.mjs [--screenshots]
import { chromium } from 'playwright-core';
import { mkdtempSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { fixtureHTML } from './fixture.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const SHOTS = process.argv.includes('--screenshots') ? join(ROOT, 'screenshots') : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    throw error;
  }
}

async function serveFixture(context) {
  await context.route('https://github.com/**', (route) => {
    const url = new URL(route.request().url());
    if (['/', '/feed', '/dashboard-feed'].includes(url.pathname)) {
      return route.fulfill({ contentType: 'text/html', body: fixtureHTML({ mode: url.searchParams.get('mode') || 'light' }) });
    }
    return route.fulfill({ contentType: 'text/html', body: '<!DOCTYPE html><html><body><main><h1>Some repository</h1></main></body></html>' });
  });
}

const counts = (page) =>
  page.$$eval('#ght-root .ght-seg-btn', (buttons) =>
    Object.fromEntries(buttons.map((b) => [b.dataset.filter, Number(b.querySelector('.ght-counter').textContent)])),
  );
const visibleTitles = (page) =>
  page.$$eval('article.js-feed-item-component', (items) => items.filter((a) => a.offsetParent !== null).map((a) => a.querySelector('h3').textContent));
const articleCount = (page) => page.$$eval('article.js-feed-item-component', (items) => items.length);
const selected = (page) => page.$eval('#ght-root [aria-current="true"]', (b) => b.dataset.filter);
const footerLabel = (page) => page.textContent('#ght-footer .ght-btn--more');
const footerNote = (page) => page.textContent('#ght-footer .ght-footer-text');
const loadMoreAndWait = async (page) => {
  await page.click('#ght-footer .ght-btn--more');
  await page.waitForFunction(() => !document.querySelector('#ght-footer .ght-btn--more').hasAttribute('data-loading'), null, { timeout: 30000 });
};

async function shot(page, name, width) {
  if (!SHOTS) return;
  if (width) await page.evaluate((w) => document.documentElement.style.setProperty('--feed-width', `${w}px`), width);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(50);
  const box = await page.$eval('main', (m) => {
    const r = m.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 560) };
  });
  await page.screenshot({ path: join(SHOTS, `${name}.png`), clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 8 } });
}

// Screenshot of the end of the list: last cards + the footer.
async function shotFooter(page, name, width) {
  if (!SHOTS) return;
  if (width) await page.evaluate((w) => document.documentElement.style.setProperty('--feed-width', `${w}px`), width);
  await page.$eval('#ght-footer', (f) => f.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(50);
  const box = await page.$eval('#ght-footer', (f) => {
    const r = f.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const top = Math.max(0, box.y - 230);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), clip: { x: box.x - 24, y: top, width: box.width + 48, height: box.y + box.height + 16 - top } });
}

// ---------------------------------------------------------------------------
console.log('Extension (unpacked, Manifest V3)');
{
  const userDataDir = mkdtempSync(join(tmpdir(), 'ght-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: CHROME,
    headless: true,
    viewport: { width: 1100, height: 900 },
    deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`, '--no-sandbox'],
  });
  await serveFixture(context);
  const page = context.pages()[0] || (await context.newPage());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('https://github.com/');

  await step('mounts the filter bar right above the feed', async () => {
    await page.waitForSelector('#ght-root .ght-seg-btn');
    const next = await page.$eval('#ght-root', (r) => r.nextElementSibling.id);
    assert.equal(next, 'conduit-feed-frame');
    assert.equal(await selected(page), 'all');
  });

  await step('counts every category (metadata + text fallback)', async () => {
    assert.deepEqual(await counts(page), {
      all: 10, 'pull-requests': 2, issues: 0, releases: 1, stars: 3, repositories: 2, follows: 1, others: 1,
    });
  });

  await step('uses GitHub theme tokens for the control', async () => {
    const bg = await page.$eval('#ght-root .ght-seg', (e) => getComputedStyle(e).backgroundColor);
    assert.equal(bg, 'rgb(230, 234, 239)'); // --controlTrack-bgColor-rest, light theme
  });

  await step('puts "Load more" after the feed in place of GitHub\'s "More"', async () => {
    const prev = await page.$eval('#ght-footer', (f) => f.previousElementSibling.id);
    assert.equal(prev, 'conduit-feed-frame');
    assert.equal((await footerLabel(page)).trim(), 'Load more');
    assert.equal(await page.isVisible('form.js-ajax-pagination'), false);
  });
  await shot(page, 'light-all', 920);

  await step('filters to stars and shows the status line', async () => {
    await page.click('#ght-root [data-filter="stars"]');
    assert.deepEqual(await visibleTitles(page), [
      'A tiny, fast Markdown parser written in Zig',
      'Ordered and error-diffusion dithering for the web',
      'Underwater acoustics toolkit',
    ]);
    assert.match(await page.textContent('#ght-root .ght-status'), /Showing 3 of 10 loaded items/);
    assert.equal(await page.isVisible('#ght-root .ght-empty'), false);
    assert.equal((await footerLabel(page)).trim(), 'Load more stars');
  });
  await shot(page, 'light-stars', 920);

  await step('hides the dismissed-item placeholder together with its card', async () => {
    const r = await page.evaluate(() => {
      const card = document.querySelector('article[data-ght-hidden]');
      const ph = document.getElementById(card.id.replace('feed-item-', 'dismissed-item-placeholder-'));
      return ph.hasAttribute('data-ght-hidden');
    });
    assert.equal(r, true);
  });

  await step('"Load more stars" loads whole pages until stars show up, max 5 pages per click', async () => {
    // Page 2 has no stars, pages 3+ have one each: 5 pages → 4 new stars.
    await page.click('#ght-footer .ght-btn--more');
    await page.waitForTimeout(120);
    await shotFooter(page, 'light-loading', 920);
    await page.waitForFunction(() => !document.querySelector('#ght-footer .ght-btn--more').hasAttribute('data-loading'), null, { timeout: 30000 });
    assert.equal(await articleCount(page), 25); // every kind of card was loaded…
    assert.equal((await visibleTitles(page)).length, 7); // …only stars are shown
    assert.equal(await footerNote(page), 'Loaded 15 more items · 4 stars');
    assert.equal(await page.isVisible('#ght-footer .ght-btn--more'), true);
    assert.equal((await counts(page)).releases, 5);
    // GitHub's own "More" (now inside a nested frame) stays hidden.
    assert.equal(await page.$$eval('.ajax-pagination-btn', (b) => b.filter((x) => x.offsetParent !== null).length), 0);
  });
  await shotFooter(page, 'light-load-more', 920);

  await step('next click picks up where it stopped, then stops at the end of the feed', async () => {
    await loadMoreAndWait(page);
    assert.equal(await articleCount(page), 40);
    assert.equal(await footerNote(page), 'Loaded 15 more items · 5 stars');
    await loadMoreAndWait(page);
    assert.equal(await articleCount(page), 49);
    assert.equal((await visibleTitles(page)).length, 15);
    assert.equal(await footerNote(page), "Loaded 9 more items · 3 stars. You've reached the end of your feed.");
    assert.equal(await page.isVisible('#ght-footer .ght-btn--more'), false);
  });

  await step('remembers the filter across reloads', async () => {
    await page.reload();
    await page.waitForSelector('#ght-root .ght-seg-btn');
    assert.equal(await selected(page), 'stars');
    assert.equal((await visibleTitles(page)).length, 3);
  });

  await step('empty state when nothing matches, with "Load more" right below', async () => {
    await page.click('#ght-root [data-filter="issues"]');
    assert.equal(await page.isVisible('#ght-root .ght-empty'), true);
    assert.match(await page.textContent('#ght-root .ght-empty-title'), /No issues yet/);
    assert.equal((await visibleTitles(page)).length, 0);
    assert.equal((await footerLabel(page)).trim(), 'Load more issues');
  });
  await shot(page, 'light-empty', 920);

  await step('loading from the empty state reveals matches as they arrive', async () => {
    await loadMoreAndWait(page);
    assert.equal(await page.isVisible('#ght-root .ght-empty'), false);
    assert.deepEqual(await visibleTitles(page), ['Tables with escaped pipes render incorrectly #77']);
    assert.equal(await footerNote(page), 'Loaded 15 more items · 1 issue');
  });

  await step('Stop ends the search after the current page', async () => {
    await page.reload();
    await page.click('#ght-root [data-filter="follows"]');
    await page.click('#ght-footer .ght-btn--more');
    await page.click('#ght-footer .ght-link'); // Stop
    await page.waitForFunction(() => !document.querySelector('#ght-footer .ght-btn--more').hasAttribute('data-loading'), null, { timeout: 10000 });
    assert.equal(await articleCount(page), 13);
    assert.equal(await footerNote(page), 'Loaded 3 more items · no follows');
  });

  await step('with "All", it loads exactly one page, like GitHub\'s "More"', async () => {
    await page.click('#ght-root [data-filter="all"]');
    assert.equal(await footerNote(page), '');
    await loadMoreAndWait(page);
    assert.equal(await articleCount(page), 16);
    assert.equal(await footerNote(page), 'Loaded 3 more items');
  });

  await step('is quiet: no DOM churn while idle', async () => {
    const mutations = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let n = 0;
          const mo = new MutationObserver((records) => (n += records.length));
          mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
          setTimeout(() => (mo.disconnect(), resolve(n)), 1000);
        }),
    );
    assert.equal(mutations, 0);
  });

  await step('re-attaches when GitHub replaces the feed (native filter / Turbo)', async () => {
    await page.click('#ght-root [data-filter="stars"]');
    await page.evaluate(() => {
      const old = document.getElementById('conduit-feed-frame');
      const fresh = old.cloneNode(true);
      fresh.querySelectorAll('[data-ght-hidden],[data-ght-category]').forEach((n) => n.removeAttribute('data-ght-hidden'));
      old.parentElement.replaceChildren(fresh);
    });
    await page.waitForFunction(() => {
      const frame = document.getElementById('conduit-feed-frame');
      return document.getElementById('ght-root')?.nextElementSibling === frame && document.getElementById('ght-footer')?.previousElementSibling === frame;
    });
    assert.equal((await visibleTitles(page)).length, 4);
  });

  await step('leaves other pages alone and comes back after soft navigation', async () => {
    await page.evaluate(() => {
      const dash = document.getElementById('dashboard');
      window.__dash = dash;
      dash.remove();
      history.pushState({}, '', '/acme/rocket');
    });
    await page.waitForFunction(() => !document.getElementById('ght-root') && !document.getElementById('ght-footer'));
    await page.evaluate(() => {
      history.pushState({}, '', '/');
      document.querySelector('main').append(window.__dash);
    });
    await page.waitForSelector('#ght-root');
    assert.equal(await selected(page), 'stars');
  });

  await step('mounts on /feed and /dashboard-feed too', async () => {
    for (const path of ['/feed', '/dashboard-feed']) {
      await page.goto(`https://github.com${path}`);
      await page.waitForSelector('#ght-root .ght-seg-btn');
      await page.waitForSelector('#ght-footer .ght-btn--more');
    }
    await page.click('#ght-root [data-filter="all"]');
  });

  await step('stays out of the way on non-feed pages', async () => {
    await page.goto('https://github.com/acme/rocket');
    await page.waitForTimeout(300);
    assert.equal(await page.$('#ght-root'), null);
    assert.equal(await page.$('#ght-footer'), null);
  });

  await step('follows the dark theme', async () => {
    await page.goto('https://github.com/?mode=dark');
    await page.waitForSelector('#ght-root .ght-seg-btn');
    const bg = await page.$eval('#ght-root .ght-seg', (e) => getComputedStyle(e).backgroundColor);
    assert.notEqual(bg, 'rgb(230, 234, 239)');
  });
  await shot(page, 'dark-all', 920);
  await page.click('#ght-root [data-filter="pull-requests"]');
  await shot(page, 'dark-pull-requests', 920);
  if (SHOTS) {
    await loadMoreAndWait(page);
    await shotFooter(page, 'dark-load-more', 920);
  }

  await step('narrow widths: icons, then icons only', async () => {
    await page.evaluate(() => document.documentElement.style.setProperty('--feed-width', '600px'));
    await page.waitForTimeout(50);
    assert.equal(await page.isVisible('#ght-root .ght-seg-label'), false);
    assert.equal(await page.isVisible('#ght-root .ght-icon'), true);
    assert.equal(await page.isVisible('#ght-root .ght-counter'), true);
    await shot(page, 'dark-medium', 600);
    await page.evaluate(() => document.documentElement.style.setProperty('--feed-width', '380px'));
    await page.waitForTimeout(50);
    assert.equal(await page.isVisible('#ght-root .ght-counter'), false);
    await shot(page, 'dark-narrow', 380);
  });

  await step('no overflow at any width', async () => {
    for (const w of [1000, 900, 800, 700, 600, 500, 420, 340]) {
      await page.evaluate((x) => document.documentElement.style.setProperty('--feed-width', `${x}px`), w);
      await page.waitForTimeout(30);
      const over = await page.$eval('#ght-root .ght-seg', (s) => s.scrollWidth - s.clientWidth);
      assert.ok(over <= 0, `overflow of ${over}px at --feed-width ${w}px`);
    }
  });

  await step('keyboard: segments are reachable and show a focus ring', async () => {
    await page.focus('#ght-root [data-filter="all"]');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement.dataset.filter);
    assert.equal(focused, 'pull-requests');
    const ring = await page.$eval('#ght-root [data-filter="pull-requests"] .ght-seg-content', (e) => getComputedStyle(e).outlineStyle);
    assert.equal(ring, 'solid');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    assert.equal(await selected(page), 'all');
  });

  await step('no page errors', async () => assert.deepEqual(errors, []));
  await context.close();
}

// ---------------------------------------------------------------------------
console.log('Userscript (dist/github-timeline.user.js, no GM_* available)');
{
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  await serveFixture(context);
  const userscript = readFileSync(join(ROOT, 'dist/github-timeline.user.js'), 'utf8');
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('https://github.com/');
  await page.evaluate(() => (globalThis.__GHT_TEST__ = {}));
  await page.addScriptTag({ content: userscript });

  await step('mounts and styles itself', async () => {
    await page.waitForSelector('#ght-root .ght-seg-btn');
    const display = await page.$eval('#ght-root .ght-seg', (e) => getComputedStyle(e).display);
    assert.equal(display, 'flex');
    assert.equal((await counts(page)).all, 10);
    assert.equal(await page.isVisible('#ght-footer .ght-btn--more'), true);
    assert.equal(await page.isVisible('form.js-ajax-pagination'), false);
  });

  await step('a second copy (extension + userscript) does not double-mount', async () => {
    await page.addScriptTag({ content: userscript });
    await page.waitForTimeout(100);
    assert.equal(await page.$$eval('#ght-root', (n) => n.length), 1);
    assert.equal(await page.$$eval('#ght-footer', (n) => n.length), 1);
    assert.equal(await page.evaluate(() => document.adoptedStyleSheets.length), 1);
  });

  await step('classifies card types by keyword', async () => {
    const results = await page.evaluate(() => {
      const t = globalThis.__GHT_TEST__;
      return Object.fromEntries(
        [
          'MERGED_PULL_REQUEST', 'OPENED_PULL_REQUEST', 'OPENED_ISSUE', 'RELEASE', 'PUBLISHED_RELEASE',
          'STARRED_REPOSITORY', 'FOLLOWED_USER', 'FORKED_REPOSITORY', 'CREATED_REPOSITORY',
          'REPOSITORY_RECOMMENDATION', 'USER_FOLLOW_RECOMMENDATION', 'TRENDING_REPOSITORY',
          'NEW_DISCUSSION', 'SPONSORED_USER', 'RESTARTED_WORKFLOW',
          'CREATED_DISCUSSION', 'CREATED_BRANCH', 'CREATE_TAG', 'CREATED', 'PUBLIC',
        ].map((type) => [type, t.classifyType(type, 'REPO')]),
      );
    });
    assert.deepEqual(results, {
      MERGED_PULL_REQUEST: 'pull-requests',
      OPENED_PULL_REQUEST: 'pull-requests',
      OPENED_ISSUE: 'issues',
      RELEASE: 'releases',
      PUBLISHED_RELEASE: 'releases',
      STARRED_REPOSITORY: 'stars',
      FOLLOWED_USER: 'follows',
      FORKED_REPOSITORY: 'repositories',
      CREATED_REPOSITORY: 'repositories',
      REPOSITORY_RECOMMENDATION: 'others',
      USER_FOLLOW_RECOMMENDATION: 'others',
      TRENDING_REPOSITORY: 'others',
      NEW_DISCUSSION: 'others',
      SPONSORED_USER: 'others',
      RESTARTED_WORKFLOW: 'others',
      CREATED_DISCUSSION: 'others',
      CREATED_BRANCH: 'others',
      CREATE_TAG: 'others',
      CREATED: 'repositories',
      PUBLIC: 'repositories',
    });
    assert.equal(await page.evaluate(() => globalThis.__GHT_TEST__.classifyType('CREATED', 'DISCUSSION')), 'others');
  });

  await step('text fallback ignores user and repository names', async () => {
    const results = await page.evaluate((headers) => {
      const t = globalThis.__GHT_TEST__;
      return headers.map((html) => {
        const article = document.createElement('article');
        article.innerHTML = `<header>${html}</header><h3>Title</h3>`;
        return t.classifyText(article);
      });
    }, [
      '<b>alice</b> starred <b>bob/issue-tracker</b>',
      '<b>alice</b> forked <b>bob/merged-config</b>',
      '<a href="/issue">issue</a> starred <a href="/merged/pull-requests">merged/pull-requests</a>',
      '<a href="/released">released</a> started following <a href="/starred">starred</a>',
      '<b>alice</b> made <a href="/alice/issues">alice/issues</a> public',
      '<b>alice</b> opened an issue in <b>bob/stars</b>',
      '<b>alice</b> contributed to <b>bob/release-notes</b>',
    ]);
    assert.deepEqual(results, ['stars', 'repositories', 'stars', 'follows', 'repositories', 'issues', 'pull-requests']);
  });

  await step('no page errors', async () => assert.deepEqual(errors, []));
  await browser.close();
}

console.log(`\n${passed} checks passed.`);
