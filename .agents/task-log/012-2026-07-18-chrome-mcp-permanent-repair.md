# Task 012 — Permanent Chrome MCP repair and Graphify retirement

- **Started:** 2026-07-18 21:30:50 IST
- **Cadence:** Task 2 of 3
- **Starting branch:** `main`
- **Starting commit:** `83708e79895af377750b173d10932f79eb128fc0`
- **Goal:** Permanently repair the repeatedly failing Chrome DevTools MCP startup/connection path, verify real MCP browser control from a fresh process, and prevent future Odyssey/Codex work from invoking Graphify.
- **Expected verification:** Reproduce the current MCP error; inspect package/config/binary state; validate managed Chrome launch with list-pages, navigation, snapshot, screenshot, console/network inspection, and clean shutdown; verify Graphify is no longer discoverable; run focused repo checks; commit, push, and remotely verify Odyssey-owned changes.
- **Scope boundary:** Machine-level Codex MCP/skill configuration plus Odyssey instructions and this task log. Preserve historical task logs and do not alter application runtime behavior.

## Root cause

- Codex registered `chrome-devtools-mcp` correctly, but configured it only with `--browserUrl=http://127.0.0.1:9223`.
- No persistent launcher owned port `9223`, so `list_pages` failed while fetching `/json/version` before any browser action could run.
- Earlier self-launch configuration had been replaced by this manual attachment path, turning every new session into a dependency on invisible external process state.
- The installed MCP package was also stale (`0.17.0`; current registry version at repair time: `1.6.0`).

## Machine-level repair

- Upgraded `/home/aru/.codex/mcp-local` to `chrome-devtools-mcp@1.6.0`.
- Replaced the external-port attachment in `/home/aru/.codex/config.toml` with MCP-managed Chrome launch using:
  - isolated temporary browser profiles;
  - headless mode, independent of X11/React Native DevTools;
  - the verified local Chrome binary;
  - container-safe no-sandbox, shared-memory, and GPU flags;
  - a 45-second startup allowance;
  - durable MCP logging;
  - bounded WebP screenshots;
  - disabled MCP usage statistics, update checks, and CrUX lookups.
- Backed up the previous config and global instructions under `/home/aru/.codex/backups/chrome-mcp-repair-2026-07-18/`.
- Updated `/home/aru/.codex/AGENTS.md` to preserve managed Chrome launch and prohibit replacement with an unsupervised `--browserUrl` dependency.

## Graphify retirement

- Moved `/home/aru/.codex/skills/graphify` to recoverable disabled storage at `/home/aru/.codex/disabled-skills/graphify-disabled-2026-07-18`.
- Updated global Codex and Odyssey instructions to prohibit Graphify and require live-source/test/runtime inspection.
- Added the user-requested durable preference note at `/home/aru/.codex/memories/extensions/ad_hoc/notes/2026-07-18-disable-graphify.md`.
- Historical task-log references remain unchanged because they are truthful records, not active instructions.

## Browser verification

- A fresh MCP client using the exact installed launch command discovered 29 Chrome tools.
- `list_pages` launched an isolated Chrome automatically and returned `about:blank`.
- `new_page` opened a synthetic health page; `take_snapshot` found `Chrome MCP is healthy`.
- `take_screenshot` wrote `/tmp/chrome-mcp-permanent-smoke.webp`; visual inspection passed and SHA-256 was `6a44731156bfb4ae25e303855aacbcc6c4a8754d9f87c1ea9f1a5310ebef8436`.
- Console and network inspection worked; the synthetic document returned HTTP-equivalent status 200.
- After MCP client close, no Chrome or MCP child remained. The log ended with `Shutting down (stdin end)`.
- A second independent cold start after machine-level installation repeated the same 29-tool, page, snapshot, screenshot, console, network, and clean-shutdown pass.
- `codex mcp list` parsed the installed TOML and displayed the managed `--headless=true --isolated=true` configuration without `--browserUrl`.
- The MCP handle already loaded by this conversation remains cached on the former `9223` command and cannot hot-reload. New Codex sessions use the repaired configuration; the independent fresh-client smoke proves that path.

## Remaining unrelated machine note

- `npm audit` for the shared MCP package directory reports seven transitive findings under `@modelcontextprotocol/server-memory` dependencies. `npm explain` did not trace them through `chrome-devtools-mcp`; they were not force-upgraded during this scoped browser repair.
