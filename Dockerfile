# syntax=docker/dockerfile:1.7

################################################################################
# Build kraft docs
################################################################################
FROM golang:1.26 AS build-kraft-docs

ARG CHANNEL=staging

WORKDIR /kraftkit
ADD https://github.com/unikraft/kraftkit.git#${CHANNEL} /kraftkit

RUN make docs

################################################################################
# Build unikraft docs
################################################################################
FROM golang:1.26 AS build-cli-docs

ARG CHANNEL=staging

WORKDIR /cli
ADD https://github.com/unikraft/cli.git#${CHANNEL} /cli

RUN make docs

################################################################################
# Dependencies + build
################################################################################
FROM node:24-alpine AS build
WORKDIR /docs

ENV CI=true
ENV PNPM_HOME="/pnpm"

RUN set -xe; \
    apk --no-cache add \
        ca-certificates \
        git \
        wget \
    ;

RUN set -xe; \
    corepack enable; \
    corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prefer-frozen-lockfile; \
    pnpm install --prod --prefer-frozen-lockfile

COPY . .

# Grab the latest OpenAPI spec based on the desired channel.
ARG CHANNEL=staging
ADD https://raw.githubusercontent.com/unikraft-cloud/openapi/refs/heads/prod-${CHANNEL}/platform.yaml apis/platform.yaml

# Kraftfile v0.7 schema docs (from unikraft-cloud/x)
ADD https://raw.githubusercontent.com/unikraft-cloud/x/refs/heads/prod-${CHANNEL}/kraftfile/schema.md pages/kraftfile/v0.7.md

# Kraft (old CLI) docs -> /cli/kraft/
COPY --from=build-kraft-docs /kraftkit/docs/kraft/cloud /docs/pages/cli/kraft
COPY --from=build-kraft-docs /kraftkit/docs/kraft/cloud.mdx /docs/pages/cli/kraft/overview.mdx

# Unikraft (new CLI) docs -> /cli/unikraft/
COPY --from=build-cli-docs /cli/dist/docs/mdx/unikraft/ /docs/pages/cli/unikraft/
COPY --from=build-cli-docs /cli/dist/docs/mdx/unikraft.mdx /docs/pages/cli/unikraft.mdx

RUN pnpm run build

################################################################################
# Production filesystem
################################################################################
FROM caddy:2.10.2-alpine AS prod
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /docs/dist/docs /var/www/docs
