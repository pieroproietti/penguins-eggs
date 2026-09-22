# GUI integration work

## Status

This document lists the changes needed for `penguins-eggs` to integrate cleanly
with the independent `penguins-gui` application.

The structured commands and flags described below are proposed. They must not
be documented as available to users until they are implemented and tested. The
existing human CLI remains the default and must continue to work unchanged.

The shared request and event contract is defined by `penguins-gui/PROTOCOL.md`
and its JSON Schemas.

## Existing interface used by the prototype

The GUI currently uses confirmed public commands and flags:

```text
eggs version
eggs remaster --path <directory>
eggs remaster --clone --path <directory>
eggs remaster --crypted --path <directory>
```

It elevates the `eggs` process with `pkexec`, displays textual stdout/stderr and
scans the working directory for the ISO. Crypted mode is opened in a terminal
because it currently requires protected interactive input.

The first protocol implementation should remove output parsing and artifact
scanning without changing normal terminal output.

## Architectural placement

Integration belongs in the Go orchestrator (`coa`), not the C engine (`oa`):

- Cobra command handling selects human or structured output;
- a reusable Go protocol package encodes requests and events;
- the planner and dispatcher expose lifecycle events through Go callbacks;
- `oa` remains focused on low-level execution and has no GUI or JSON concern.

The structured emitter should be separate from the existing centralized human
logging wrappers. In protocol mode stdout must contain NDJSON only; human logs
must not be mixed into that stream.

## Minimum first delivery

The smallest useful change is structured output for the existing remaster
operation.

### Proposed invocation

One possible CLI is:

```text
eggs remaster --request - --events ndjson
```

The request is read from stdin. A file path may also be supported. The exact
flag spelling can change before implementation, but it should provide these
semantics:

- explicit opt-in;
- one JSON request;
- NDJSON-only stdout;
- immediate flush after each event;
- one final `result` or `error` document;
- exit zero only after a successful result.

### Events to expose

Start with events already visible in the remaster plan rather than inventing a
second progress model:

- request accepted;
- validation and space check;
- plan generated;
- each plan/task step started;
- measurable step progress when the underlying program supplies it;
- step completed;
- ISO completed;
- terminal success, failure or cancellation.

Stable `step.id` values should come from task names. Human text remains in
`message` and may change or be translated without affecting the GUI.

### Final artifact

On success Eggs must explicitly return the exact ISO it produced:

```json
{
  "protocol": "penguins/v1",
  "type": "result",
  "tool": "eggs",
  "operation": "remaster",
  "state": "succeeded",
  "artifacts": [
    {
      "kind": "iso",
      "path": "/home/eggs/egg-of-debian-trixie-colibri-amd64.iso",
      "size_bytes": 1825361100
    }
  ]
}
```

The real document also contains the common identifiers, version, sequence and
timestamp required by the schema. The path is absolute. A checksum is optional
and should be calculated only when requested or already available.

## Capability discovery

The GUI needs facts about the installed Eggs, not assumptions based on its
version string. Add a read-only JSON operation equivalent to:

```text
eggs capabilities --json
```

It should report at least:

- application and protocol versions;
- supported operations;
- remaster modes actually available on the detected distribution;
- supported compression algorithms and valid level ranges;
- whether checking, events and cancellation are supported;
- whether the operation requires privileges;
- whether protected interactive input is required;
- relevant platform restrictions, such as crypted-mode availability.

Capability output must be safe and useful without root whenever possible.

## System status and remaster check

Add a read-only machine response containing the data currently needed to
decide whether remastering can begin:

- distribution family, distribution ID and release;
- architecture;
- whether the system is running live;
- resolved working and target directories;
- effective compression settings;
- prerequisite status;
- available and estimated required space;
- warnings and blocking errors.

A proposed check flow is:

```text
eggs remaster --check --request - --json
```

It must not alter mounts, staging directories or configuration. Its `plan`
response returns `normalized_options`, so the GUI can show the values Eggs will
actually use after defaults have been applied.

## Request mapping

The first implementation needs only fields that map to existing behaviour:

| Request field | Existing Eggs concept |
| --- | --- |
| `mode: standard` | `eggs remaster` |
| `mode: clone` | `eggs remaster --clone` |
| `mode: crypted` | `eggs remaster --crypted` |
| `working_directory` | `--path` |
| `target_directory` | `--target-dir` |
| compression | effective Eggs configuration/wizard selection |

The receiver validates unknown fields and invalid combinations. It should call
the same internal remaster path as the normal CLI, not maintain a separate GUI
implementation.

## Errors

Map known failures to stable codes while preserving the original cause. An
initial set may include:

- `INVALID_REQUEST`;
- `UNSUPPORTED_PROTOCOL`;
- `UNSUPPORTED_MODE`;
- `PRIVILEGES_REQUIRED`;
- `PREREQUISITE_MISSING`;
- `INSUFFICIENT_SPACE`;
- `WORK_DIRECTORY_INVALID`;
- `TARGET_DIRECTORY_INVALID`;
- `PLAN_FAILED`;
- `TASK_FAILED`;
- `CANCELLED`.

This list should grow from real failure paths. Messages are for people; the GUI
branches only on codes and structured details.

## Crypted mode

Passphrases must never appear in command arguments, request JSON, events or
logs. The initial protocol may explicitly report that crypted mode requires the
legacy terminal workflow. A later implementation can accept a protected file
descriptor or another short-lived secret channel.

The structured request contains only a reference to that channel. Eggs remains
responsible for confirmation, secret validation and cleanup.

## Cancellation

The orchestrator should handle a graceful termination request and report
whether the current step can be interrupted safely. If cleanup succeeds, emit a
terminal `cancelled` error/result and exit non-zero. Do not claim cancellation
support in capabilities until every touched resource is left in a known state.

## Suggested implementation steps

Each step should be a separate, testable change:

1. add protocol Go types plus JSON fixture tests;
2. add an NDJSON writer with monotonic sequence and flushing;
3. add structured capability output;
4. parse and validate a remaster request without executing it;
5. expose the existing space check and normalized remaster plan;
6. add lifecycle callbacks around existing plan/task execution;
7. emit the exact ISO artifact from the code that finalizes it;
8. map real errors to stable codes;
9. add graceful cancellation;
10. enable protocol mode in `penguins-gui`, retaining its legacy adapter.

## Acceptance test

The integration milestone is complete when this scenario works unattended:

1. the GUI probes capabilities;
2. it submits a standard remaster request;
3. Eggs validates it and streams schema-valid NDJSON;
4. no human text appears on protocol stdout;
5. the last document identifies the exact ISO;
6. the process exits zero;
7. the GUI opens that artifact without scanning a directory;
8. running ordinary `eggs remaster` still produces the familiar human output.

