# Pullbureau Open Source Implementation Plan

**Goal:** Prepare a fictional-data, bilingual, self-hosted GitHub organization queue visualization with a single initial commit.

**Architecture:** Keep App Router routes and organization membership authorization. Use deployment-wide typed dictionaries (en and pt-BR), shared by UI and pure domain functions. Public presentation configuration is injected at build time; credentials remain server-only. Demo mode serves only fictional replay data and never live organization data.

**Constraints:** Original checkout is read-only. No original history, environment files, recordings, private data, remote creation or push. MIT, copyright Felipe Ferrarini 2026. Package stays private. Only one final commit.

- [x] 1. Sanitize copied source, fixtures, internal documents, identifiers and binary metadata. Rename branded duel references. Regenerate demo. Verify lint, types and unit tests.
- [x] 2. Add validated organization/auth configuration, optional inspector, configurable label, timezone and business hours. Restrict auth bypass to local nonproduction; isolate credential-free demo. Test missing configuration and production/host bypass denial.
- [x] 3. Extract visible UI, domain and scene messages to en/pt-BR dictionaries. Update locale-dependent Intl formatting and speech. Test locale selection, dictionary parity and formatting in both languages.
- [x] 4. Write bilingual setup documentation, community files, asset/license inventory, CI and dependency updates. Check environment table against actual use.
- [x] 5. Run all verification, scan text and binary assets and secrets, capture six screenshots, review changes and fix findings. Save outputs in release report. Initialize independent repository and create exactly one commit with clean status.

**Review focus:** Demo cannot expose live APIs; production cannot enable auth bypass; optional inspector must not create an empty-name actor; server and browser must use the same locale/timezone; asset metadata and screenshots must contain no private identities.
