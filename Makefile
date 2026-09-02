# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2022, Unikraft GmbH and The KraftKit Authors.
# Licensed under the BSD-3-Clause License (the "License").
# You may not use this file except in compliance with the License.

# Directories
WORKDIR ?= $(CURDIR)

# Tools
VALE    ?= vale
WGET    ?= wget
CURL    ?= curl

# Sync configuration
EXAMPLES_REPO     ?= unikraft-cloud/examples
EXAMPLES_BRANCH   ?= main
GUIDES_DIR        ?= $(WORKDIR)/pages/guides
RELEASES_DIR      ?= $(WORKDIR)/pages/releases

.PHONY: generate
generate:
	$(WORKDIR)/scripts/generate_releases_rss.py "$(RELEASES_DIR)" "$(WORKDIR)/public/releases/rss.xml"

.PHONY: lint
lint: $(VALE)
	$(VALE) sync
	$(VALE) $(WORKDIR)/pages

.PHONY: $(VALE)
$(VALE):
	@command -v $(VALE) >/dev/null 2>&1 || { \
		echo "❌ $(VALE) is not installed."; \
		echo ""; \
		echo "👉 Please install it before continuing."; \
		echo "   For example:"; \
		echo "     - macOS: brew install $(VALE)"; \
		echo "     - Debian/Ubuntu: snap install $(VALE)"; \
		echo "     - Windows: choco install $(VALE)"; \
		echo "   For more info, visit: https://vale.sh"; \
		exit 1; \
	}

.PHONY: sync
sync:
	@set -e; \
	EXAMPLES_LOCAL="$(WORKDIR)/.examples"; \
	if [ -d "$$EXAMPLES_LOCAL/.git" ]; then \
		cd "$$EXAMPLES_LOCAL" && git fetch --all && git checkout $(EXAMPLES_BRANCH) && git pull; \
	else \
		rm -rf "$$EXAMPLES_LOCAL"; \
		git clone --depth 1 --branch $(EXAMPLES_BRANCH) https://github.com/$(EXAMPLES_REPO) "$$EXAMPLES_LOCAL"; \
	fi; \
	updated_guides=""; \
	for example in $$(find "$$EXAMPLES_LOCAL" -mindepth 1 -maxdepth 1 -type d -not -name '.*'); do \
		name=$$(basename "$$example"); \
		readme="$$example/README.md"; \
		if [ -f "$$readme" ]; then \
			# TODO: remove - Only transform updated READMEs \
			if grep -q "Make sure to log into Unikraft Cloud" "$$readme" ; then \
				guide="$(GUIDES_DIR)/$$name.mdx" ;\
				echo "  📄 $$name -> $$(basename $$guide)" ;\
				$(WORKDIR)/scripts/transform_readme.py "$$readme" "$$guide" "$$name" ;\
				updated_guides="$$updated_guides $$name.mdx" ;\
			else \
				echo "⏭ Skipping $$name (metro line not present)" ;\
			fi ;\
		fi; \
	done; \
	for guide in $$(find "$(GUIDES_DIR)" -maxdepth 1 -name '*.mdx' -type f); do \
		gname=$$(basename "$$guide"); \
		if [ "$$gname" = "overview.mdx" ]; then continue; fi; \
		if ! echo "$$updated_guides" | grep -qw "$$gname"; then \
			echo "  🗑 Removing stale guide: $$gname"; \
			rm -f "$$guide"; \
		fi; \
	done; \
	$(WORKDIR)/scripts/update_zudoku_guides.py "$(GUIDES_DIR)" "$(WORKDIR)/zudoku.config.tsx"

.PHONY: sync-list
sync-list:
	$(WORKDIR)/scripts/update_zudoku_guides.py "$(GUIDES_DIR)" "$(WORKDIR)/zudoku.config.tsx"
