# Contributing to Pullbureau

Use fictional organizations, people, repositories and PRs in examples and tests. Never submit credentials, environment files, live recordings, private URLs or organization data.

1. Install the pinned pnpm version and run `pnpm install --frozen-lockfile`.
2. Start `pnpm demo` for a credential-free local scene.
3. Keep changes focused. Use English for code, comments and primary documentation; update the Portuguese README when user-facing setup changes.
4. Keep pure domain rules in `src/domain` and shared contracts in `src/types`. Read `AGENTS.md` and `GLOSSARY.md`.
5. Run `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test`, `pnpm build` and `pnpm e2e`. Install Chromium with `pnpm exec playwright install chromium` first.
6. Explain the problem, resulting behavior and verification in your pull request. Include a fictional-data screenshot for visible changes when useful.

New assets need a verifiable source and redistribution license. Update `public/CREDITS.md` and retain required notices. Asset imports require an explicit source directory; generated assets and manifests should be reviewed together. Check dependency license changes with `pnpm licenses list --json` and refresh `docs/licenses`.

Report security issues privately using `SECURITY.md`. All participants follow `CODE_OF_CONDUCT.md`.
