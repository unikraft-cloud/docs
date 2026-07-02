# Unikraft Cloud Documentation

This repository contains the markdown contents of the documentation site at https://unikraft.com/docs.

## Contributing to the docs

Contributions to the documentation are welcome!

### Table of contents

- [Unikraft Cloud Documentation](#unikraft-cloud-documentation)
  - [Contributing to the docs](#contributing-to-the-docs)
    - [Table of contents](#table-of-contents)
    - [Introduction](#introduction)
    - [Local development with Docker](#local-development-with-docker)
    - [Code contribution guidelines](#code-contribution-guidelines)
    - [Git commit message guidelines](#git-commit-message-guidelines)
    - [Copyright and license](#copyright-and-license)

### Introduction

The [`pages/`](./pages) directory contains all the [markdown](https://www.markdownguide.org/) files for Unikraft Cloud's documentation.

To maintain consistency and accuracy across all documentation pages, [vale](https://vale.sh/) lints all written prose.

### Local development with Docker

Run the commands in this section from the root of this `docs/` repository.

The checked-in [docker-compose.yaml](./docker-compose.yaml) builds the production site and does not provide hot reload.
For live editing, first bootstrap the generated CLI, API, and Kraftfile reference content from the existing Docker build:

```bash
docker build --target build -t ukc-docs-bootstrap .

cid=$(docker create ukc-docs-bootstrap)
mkdir -p apis pages/cli pages/kraftfile
docker cp "$cid":/docs/apis/platform.yaml ./apis/platform.yaml
docker cp "$cid":/docs/pages/cli/unikraft ./pages/cli/unikraft
docker cp "$cid":/docs/pages/cli/kraft ./pages/cli/kraft
docker cp "$cid":/docs/pages/cli/unikraft.mdx ./pages/cli/unikraft.mdx
docker cp "$cid":/docs/pages/kraftfile/v0.7.md ./pages/kraftfile/v0.7.md
docker rm "$cid"
```

That bootstrap image pulls the OpenAPI specification from the [unikraft-cloud/openapi](https://github.com/unikraft-cloud/openapi) repository and materializes the API reference consumed by Zudoku at startup.
If you only need to refresh the API reference, you can fetch that file directly without rebuilding the whole bootstrap image:

```bash
mkdir -p apis
curl -fsSL \
  https://raw.githubusercontent.com/unikraft-cloud/openapi/refs/heads/prod-staging/platform.yaml \
  -o apis/platform.yaml
```

Then run the docs site in a bind-mounted Node container:

```bash
docker run --rm -it \
  -p 3131:3131 \
  -e CHOKIDAR_USEPOLLING=true \
  -v "$PWD":/docs \
  -v ukc-docs-node-modules:/docs/node_modules \
  -w /docs \
  node:24-bookworm \
  sh -lc 'apt-get update >/dev/null \
    && apt-get install -y ca-certificates >/dev/null \
    && corepack enable >/dev/null \
    && corepack prepare pnpm@10.33.0 --activate >/dev/null \
    && pnpm install >/dev/null \
    && pnpm dev -- --host 0.0.0.0'
```

Open `http://localhost:3131/docs` in your browser.
Changes under this directory are bind-mounted into the container, and `CHOKIDAR_USEPOLLING=true` enables hot reload reliably from Docker.

The bootstrap step is needed because this repository does not check in the generated `/apis/platform.yaml`, `/cli/unikraft`, `/cli/kraft`, and `/kraftfile/v0.7` source files that Zudoku expects at startup.
The first run takes longer because Docker builds the bootstrap image, downloads the base Node image, and `pnpm` installs dependencies into the `ukc-docs-node-modules` volume.
To reset that container-only dependency cache, remove the volume:

```bash
docker volume rm ukc-docs-node-modules
```

### Code contribution guidelines

To make the contribution process as seamless as possible, please follow these requirements:

- Fork the project and make your changes.
- When you’re ready to create a pull request, be sure to:
  - Run `make lint` to check all documentation.
  - Squash your commits into to logical, [atomic commits](https://en.wikipedia.org/wiki/Atomic_commit) (`git rebase -i`).
    It's okay to force update your pull request with `git push -f`.
  - Follow the **Git Commit Message Guidelines** below.
- All commits must be signed off (`git commit -s`) by all authors in order to certify that the contributions are published under the [Developer Certificate of Origin (DCO)](https://wiki.linuxfoundation.org/dco).
- For consistency, you should follow these soft guidelines for writing docs (besides what `make lint` enforces):
  - Where `unikraft` commands are used, provide `kraft` commands as well, if applicable.
  - All code blocks should have 2 spaces indentation for multi-line code, and the language should be specified for syntax highlighting (for example, `bash` for shell commands).
  - Code blocks used for listing output should have `title=""`, unless context clarifications are needed (e.g., it is tied to a specific CLI in a `CodeTabs`).
  - Header titles should be concise and descriptive, starting with a capital letter on the first word only.

### Git commit message guidelines

This project follows a modified version of the [AngularJS Commit Guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#-git-commit-guidelines).
A commit message should take the following form:

```
<type>: <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

where `<body>` and `<footer>` containing at least the contributions DCO.
The `<type>` should be one of the following:

- `chore`: Maintenance tasks for the repository itself.
- `ci`: Changes related to GitHub actions or any other CI/CD-related operations.
- `docs`: Documentation only changes (for example, this README, or source comments).
- `feat`: A new feature.
- `fix`: A bug fix.
- `perf`: A code change that improves performance (in this case, please include relevant benchmarks).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `style`: Changes that don't affect the meaning of the code (for example, code formatting).
- `test`: Adding new tests, missing tests, or correcting existing tests.

An example would be something like:

```text
feat(guides): Add foobar deployment example

This commit adds a new example deployment to Unikraft Cloud
which demonstrates how to use foobar.

GitHub-Fixes: #30
Signed-off-by: Bobo Monkey <monkey@unikraft.com>
```

### Copyright and license

Copyright Unikraft GmbH © 2025.
All rights reserved.
Unikraft GmbH licenses this documentation under `BSD-3-Clause`, see [`LICENSE.md`](./LICENSE.md) for more details.
