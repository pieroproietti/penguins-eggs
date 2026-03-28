#!/usr/bin/env bash
# plugins/filesystem/btrfs-snapshot.sh — btrfs pre-reset snapshot plugin
#
# Automatically creates a read-only btrfs subvolume snapshot before any
# reset operation when the root filesystem is btrfs.

PW_PLUGIN_NAME="btrfs-auto-snapshot"
PW_PLUGIN_TYPE="filesystem"
PW_PLUGIN_MATCH="btrfs"

pw_plugin_pre_reset() {
    pw_step "[btrfs] Creating pre-reset snapshot"
    pw_fs_snapshot_create "pre_reset_$(pw_timestamp)"
}

pw_plugin_post_reset() {
    pw_step "[btrfs] Post-reset snapshot list"
    pw_fs_snapshot_list
    pw_info "Roll back with: powerwash snapshot rollback <name>"
}
