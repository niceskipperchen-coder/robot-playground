# Robot Playground Implementation Plan

Goal: a standalone browser robot programming environment with runnable, shareable challenges.
Architecture: retain the tested SCARA math and renderer; add a deterministic simulator, bounded RobotScript parser/runner, URL-fragment sharing, and CodeMirror UI. Deploy a separate GitHub Pages repository.

- [x] Test and implement parsing: numeric robot commands, comments, repeat blocks, line errors, command budgets; reject arbitrary JavaScript.
- [x] Test and implement simulator commands, finite/range validation, timed stepping, cancellation, grip failures, and challenge completion after released blocks settle.
- [x] Test and implement challenge validation and versioned fragment encoding; preserve Unicode, reject malformed/oversized input and unreachable layouts.
- [x] Create CodeMirror editor with execution/error line decorations, split workspace, console, API reference, starter programs, pause/step/reset, manual controls, and responsive layout.
- [x] Build three built-in challenges and a one-to-three-block custom builder. Share challenge-only or challenge plus program; imported programs never auto-run.
- [x] Verify parser and runtime tests, all example solutions, browser execution, stopping, sharing reload, error handling, clipboard fallback, and narrow layouts.
- [ ] Document syntax, limitations and authorship; publish GitHub repository and Pages demo, then add profile link after live verification.

Constraints: no eval or Function; max 300 expanded commands, repeat 1–20, max 8 KB source, max 16 KB decoded share payload; XY reach 40–320 mm, grip height 12–100 mm. No authentication or telemetry. Errors and shared titles are rendered as text. Existing simulator remains separate.
