//! Recovery partition management for penguins-recovery.
//!
//! Extracted from pop-os/upgrade. Provides:
//! - Recovery partition detection and version tracking
//! - ISO fetching with checksum verification
//! - System repair (fstab, crypttab, packaging)
//!
//! These modules are not yet fully decoupled from the pop-os/upgrade
//! daemon internals. They reference types (SignalEvent, release_api,
//! SystemEnvironment, etc.) that need adapter implementations before
//! this crate compiles standalone. See TODO markers below.

// TODO: Define local adapter traits/types for:
//   - SignalEvent (D-Bus signal abstraction)
//   - release_api::Release (ISO download URL resolution)
//   - release_architecture::detect_arch
//   - system_environment::SystemEnvironment
//   - external::findmnt_uuid
//   - ubuntu_version::{Codename, Version}
//
// Until then, these modules serve as the reference implementation
// for recovery partition management logic.

pub mod checksum;
pub mod misc;
pub mod recovery;
pub mod repair;
