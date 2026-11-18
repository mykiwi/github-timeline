.DEFAULT_GOAL := help
.PHONY: help install build test screenshots lock lock-verify release

# Playwright's Chromium (branded Google Chrome 137+ ignores --load-extension).
CHROME ?= $(shell node -e "import('playwright-core').then(m => console.log(m.chromium.executablePath()))" 2>/dev/null)
export CHROME

help:
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

node_modules: package.json package-lock.json
	npm ci
	npx playwright-core install chromium
	@touch $@

install: node_modules ## Install dependencies and Playwright's Chromium

build: node_modules ## Build dist/ (userscript + extension zip)
	npm run build

test: node_modules ## Build and run the end-to-end tests
	npm test

screenshots: node_modules ## Build and regenerate screenshots/
	npm run screenshots

lock: ## Pin GitHub Actions and update .github/workflows/actions.lock
	gh actions-lock --relock

lock-verify: ## Check actions.lock matches the workflows
	gh actions-lock --verify

release: ## Bump version, test, commit, tag and push (make release VERSION=x.y.z)
	@test -n "$(VERSION)" || { echo "Usage: make release VERSION=x.y.z"; exit 1; }
	@test "$$(git branch --show-current)" = master || { echo "Not on master"; exit 1; }
	@test -z "$$(git status --porcelain)" || { echo "Working tree not clean"; exit 1; }
	@! git rev-parse -q --verify "refs/tags/$(VERSION)" >/dev/null || { echo "Tag $(VERSION) already exists"; exit 1; }
	npm version --no-git-tag-version "$(VERSION)"
	sed -i -E '0,/"version": "[^"]*"/s//"version": "$(VERSION)"/' manifest.json
	$(MAKE) test
	git add manifest.json package.json package-lock.json dist/github-timeline.user.js
	git commit -m "Release $(VERSION)"
	git tag "$(VERSION)"
	git push origin master "$(VERSION)"
