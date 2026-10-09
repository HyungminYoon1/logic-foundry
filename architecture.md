# LOGIC FOUNDRY architecture

## Purpose

A bounded acyclic digital logic editor with gate wiring, live input signals, mission outputs and exhaustive truth-table verification.

The mission catalog contains 13 combinational exercises, including three-bit ripple addition, two-bit add/subtract, parity, decoding, multiplexing, comparison, priority arbitration and NAND-only synthesis. Model ceilings are 32 gates, 7 binary inputs, 4 outputs and 128 exhaustive rows; current mission gate budgets range from 8 to 24. Definitions, output names, directed vectors, predicates and sample circuits remain in the pure model. No timing or sequential-state simulation is implied.

## Structure

Independent static GitHub Pages site at /logic-foundry/. dist/src/model.js owns pure calculation; dist/src/app.js owns UI, bounded inputs, playback and page lifecycle; dist/styles.css owns responsive presentation. pure DAG evaluator and mission predicates -> SVG diagram and semantic editor controls; no eval.

No backend, account, tracking, cookies, visitor persistence, external fonts or runtime API. Input and experiments are transient page memory; explicit image download is user-owned local output, not server storage. Optional page-scoped WebMCP tools use the same validated state/actions as the visible controls, and feature-detect unsupported browsers. Tool summaries contain no private image bytes.

Gate array order is the topological order: only mission inputs, constants and earlier gates are accepted, including the inactive NOT port. Input records must contain exactly the mission's own binary input keys. Validation precedes any UI circuit replacement; exhaustive evaluation validates once, then performs bounded linear passes. The UI owns page-memory drafts, revealed hints and completion indicators. Example-assisted practice is separate from independently verified completion, and nothing is persisted. Model code imports no DOM, storage or network APIs.

No eval, user HTML injection or remote embeds. External links use noopener/noreferrer. CSP restricts connections and execution; GitHub hosting logs are separate. Only dist is deployed. UTF-8 without BOM / CRLF. Preserve all other repositories.

## Visual direction

dark-green circuit workbench. The working surface opens immediately; no marketing landing page ahead of controls. Keyboard controls, touch input, readable labels and reduced motion are part of the UI. Diagrams/canvas represent actual computed state rather than decorative or fictional results.
