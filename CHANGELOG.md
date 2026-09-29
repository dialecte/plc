# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-29

### Added

- The definitions describe types and structure: `type` on attributes and text, `contentModel`, `nillable`, `anyNamespace`, text `default` / `fixed`.
- The attributes of an element as declared under each parent: `Plc.AttributesOf<'Address', 'Member'>`.

### Changed

- Requires `@dialecte/core` 0.5.1.

### Removed

- `children.choices` from the definitions: read the `choice` nodes of `contentModel`.

### Fixed

- An element declared several times with different content (`variable`, a structure under `struct` and a bare text under `coil`) is no longer typed as its first declaration.

## [0.0.19] - 2026-07-27

- Bump `@dialecte/core` to `0.4.9`

## [0.0.18] - 2026-07-23

- Bump `@dialecte/core` to `0.4.7`

## [0.0.17] - 2026-07-22

- Bump `@dialecte/core` to `0.4.6` - ExtendedDocument

## [0.0.16] - 2026-07-21

### Changed

- Bump `@dialecte/core` to `0.4.5`

## [0.0.15] - 2026-07-09

### Changed

- Bump `@dialecte/core` to `0.4.2`
- Update to typescript 7

## [0.0.14] - 2026-07-07

### Changed

- Bump `@dialecte/core` to `0.4.0`

## [0.0.13] - 2026-07-06

### Changed

- Bump `@dialecte/core` to `0.3.0`. Hooks are now provided on the `Project` instance instead of the config: `createPlcProject` passes `hooks: IO_HOOKS` and `PLC_IO_CONFIG` no longer carries them. Consumer usage is unchanged. Importing a file now standardizes each record via core — canonical attribute order/names and filled required attributes.

## [0.0.12] - 2026-06-30

### Fixed

TC6 v201 import now produces XSD-valid IEC 61131-10 output for several cases caught by validating against the FDIS schema:

- `Project/@schemaVersion` is stamped with the IEC schema version (`1.0`) instead of being copied empty.
- `creationDateTime` is emitted on `ContentHeader` (where it is required) rather than `FileHeader` (where it is forbidden); `FileHeader`/`ContentHeader` are always present with their required attributes.
- Parameter-set variables (`InputVars`/`OutputVars`/`InoutVars`) carry the required `orderWithinParamSet`.
- `Vars` carries the required `accessSpecifier`.
- Comment text is emitted as `Content` element text rather than a non-schema `value` attribute.

## [0.0.11] - 2026-06-30

### Fixed

- TC6 v201 import now maps `inVariable`/`outVariable` to `DataSource`/`DataSink` with a `ConnectionPointOut`/`ConnectionPointIn` directly on the `FbdObject` instead of an `OutputVariables`/`InputVariables` wrapper, matching the IEC 61131-10 XSD (those wrappers are valid only on `xsi:type="Block"`).

## [0.0.10] - 2026-06-29

- Bump `@dialecte/core` to `0.2.22` - fix withAllExtensions

## [0.0.9] - 2026-06-29

- Bump `@dialecte/core` to `0.2.21` - add `snapshots`

## [0.0.8] - 2026-06-26

### Added

- Type-performance CI gates (`type-bench:check` + `type-narrowing`) via `@dialecte/cli`, scoped to the `v1` definition, with benchmarks under `benchmarks/types/v1/`.

### Changed

- Build now externalizes `dexie` alongside `@dialecte/core` (no longer bundled).

## [0.0.7] - 2026-06-11

### Fixed

- test utils namespace

## [0.0.6] - 2026-06-10

### Fixed

- extensions import path after introducing versioning

## [0.0.5] - 2026-06-10

### Added

- dialecte test utils
- io hooks : upgrade from TC6v201 to IEC61131-10

### Changed

- `io-hooks.ts`: `IEC_NS` and `XSI_NS` now derive from `PLC_NAMESPACES` instead of hardcoded strings
- `io-hooks.test.ts`: same - imports `PLC_NAMESPACES` from `@/v1/config/namespaces`
- `tsconfig.vitest.json`: `lib` fixed from `[]` to `["DOM", "DOM.Iterable", "ESNext"]` - restores browser globals (`DOMParser`, `XMLDocument`, etc.) for test files

## [0.0.4] - 2026-06-09

### Fixed

- Change namespace in test utils

## [0.0.3] - 2026-06-09

### Added

- Test utils

## [0.0.2] - 2026-06-09

### Fixed

- Added missing elements to the definition, after updating the generation script

## [0.0.1] - 2026-06-08

### Added

- Dialecte initialization
