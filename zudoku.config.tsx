import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  metadata: {
    title: "%s | Unikraft Cloud Docs",
    favicon: "/favicon.ico",
  },
  basePath: "/docs",
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: "130px",
    },
    showPoweredBy: false,
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
    defaultOptions: {
      showLastModified: true,
      suggestEdit: {
        text: "Edit this page",
        url: "https://github.com/unikraft-cloud/docs/edit/prod-stable/{filePath}",
      },
    },
    publishMarkdown: true,
    llms: {
      llmsTxt: true, // Generate llms.txt
      llmsTxtFull: true, // Generate llms-full.txt
      includeProtected: false, // Exclude protected routes
    },
  },
  syntaxHighlighting: {
    languages: [
      "c",
      "go",
      "html",
      "javascript",
      "json",
      "python",
      "rust",
      "shellscript",
      "typescript",
      "yaml",
    ],
    themes: {
      light: "github-light",
      dark: "github-dark-high-contrast",
    },
  },
  navigation: [
    {
      type: "category",
      label: "Documentation",
      icon: "book-open-text",
      items: [
        {
          type: "category",
          label: "Getting Started",
          icon: "star",
          collapsed: false,
          items: [
            "/introduction",
            "/faq",
          ],
        },
        {
          type: "category",
          label: "Features",
          icon: "rocket",
          collapsed: false,
          items: [
            "/features/scale-to-zero",
            "/features/load-balancing",
            "/features/snapshots",
            "/features/autoscale",
            "/features/roms",
            "/features/autokill",
            "/features/cron-jobs",
            "/features/forking",
          ],
        },
        {
          type: "category",
          label: "Use Cases",
          icon: "lightbulb",
          collapsed: false,
          items: [
            "/use-cases/sandboxes",
            "/use-cases/headless-browsers",
            "/use-cases/mcp-servers",
            "/use-cases/api-gateways",
            "/use-cases/serverless-functions",
            "/use-cases/serverless-databases",
            "/use-cases/build-test-environments",
            "/use-cases/webhooks",
            "/use-cases/remote-ides",
            "/use-cases/game-servers",
            "/use-cases/remote-desktops",
          ],
        },
        {
          type: "category",
          label: "Cloud Platform",
          icon: "cloud",
          collapsed: false,
          items: [
            "/platform/metros",
            "/platform/instances",
            "/platform/services",
            "/platform/domains",
            "/platform/certificates",
            "/platform/volumes",
            "/platform/images",
            "/platform/quotas",
            "/platform/metrics",
            "/platform/tagging",
            "/platform/delete-locks",
            "/platform/troubleshooting",
          ],
        },
        {
          type: "category",
          label: "Integrations",
          icon: "blocks",
          collapsed: false,
          items: [
            "/integrations/kubernetes",
            "/integrations/sdks/go",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Guides",
      icon: "graduation-cap",
      items: [
        //TODO: Please keep this list sorted by titles, not filenames !!
        "/guides/overview", // Guides Overview
        "/guides/httpserver-dotnet10.0", // .NET HTTP Server
        "/guides/node18-agario", // Agar.io (Node)
        "/guides/mcp-server-arxiv", // ArXiv MCP Server
        "/guides/httpserver-bun", // Bun HTTP Server
        "/guides/httpserver-gcc13.2", // C HTTP Server
        "/guides/httpserver-boost1.74-gpp13.2", // C++ Boost HTTP Server
        "/guides/httpserver-gpp13.2", // C++ HTTP Server
        "/guides/caddy2.7-go1.21", // Caddy
        "/guides/debian-ssh", // Debian SSH server
        "/guides/httpserver-python3.12-django5.0", // Django HTTP Server
        "/guides/dragonflydb", // DragonflyDB
        "/guides/duckdb-go1.21", // DuckDB with Go
        "/guides/httpserver-elixir1.16", // Elixir HTTP Server
        "/guides/httpserver-erlang26.2", // Erlang HTTP Server
        "/guides/httpserver-expressjs4.18-node21", // Express HTTP Server
        "/guides/httpserver-python3.12-fastapi-0.121.3", // FastAPI HTTP Server
        "/guides/httpserver-flask-redis", // Flask + Redis HTTP Server
        "/guides/httpserver-python3.12-flask3.0-sqlite", // Flask and SQLite HTTP Server
        "/guides/httpserver-python3.12-flask3.0", // Flask HTTP Server
        "/guides/github-webhook-node", // GitHub Webhook receiver
        "/guides/httpserver-go1.21", // Go HTTP Server
        "/guides/grafana", // Grafana
        "/guides/haproxy", // HAProxy
        "/guides/hugo0.122", // Hugo
        "/guides/imaginary", // Imaginary
        "/guides/httpserver-java21", // Java HTTP Server
        "/guides/httpserver-lua5.1", // Lua HTTP Server
        "/guides/mariadb", // MariaDB
        "/guides/memcached1.6", // Memcached
        "/guides/minio", // Minio
        "/guides/mongodb", // MongoDB
        "/guides/httpserver-node21-nextjs", // Next.js HTTP Server
        "/guides/nginx", // Nginx
        "/guides/node24-karaoke", // Node AllKaraoke
        "/guides/httpserver-node25", // Node HTTP Server
        "/guides/node21-websocket", // Node WebSocket Server
        "/guides/novnc-browser", // noVNC
        "/guides/opentelemetry-collector", // OpenTelemetry Collector
        "/guides/httpserver-perl5.42", // Perl HTTP Server
        "/guides/httpserver-php8.2", // PHP HTTP Server
        "/guides/node-playwright-chromium", // Playwright (Chromium) with Node.js
        "/guides/python-playwright-chromium", // Playwright (Chromium) with Python FastAPI
        "/guides/node-playwright-firefox", // Playwright (Firefox) with Node.js
        "/guides/node-playwright-webkit", // Playwright (WebKit) with Node.js
        "/guides/postgres", // PostgreSQL
        "/guides/httpserver-prisma-expressjs4.19-node18", // Prisma HTTP Server
        "/guides/httpserver-node-express-puppeteer", // Puppeteer HTTP Server
        "/guides/httpserver-python3.12", // Python HTTP Server
        "/guides/httpserver-node22-react-router", // React Router HTTP Server
        "/guides/redis7.2", // Redis
        "/guides/httpserver-ruby3.2", // Ruby HTTP Server
        "/guides/ruby3.2-rails", // Ruby on Rails
        "/guides/httpserver-rust1.88-actix-web4", // Rust (Actix Web) HTTP Server
        "/guides/httpserver-rust-trunkrs-leptos", // Rust (Leptos + Trunk) HTTP Server
        "/guides/httpserver-rust1.88-rocket0.5", // Rust (Rocket) HTTP Server
        "/guides/httpserver-rust1.75-tokio", // Rust (Tokio) HTTP Server
        "/guides/httpserver-rust1.91", // Rust HTTP Server
        "/guides/mcp-server-simple", // Simple MCP Server
        "/guides/skipper0.18", // Skipper
        "/guides/httpserver-node21-solid-start", // SolidJS HTTP Server
        "/guides/spin-wagi-http", // Spin
        "/guides/httpserver-java17-springboot3.5.x", // Spring Boot HTTP Server
        "/guides/httpserver-java17-spring-petclinic", // Spring PetClinic
        "/guides/httpserver-c-debug", // SSH and HTTP Server with C and Debugging Tools
        "/guides/httpserver-node22-sveltekit", // SvelteKit HTTP Server
        "/guides/traefik", // Traefik
        "/guides/visual-studio-code-server", // Visual Studio Code Server
        "/guides/httpserver-node-vite-vanilla", // Vite (vanilla)
        "/guides/httpserver-node-vite-ssr-vanilla", // Vite (vanilla) SSR
        "/guides/httpserver-nginx-vite-vanilla", // Vite HTTP Server
        "/guides/vsftpd", // vsftpd
        "/guides/wazero-import-go", // Wazero
        "/guides/node18-wingsio", // Wings.io (Node)
        "/guides/wordpress-all-in-one", // Wordpress
      ]
    },
    {
      type: "category",
      label: "Tutorials",
      icon: "book",
      items: [
        "/tutorials/docker-to-ukc",
        "/tutorials/environment-variables",
        "/tutorials/rootfs-formats",
        "/tutorials/rootfs-compression",
        "/tutorials/rootfs-volumes-roms",
        "/tutorials/scale-to-zero-triggers",
        "/tutorials/instance-metrics",
        "/tutorials/network-communication"
      ]
    },
    {
      type: "category",
      label: "CLI Reference",
      icon: "terminal",
      items: [
        "/cli/overview",
        {
          type: "category",
          label: "Concepts",
          icon: "lightbulb",
          collapsed: false,
          items: [
            "/cli/registries",
            "/cli/filters",
          ],
        },
        {
          type: "category",
          label: "unikraft",
          icon: "terminal",
          collapsed: false,
          items: [
            "/cli/unikraft",
            "/cli/unikraft/login",
            "/cli/unikraft/logout",
            "/cli/unikraft/completion",
            "/cli/unikraft/run",
            "/cli/unikraft/build",
            "/cli/unikraft/tui",
            "/cli/unikraft/upgrade",
            "/cli/unikraft/version",
            {
              type: "category",
              label: "unikraft config",
              icon: "settings",
              collapsed: false,
              items: [
                "/cli/unikraft/config",
                "/cli/unikraft/config/get",
              ],
            },
            {
              type: "category",
              label: "unikraft profile",
              icon: "user-circle",
              collapsed: false,
              items: [
                "/cli/unikraft/profile",
                "/cli/unikraft/profile/get",
                "/cli/unikraft/profile/list",
                "/cli/unikraft/profile/use",
              ],
            },
            {
              type: "category",
              label: "unikraft metros",
              icon: "earth",
              collapsed: false,
              items: [
                "/cli/unikraft/metros",
                "/cli/unikraft/metros/get",
                "/cli/unikraft/metros/list",
              ],
            },
            {
              type: "category",
              label: "unikraft instances",
              icon: "rocket",
              collapsed: false,
              items: [
                "/cli/unikraft/instances",
                "/cli/unikraft/instances/create",
                "/cli/unikraft/instances/delete",
                "/cli/unikraft/instances/edit",
                "/cli/unikraft/instances/get",
                "/cli/unikraft/instances/list",
                "/cli/unikraft/instances/logs",
                "/cli/unikraft/instances/restart",
                "/cli/unikraft/instances/start",
                "/cli/unikraft/instances/stop",
                "/cli/unikraft/instances/wait",
              ],
            },
            {
              type: "category",
              label: "unikraft volumes",
              icon: "cylinder",
              collapsed: false,
              items: [
                "/cli/unikraft/volumes",
                "/cli/unikraft/volumes/clone",
                "/cli/unikraft/volumes/create",
                "/cli/unikraft/volumes/delete",
                "/cli/unikraft/volumes/edit",
                "/cli/unikraft/volumes/get",
                "/cli/unikraft/volumes/list",
                "/cli/unikraft/volumes/wait",
              ],
            },
            {
              type: "category",
              label: "unikraft services",
              icon: "split",
              collapsed: false,
              items: [
                "/cli/unikraft/services",
                "/cli/unikraft/services/create",
                "/cli/unikraft/services/delete",
                "/cli/unikraft/services/edit",
                "/cli/unikraft/services/get",
                "/cli/unikraft/services/list",
                "/cli/unikraft/services/wait",
              ],
            },
            {
              type: "category",
              label: "unikraft certificates",
              icon: "shield-check",
              collapsed: false,
              items: [
                "/cli/unikraft/certificates",
                "/cli/unikraft/certificates/create",
                "/cli/unikraft/certificates/delete",
                "/cli/unikraft/certificates/get",
                "/cli/unikraft/certificates/list",
                "/cli/unikraft/certificates/wait",
              ],
            },
            {
              type: "category",
              label: "unikraft images",
              icon: "package",
              collapsed: false,
              items: [
                "/cli/unikraft/images",
                "/cli/unikraft/images/copy",
                "/cli/unikraft/images/get",
                "/cli/unikraft/images/list",
              ],
            },
          ]
        },
        {
          type: "category",
          label: "kraft cloud",
          icon: "terminal",
          collapsed: false,
          items: [
            "/cli/kraft/overview",
            "/cli/kraft/deploy",
            "/cli/kraft/quota",
            "/cli/kraft/tunnel",
            {
              type: "category",
              label: "kraft cloud cert",
              icon: "shield-check",
              collapsed: false,
              items: [
                "/cli/kraft/cert",
                "/cli/kraft/cert/create",
                "/cli/kraft/cert/get",
                "/cli/kraft/cert/list",
                "/cli/kraft/cert/remove",
              ],
            },
            {
              type: "category",
              label: "kraft cloud compose",
              icon: "book-open",
              collapsed: false,
              items: [
                "/cli/kraft/compose",
                "/cli/kraft/compose/build",
                "/cli/kraft/compose/create",
                "/cli/kraft/compose/down",
                "/cli/kraft/compose/log",
                "/cli/kraft/compose/ls",
                "/cli/kraft/compose/ps",
                "/cli/kraft/compose/push",
                "/cli/kraft/compose/start",
                "/cli/kraft/compose/stop",
                "/cli/kraft/compose/up",
              ],
            },
            {
              type: "category",
              label: "kraft cloud image",
              icon: "package",
              collapsed: false,
              items: [
                "/cli/kraft/image",
                "/cli/kraft/image/list",
                "/cli/kraft/image/remove",
              ],
            },
            {
              type: "category",
              label: "kraft cloud instance",
              icon: "rocket",
              collapsed: false,
              items: [
                "/cli/kraft/instance",
                "/cli/kraft/instance/create",
                "/cli/kraft/instance/get",
                "/cli/kraft/instance/list",
                "/cli/kraft/instance/logs",
                "/cli/kraft/instance/remove",
                "/cli/kraft/instance/start",
                "/cli/kraft/instance/stop",
              ],
            },
            {
              type: "category",
              label: "kraft cloud metro",
              icon: "earth",
              collapsed: false,
              items: [
                "/cli/kraft/metro",
                "/cli/kraft/metro/list",
              ],
            },
            {
              type: "category",
              label: "kraft cloud scale",
              icon: "arrow-up-1-0",
              collapsed: false,
              items: [
                "/cli/kraft/scale",
                "/cli/kraft/scale/add",
                "/cli/kraft/scale/get",
                "/cli/kraft/scale/init",
                "/cli/kraft/scale/remove",
                "/cli/kraft/scale/reset",
              ],
            },
            {
              type: "category",
              label: "kraft cloud service",
              icon: "split",
              collapsed: false,
              items: [
                "/cli/kraft/service",
                "/cli/kraft/service/create",
                "/cli/kraft/service/get",
                "/cli/kraft/service/list",
                "/cli/kraft/service/remove",
              ],
            },
            {
              type: "category",
              label: "kraft cloud volume",
              icon: "cylinder",
              collapsed: false,
              items: [
                "/cli/kraft/volume",
                "/cli/kraft/volume/attach",
                "/cli/kraft/volume/create",
                "/cli/kraft/volume/detach",
                "/cli/kraft/volume/get",
                "/cli/kraft/volume/import",
                "/cli/kraft/volume/list",
                "/cli/kraft/volume/remove",
              ],
            },
          ]
        },
      ],
    } as any,
    {
      type: "category",
      label: "Kraftfile",
      icon: "file-text",
      items: [
        "/kraftfile/v0.7",
        {
          type: "link",
          label: "Kraftfile Reference (v0.6)",
          to: "https://unikraft.org/docs/cli/reference/kraftfile/v0.6",
        },
        {
          type: "link",
          label: "Kraftfile Reference (v0.5)",
          to: "https://unikraft.org/docs/cli/reference/kraftfile/v0.5",
        },
      ],
    } as any,
    {
      type: "link",
      label: "Platform API",
      icon: "unplug",
      to: "/api/platform/v1",
    },
  ],
  search: {
    type: "pagefind",
  },
  redirects: [
    { from: "/", to: "/introduction" },
    { from: "/cli", to: "/cli/overview" },
    { from: "/kraftfile", to: "/kraftfile/v0.7" },
    { from: "/guides", to: "/guides/overview" },
  ],
  apis: [
    {
      type: "file",
      input: "./apis/platform.yaml",
      path: "/api/platform/v1",
    },
  ],
  theme: {
    fonts: {
      sans: {
        fontFamily: "Inter, sans-serif",
        url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
      },
      mono: {
        fontFamily: "IBM Plex Mono, monospace",
        url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap",
      },
    },
    light: {
      background: "#ffffff", // Main background color
      foreground: "#020817", // Main text color
      card: "#ffffff", // Card background color
      cardForeground: "#020817", // Card text color
      popover: "#ffffff", // Popover background color
      popoverForeground: "#020817", // Popover text color
      primary: "#2563eb", // Primary action color
      primaryForeground: "#ffffff", // Text color on primary backgrounds
      secondary: "#f1f5f9", // Secondary action color
      secondaryForeground: "#020817", // Text color on secondary backgrounds
      muted: "#f1f5f9", // Muted/subtle background color
      mutedForeground: "#64748b", // Text color for muted elements
      accent: "#f1f5f9", // Accent color for highlights
      accentForeground: "#020817", // Text color on accent backgrounds
      destructive: "#ef4444", // Color for destructive actions
      destructiveForeground: "#ffffff", // Text color on destructive backgrounds
      border: "#cbd5e1", // Border color
      input: "#e2e8f0", // Input field border color
      ring: "#0284c7", // Focus ring color
      radius: "0.4rem", // Border radius value
    },
    dark: {
      background: "#000000", // Main background color
      foreground: "#dbeafe", // Main text color
      card: "#000000", // Card background color
      cardForeground: "#dbeafe", // Card text color
      popover: "hsl(20 14.3% 4.1%)", // Popover background color
      popoverForeground: "hsl(60 9.1% 97.8%)", // Popover text color
      primary: "#2563eb", // Primary action color
      primaryForeground: "#ffffff", // Text color on primary backgrounds
      secondary: "var(--color-slate-800)", // Secondary action color
      secondaryForeground: "hsl(60 9.1% 97.8%)", // Text color on secondary backgrounds
      muted: "var(--color-slate-900)", // Muted/subtle background color
      mutedForeground: "var(--color-slate-600)", // Text color for muted elements
      accent: "var(--color-slate-800)", // Accent color for highlights
      accentForeground: "hsl(60 9.1% 97.8%)", // Text color on accent backgrounds
      destructive: "var(--color-rose-800)", // Color for destructive actions
      destructiveForeground: "hsl(60 9.1% 97.8%)", // Text color on destructive backgrounds
      border: "#1e293b", // Border color
      input: "#334155", // Input field border color
      ring: "var(--color-amber-500)", // Focus ring color
      radius: "0.4rem", // Border radius value
    },
  },
};

export default config;
