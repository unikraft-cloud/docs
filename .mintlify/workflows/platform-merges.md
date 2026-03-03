---
name: "platform merges"
on:
  push:
    - repo: "unikraft-cloud/platform"
context:
  - repo: "unikraft-cloud/docs"
  - repo: "unikraft-cloud/agent"
  - repo: "unikraft-cloud/docs-internal"
---

# Instructions for platform merges

Review PRs merged to the 'unikraft-cloud/platform' repository since the last feature update component was added.

Update an existing file or write a new file to "pages/features" or "pages/platform" based on what shipped. The feature update is about changes to the product, not changes to the docs.

- Do not include any internal-only information.
- Only include updates that affect end users.
- Include a description of the change and what it means for users.
- If you're ever unsure about the structure, review recent docs feature updates and follow that style and format.
- Follow the communication style of files in 'pages/features'.
