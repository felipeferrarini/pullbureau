# Development

Use English for code, comments and primary documentation. Keep shared types in src/types. Read the applicable guide in node_modules/next/dist/docs before changing routing, localization or Next.js configuration.

Run pnpm lint, pnpm tsc --noEmit and pnpm test after each implementation stage. Tests must use fictional data and no real tokens. Never commit environment files, recordings or secrets.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
