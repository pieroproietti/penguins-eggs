#!/usr/bin/env bash
# integration/recovery-plugin/pip-recovery-plugin.sh
#
# Called by penguins-recovery before and after factory resets.
#
# Environment variables set by penguins-recovery:
#   RECOVERY_HOOK   -- "pre-reset" | "post-reset"
#   RESET_MODE      -- "soft" | "medium" | "hard" | "sysprep" | "hardware"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# shellcheck source=../../lib/common.sh
source "${HUB_ROOT}/lib/common.sh"
_load_conf

case "${RECOVERY_HOOK:-pre-reset}" in

  pre-reset)
    if [[ "${PRE_RESET_SNAPSHOT}" == "1" ]]; then
      echo "[penguins-incus-hub] Snapshotting Incus instances before ${RESET_MODE:-unknown} reset..."
      snapshot_running_instances "pre-${RESET_MODE:-reset}"
    fi
    ;;

  post-reset)
    case "${RESET_MODE:-}" in
      hard|sysprep)
        if [[ "${POST_HARD_RESET_RESTART}" == "1" ]]; then
          echo "[penguins-incus-hub] Restarting penguins-incus-daemon after ${RESET_MODE} reset..."
          systemctl restart penguins-incus-daemon 2>/dev/null || true

          # Re-apply default profiles if the CLI is available
          local cli
          cli="$(_pip_cli_bin)"
          if [[ -x "${cli}" ]]; then
            local profiles_dir
            profiles_dir="$(_pip_profiles_dir)"
            if [[ -n "${profiles_dir}" ]]; then
              echo "[penguins-incus-hub] Re-applying default Incus profiles..."
              for f in "${profiles_dir}"/**/*.yaml; do
                "${cli}" profile create "$(basename "${f}" .yaml)" \
                  --config "${f}" 2>/dev/null || true
              done
            fi
          fi
        fi
        ;;
    esac
    ;;

esac
