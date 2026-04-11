# ADR 0002: Memory Provider Abstraction

## Status

Accepted

## Decision

Use a `MemoryProvider` interface with an app-native default provider and an optional MemPalace adapter.

## Consequences

Core functionality remains stable without external AI memory infrastructure. MemPalace can be enabled later without changing API or UI contracts.

