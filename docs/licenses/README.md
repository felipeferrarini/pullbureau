# Dependency and asset license audit

Audit date: 2026-10-23. Application code uses MIT; upstream dependencies and assets keep their own licenses.

## Reproduction and inventory scope

```sh
pnpm install --frozen-lockfile
pnpm licenses list --json > docs/licenses/dependencies.json
```

The checked-in `dependencies.json` contains the successful output from `pnpm licenses list --json`, with local installation paths omitted. The command required read access to the pnpm store metadata. No credentials were used.

`installed-package-metadata.json` is a fallback inventory of 559 unique installed package/version pairs, read from package manifests. It contains names, versions and declared licenses only; it omits local paths and package authors. It reflects this machine's installed optional dependencies, so another platform can add different native packages. Missing or combined license fields require reviewing the package's bundled notices.

## Licenses requiring explicit attention

| Package | Declared license | Review point |
| --- | --- | --- |
| `@img/sharp-libvips-darwin-arm64@1.3.4` | LGPL-3.0-or-later | Native libvips distribution includes LGPL obligations; inspect applicable notices and source/relinking requirements when redistributing runtime binaries. Other platform variants must be checked too. |
| `lightningcss@1.33.0`, `lightningcss-darwin-arm64@1.33.0` | MPL-2.0 | File-level copyleft; preserve notices and review source obligations for distributed modifications. |
| `axe-core@4.14.0` | MPL-2.0 | Test tooling with file-level copyleft; retain notices when redistributing. |
| `caniuse-lite` | CC-BY-4.0 | Attribution conditions apply to its compatibility data. |
| `@fontsource/inter` and `public/fonts/inter-700.woff` | OFL-1.1 | Font license applies independently of MIT; retained notice in `public/fonts/OFL.txt`. |
| `webgl-constants@1.1.1` | Manifest missing license | Bundled `LICENSE` was inspected and identifies MIT; metadata inventory intentionally preserves the missing manifest field as `UNKNOWN`. |

The inventory also includes permissive licenses beyond MIT: Apache-2.0, ISC, BSD variants, Python-2.0, BlueOak-1.0.0 and Zlib. Preserve upstream notices as required. This is a factual inventory, not a claim that every dependency is permissively licensed or that an exhaustive legal review has occurred.

## Public asset inventory

The public asset tree contains 52 character GLBs, 75 prop GLBs, two HDRIs and one Inter WOFF (plus documentation/license notices). [Asset credits](../../public/CREDITS.md) map model packs and HDRIs to CC0 upstream pages and identify the font's OFL-1.1 terms. Source declarations were checked on the audit date; original archive hashes are unavailable. Import recipes identify the expected source layout.

No audio files were found. The application creates Web Audio sounds procedurally and uses browser speech synthesis. No unverified audio needed removal. The inherited favicon had no established provenance and was removed.
