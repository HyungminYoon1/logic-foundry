# Systematic edge-case audit — 2026-10-13

LOCAL ONLY. This is a new systematic audit, separate from the earlier guide/copy maintenance on the same date. No commit, push, deployment, remote CI run, gallery/ranking-server changes or external services.

## Source inventory and authority

- Named repository `logic-foundry`: VERIFIED inventory, clean starting main worktree; baseline HEAD `24a0ac6a288b992ad1ca487ca4a8a4d200fd4d34`.
- VERIFIED full reads: architecture.md > README.md, docs/decisions.md, package.json, .github/workflows/pages.yml, .gitattributes, .gitignore; all dist/src modules (app.js, ui.js, model.js, records.js, history.js, storage.js, progress.js); all existing test files and relevant fixtures; tools/check.mjs and serve.mjs. No api-spec.md or requirements.md was present. User-supplied AGENTS instructions applied.
- VERIFIED current HTML control inventory; CSS PARTIAL (relevant responsive/focus/overflow selectors and source portions selected for browser QA, not a complete stylesheet audit). docs/verification.md PARTIAL: current/latest evidence and relevant prior coverage read, historical deployment sections not reverified. Favicon/Git internals/generated caches are inventoried, content NOT_INSPECTED.
- Existing ignored `tmp/output/playwright/qa-20261013/qa.cjs`: VERIFIED and reused as primary flow in tracked tools/edge-browser.cjs. New edge assertions extend it. Root output/playwright/implement-20261012/package.json VERIFIED exists (Playwright1.61.1); specified Chrome executable VERIFIED by actual launch. Other root QA tools only inventoried. Sibling repositories, gallery and ranking server NOT_INSPECTED/NOT_MODIFIED by this owner.
- Feature boundaries accounted for: 13 missions, 7 gate operations/acyclic order, exact inputs, exhaustive rows/vectors/counterexample/filter, gate edits/remove/repair/add limit, signal focus, per-mission drafts/hints/practice, undo32, files16KiB, state128KiB, durable revalidation/summary/erase.

## Executable boundary matrix

N = new pure test in test/edge.test.js; U = actual app callbacks in test/ui.test.js with DOM/storage doubles; E = existing named tests retained; B = tools/edge-browser.cjs actual Chrome. All executed entries below VERIFIED/PASS; doubles/injection are labeled and do not establish physical-device or production evidence. `npm test` runs N/U/E; B is separate and NOT executed by the current CI workflow.

| Feature/boundary | Cases mapped to actual tests / observations | Evidence |
| --- | --- | --- |
| Input type/nonfinite | NEW baseline PASS `edge: binary inputs reject empty, type and nonfinite values even for inactive NOT port` (empty/null/bool/string/just-outside/NaN/+Inf/-Inf); constants/direct output valid. Existing foreign/own-key strictness, cycles/forward/dangling/output arity. | N + E |
| Min/max/empty circuit | NEW baseline PASS `edge: zero-gate constants and direct outputs evaluate every row without invented gates`. Existing exact gate budgets 8..24/+1 rejection, inputs7/outputs4/rows128 and sparse input validation. | N + E |
| Independent invariants/determinism | NEW baseline PASS `edge: gate ID renaming and added unused gates preserve independently checked arithmetic`: output truth tables invariant under topology-preserving IDs and unused node. Existing arithmetic/borrow/parity/one-hot/MUX/priority oracle assertions remain authoritative. | N + E |
| File/state exact byte ceilings | NEW baseline PASS `edge: exact byte ceilings accept padded valid JSON and reject one additional byte` at 16384/16385 and 131072/131073 UTF8 bytes. Existing Korean multibyte rejection, exact schema/forged completion/cycle/unknown mission. No imported achievement flags. | N + E |
| Malformed/error state preservation | NEW baseline PASS UI `edge: failed file read preserves editor, inputs, undo history and durable records`. Existing atomic forged/schema/size rejection; browser actual oversize selection rejects without replacing editor; actual export download/import restores XOR as practice. | U + B |
| Async/latest/reset/cancel | RED->GREEN `edge: latest file selection wins when an earlier read completes late`, `edge: reset cancels pending import and its late error cannot overwrite reset status`, `edge: reset cancels a pending valid import instead of resurrecting assisted practice`. Node deferred promise fixtures; browser delayed File.text fixture with real reset. | U + B |
| Hint/no-solution/terminal | NEW baseline PASS `edge: hints are bounded and never turn exhaustive failure into completion`. Existing first-counterexample/filter; browser initial failure -> direct XOR verification. Hint alone has no penalty, examples/import remain practice. No timed game terminal; passing is exhaustive verification, not a solver proving no circuit exists. | U + E + B |
| Undo/reset/restore | NEW baseline PASS `edge: undo snapshots detach nested inputs and remain independent across mission histories`. Existing 32 histories, repair deletion, assistance restored, per-mission draft switches and explicit local load. Browser all13 reset inputs and full examples, save/load/undo; initial reload starts authored editor. | N + E + B |
| Storage/readback/isolation | Existing `local storage roundtrip, corrupt/denied/quota behavior and erase are scoped`, `failed private erase preserves the durable completion and its gallery summary`. Browser own setItem quota fixture -> original private/summary retained; real own erase keeps peer data. Initial count revalidates stored circuits. | E + B |
| Keyboard/focus/mobile | Existing signal link focus and palette/budget UI double; browser input switches/vectors and 128-row adder, 1440/390/320 circuit scroll. Full SVG keyboard IME, assistive technology, physical phone/touch and cross-tab last-writer races NOT_RUN. | E + B / NOT_RUN |

## Failures before / fixes after

Unchanged app + `node --test --test-name-pattern='edge:' test/ui.test.js`: late earlier file expected mission adder/two outputs, actual difference/one output (2 PASS/1 FAIL). Then unchanged app + `node --test --test-name-pattern='edge: reset cancels' test/ui.test.js`: 2 FAIL: late failure overwrote reset status with import error; late valid file replaced reset AND with assisted adder. After request-generation guard, SAME edge command 5/5 PASS and full suite53/53. File read failures are fixtures, not actual disk failure claims.

Minimal fix: Track import request generation; installation/restore and mission change invalidate pending reads. Ignore stale success/error and only clear the matching file selection. No legitimate assertion was relaxed. 5 new pure tests passed on unchanged production code; these are coverage additions, **not RED_GREEN**. Total 10 new executable Node tests: 3 genuine failing regressions, 7 baseline-passing additions (including UI sequence checks). Existing 43 tests retained.

The browser harness had trial issues with async-status readiness and a collapsed erase control; corrected waits/visible-control navigation without changing product expectations. Those are harness issues, not product bugs or additional RED_GREEN claims.

## Commands and local results

- `node --test test/edge.test.js`: baseline 5/5 PASS before app edits.
- `node --test --test-name-pattern='edge:' test/ui.test.js`: original failures described above; same regression test executable after fix PASS.
- `npm test`: 53/53 PASS, fail0. `npm run check`: PASS. No test/workflow/dependency command changed.
- `git diff --check`: PASS at final handoff. Only edited text normalized UTF-8 without BOM / CRLF.
- Browser: start own persistent loopback server using `node tools/serve.mjs 0`; use emitted URL, then `node tools/edge-browser.cjs http://127.0.0.1:<port>/`. It resolves the already-installed root Playwright package (optional PLAYWRIGHT_MODULE_PATH path override), launches isolated headless Chrome at the requested executable with --mute-audio, and closes its owned context/browser in finally. Stop the owned preview session after completion. It never uses the personal Chrome profile.
- Existing workflow runs npm test/check on Node22 and includes all new Node tests. Browser harness retained in tools/ and runnable locally; CI browser execution NOT_RUN/not configured. Remote CI/live deployment NOT_RUN.

## Browser and visual evidence

Primary flow 54 named checks plus additional edge assertions. Actual direct XOR4/4 saved; all13 examples remain practice; adder3 128/128 and 7+0+1=0001; parity one flip ERROR1/two flips ERROR0.

Additional flows include the new input/lifecycle regression, malformed or oversized imports where available, cancellation where available, explicit Storage.setItem quota failure injection with unchanged raw-record readback, and actual own-record erase preserving synthetic echo-vault/peer-private fixtures. Storage denial/quota in Node are test doubles; browser quota is deliberately injected, not a claim that physical disk quota was exhausted.

Evidence folder (already ignored): `tmp/output/playwright/edge-20261013/`. Artifacts: startup-1440/390/320.png; final-viewport-1440/390/320.png; desktop-xor.png; adder3-1440.png / adder3-390.png / adder3-320.png; roundtrip.json. browser-report.json contains local outcomes/page errors/console logs. Node evidence baseline-tests.txt, regression-before.txt, regression-after.txt, final-tests-check.txt is local only. Actual 1440x1000 / 390x844 / 320x844 views and relevant full result states captured; screenshots reviewed separately from numeric horizontal-fit checks. Pages intentionally scroll; no fixed-shell fit guarantee is claimed. Observed tested page errors/console errors/warnings0.

UI **behavior** changed; HTML/CSS/layout did not. Parent screenshot refresh review recommended at the primary/result capture states above; no gallery screenshot changed here.

Exploratory mobile emulation also exercised touch/tap and mixed controls in two short interaction bursts: switch/hint/vector interactions and actual horizontal wheel scroll to the adder outputs; explore-adder-390.png and explore-scrolled-right-390.png. Observed exploratory page errors0; emulation is not physical mobile proof. Detailed chart/cost/terminal screenshots were separately reviewed at readable scale.

Runtime cleanup: final standalone harnesses closed their own Chrome/context in finally; exploratory contexts/browser explicitly closed. Four owned loopback listeners stopped after verification. An earlier interactive REPL timed out while a hidden erase control was being waited for; its initial handle was lost. Its process termination could not be independently confirmed from the reset REPL, so no ambiguous shared Chrome process was killed. Final self-closing CLI evidence supersedes that interrupted harness run.


## Decisions and integration limits

See D13 in decisions.md. Rules/versions, physics, mission predicates, scoring, storage keys/schemas/bounds/retention, 15-ID allowlist and separation of concerns retained. Browser fixtures use disposable contexts; no user records erased. Runtime code change is confined to dist/src/app.js.

Latest-two-file ordering verified with Node deferred promises; browser specifically verifies pending read vs reset. File picker OS cancellation, genuine hardware read errors, network (absent), all SVG keys, physical IME/touch, screenreader and cross-tab races NOT_RUN. Input toggles alone during pending read are not specified as cancellation and not signed off.

All engines/devices/possible seeds or campaigns, measured learning efficacy, cross-origin gallery sharing and same-origin full gallery integration are NOT_RUN. Peer fixtures verify contract preservation, not sibling app UI integration. Shared storage is intentionally last-writer-wins; no atomic cross-tab or two-key transaction claim. No unsupported physics/logic/policy rule was repaired by changing its definition.

Changed files: dist/src/app.js; test/ui.test.js; new test/edge.test.js; new tools/edge-browser.cjs; docs/decisions.md; docs/verification.md; new docs/edge-cases-20261013.md. All changes uncommitted. Parent integrates/reviews/releases; this report provides no deployed/live assertion.

