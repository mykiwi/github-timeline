// ==UserScript==
// @name         GitHub Timeline
// @namespace    https://github.com/mykiwi/github-timeline
// @version      2.0.1
// @description  Filter your GitHub feed in one click: pull requests, issues, releases, stars, repositories, follows and more.
// @author       mykiwi
// @license      MIT
// @homepageURL  https://github.com/mykiwi/github-timeline
// @supportURL   https://github.com/mykiwi/github-timeline/issues
// @updateURL    https://raw.githubusercontent.com/mykiwi/github-timeline/master/dist/github-timeline.user.js
// @downloadURL  https://raw.githubusercontent.com/mykiwi/github-timeline/master/dist/github-timeline.user.js
// @match        https://github.com/*
// @icon         https://raw.githubusercontent.com/mykiwi/github-timeline/master/icons/icon-48.png
// @grant        GM_addStyle
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function (css) {
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
})("/*!\n * GitHub Timeline 2 — styles.\n * Built on GitHub's own Primer design tokens (CSS variables), so the controls\n * follow whichever light, dark or high-contrast theme is active.\n * Fallback values are Primer's light theme.\n */\n\n[data-ght-hidden] {\n  display: none !important;\n}\n\n#ght-root {\n  container: ght / inline-size;\n  margin: 8px 0 4px;\n  color: var(--fgColor-default, #1f2328);\n  font-family: inherit;\n}\n\n:is(#ght-root, #ght-footer) [hidden],\n#ght-footer[hidden] {\n  display: none !important;\n}\n\n/* Our footer button stands in for GitHub's \"More\" button. GitHub nests every\n   loaded page in another turbo-frame, so the next \"More\" can be at any depth. */\n[data-ght-managed] .js-ajax-pagination,\n[data-ght-managed] .ajax-pagination-btn {\n  display: none !important;\n}\n\n/* ---- Segmented control (Primer SegmentedControl) ---------------------- */\n\n#ght-root .ght-bar {\n  display: block;\n}\n\n#ght-root .ght-seg {\n  display: flex;\n  width: 100%;\n  height: var(--control-medium-size, 32px);\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  background-color: var(--controlTrack-bgColor-rest, #e6eaef);\n  border: var(--borderWidth-thin, 1px) solid var(--controlTrack-borderColor-rest, transparent);\n  border-radius: var(--borderRadius-medium, 6px);\n  font-size: var(--text-body-size-medium, 14px);\n  line-height: 20px;\n}\n\n#ght-root .ght-seg-item {\n  position: relative;\n  display: flex;\n  flex: 1 1 auto;\n  min-width: 0;\n  margin: 0;\n  padding: 0;\n}\n\n/* Thin dividers between unselected segments. */\n#ght-root .ght-seg-item + .ght-seg-item::before {\n  content: \"\";\n  position: absolute;\n  top: 50%;\n  left: 0;\n  width: 1px;\n  height: 16px;\n  transform: translateY(-50%);\n  background-color: var(--borderColor-default, #d1d9e0);\n  pointer-events: none;\n}\n\n#ght-root .ght-seg-item:has(> [aria-current=\"true\"])::before,\n#ght-root .ght-seg-item:has(> [aria-current=\"true\"]) + .ght-seg-item::before {\n  opacity: 0;\n}\n\n#ght-root .ght-seg-btn {\n  appearance: none;\n  display: flex;\n  align-items: stretch;\n  width: 100%;\n  height: calc(100% + 2px);\n  margin: -1px 0;\n  padding: 0;\n  color: var(--fgColor-default, #1f2328);\n  font: inherit;\n  font-weight: var(--base-text-weight-normal, 400);\n  text-align: center;\n  background: transparent;\n  border: 0;\n  border-radius: var(--borderRadius-medium, 6px);\n  cursor: pointer;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n\n#ght-root .ght-seg-content {\n  display: flex;\n  flex: 1;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  min-width: 0;\n  margin: 4px;\n  padding: 0 4px;\n  white-space: nowrap;\n  border: var(--borderWidth-thin, 1px) solid transparent;\n  border-radius: var(--borderRadius-small, 3px);\n  transition: background-color 80ms cubic-bezier(0.33, 1, 0.68, 1);\n}\n\n#ght-root .ght-seg-btn:hover:not([aria-current=\"true\"]) .ght-seg-content {\n  background-color: var(--controlTrack-bgColor-hover, #e0e6eb);\n}\n\n#ght-root .ght-seg-btn:active:not([aria-current=\"true\"]) .ght-seg-content {\n  background-color: var(--controlTrack-bgColor-active, #dae0e7);\n}\n\n#ght-root .ght-seg-btn[aria-current=\"true\"] {\n  font-weight: var(--base-text-weight-semibold, 600);\n  cursor: default;\n}\n\n#ght-root .ght-seg-btn[aria-current=\"true\"] .ght-seg-content {\n  margin: 0;\n  padding: 0 8px;\n  background-color: var(--controlKnob-bgColor-rest, #fff);\n  border-color: var(--controlKnob-borderColor-rest, #d1d9e0);\n  border-radius: var(--borderRadius-medium, 6px);\n}\n\n#ght-root .ght-seg-btn:focus {\n  outline: none;\n}\n\n#ght-root .ght-seg-btn:focus-visible .ght-seg-content {\n  outline: 2px solid var(--focus-outlineColor, #0969da);\n  outline-offset: -2px;\n}\n\n#ght-root .ght-seg-label {\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n#ght-root .ght-icon {\n  display: none;\n  flex: none;\n  fill: currentColor;\n  color: var(--fgColor-muted, #59636e);\n  vertical-align: text-bottom;\n}\n\n#ght-root .ght-seg-btn[aria-current=\"true\"] .ght-icon {\n  color: var(--fgColor-default, #1f2328);\n}\n\n/* ---- Counter (Primer Counter) ----------------------------------------- */\n\n#ght-root .ght-counter {\n  display: inline-block;\n  flex: none;\n  min-width: 20px;\n  padding: 0 6px;\n  color: var(--fgColor-default, #1f2328);\n  font-size: 12px;\n  font-weight: var(--base-text-weight-medium, 500);\n  line-height: 18px;\n  text-align: center;\n  background-color: var(--bgColor-neutral-muted, #818b981f);\n  border: var(--borderWidth-thin, 1px) solid var(--counter-borderColor, transparent);\n  border-radius: 2em;\n}\n\n#ght-root .ght-counter[data-zero] {\n  color: var(--fgColor-muted, #59636e);\n}\n\n/* ---- Responsive: labels → icons → icons only -------------------------- */\n\n@container ght (max-width: 799px) {\n  #ght-root .ght-seg-label {\n    display: none;\n  }\n  #ght-root .ght-icon {\n    display: inline-block;\n  }\n}\n\n@container ght (max-width: 459px) {\n  #ght-root .ght-counter {\n    display: none;\n  }\n}\n\n/* ---- Status line ------------------------------------------------------ */\n\n#ght-root .ght-status {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 4px;\n  margin-top: 8px;\n  color: var(--fgColor-muted, #59636e);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n:is(#ght-root, #ght-footer) .ght-link {\n  appearance: none;\n  padding: 0;\n  color: var(--fgColor-accent, #0969da);\n  font: inherit;\n  background: none;\n  border: 0;\n  cursor: pointer;\n}\n\n:is(#ght-root, #ght-footer) .ght-link:hover {\n  text-decoration: underline;\n}\n\n/* ---- Empty state (Primer Blankslate) ---------------------------------- */\n\n#ght-root .ght-empty {\n  margin-top: 16px;\n  padding: 32px 24px;\n  text-align: center;\n  background-color: var(--bgColor-default, #fff);\n  border: var(--borderWidth-thin, 1px) solid var(--borderColor-default, #d1d9e0);\n  border-radius: var(--borderRadius-medium, 6px);\n}\n\n#ght-root .ght-empty-icon {\n  margin-bottom: 8px;\n  fill: var(--fgColor-muted, #59636e);\n}\n\n#ght-root .ght-empty-title {\n  margin: 0 0 4px;\n  color: var(--fgColor-default, #1f2328);\n  font-size: 16px;\n  font-weight: var(--base-text-weight-semibold, 600);\n  line-height: 24px;\n}\n\n#ght-root .ght-empty-desc {\n  max-width: 440px;\n  margin: 0 auto 16px;\n  color: var(--fgColor-muted, #59636e);\n  font-size: 14px;\n  line-height: 20px;\n}\n\n#ght-root .ght-empty-actions {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 8px;\n}\n\n/* ---- Buttons (Primer Button) ------------------------------------------ */\n\n:is(#ght-root, #ght-footer) .ght-btn {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  height: var(--control-medium-size, 32px);\n  padding: 0 12px;\n  color: var(--button-default-fgColor-rest, var(--fgColor-default, #1f2328));\n  font: inherit;\n  font-size: 14px;\n  font-weight: var(--base-text-weight-medium, 500);\n  line-height: 20px;\n  white-space: nowrap;\n  background-color: var(--button-default-bgColor-rest, #f6f8fa);\n  border: var(--borderWidth-thin, 1px) solid var(--button-default-borderColor-rest, #d1d9e0);\n  border-radius: var(--borderRadius-medium, 6px);\n  box-shadow: var(--button-default-shadow-resting, 0 1px 0 0 #1f23280a);\n  cursor: pointer;\n}\n\n:is(#ght-root, #ght-footer) .ght-btn:hover:not(:disabled) {\n  background-color: var(--button-default-bgColor-hover, #eff2f5);\n  border-color: var(--button-default-borderColor-hover, #d1d9e0);\n}\n\n:is(#ght-root, #ght-footer) .ght-btn:focus-visible {\n  outline: 2px solid var(--focus-outlineColor, #0969da);\n  outline-offset: -2px;\n}\n\n:is(#ght-root, #ght-footer) .ght-btn:disabled {\n  color: var(--fgColor-disabled, #818b98);\n  cursor: default;\n}\n\n:is(#ght-root, #ght-footer) .ght-btn--invisible {\n  color: var(--button-invisible-fgColor-rest, var(--fgColor-default, #1f2328));\n  background-color: transparent;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n:is(#ght-root, #ght-footer) .ght-btn--invisible:hover:not(:disabled) {\n  background-color: var(--button-invisible-bgColor-hover, #818b981a);\n  border-color: transparent;\n}\n\n:is(#ght-root, #ght-footer) .ght-btn-icon {\n  fill: var(--fgColor-muted, #59636e);\n}\n\n/* ---- Footer: \"Load more\" ---------------------------------------------- */\n\n#ght-footer {\n  margin: 8px 0 0;\n  text-align: center;\n}\n\n#ght-footer .ght-btn--more {\n  justify-content: center;\n  width: 100%;\n  color: var(--fgColor-accent, #0969da);\n  font-weight: var(--base-text-weight-semibold, 600);\n  background-color: var(--bgColor-default, #fff);\n}\n\n#ght-footer .ght-btn--more:hover:not([aria-disabled=\"true\"]) {\n  background-color: var(--bgColor-muted, #f6f8fa);\n}\n\n#ght-footer .ght-btn--more .ght-btn-icon {\n  fill: currentColor;\n}\n\n#ght-footer .ght-btn--more[aria-disabled=\"true\"] {\n  color: var(--fgColor-muted, #59636e);\n  cursor: progress;\n}\n\n#ght-footer .ght-spinner {\n  display: none;\n  flex: none;\n}\n\n#ght-footer .ght-btn--more[data-loading] .ght-btn-icon {\n  display: none;\n}\n\n#ght-footer .ght-btn--more[data-loading] .ght-spinner {\n  display: inline-block;\n  animation: ght-spin 1s linear infinite;\n}\n\n#ght-footer .ght-footer-note {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 4px;\n  margin: 8px 0 0;\n  color: var(--fgColor-muted, #59636e);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n@keyframes ght-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  #ght-footer .ght-btn--more[data-loading] .ght-spinner {\n    animation-duration: 3s;\n  }\n  #ght-root .ght-seg-content {\n    transition: none;\n  }\n}\n\n@media (forced-colors: active) {\n  #ght-root .ght-seg-btn[aria-current=\"true\"] .ght-seg-content {\n    border-color: Highlight;\n  }\n}");

/*!
 * GitHub Timeline 2 — quick filters for the GitHub dashboard feed.
 * https://github.com/mykiwi/github-timeline · MIT License
 *
 * Adds a segmented control (All · Pull requests · Issues · Releases · Stars ·
 * Repositories · Follows · Others) above the feed on github.com, /feed and
 * /dashboard-feed, filters the feed cards instantly, client-side, and puts a
 * "Load more stars" button (etc.) at the end of the list that keeps loading
 * feed pages until more matching cards show up.
 *
 * No network requests, no tokens, no extension permissions: it only reads the
 * card markup GitHub already rendered.
 */
(() => {
  'use strict';

  // Guard against running twice (e.g. extension + userscript installed together).
  const root = document.documentElement;
  if (root.hasAttribute('data-ght-loaded')) return;
  root.setAttribute('data-ght-loaded', '');

  const STORAGE_KEY = 'github-timeline:filter';
  const ROOT_ID = 'ght-root';
  const FOOTER_ID = 'ght-footer';
  const ITEM_SELECTOR = 'article.js-feed-item-component, article[id^="feed-item-"]';
  const MORE_SELECTOR = 'form.js-ajax-pagination button, button.ajax-pagination-btn';
  const DASHBOARD_ROUTE = /^\/(?:dashboard|feed|dashboard-feed|orgs\/[^/]+\/dashboard)?\/?$/;

  // "Load more stars" keeps loading feed pages until this many new matching cards
  // appeared, or this many pages were loaded, whichever comes first.
  const LOAD_TARGET = 10;
  const LOAD_MAX_PAGES = 5; // GitHub takes ~2 s per page
  const PAGE_DELAY_MS = 250;

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  const FILTERS = [
    { id: 'all', label: 'All', icon: 'rss', noun: 'activity', one: 'item', many: 'items' },
    { id: 'pull-requests', label: 'Pull requests', icon: 'pr', noun: 'pull requests', one: 'pull request', many: 'pull requests' },
    { id: 'issues', label: 'Issues', icon: 'issue', noun: 'issues', one: 'issue', many: 'issues' },
    { id: 'releases', label: 'Releases', icon: 'tag', noun: 'releases', one: 'release', many: 'releases' },
    { id: 'stars', label: 'Stars', icon: 'star', noun: 'stars', one: 'star', many: 'stars' },
    { id: 'repositories', label: 'Repositories', icon: 'repo', noun: 'new repositories or forks', one: 'repository', many: 'repositories' },
    { id: 'follows', label: 'Follows', icon: 'person', noun: 'follows', one: 'follow', many: 'follows' },
    { id: 'others', label: 'Others', icon: 'kebab', noun: 'other activity', one: 'other item', many: 'other items' },
  ];
  const FILTER_IDS = new Set(FILTERS.map((f) => f.id));
  const filterById = (id) => FILTERS.find((f) => f.id === id);
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Each feed card carries analytics metadata such as
  //   data-hydro-view='{"payload":{"feed_card":{"card_type":"MERGED_PULL_REQUEST",...}}}'
  // We classify on the words of card_type, so new variants (OPENED_ISSUE,
  // STARRED_REPOSITORY, FORKED_REPOSITORY, ...) land in the right bucket without
  // having to list every value GitHub may use.
  const TYPE_RULES = [
    ['others', ['RECOMMENDATION', 'RECOMMENDATIONS', 'RECOMMENDED', 'TRENDING', 'SUGGESTED', 'SUGGESTION', 'POPULAR', 'SPOTLIGHT', 'EXPLORE', 'DISCOVER']],
    ['pull-requests', ['PULL', 'PR', 'PULLREQUEST']],
    ['issues', ['ISSUE', 'ISSUES']],
    ['releases', ['RELEASE', 'RELEASES', 'RELEASED']],
    ['stars', ['STAR', 'STARS', 'STARRED']],
    ['follows', ['FOLLOW', 'FOLLOWS', 'FOLLOWED', 'FOLLOWING']],
    // CREATED/CREATE alone is not enough: CREATED_DISCUSSION, CREATE_TAG, ... are not repositories.
    ['repositories', ['FORK', 'FORKED', 'REPOSITORY', 'REPO', 'PUBLIC']],
  ];
  const CREATE_WORDS = new Set(['CREATE', 'CREATED']);

  // Used only when a card has no metadata: match on the card header text.
  // Hyphens count as part of a word, so "bob/issue-tracker" never reads as "issue".
  const phrase = (source) => new RegExp(`(?<![\\w-])(?:${source})(?![\\w-])`);
  const TEXT_RULES = [
    ['others', phrase('trending|recommended|popular projects|you may like|suggested for you')],
    ['pull-requests', phrase('pull requests?|contributed to|merged')],
    ['issues', phrase('issues?')],
    ['releases', phrase('released|published a release')],
    ['stars', phrase('starred')],
    ['follows', phrase('started following|followed|follows')],
    ['repositories', phrase('forked|created a repository|made (?:.+ )?public')],
  ];

  function readCardType(article) {
    const sources = [article, ...article.querySelectorAll('[data-hydro-view], [data-hydro-click]')];
    for (const el of sources) {
      for (const attr of ['data-hydro-view', 'data-hydro-click']) {
        const raw = el.getAttribute(attr);
        if (!raw || !raw.includes('feed_card')) continue;
        try {
          const card = JSON.parse(raw).payload.feed_card;
          if (card && card.card_type) return { type: String(card.card_type), resource: String(card.resource_type || '') };
        } catch {
          /* not JSON, keep looking */
        }
      }
    }
    return null;
  }

  function classifyType(type, resource) {
    const words = new Set(type.toUpperCase().split(/[^A-Z]+/).filter(Boolean));
    for (const [category, keywords] of TYPE_RULES) {
      if (keywords.some((k) => words.has(k))) return category;
    }
    // A bare CREATED/CREATE card is a repository only when its resource says so.
    if (words.size && [...words].every((w) => CREATE_WORDS.has(w)) && /^REPO(SITORY)?$/i.test(resource)) return 'repositories';
    // Unknown card type: trust the resource only when it is specific.
    if (/PULL_?REQUEST/i.test(resource)) return 'pull-requests';
    if (/ISSUE/i.test(resource)) return 'issues';
    if (/RELEASE/i.test(resource)) return 'releases';
    return 'others';
  }

  function classifyText(article) {
    // Keep only the action words: drop links (user, repository and issue names)
    // and anything shaped like owner/name.
    const header = (article.querySelector('header') || article).cloneNode(true);
    for (const link of header.querySelectorAll('a')) link.remove();
    const text = header.textContent.replace(/\S*\/\S*/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    for (const [category, re] of TEXT_RULES) if (re.test(text)) return category;
    return 'others';
  }

  function categoryOf(article) {
    let category = article.getAttribute('data-ght-category');
    if (!category) {
      const card = readCardType(article);
      category = card ? classifyType(card.type, card.resource) : classifyText(article);
      article.setAttribute('data-ght-category', category);
      if (card) article.setAttribute('data-ght-type', card.type);
    }
    return category;
  }

  // ---------------------------------------------------------------------------
  // Persistence (page localStorage: works the same in the extension and the userscript)
  // ---------------------------------------------------------------------------

  function loadFilter() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (FILTER_IDS.has(saved)) return saved;
    } catch {
      /* storage may be blocked */
    }
    return 'all';
  }

  function saveFilter(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // Icons (Primer Octicons, MIT)
  // ---------------------------------------------------------------------------

  const ICONS = {
    rss: 'M2.002 2.725a.75.75 0 0 1 .797-.699C8.79 2.42 13.58 7.21 13.974 13.201a.75.75 0 0 1-1.497.098 10.502 10.502 0 0 0-9.776-9.776.747.747 0 0 1-.7-.798ZM2.84 7.05h-.002a7.002 7.002 0 0 1 6.113 6.111.75.75 0 0 1-1.49.178 5.503 5.503 0 0 0-4.8-4.8.75.75 0 0 1 .179-1.489ZM2 13a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z',
    pr: 'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z',
    issue: 'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z',
    tag: 'M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
    star: 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z',
    repo: 'M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z',
    person: 'M7.9 8.548h-.001a5.528 5.528 0 0 1 3.1 4.659.75.75 0 1 1-1.498.086A4.01 4.01 0 0 0 5.5 9.5a4.01 4.01 0 0 0-4.001 3.793.75.75 0 1 1-1.498-.085 5.527 5.527 0 0 1 3.1-4.66 3.5 3.5 0 1 1 4.799 0ZM13.25 0a.75.75 0 0 1 .75.75V2h1.25a.75.75 0 0 1 0 1.5H14v1.25a.75.75 0 0 1-1.5 0V3.5h-1.25a.75.75 0 0 1 0-1.5h1.25V.75a.75.75 0 0 1 .75-.75ZM5.5 4a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 4Z',
    kebab: 'M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    foldDown: 'm8.177 14.323 2.896-2.896a.25.25 0 0 0-.177-.427H8.75V7.764a.75.75 0 1 0-1.5 0V11H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0ZM2.25 5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 4.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5a.75.75 0 0 1 .75.75ZM8.25 5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 4.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5a.75.75 0 0 1 .75.75Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z',
    filter24: 'M2.75 6a.75.75 0 0 0 0 1.5h18.5a.75.75 0 0 0 0-1.5H2.75ZM6 11.75a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75Zm4 4.938a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z',
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function icon(name, size = 16, className = 'ght-icon') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', className);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', ICONS[name]);
    svg.append(path);
    return svg;
  }

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : String(value));
    }
    node.append(...children);
    return node;
  }

  // Only touch the DOM when something actually changed: keeps the page's
  // MutationObservers (and ours) quiet.
  function setText(node, value) {
    if (node.textContent !== value) node.textContent = value;
  }
  function setAttr(node, name, value) {
    if (value === null || value === false) {
      if (node.hasAttribute(name)) node.removeAttribute(name);
    } else if (node.getAttribute(name) !== String(value)) {
      node.setAttribute(name, String(value));
    }
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  let current = loadFilter();
  let frame = null;
  let frameHadMore = false; // did this feed ever show GitHub's "More" button?
  let loader = idleLoader();
  const ui = buildUI();

  function idleLoader() {
    return { running: false, stop: false, done: false, filter: null, pages: 0, items: 0, found: 0 };
  }

  function spinner() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'ght-spinner');
    const track = document.createElementNS(SVG_NS, 'circle');
    for (const [k, v] of Object.entries({ cx: 8, cy: 8, r: 7, fill: 'none', stroke: 'currentColor', 'stroke-opacity': 0.25, 'stroke-width': 2 })) track.setAttribute(k, String(v));
    const arc = document.createElementNS(SVG_NS, 'path');
    for (const [k, v] of Object.entries({ d: 'M15 8a7 7 0 0 0-7-7', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' })) arc.setAttribute(k, String(v));
    svg.append(track, arc);
    return svg;
  }

  function buildUI() {
    const buttons = new Map();
    const counters = new Map();

    const list = el('ul', { class: 'ght-seg', 'aria-label': 'Filter feed by activity type' });
    for (const filter of FILTERS) {
      const counter = el('span', { class: 'ght-counter', text: '0' });
      const button = el(
        'button',
        { type: 'button', class: 'ght-seg-btn', 'data-filter': filter.id },
        el('span', { class: 'ght-seg-content' }, icon(filter.icon), el('span', { class: 'ght-seg-label', text: filter.label }), counter),
      );
      button.addEventListener('click', () => select(filter.id));
      buttons.set(filter.id, button);
      counters.set(filter.id, counter);
      list.append(el('li', { class: 'ght-seg-item' }, button));
    }

    const statusText = el('span', { class: 'ght-status-text' });
    const resetLink = el('button', { type: 'button', class: 'ght-link', text: 'Show all' });
    resetLink.addEventListener('click', () => select('all'));
    const status = el('div', { class: 'ght-status', 'aria-live': 'polite' }, statusText, resetLink);

    const emptyTitle = el('h3', { class: 'ght-empty-title' });
    const emptyDesc = el('p', { class: 'ght-empty-desc' });
    const showAllButton = el('button', { type: 'button', class: 'ght-btn ght-btn--invisible', text: 'Show all activity' });
    showAllButton.addEventListener('click', () => select('all'));
    const empty = el(
      'div',
      { class: 'ght-empty', hidden: true },
      icon('filter24', 24, 'ght-empty-icon'),
      emptyTitle,
      emptyDesc,
      el('div', { class: 'ght-empty-actions' }, showAllButton),
    );

    const container = el('div', { id: ROOT_ID, 'data-ght': '' }, el('nav', { class: 'ght-bar', 'aria-label': 'GitHub Timeline' }, list), status, empty);

    // Footer, right after the feed. It stands in for GitHub's "More" button:
    // "Load more stars" keeps loading feed pages until more stars show up.
    const footerLabel = el('span', { text: 'Load more' });
    const footerButton = el('button', { type: 'button', class: 'ght-btn ght-btn--more' }, icon('foldDown', 16, 'ght-btn-icon'), spinner(), footerLabel);
    footerButton.addEventListener('click', loadMore);
    const footerText = el('span', { class: 'ght-footer-text' });
    const stopLink = el('button', { type: 'button', class: 'ght-link', text: 'Stop' });
    stopLink.addEventListener('click', () => {
      loader.stop = true;
      render();
    });
    const footerNote = el('p', { class: 'ght-footer-note', 'aria-live': 'polite' }, footerText, stopLink);
    const footer = el('div', { id: FOOTER_ID, 'data-ght': '', hidden: true }, footerButton, footerNote);

    return { container, buttons, counters, status, statusText, empty, emptyTitle, emptyDesc, footer, footerButton, footerLabel, footerNote, footerText, stopLink };
  }

  function select(id) {
    if (!FILTER_IDS.has(id)) return;
    if (id !== current) {
      if (loader.running) loader.stop = true;
      else loader = idleLoader();
    }
    current = id;
    saveFilter(id);
    render();
  }

  function moreControl() {
    const control = frame && frame.querySelector(MORE_SELECTOR);
    if (control) frameHadMore = true;
    return control;
  }

  function topLevelItems() {
    if (!frame) return [];
    return [...frame.querySelectorAll(ITEM_SELECTOR)].filter((item) => !item.parentElement.closest(ITEM_SELECTOR));
  }

  function matching(filterId) {
    const items = topLevelItems();
    return filterId === 'all' ? items.length : items.filter((item) => categoryOf(item) === filterId).length;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function until(predicate, timeout) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (predicate()) resolve(true);
        else if (Date.now() - start > timeout) resolve(false);
        else setTimeout(tick, 100);
      };
      tick();
    });
  }

  // Loads whole feed pages through GitHub's own "More" button: every kind of
  // activity comes in, the filter only decides what is shown. With a filter on,
  // it keeps going until LOAD_TARGET new matching cards appeared (or
  // LOAD_MAX_PAGES pages, the end of the feed, or Stop). With "All", one page.
  async function loadMore() {
    if (loader.running || !frame) return;
    const filter = current;
    const target = filter === 'all' ? 1 : LOAD_TARGET;
    const matchesBefore = matching(filter);
    const itemsAtStart = topLevelItems().length;
    loader = { running: true, stop: false, done: false, filter, pages: 0, items: 0, found: 0 };
    render();

    while (!loader.stop && loader.pages < LOAD_MAX_PAGES) {
      const button = moreControl();
      if (!button) break;
      const itemsBefore = topLevelItems().length;
      let goneAt = 0;
      button.click();
      const loaded = await until(() => {
        if (!frame || topLevelItems().length > itemsBefore) return true;
        // The button went away without new cards: give GitHub a moment, then move on.
        if (!button.isConnected) {
          goneAt = goneAt || Date.now();
          return Date.now() - goneAt > 1000;
        }
        return false;
      }, 15000);
      if (!loaded || !frame) break;
      loader.pages += 1;
      loader.items = topLevelItems().length - itemsAtStart;
      loader.found = matching(filter) - matchesBefore;
      render();
      if (loader.found >= target) break;
      await sleep(PAGE_DELAY_MS);
    }

    loader.running = false;
    loader.done = true;
    render();
  }

  function footerMessage(filter, more) {
    const end = "You've reached the end of your feed.";
    if (loader.running) {
      const page = `Loading page ${loader.pages + 1}…`;
      if (current === 'all') return page;
      return `${page} · ${loader.found ? count(loader.found, `new ${filter.one}`, `new ${filter.many}`) : `no ${filter.many} yet`} ·`;
    }
    if (loader.done && loader.filter === current && loader.pages > 0) {
      const loaded = `Loaded ${count(loader.items, 'more item', 'more items')}`;
      const found = current === 'all' ? '' : ` · ${loader.found ? count(loader.found, filter.one, filter.many) : `no ${filter.many}`}`;
      return `${loaded}${found}${more ? '' : `. ${end}`}`;
    }
    return more ? '' : end;
  }

  function render() {
    if (!frame) return;
    const items = topLevelItems();
    const counts = Object.fromEntries(FILTERS.map((f) => [f.id, 0]));
    let visible = 0;

    for (const item of items) {
      const category = categoryOf(item);
      counts[category] += 1;
      counts.all += 1;
      const hidden = current !== 'all' && category !== current;
      if (!hidden) visible += 1;
      setAttr(item, 'data-ght-hidden', hidden ? '' : null);
      // Keep the "You dismissed this item" placeholder in sync with its card.
      const id = item.id && item.id.replace(/^feed-item-/, '');
      const placeholder = id && document.getElementById(`dismissed-item-placeholder-${id}`);
      if (placeholder) setAttr(placeholder, 'data-ght-hidden', hidden ? '' : null);
    }

    for (const filter of FILTERS) {
      const button = ui.buttons.get(filter.id);
      const n = counts[filter.id];
      setAttr(button, 'aria-current', filter.id === current ? 'true' : null);
      setAttr(button, 'aria-label', `${filter.label} (${n})`);
      setAttr(button, 'title', filter.label);
      const counter = ui.counters.get(filter.id);
      setText(counter, String(n));
      setAttr(counter, 'data-zero', n === 0 ? '' : null);
    }

    const filter = filterById(current);
    const more = moreControl();
    const filtered = current !== 'all';

    // Status line: "Showing 3 of 21 loaded items · Show all"
    const showStatus = filtered && visible > 0;
    setAttr(ui.status, 'hidden', showStatus ? null : '');
    if (showStatus) setText(ui.statusText, `Showing ${visible} of ${count(items.length, 'loaded item', 'loaded items')} ·`);

    // Empty state
    const showEmpty = filtered && visible === 0 && items.length > 0;
    setAttr(ui.empty, 'hidden', showEmpty ? null : '');
    if (showEmpty) {
      setText(ui.emptyTitle, `No ${filter.noun} yet`);
      setText(
        ui.emptyDesc,
        more || loader.running
          ? `None of the ${items.length} items loaded so far match. Load more below to look further back.`
          : `None of the ${items.length} items in your feed match this filter.`,
      );
    }

    // Footer: our button replaces GitHub's "More" (hidden via [data-ght-managed]).
    const showFooter = frameHadMore && items.length > 0;
    setAttr(ui.footer, 'hidden', showFooter ? null : '');
    setAttr(frame, 'data-ght-managed', showFooter ? '' : null);
    if (showFooter) {
      const canLoad = Boolean(more) || loader.running;
      setAttr(ui.footerButton, 'hidden', canLoad ? null : '');
      setAttr(ui.footerButton, 'aria-disabled', loader.running ? 'true' : null);
      setAttr(ui.footerButton, 'data-loading', loader.running ? '' : null);
      setText(ui.footerLabel, loader.running ? 'Loading…' : filtered ? `Load more ${filter.many}` : 'Load more');
      const message = footerMessage(filter, more);
      setText(ui.footerText, message);
      setAttr(ui.footerNote, 'hidden', message ? null : '');
      setAttr(ui.stopLink, 'hidden', loader.running && filtered && !loader.stop ? null : '');
    }
  }

  // ---------------------------------------------------------------------------
  // Mounting: GitHub navigates without full page loads (Turbo / React), and the
  // feed re-renders itself (pagination, live updates, native filter changes).
  // One observer keeps the bar attached to whatever feed is on screen.
  // ---------------------------------------------------------------------------

  function findFrame() {
    // Loaded pages are nested turbo-frames with the same id; getElementById
    // returns the outermost one, which holds the whole feed.
    const byId = document.getElementById('conduit-feed-frame');
    if (byId) return byId;
    if (!DASHBOARD_ROUTE.test(location.pathname)) return null;
    return document.querySelector('.js-for-you-feed-items');
  }

  function sync() {
    const found = findFrame();
    if (!found) {
      ui.container.remove();
      ui.footer.remove();
      frame = null;
      return;
    }
    if (found !== frame) {
      frame = found;
      frameHadMore = false;
    }
    if (ui.container.nextElementSibling !== frame) frame.before(ui.container);
    if (ui.footer.previousElementSibling !== frame) frame.after(ui.footer);
    render();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sync();
    });
  }

  const isOurs = (node) => ui.container.contains(node) || ui.footer.contains(node);
  const observer = new MutationObserver((records) => {
    // Ignore our own DOM updates.
    if (records.every((r) => isOurs(r.target))) return;
    schedule();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  for (const type of ['turbo:load', 'turbo:render', 'turbo:frame-load', 'soft-nav:end', 'pageshow', 'popstate']) {
    window.addEventListener(type, schedule);
    document.addEventListener(type, schedule);
  }

  // Keep tabs in sync when the filter is changed in another window.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && FILTER_IDS.has(event.newValue)) {
      current = event.newValue;
      render();
    }
  });

  sync();

  // Exposed for tests only.
  if (typeof globalThis.__GHT_TEST__ === 'object') {
    Object.assign(globalThis.__GHT_TEST__, { classifyType, classifyText, categoryOf, select, sync });
  }
})();
