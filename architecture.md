# LOGIC FOUNDRY architecture

## Purpose

A bounded acyclic digital logic editor with gate wiring, live input signals, mission outputs and exhaustive truth-table verification.

The mission catalog contains the original 13 combinational exercises, including three-bit ripple addition, two-bit add/subtract, parity, decoding, multiplexing, comparison, priority arbitration and NAND-only synthesis. Model ceilings are 24 gates, 7 binary inputs, 4 outputs and 128 exhaustive rows; mission gate budgets range from 8 to 24. Definitions, output names, directed vectors, predicates and sample circuits remain in the pure model. No timing or sequential-state simulation is implied.

## Structure

Independent static GitHub Pages site at /logic-foundry/. dist/src/model.js owns pure calculation; dist/src/app.js owns UI, bounded inputs, playback and page lifecycle; dist/styles.css owns responsive presentation. pure DAG evaluator and mission predicates -> SVG diagram and semantic editor controls; no eval.

No backend, public ranking, account, tracking, cookies, external fonts or runtime API. User-approved bounded device-local persistence replaces the former memory-only rule (D08/D09). Explicit JSON files stay in the browser and on the user's device. Optional page-scoped WebMCP tools use the same validated state/actions as the visible controls, and feature-detect unsupported browsers.

Gate array order is the topological order: only mission inputs, constants and earlier gates are accepted, including the inactive NOT port. Input records must contain exactly the mission's own binary input keys. Validation precedes any UI circuit replacement; exhaustive evaluation validates once, then performs bounded linear passes. Example/import-assisted practice is separate from independent completion. Existing hint semantics remain: revealing a hint alone creates no completion and carries no penalty; completion requires explicit exhaustive verification.

## Device-local schemas and retention

- `model.js`: pure acyclic evaluation, unchanged campaign predicates; global ceiling now matches the largest mission (24).
- `records.js`: pure exact-schema codecs and independent-completion validation. Circuit files are UTF-8 JSON, at most 16 KiB, `{version:1,mission,circuit:{gates:[{id,type,a,b}],outputs:[reference]}}`. Unknown fields (including solved flags), versions, missions, gate kinds, dangling/forward/cyclic references and excess gate/output counts reject before replacing UI state. Every imported file is practice, even when exhaustive evaluation passes; files contain no achievements or assistance claims.
- `history.js`: detached editing snapshots, at most 32 per mission (13 missions) in page memory. Add/remove/type/input/output edits, reset, example, import and local load can be undone; switch values alone are not edits. Snapshots restore practice provenance. History is not persisted or exported.
- `storage.js`: only `logic-foundry-state-v1`, at most 128 KiB UTF-8 JSON: `{version:1,drafts:{[mission]:{circuit,inputs,hintCount,assisted}},achievements:{[mission]:circuit}}`. At most 13 drafts and 13 completion circuits. Saving explicitly replaces only the current mission draft. Completion writes automatically only after the verify button exhaustively passes an independent circuit. Startup restores completion counts by revalidating every durable circuit, and starts with the initial editor; draft loading is explicit for the selected mission. No imported solved boolean is accepted. Example/import assistance survives local save/load. Each read validates the full record; malformed, unavailable or quota-limited storage fails without a fabricated completion or silent overwrite. Reset affects editing, not durable achievements.
- `progress.js`: only the shared `web-lab-progress-v1` summary, at most 8 KiB. Exact `{version:1,apps:{[repoId]:{completed,total,updatedAt}}}` with the 15 fixed app IDs, integer `0 <= completed <= total <= 1000` and canonical UTC ISO timestamp of the actual completion write. The own record is `logic-foundry`, `total=13`, count recomputed from validated durable achievements after a successful independent completion write. No summary write on initial view, mission visit, hint, import/example, draft save or failed persistence. Read-modify-write preserves valid other app records. Unknown/invalid/oversized summaries fail without overwriting them. No names, seeds, actions or file/circuit payloads enter the summary. Gallery reads only this aggregate; private payloads remain in the app-specific key.

Data stays until explicit erase or browser storage removal; there is no timed retention, sync or migration from the former memory-only campaign. Erase removes the app-specific key and only `apps['logic-foundry']` from the shared summary, preserving other app data; failures are reported. Current editor and page-memory drafts remain available, downloaded files are user-owned and cannot be recalled. No automatic draft restore, storage-wide clear or network upload. Multiple tabs share origin storage; last writer wins, with no transaction guarantee across the private record and aggregate. A failed summary write can leave a stale badge until another actual completion verification or erase. These are editable learning records, not authenticated certificates.

Pure calculation/codec/history modules import no DOM, storage, clock or network APIs. DOM and file downloads belong to `app.js`; browser storage access belongs to the two boundary helpers.

No eval, user HTML injection or remote embeds. External links use noopener/noreferrer. CSP restricts connections and execution; GitHub hosting logs are separate. Only dist is deployed. UTF-8 without BOM / CRLF. Preserve all other repositories.

## Visual direction

dark-green circuit workbench. The working surface opens immediately; no marketing landing page ahead of controls. Keyboard controls, touch input, readable labels and reduced motion are part of the UI. Diagrams/canvas represent actual computed state rather than decorative or fictional results.
