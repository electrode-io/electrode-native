# ERN Platform — CVE Remediation Summary

## Overview

Remediates **14 unique CVEs** identified in the ERN Platform Vulnerability Assessment across 8 ERN packages (v0.53.7). The platform is sunsetting in ~1 year, so only targeted security patches are applied — no feature changes.

Each vulnerable package was evaluated against the **6-tier Fix Classification Decision Tree**, starting at Priority 1 (most preferred) and escalating only when higher-priority fixes were not viable.

### Two-Phase Approach

- **Phase 1 (Workspace):** Yarn resolutions + direct upgrades to fix CVEs in the monorepo development environment.
- **Phase 2 (Published Packages):** Forks, replacements, and version bumps to ensure CVEs are also resolved when packages are published to npm — since yarn resolutions do NOT travel with published packages.

---

## Per-Package Decision Tree Analysis

### 1. `semver` — ReDoS Vulnerability

**Dependency chain:** Direct dependency in 11 ERN packages

| Priority | Strategy | Viable? | Rationale |
|----------|----------|---------|-----------|
| **P1** | Direct dep upgrade, no code change | **Yes** | `semver` is a direct dependency. Bumping `^7.3.5` → `^7.5.2` is a semver-compatible minor/patch upgrade. No API changes — drop-in replacement. |

**Fix applied:**
- Updated `semver` from `^7.3.5` → `^7.5.2` across **all 11 packages** that depend on it: `ern-core`, `ern-api-gen`, `ern-api-impl-gen`, `ern-cauldron-api`, `ern-composite-gen`, `ern-container-gen`, `ern-container-gen-android`, `ern-container-gen-ios`, `ern-local-cli`, `ern-orchestrator`, `ern-runner-gen-ios`
- Added `"semver": "^7.5.2"` to root `resolutions` to cover any transitive instances.
- **Travels with published packages:** ✅ Yes — direct dependency change.

---

### 2. `@octokit/rest` — Multiple CVEs in v18 Transitive Dependency Tree

**Dependency chain:** `ern-core` → `@octokit/rest@18.5.3` (direct), `ern-orchestrator` → `@octokit/rest@18.5.3` (direct)

| Priority | Strategy | Viable? | Rationale |
|----------|----------|---------|-----------|
| P1 | Direct dep upgrade, no code change | **No** | No patched version exists within v18.x. Upgrade requires major version jump (v18 → v20), which introduces breaking TypeScript types and API changes. |
| **P2** | Direct dep upgrade, with code change | **Yes** | Upgraded to `^20.1.1` and adapted `GitHubApi.ts` to handle Octokit v20 breaking changes. |

**Fix applied:**
- `ern-core/package.json` — `"@octokit/rest": "18.5.3"` → `"@octokit/rest": "^20.1.1"`
- `ern-orchestrator/package.json` — `"@octokit/rest": "18.5.3"` → `"@octokit/rest": "^20.1.1"`
- `ern-core/src/GitHubApi.ts` — Two categories of code changes:
  - **`Buffer.from()` encoding** — Adapted content encoding to match Octokit v20's API contract
  - **`: Promise<any>` return type annotations** — Added explicit return types on `createBranch`, `deleteBranch`, `createTag`, `deleteTag`, and `updateFileContent` to resolve TypeScript compilation errors caused by Octokit v20's overhauled type definitions
- **Travels with published packages:** ✅ Yes — direct dependency change.

---

### 3. `plist` / `xmldom` — XML Parsing Vulnerabilities (CVE-2021-37712, CVE-2022-39353)

**Dependency chain:** `ern-core` → `xcode-ern` → `simple-plist` → `plist` → `xmldom`

| Priority | Strategy | Viable? | Rationale |
|----------|----------|---------|-----------|
| P1–P4 | Direct/parent upgrade | **No** | `xcode-ern` is **abandoned** — no newer version exists. |
| **P5** | Fork and replace | **Yes** | Forked `xcode-ern` as [`ern-xcode`](https://www.npmjs.com/package/ern-xcode). Updated `simple-plist` from `^0.2.1` → `^1.3.1` which includes patched `plist`/`xmldom`. Also removed `uuid` dependency entirely (replaced with Node.js built-in `crypto.randomUUID()`), fixing CVE-2024-6096. |

**Fix applied (Phase 2 — Published Package Fix):**
- Published [`ern-xcode@1.0.14`](https://www.npmjs.com/package/ern-xcode) with updated deps
- Updated 4 packages to use `ern-xcode` instead of `xcode-ern`:
  - `ern-core/package.json` — `"xcode-ern": "^1.0.13"` → `"ern-xcode": "^1.0.14"`
  - `ern-api-impl-gen/package.json` — same
  - `ern-container-gen/package.json` — same
  - `ern-container-gen-ios/package.json` — same
- Updated all TypeScript imports (`import xcode from 'xcode-ern'` → `import xcode from 'ern-xcode'`)
- Updated all `typings/modules.d.ts` declarations
- **Travels with published packages:** ✅ Yes — source dependency replaced.
- **CVEs fixed:** xmldom (CVE-2021-37712, CVE-2022-39353), uuid (CVE-2024-6096)

---

### 4. `bugsnag-sourcemaps` → `@bugsnag/source-maps` — deep-extend & trim-newlines CVEs

**Dependency chain:** `ern-core` → `bugsnag-sourcemaps` → `deep-extend`, `trim-newlines`

| Priority | Strategy | Viable? | Rationale |
|----------|----------|---------|-----------|
| P1–P4 | Direct/parent upgrade | **No** | `bugsnag-sourcemaps` is **deprecated** — no newer version. |
| **P5** | Replace with maintained alternative | **Yes** | Official replacement `@bugsnag/source-maps` exists with proper TypeScript types and no vulnerable transitive deps. |

**Fix applied (Phase 2 — Published Package Fix):**
- `ern-core/package.json` — `"bugsnag-sourcemaps": "^1.3.0"` → `"@bugsnag/source-maps": "^2.3.3"`
- `ern-core/src/bugsnagUpload.ts` — Rewrote to use `@bugsnag/source-maps` API (`reactNative.uploadOne()`)
- Fixed proxy agent type mismatch caught by new TypeScript types (pre-existing bug exposed by proper type definitions)
- **Travels with published packages:** ✅ Yes — source dependency replaced.
- **CVEs fixed:** deep-extend (CVE-2018-3750), trim-newlines (CVE-2021-33623)

---

### 5. `code-push` — @tootallnate/once & ip CVEs

**Dependency chain:** `ern-core` → `code-push@4.0.5` → `superagent-proxy` → `proxy-agent@5` → `pac-proxy-agent` → `@tootallnate/once`, `pac-resolver` → `ip`

| Priority | Strategy | Viable? | Rationale |
|----------|----------|---------|-----------|
| **P3** | Upgrade parent, no code change | **Yes** | `code-push@4.2.3` (latest) removed `superagent-proxy` entirely and replaced it with `proxy-agent@^6.3.0` as a direct dependency. API is fully backward compatible — same constructor signature and methods. |

**Fix applied (Phase 2 — Published Package Fix):**
- `ern-core/package.json` — `"code-push": "4.0.5"` → `"code-push": "4.2.3"`
- No code changes required — API is backward compatible.
- **Travels with published packages:** ✅ Yes — direct dependency version bump.
- **CVEs fixed:** @tootallnate/once, ip (CVE-2024-29415)

---

### 6. `sway` → `ern-sway` — validator & deep-extend CVEs

**Dependency chain:**
- `ern-api-gen` → `sway@1.0.0` → `z-schema@^3.16.1` → `validator@^10.0.0` (vulnerable to 3 CVEs)
- `ern-api-gen` → `sway@1.0.0` → `json-schema-faker@^0.2.8` → `deref` → `deep-extend` (CVE)

| Priority | Strategy | Viable? | Rationale |
|----------|----------|---------|-----------|
| P1–P4 | Direct/parent upgrade | **No** | `sway@1.0.0` uses `z-schema@^3.x` which pins `validator@^10.0.0` (forever vulnerable). Even `sway@2.0.6` still uses `z-schema@^3.22.0`. |
| **P5** | Fork and replace | **Yes** | Forked `sway@2.0.6` as [`ern-sway`](https://www.npmjs.com/package/ern-sway). Updated `z-schema` from `^3.22.0` → `^5.0.6` (which uses `validator@^13.7.0` → resolves to 13.15.35, fixing all 3 validator CVEs). Also benefits from `json-schema-faker@^0.5.0` which dropped the `deref`/`deep-extend` chain. |

**Fix applied (Phase 2 — Published Package Fix):**
- Published [`ern-sway@2.0.8`](https://www.npmjs.com/package/ern-sway) with `z-schema@^5.0.6`
- `ern-api-gen/package.json` — `"sway": "^1.0.0"` → `"ern-sway": "^2.0.7"`
- `ern-api-gen/src/java/Swagger.ts` — Updated all 5 imports from `sway` → `ern-sway`
- Updated `index.d.ts` in fork: `declare module 'sway'` → `declare module 'ern-sway'`
- **Travels with published packages:** ✅ Yes — source dependency replaced.
- **CVEs fixed:** validator (CVE-2021-3765, CVE-2025-56200, CVE-2025-12758), deep-extend (CVE-2018-3750)

---

## Summary of Fix Distribution

| Fix Tier | Count | Packages | Travels with Published? |
|----------|-------|----------|------------------------|
| **P1** — Direct upgrade, no code | 1 | `semver` (11 packages) | ✅ Yes |
| **P2** — Direct upgrade, with code | 1 | `@octokit/rest` (2 packages + 1 source file) | ✅ Yes |
| **P3** — Parent upgrade, no code | 1 | `code-push` (version bump 4.0.5 → 4.2.3) | ✅ Yes |
| **P5** — Fork and replace | 3 | `xcode-ern` → `ern-xcode`, `bugsnag-sourcemaps` → `@bugsnag/source-maps`, `sway` → `ern-sway` | ✅ Yes |

### Phase 1 → Phase 2 Evolution

In Phase 1, 7 of 9 fixes relied on **P6 Yarn Resolutions** — the quickest fix for the workspace but ineffective for published packages. Phase 2 replaced all P6 resolutions with proper P1–P5 fixes by forking abandoned packages, replacing deprecated packages with maintained alternatives, and upgrading where newer versions existed. **All 14 CVEs are now resolved in both the workspace AND published packages.**

---

## Files Changed

### Phase 1 (Workspace Fixes)
| File | Change |
|------|--------|
| `package.json` (root) | Added `resolutions` block with transitive dependency overrides |
| `ern-core/src/GitHubApi.ts` | `Buffer.from()` updates + `: Promise<any>` return type annotations |
| `yarn.lock` | Regenerated against public registry (`registry.yarnpkg.com`) |

### Phase 2 (Published Package Fixes)
| File | Change |
|------|--------|
| `ern-core/package.json` | `xcode-ern` → `ern-xcode@^1.0.14`, `bugsnag-sourcemaps` → `@bugsnag/source-maps@^2.3.3`, `code-push` 4.0.5 → 4.2.3, `@octokit/rest` → `^20.1.1`, `semver` → `^7.5.2` |
| `ern-core/src/bugsnagUpload.ts` | Rewritten for `@bugsnag/source-maps` API |
| `ern-core/src/iosUtil.ts` | Import updated to `ern-xcode` |
| `ern-core/typings/modules.d.ts` | `declare module 'ern-xcode'` |
| `ern-api-gen/package.json` | `sway` → `ern-sway@^2.0.7`, `semver` → `^7.5.2` |
| `ern-api-gen/src/java/Swagger.ts` | All imports updated to `ern-sway` |
| `ern-api-impl-gen/package.json` | `xcode-ern` → `ern-xcode@^1.0.14`, `semver` → `^7.5.2` |
| `ern-api-impl-gen/src/.../ApiImplIosGenerator.ts` | Import updated to `ern-xcode` |
| `ern-api-impl-gen/typings/modules.d.ts` | `declare module 'ern-xcode'` |
| `ern-container-gen/package.json` | `xcode-ern` → `ern-xcode@^1.0.14`, `semver` → `^7.5.2` |
| `ern-container-gen-ios/package.json` | `xcode-ern` → `ern-xcode@^1.0.14`, `semver` → `^7.5.2` |
| `ern-container-gen-ios/src/IosGenerator.ts` | Import updated to `ern-xcode` |
| `ern-container-gen-ios/typings/modules.d.ts` | `declare module 'ern-xcode'` |
| `ern-orchestrator/package.json` | `@octokit/rest` → `^20.1.1`, `semver` → `^7.5.2` |
| `ern-cauldron-api/package.json` | `semver` → `^7.5.2` |
| `ern-composite-gen/package.json` | `semver` → `^7.5.2` |
| `ern-container-gen-android/package.json` | `semver` → `^7.5.2` |
| `ern-local-cli/package.json` | `semver` → `^7.5.2` |
| `ern-runner-gen-ios/package.json` | `semver` → `^7.5.2` |
| `typings/modules.d.ts` (root) | `declare module 'ern-xcode'` |

### External Forks Published to npm
| Package | Description | Key Changes |
|---------|-------------|-------------|
| [`ern-xcode@1.0.14`](https://www.npmjs.com/package/ern-xcode) | Fork of abandoned `xcode-ern` | `simple-plist` → `^1.3.1`, removed `uuid` (uses `crypto.randomUUID()`) |
| [`ern-sway@2.0.8`](https://www.npmjs.com/package/ern-sway) | Fork of unmaintained `sway` | Based on v2.0.6, `z-schema` → `^5.0.6`, `json-schema-faker` → `^0.5.0` |

## Validation

- [x] `yarn install` completes successfully
- [x] `yarn build` passes across all 15 packages
- [x] Full test suite passes (`yarn test:unit`)
- [x] All 14 original CVEs resolved in workspace
- [x] All 14 original CVEs resolved in published packages (no reliance on yarn resolutions)
- [x] `yarn.lock` uses only public registry (`registry.yarnpkg.com`)
