#!/usr/bin/env bash
# lib/filesystem.sh — filesystem detection and snapshot abstraction
#
# Abstracts over ext4, btrfs, zfs, xfs, and overlayfs.
# Snapshot operations are no-ops on filesystems that don't support them,
# so callers don't need to branch on filesystem type.

# ── Detection ──────────────────────────────────────────────────────────────────

PW_FS_TYPE=""       # ext4 | btrfs | zfs | xfs | overlayfs | tmpfs | unknown
PW_FS_DEVICE=""     # block device backing /
PW_FS_SNAPSHOT_CAP=0  # 1 if native snapshots are available

pw_fs_detect() {
    local mountpoint="${1:-/}"

    # findmnt is the most reliable cross-distro tool for this
    if pw_has_cmd findmnt; then
        PW_FS_TYPE=$(findmnt -n -o FSTYPE "${mountpoint}" 2>/dev/null || echo "unknown")
        PW_FS_DEVICE=$(findmnt -n -o SOURCE "${mountpoint}" 2>/dev/null || echo "unknown")
    else
        # Fall back to /proc/mounts
        PW_FS_TYPE=$(awk -v mp="${mountpoint}" '$2==mp{print $3; exit}' /proc/mounts 2>/dev/null || echo "unknown")
        PW_FS_DEVICE=$(awk -v mp="${mountpoint}" '$2==mp{print $1; exit}' /proc/mounts 2>/dev/null || echo "unknown")
    fi

    PW_FS_TYPE="${PW_FS_TYPE,,}"

    case "${PW_FS_TYPE}" in
        btrfs)
            PW_FS_SNAPSHOT_CAP=1
            ;;
        zfs)
            pw_has_cmd zfs && PW_FS_SNAPSHOT_CAP=1 || PW_FS_SNAPSHOT_CAP=0
            ;;
        ext4|xfs|overlayfs|tmpfs|*)
            PW_FS_SNAPSHOT_CAP=0
            ;;
    esac

    pw_debug "Filesystem: type=${PW_FS_TYPE} device=${PW_FS_DEVICE} snapshots=${PW_FS_SNAPSHOT_CAP}"
}

pw_fs_info() {
    printf "Filesystem type   : %s\n" "${PW_FS_TYPE}"
    printf "Device            : %s\n" "${PW_FS_DEVICE}"
    printf "Native snapshots  : %s\n" "$([[ ${PW_FS_SNAPSHOT_CAP} -eq 1 ]] && echo yes || echo no)"
}

# ── Snapshot interface ─────────────────────────────────────────────────────────
# pw_fs_snapshot_create <label>  — create a pre-reset snapshot
# pw_fs_snapshot_list            — list powerwash snapshots
# pw_fs_snapshot_rollback <name> — roll back to a snapshot
# pw_fs_snapshot_delete <name>   — delete a snapshot

pw_fs_snapshot_create() {
    local label="${1:-powerwash_$(pw_timestamp)}"

    if [[ ${PW_FS_SNAPSHOT_CAP} -eq 0 ]]; then
        pw_warn "Native snapshots not supported on ${PW_FS_TYPE}. Skipping snapshot."
        pw_warn "Use the backup subsystem (pw_backup_*) for pre-reset safety instead."
        return 0
    fi

    case "${PW_FS_TYPE}" in
        btrfs) _pw_btrfs_snapshot_create "${label}" ;;
        zfs)   _pw_zfs_snapshot_create   "${label}" ;;
    esac
}

pw_fs_snapshot_list() {
    if [[ ${PW_FS_SNAPSHOT_CAP} -eq 0 ]]; then
        pw_info "No native snapshot support on ${PW_FS_TYPE}."
        return 0
    fi

    case "${PW_FS_TYPE}" in
        btrfs) _pw_btrfs_snapshot_list ;;
        zfs)   _pw_zfs_snapshot_list   ;;
    esac
}

pw_fs_snapshot_rollback() {
    local name="$1"
    [[ -n "${name}" ]] || pw_die "Snapshot name required."

    if [[ ${PW_FS_SNAPSHOT_CAP} -eq 0 ]]; then
        pw_warn "Native snapshots not supported on ${PW_FS_TYPE}."
        return 1
    fi

    pw_warn "Rolling back to snapshot '${name}' will discard all changes since that point."
    pw_confirm "Proceed with rollback?" || { pw_info "Rollback cancelled."; return 0; }

    case "${PW_FS_TYPE}" in
        btrfs) _pw_btrfs_snapshot_rollback "${name}" ;;
        zfs)   _pw_zfs_snapshot_rollback   "${name}" ;;
    esac
}

pw_fs_snapshot_delete() {
    local name="$1"
    [[ -n "${name}" ]] || pw_die "Snapshot name required."

    case "${PW_FS_TYPE}" in
        btrfs) _pw_btrfs_snapshot_delete "${name}" ;;
        zfs)   _pw_zfs_snapshot_delete   "${name}" ;;
        *)     pw_warn "No snapshot support on ${PW_FS_TYPE}." ;;
    esac
}

# ── Btrfs implementation ───────────────────────────────────────────────────────

# Powerwash snapshots live at /.pw_snapshots/<label>
_PW_BTRFS_SNAP_DIR="/.pw_snapshots"

_pw_btrfs_snapshot_create() {
    local label="$1"
    pw_require_cmd btrfs
    pw_run mkdir -p "${_PW_BTRFS_SNAP_DIR}"
    pw_step "Creating btrfs snapshot: ${_PW_BTRFS_SNAP_DIR}/${label}"
    pw_run btrfs subvolume snapshot -r / "${_PW_BTRFS_SNAP_DIR}/${label}"
    pw_info "Snapshot created: ${_PW_BTRFS_SNAP_DIR}/${label}"
}

_pw_btrfs_snapshot_list() {
    pw_require_cmd btrfs
    if [[ -d "${_PW_BTRFS_SNAP_DIR}" ]]; then
        btrfs subvolume list "${_PW_BTRFS_SNAP_DIR}" 2>/dev/null \
            | grep "pw_snapshots" \
            || pw_info "No powerwash snapshots found."
    else
        pw_info "No powerwash snapshots found."
    fi
}

_pw_btrfs_snapshot_rollback() {
    local name="$1"
    local snap_path="${_PW_BTRFS_SNAP_DIR}/${name}"
    [[ -d "${snap_path}" ]] || pw_die "Snapshot not found: ${snap_path}"
    pw_step "Rolling back to btrfs snapshot: ${snap_path}"
    # Mark current root as rw snapshot, swap default subvolume
    pw_run btrfs subvolume snapshot "${snap_path}" /
    pw_info "Rollback staged. Reboot to complete."
}

_pw_btrfs_snapshot_delete() {
    local name="$1"
    local snap_path="${_PW_BTRFS_SNAP_DIR}/${name}"
    [[ -d "${snap_path}" ]] || pw_die "Snapshot not found: ${snap_path}"
    pw_run btrfs subvolume delete "${snap_path}"
    pw_info "Snapshot deleted: ${snap_path}"
}

# ── ZFS implementation ─────────────────────────────────────────────────────────

_pw_zfs_dataset_of_root() {
    # Find the ZFS dataset mounted at /
    zfs list -H -o name,mountpoint | awk '$2=="/" {print $1; exit}'
}

_pw_zfs_snapshot_create() {
    local label="$1"
    pw_require_cmd zfs
    local dataset
    dataset=$(_pw_zfs_dataset_of_root)
    [[ -n "${dataset}" ]] || pw_die "Could not determine ZFS dataset for /."
    local snap="${dataset}@powerwash_${label}"
    pw_step "Creating ZFS snapshot: ${snap}"
    pw_run zfs snapshot "${snap}"
    pw_info "Snapshot created: ${snap}"
}

_pw_zfs_snapshot_list() {
    pw_require_cmd zfs
    local dataset
    dataset=$(_pw_zfs_dataset_of_root)
    zfs list -t snapshot -o name,creation -s creation \
        | grep "${dataset}@powerwash_" \
        || pw_info "No powerwash snapshots found."
}

_pw_zfs_snapshot_rollback() {
    local name="$1"
    pw_require_cmd zfs
    local dataset
    dataset=$(_pw_zfs_dataset_of_root)
    local snap="${dataset}@powerwash_${name}"
    pw_step "Rolling back ZFS snapshot: ${snap}"
    pw_run zfs rollback -r "${snap}"
    pw_info "Rollback complete. Reboot recommended."
}

_pw_zfs_snapshot_delete() {
    local name="$1"
    pw_require_cmd zfs
    local dataset
    dataset=$(_pw_zfs_dataset_of_root)
    local snap="${dataset}@powerwash_${name}"
    pw_run zfs destroy "${snap}"
    pw_info "Snapshot deleted: ${snap}"
}

# ── Disk usage helpers ─────────────────────────────────────────────────────────

pw_fs_usage() {
    local path="${1:-/}"
    df -h "${path}"
}

# Returns available bytes on the given path's filesystem
pw_fs_available_bytes() {
    local path="${1:-/}"
    df --output=avail -B1 "${path}" | tail -1
}

# Check that at least <bytes> are free on <path>
pw_fs_assert_space() {
    local path="$1"
    local required_bytes="$2"
    local available
    available=$(pw_fs_available_bytes "${path}")
    if (( available < required_bytes )); then
        pw_die "Insufficient space on ${path}: need ${required_bytes} bytes, have ${available}."
    fi
}
