# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
