# recovery-manager

Recovery partition management extracted from [pop-os/upgrade](https://github.com/pop-os/upgrade).

## What's included

- **recovery/** -- Recovery partition detection, version tracking, ISO fetching with checksum verification, and partition syncing via rsync.
- **repair/** -- System repair routines: fstab correction, crypttab fixes, and packaging repairs.
- **checksum.rs** -- File checksum utilities.
- **misc.rs** -- File copy and system helpers.

## Status

These modules are extracted verbatim from the pop-os/upgrade daemon. They reference internal types (`SignalEvent`, `release_api`, `SystemEnvironment`, etc.) that need adapter implementations before this crate compiles standalone.

See `src/lib.rs` for the list of required adapter types.

## License

GPL-3.0 (inherited from pop-os/upgrade)
