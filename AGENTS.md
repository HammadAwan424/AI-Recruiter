# Agent Working Agreement

## Explicit request modes

An explicit prefix marker applies to the current request and overrides intent
inference for that request. A later marker replaces the earlier one.
EXAMPLE USAGE: `PREFIX`: `PROMPT`

### `PREFIX = analyze`

Inspect relevant code files if necessary, and produce a short summary covering:
- approach: how the task will be accomplished
- core changes: the minimum change(s) strictly required to fix/achieve the task
- assumed changes: any additional changes made beyond what's strictly required —
  enhancements, adjacent scope, or capability added while touching the core code —
  called out explicitly so they can be approved or rejected separately

### PREFIX: implement

Silently run the `analyze` step first to determine approach, core changes,
and assumed changes — do not pause for approval. Proceed directly into
implementation using that analysis.

Inspect first, preserve unrelated changes, and run relevant validation. 
Keep changes focused; call out assumed changes in the final summary rather than asking before
making them, and explicitly state what new changes were learned after the initial analysis. 
Add or update regression coverage when appropriate.


## Completion expectations
- If a requested action requires new authority or would materially expand the
  scope, stop and ask for direction rather than assuming permission.
