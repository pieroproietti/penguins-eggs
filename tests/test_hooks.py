"""Tests for penguins_kernel_manager.hooks"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest

from penguins_kernel_manager.hooks import (
    post_install,
    post_remove_old,
    pre_install,
    pre_remove,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cfg_overrides(**kwargs) -> dict:
    """Return a minimal hooks config dict with sensible test defaults."""
    base = {
        "eggs_bin": "eggs",
        "recovery_bin": "penguins-recovery",
        "pre_install_snapshot": True,
        "post_install_notify": True,
        "pre_remove_warn": True,
        "post_remove_old_sync": False,
    }
    base.update(kwargs)
    return base


# ---------------------------------------------------------------------------
# pre_install
# ---------------------------------------------------------------------------

class TestPreInstall:
    def test_calls_recovery_snapshot_when_available(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()):
            pre_install("6.12.0", "rt")
            mock_run.assert_called_once_with(
                ["penguins-recovery", "snapshot", "create", "pre-kernel-6.12.0-rt"]
            )

    def test_label_without_flavor(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()):
            pre_install("6.12.0")
            mock_run.assert_called_once_with(
                ["penguins-recovery", "snapshot", "create", "pre-kernel-6.12.0"]
            )

    def test_noop_when_recovery_unavailable(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=False), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()):
            pre_install("6.12.0")
            mock_run.assert_not_called()

    def test_noop_when_snapshot_disabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg_overrides(pre_install_snapshot=False)):
            pre_install("6.12.0")
            mock_run.assert_not_called()


# ---------------------------------------------------------------------------
# post_install
# ---------------------------------------------------------------------------

class TestPostInstall:
    def test_runs_hook_script_when_available(self, tmp_path):
        hook = tmp_path / "pkm-hook.sh"
        hook.write_text("#!/bin/bash\necho ok\n")
        hook.chmod(0o755)

        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()), \
             patch("penguins_kernel_manager.hooks.Path") as mock_path:
            # Make the hook script path resolve to our tmp file
            mock_path.return_value.__truediv__ = lambda s, x: hook if "pkm-hook.sh" in str(x) else Path(x)
            mock_path.return_value.exists.return_value = True
            post_install("6.12.0", "rt")
            # _run should be called with bash + the hook script
            assert mock_run.called

    def test_noop_when_eggs_unavailable(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=False), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()):
            post_install("6.12.0")
            mock_run.assert_not_called()

    def test_noop_when_notify_disabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg_overrides(post_install_notify=False)):
            post_install("6.12.0")
            mock_run.assert_not_called()


# ---------------------------------------------------------------------------
# pre_remove
# ---------------------------------------------------------------------------

class TestPreRemove:
    def test_returns_none_when_no_manifest(self, tmp_path):
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()), \
             patch("penguins_kernel_manager.hooks.Path") as mock_path:
            mock_path.return_value.exists.return_value = False
            result = pre_remove("6.12.0")
            assert result is None

    def test_returns_warning_when_kernel_embedded_in_iso(self, tmp_path):
        manifest = tmp_path / "kernel-manifest.json"
        manifest.write_text(json.dumps([
            {"version": "6.12.0", "embedded_in_iso": True},
            {"version": "6.8.0",  "embedded_in_iso": False},
        ]))
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()), \
             patch("penguins_kernel_manager.hooks.Path", return_value=manifest):
            result = pre_remove("6.12.0")
            assert result is not None
            assert "6.12.0" in result

    def test_returns_none_when_kernel_not_in_manifest(self, tmp_path):
        manifest = tmp_path / "kernel-manifest.json"
        manifest.write_text(json.dumps([
            {"version": "6.8.0", "embedded_in_iso": True},
        ]))
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg_overrides()), \
             patch("penguins_kernel_manager.hooks.Path", return_value=manifest):
            result = pre_remove("6.12.0")
            assert result is None

    def test_noop_when_warn_disabled(self):
        with patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg_overrides(pre_remove_warn=False)):
            result = pre_remove("6.12.0")
            assert result is None


# ---------------------------------------------------------------------------
# post_remove_old
# ---------------------------------------------------------------------------

class TestPostRemoveOld:
    def test_noop_when_sync_disabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks.subprocess") as mock_sub, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg_overrides(post_remove_old_sync=False)):
            post_remove_old(["6.12.0"])
            mock_sub.Popen.assert_not_called()

    def test_noop_when_eggs_unavailable(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=False), \
             patch("penguins_kernel_manager.hooks.subprocess") as mock_sub, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg_overrides(post_remove_old_sync=True)):
            post_remove_old(["6.12.0"])
            mock_sub.Popen.assert_not_called()

    def test_fires_eggs_produce_when_sync_enabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks.subprocess") as mock_sub, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg_overrides(post_remove_old_sync=True)):
            post_remove_old(["6.12.0"])
            mock_sub.Popen.assert_called_once()
            cmd = mock_sub.Popen.call_args[0][0]
            assert "eggs" in cmd
            assert "produce" in cmd
