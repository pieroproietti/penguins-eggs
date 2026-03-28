#!/usr/bin/env bash
# lib/plugin.sh — plugin loader and registry
#
# Plugins are shell scripts dropped into plugins/{distro,filesystem,hardware}/.
# Each plugin declares itself by setting PW_PLUGIN_* variables and implementing
# hook functions. The loader sources matching plugins after distro/fs detection.
#
# Plugin contract:
#   PW_PLUGIN_NAME="my-plugin"          # unique identifier
#   PW_PLUGIN_TYPE="distro"             # distro | filesystem | hardware
#   PW_PLUGIN_MATCH="ubuntu|debian"     # regex matched against distro ID or fs type
#
# Optional hook functions a plugin may implement:
#   pw_plugin_pre_reset()               # called before any reset mode runs
#   pw_plugin_post_reset()              # called after any reset mode completes
#   pw_plugin_pre_backup()              # called before backup creation
#   pw_plugin_post_backup()             # called after backup creation
#   pw_plugin_pkg_list_user()           # override user package listing
#   pw_plugin_pkg_reset_sources()       # override source reset logic

# Registry: associative arrays keyed by plugin name
declare -A _PW_PLUGIN_TYPES=()
declare -A _PW_PLUGIN_PATHS=()
declare -a _PW_LOADED_PLUGINS=()

# ── Loader ─────────────────────────────────────────────────────────────────────

# Load all plugins matching the current distro/fs context.
# Call after pw_distro_detect and pw_fs_detect.
pw_plugin_load_all() {
    local plugin_type
    for plugin_type in distro filesystem hardware; do
        local plugin_dir="${PW_PLUGIN_DIR}/${plugin_type}"
        [[ -d "${plugin_dir}" ]] || continue

        local plugin_file
        for plugin_file in "${plugin_dir}"/*.sh; do
            [[ -f "${plugin_file}" ]] || continue
            _pw_plugin_load_file "${plugin_file}"
        done
    done

    if [[ ${#_PW_LOADED_PLUGINS[@]} -gt 0 ]]; then
        pw_debug "Loaded plugins: ${_PW_LOADED_PLUGINS[*]}"
    fi
}

_pw_plugin_load_file() {
    local plugin_file="$1"

    # Reset plugin metadata variables before sourcing
    local PW_PLUGIN_NAME="" PW_PLUGIN_TYPE="" PW_PLUGIN_MATCH=""

    # shellcheck disable=SC1090
    source "${plugin_file}"

    # Validate required metadata
    if [[ -z "${PW_PLUGIN_NAME}" || -z "${PW_PLUGIN_TYPE}" || -z "${PW_PLUGIN_MATCH}" ]]; then
        pw_warn "Plugin missing required metadata, skipping: ${plugin_file}"
        return
    fi

    # Check if this plugin matches the current context
    local match_target=""
    case "${PW_PLUGIN_TYPE}" in
        distro)     match_target="${PW_DISTRO_ID:-}" ;;
        filesystem) match_target="${PW_FS_TYPE:-}" ;;
        hardware)   match_target="always" ;;  # hardware plugins always load
    esac

    if [[ "${match_target}" =~ ${PW_PLUGIN_MATCH} ]]; then
        _PW_PLUGIN_TYPES["${PW_PLUGIN_NAME}"]="${PW_PLUGIN_TYPE}"
        _PW_PLUGIN_PATHS["${PW_PLUGIN_NAME}"]="${plugin_file}"
        _PW_LOADED_PLUGINS+=("${PW_PLUGIN_NAME}")
        pw_debug "Plugin loaded: ${PW_PLUGIN_NAME} (${PW_PLUGIN_TYPE})"
    fi
}

# ── Hook dispatch ──────────────────────────────────────────────────────────────

# Call a named hook on all loaded plugins that implement it.
pw_plugin_hook() {
    local hook="$1"; shift
    local plugin
    for plugin in "${_PW_LOADED_PLUGINS[@]+"${_PW_LOADED_PLUGINS[@]}"}"; do
        if declare -f "${hook}" &>/dev/null; then
            pw_debug "Plugin hook: ${plugin}::${hook}"
            "${hook}" "$@"
        fi
    done
}

pw_plugin_pre_reset()        { pw_plugin_hook pw_plugin_pre_reset "$@"; }
pw_plugin_post_reset()       { pw_plugin_hook pw_plugin_post_reset "$@"; }
pw_plugin_pre_backup()       { pw_plugin_hook pw_plugin_pre_backup "$@"; }
pw_plugin_post_backup()      { pw_plugin_hook pw_plugin_post_backup "$@"; }

# ── Plugin listing ─────────────────────────────────────────────────────────────

pw_plugin_list() {
    if [[ ${#_PW_LOADED_PLUGINS[@]} -eq 0 ]]; then
        pw_info "No plugins loaded."
        return 0
    fi
    printf "%-30s  %-12s  %s\n" "Plugin" "Type" "Path"
    printf '%s\n' "$(printf '─%.0s' {1..70})"
    local p
    for p in "${_PW_LOADED_PLUGINS[@]}"; do
        printf "%-30s  %-12s  %s\n" \
            "${p}" \
            "${_PW_PLUGIN_TYPES[${p}]}" \
            "${_PW_PLUGIN_PATHS[${p}]}"
    done
}

pw_plugin_list_available() {
    pw_info "Available plugins in ${PW_PLUGIN_DIR}:"
    find "${PW_PLUGIN_DIR}" -name "*.sh" | sort | while read -r f; do
        local name type
        name=$(grep -m1 '^PW_PLUGIN_NAME=' "${f}" | cut -d= -f2 | tr -d '"')
        type=$(grep -m1 '^PW_PLUGIN_TYPE=' "${f}" | cut -d= -f2 | tr -d '"')
        printf "  %-30s  %s\n" "${name:-$(basename "${f}")}" "${type:-unknown}"
    done
}
