# Pullbureau

A playful 3D office for your GitHub organization's pull request queue. Repositories become service counters, pull requests become numbered tickets, and reviewers bring the room to life. Built with Next.js, React Three Fiber, Three.js, Auth.js and Zustand.

![Pullbureau demo scene](public/screenshots/en-scene.png)

[Português brasileiro](README.pt-BR.md) · [Contributing](CONTRIBUTING.md) · [Vocabulary](GLOSSARY.md)

## Try the fictional demo

Requires Node.js 22 or newer and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm demo
```

Open [localhost:3000](http://localhost:3000). Demo mode uses generated fictional data and needs no GitHub credentials. WebGL is required; a current desktop browser works best. Sound starts after browser interaction.

## Connect an organization

Copy `.env.example` to `.env.local` and configure your own values. Keep credentials server-side and out of Git.

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Server token for GitHub GraphQL and REST reads |
| `GITHUB_ORG` | Organization to display and use for membership checks |
| `AUTH_SECRET` | Random session signing secret; generate with `openssl rand -base64 32` |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth App credentials |
| `AUTH_URL` | Application origin, for example `http://localhost:3000` |
| `AUTH_TRUST_HOST` | Set `true` only when your deployment's host headers are trusted |
| `LOCALE` | `en` (default) or `pt-BR` |
| `TIME_ZONE` | IANA time zone; default `UTC` |
| `BUSINESS_START_HOUR`, `BUSINESS_END_HOUR` | Local business hours; defaults `9`, `18` |
| `READY_LABEL` | Label marking a queued PR as ready; default `ready-for-review` |
| `ORG_DISPLAY_NAME` | Display name; falls back to `GITHUB_ORG` |
| `CTO_LOGIN` | Optional login for the special inspection character |
| `IGNORED_LOGINS` | Comma-separated bots ignored in activity |
| `EXCLUDED_LOGINS` | Comma-separated people hidden from the board |
| `CHARACTER_OVERRIDES` | JSON mapping of logins to model IDs |
| `E2E_BYPASS_AUTH` | Test-only `1`; requires nonproduction and a loopback request host; denied on known deployment hosts |
| `ASSET_DIR` | Import-script source directory; alternatively pass a directory argument |
| `DEMO_MODE` | `1` selects fictional demo data; omit for live operation |

Create a GitHub OAuth App with homepage `http://localhost:3000` and callback `http://localhost:3000/api/auth/callback/github`. Use your deployment origin for both in production. Login requests `read:user`; the server independently checks organization membership with `GITHUB_TOKEN` before allowing access.

For a classic personal access token, use `read:org` and `repo` when reading private repositories. Authorize organization SSO if required. `repo` also covers private workflow-run reads. Fine-grained tokens must target the organization and selected repositories, with organization **Members: read** and repository **Pull requests: read**, **Contents: read**, **Actions: read** and metadata access. CI completion timestamps come from the REST Actions API rather than the Check Runs API, which is unavailable with the fine-grained permission set used here. Organization policy may require approval. Check GraphQL access against the repositories you intend to display; GitHub's supported token permissions vary by endpoint. See GitHub's [membership API](https://docs.github.com/en/rest/orgs/members#check-organization-membership-for-a-user), [workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository), and [GraphQL authentication](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql).

```sh
pnpm dev
# Production, with live credentials configured:
pnpm build
pnpm start
```

## Deploy your own instance

This is one organization's private dashboard per deployment. The live site requires login by a member of `GITHUB_ORG`; publishing the source does not make live organization data public.

For Vercel, import your own repository and use the Next.js preset. Configure the five required live variables, `AUTH_URL` with the production HTTPS origin, and presentation settings before building. Register that origin's `/api/auth/callback/github` URL in the OAuth App. If your reverse proxy supplies trusted host headers, configure `AUTH_TRUST_HOST=true`. Keep `E2E_BYPASS_AUTH` unset.

For a generic Node host, install dependencies, configure the same environment, run `pnpm build`, then `pnpm start --hostname 0.0.0.0`. Put an HTTPS reverse proxy in front of the process. The deployment must include `public/` and the bundled demo fixture if replay is used. No AWS credentials or services are needed.

`LOCALE`, `TIME_ZONE`, business hours, `READY_LABEL`, display name and `DEMO_MODE` are public build-time settings shared with the browser. Rebuild when changing them. Credentials remain server-only. To deploy only the fictional demo, set `DEMO_MODE=1` during both build and startup, without live credentials; live data endpoints remain denied.

## Controls and diagnostic URLs

Select a person or counter to inspect activity; use the HUD for scene controls. The UI offers English and Brazilian Portuguese through `LOCALE`.

| Query | Effect |
| --- | --- |
| `?replay=demo` | Play the bundled fictional replay |
| `?replay=demo&speed=2` | Adjust replay speed |
| `?hora=10:00` | Override the scene clock in the configured time zone |
| `?fx=low` / `normal` / `high` | Choose rendering quality |
| `?finisher=approved` / `closed` / `tbc` | Simulate a duel outcome using a recorded PR thread |
| `?fiscalizacao=1` | Trigger the optional inspector early |
| `?shot=1` | Preserve the drawing buffer for screenshot tools |
| `?intro=0` | Skip the initial camera walk-in |
| `?egg=caramelo,sexta` | Trigger named scene events; supported names: `caramelo`, `furafila`, `aniversario`, `sexta`, `baile`, `cafe` |
| `?variant=A` / `B` / `C` | Development filter prototypes |
| `?q=example` | Text query for filter prototype C |

Prototype facet keys are `author`, `reviewer`, `repo`, `age`, `ci`, and `status`; repeat a key to select multiple values. Prototype switching and browser debug hooks are development tools. Authentication bypass is restricted to local development tests and must never grant access in production.

## Development

```sh
pnpm lint
pnpm tsc --noEmit
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

CI runs these checks with fictional demo data and no real credentials. E2E starts a credential-free demo development server. Production bypass denial is covered by unit tests. Replay recordings from a live organization can contain private data; do not commit them. Keep generated demo fixtures fictional.

Code lives in `src/domain` (pure queue and event rules), `src/github` (API integration), `src/server` (access and caching), `src/client` (live/replay feeds), and `src/scene` (3D presentation). Shared contracts live in `src/types`.

## License and assets

Application code is [MIT licensed](LICENSE), copyright 2026 Felipe Ferrarini. The package remains private to prevent accidental npm publication. Third-party models and HDRIs are CC0; Inter is OFL-1.1. See [asset credits and import instructions](public/CREDITS.md) and the [dependency license audit](docs/licenses/README.md). Procedural sound is generated in the browser; no third-party audio recordings are shipped.

Non-draft PRs carrying `READY_LABEL` enter a counter queue; drafts and PRs without that label stay in the waiting room. The default label is `ready-for-review`.
