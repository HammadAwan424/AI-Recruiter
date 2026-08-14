# Test layout and fixture contracts

Tests are owned by the feature they exercise. Direct agent behavior uses the
`test_agent__` filename marker wherever the test lives; the feature directory
still determines ownership. The extraction feature includes resume extraction,
parsing, and screening as one pipeline. Gmail owns job classification because
classification is a Gmail-ingestion concern.

## Directories

- `unit/extraction/` and `unit/gmail/`: isolated unit tests.
- `extraction/` and `gmail/`: manually runnable producer/consumer workflows.
- `e2e/`: reserved for end-to-end tests.
- `fixtures/<feature>/<scenario>/inputs/`: authored, synthetic source data.
- `fixtures/<feature>/<scenario>/contracts/`: reusable serialized producer
  outputs. A contract can be the expected output of one stage and the input to
  an independently-run consumer; it is stored only once here.
- `tests/.artifacts/`: generated workflow outputs. This directory is ignored
  and must never be treated as a committed fixture.
- `util/`: shared test-only helpers and fixture readers.

## Contract chains

Each workflow producer validates and writes its output. Each consumer reads and
validates that output before using it. The `schema_version` field is a required
versioned boundary, and the strict application schemas reject unknown fields.
The workflow tests import these schemas from `app/schemas`; they do not define
parallel test-only versions of runtime contracts. Committed fixtures are
synthetic and read-only. Tests write generated results to `tests/.artifacts/`.

The extraction pipeline intentionally keeps parsing and screening as separate
consumers of the extracted text: screening uses
`contracts/extracted_resume_text.v1.json` plus
`inputs/job_spec.v1.json`; it does not depend on the parsed profile artifact.

| Producer | Boundary contract | Consumer |
| --- | --- | --- |
| resume extraction | `contracts/extracted_resume_text.v1.json` | resume parsing and screening |
| resume parsing | generated artifact only | inspection/debugging only |
| resume screening | generated artifact only | inspection/debugging only |
| Gmail sync context | `contracts/sync_context.v1.json` | deduplication |
| Gmail deduplication | `contracts/deduped_message_headers.v1.json` | message processing |
| Gmail message processing | `contracts/processed_messages.v1.json` | job classification |
| Gmail job classification | `contracts/classified_messages.v1.json` | persistence |
| Gmail persistence | generated artifact only | inspection/debugging only |
| outbound email | generated artifact only | inspection/debugging only |

Run the manual chain in order with `python tests/run_tests_cli.py`. Each stage
prefers the previous stage's generated artifact and falls back to the committed
contract, so an individual stage can still be inspected without mutating the
repository. The generated artifacts are never hand-edited or committed.

Do not add real resumes, raw Gmail payloads, credentials, provider recordings,
database dumps, or live LLM responses to `fixtures/`. If a source artifact is
needed for a test, anonymize it or create a minimal synthetic equivalent.
