# Pullbureau preparation report

Prepared on 2026-10-23. The source checkout was left unchanged. This repository was created from a file-tree copy without the previous Git history, local environment files, recordings, build output or installed dependencies. Dependencies were installed independently. No remote repository, push, deployment, credential rotation or organization-account operation was performed.

## Changes

- Replaced organization defaults, real demo identities, internal repository examples and private documentation with fictional data and public documentation. Regenerated the replay and generated local initial-based demo avatars instead of loading real profile pictures. Audited binary asset contents and validated all 127 GLB containers.
- Added deployment-wide English/Brazilian Portuguese dictionaries for UI, domain text, 3D text and speech; locale-aware number/date formatting; configurable UTC-based timezone, business hours, display name and readiness label. Corrected business-hour calculations across working-day daylight-saving transitions.
- Preserved organization-members-only live access. Live startup validates all five required settings. Inspector login is optional. Auth bypass requires nonproduction and a loopback request host and remains blocked on deployment hosts. Credential-free demo mode always selects fictional replay and denies live data endpoints, including in production.
- Renamed branded duel terminology to neutral duel/finisher outcomes. Sounds are procedural; no audio recordings are shipped.
- Added bilingual setup/deployment documentation, MIT, community/security files, issue/PR templates, CI, Dependabot, portable asset imports, font notices and dependency-license reports. Removed the inherited favicon because its source was unverified. Package publication remains disabled.

## Verification output

The following snippets are from local verification runs; local filesystem prefixes are omitted. E2E uses Chromium's software renderer and fictional data, without live credentials.

```text
$ pnpm lint
$ eslint
exit 0, no findings

$ pnpm tsc --noEmit
exit 0

$ pnpm test
Test Files  78 passed (78)
     Tests  486 passed (486)
```

```text
$ DEMO_MODE=1 pnpm build
✓ Compiled successfully
✓ Generating static pages using 9 workers (6/6)
exit 0

$ LOCALE=en pnpm e2e
6 passed (2.8m)

$ LOCALE=pt-BR pnpm e2e
6 passed (3.2m)

$ gitleaks dir <publication-tree> --redact
INF no leaks found

Private organization/person/demo identifiers: 0 matches
Valid GLB containers: 127
```

Both language runs covered the main scene, duel, inspector visit, introduction, keyboard scene event, fictional-data isolation and screenshot capture. Six screenshots were visually inspected. The access-denied character was re-framed and re-captured after that visual check.

The compiled production demo was also started locally and checked without credentials:

```text
/ 200
/api/replay/demo 200
/api/state 401
/api/pr/api/1 401
/api/replay/private 401
/hdri/kloofendal_43d_clear_puresky_1k.hdr 200
```

The final commit count, commit ID and clean-status output are recorded in the delivery report after committing.

## Decisions and limits

Used the dictionary pattern supported by the bundled Next.js 16 documentation, with no new localization dependency or route prefixes. Locale changes require a rebuild; the optional cookie switch was omitted. Existing route and diagnostic URL paths were retained. The copy is inside the current writable workspace rather than its parent directory. A readiness label determines queue eligibility independently of GitHub's draft state.

The privacy audit excludes installed/generated trees and Git internals, and scans all publication files including binary contents. One required React runtime dependency naturally overlaps an audit term; its package metadata was preserved in the lockfile and license inventories. No private organization, colleague or demo-repository identifiers were found in publication content. Raw byte matching of the short three-letter audit token also hits compressed screenshot payloads; these are incidental binary sequences, not PNG text metadata or visible content. Screenshots were visually reviewed.

Dependency licensing is not uniformly permissive: native libvips uses LGPL, and some tooling uses MPL; attribution/font licenses also apply. See [the full audit](licenses/README.md). The software still emits an upstream Three.js clock deprecation warning and a Vite configuration-loader advisory; neither failed verification.

Live GitHub integration was tested with mocked transport, not real credentials. CI was authored and its commands run locally; no GitHub-hosted run occurred. Organization approval to publish, credential rotation, remote creation, push and deployment remain with the owner.

Run locally with `pnpm demo`. Screenshots are in `public/screenshots/` for the main scene, sign-in and access-denied pages in both languages.
