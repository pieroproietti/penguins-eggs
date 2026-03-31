"""Tests for penguins_kernel_manager.hooks"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch

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

def _cfg(**kwargs) -> dict:
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
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()):
            pre_install("6.12.0", "rt")
            mock_run.assert_called_once_with(
                ["penguins-recovery", "snapshot", "create", "pre-kernel-6.12.0-rt"]
            )

    def test_label_without_flavor(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()):
            pre_install("6.12.0")
            mock_run.assert_called_once_with(
                ["penguins-recovery", "snapshot", "create", "pre-kernel-6.12.0"]
            )

    def test_noop_when_recovery_unavailable(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=False), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()):
            pre_install("6.12.0")
            mock_run.assert_not_called()

    def test_noop_when_snapshot_disabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg(pre_install_snapshot=False)):
            pre_install("6.12.0")
            mock_run.assert_not_called()


# ---------------------------------------------------------------------------
# post_install
# ---------------------------------------------------------------------------

class TestPostInstall:
    def test_runs_hook_script_when_script_exists(self, tmp_path):
        """When eggs is available and the hook script exists, _run is called."""
        hook = tmp_path / "pkm-hook.sh"
        hook.write_text("#!/bin/bash\necho ok\n")
        hook.chmod(0o755)

        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()), \
             patch("penguins_kernel_manager.hooks.EGGS_HOOK_SCRIPT", hook):
            post_install("6.12.0", "rt")
            args, kwargs = mock_run.call_args
            assert args == (["bash", str(hook)],)
            assert kwargs.get("check") is False
            assert "EGGS_HOOK" in kwargs.get("env", {})

    def test_noop_when_script_missing(self, tmp_path):
        """When the hook script does not exist, _run is not called."""
        missing = tmp_path / "nonexistent-pkm-hook.sh"

        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()), \
             patch("penguins_kernel_manager.hooks.EGGS_HOOK_SCRIPT", missing):
            post_install("6.12.0")
            mock_run.assert_not_called()

    def test_noop_when_eggs_unavailable(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=False), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()):
            post_install("6.12.0")
            mock_run.assert_not_called()

    def test_noop_when_notify_disabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks._run") as mock_run, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg(post_install_notify=False)):
            post_install("6.12.0")
            mock_run.assert_not_called()


# ---------------------------------------------------------------------------
# pre_remove
# ---------------------------------------------------------------------------

class TestPreRemove:
    def test_returns_none_when_manifest_missing(self, tmp_path):
        """No manifest file → no warning."""
        missing = tmp_path / "nonexistent-manifest.json"
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()), \
             patch("penguins_kernel_manager.hooks.KERNEL_MANIFEST_PATH", missing):
            assert pre_remove("6.12.0") is None

    def test_returns_warning_when_kernel_embedded_in_iso(self, tmp_path):
        """Kernel present in manifest with embedded_in_iso=True → warning returned."""
        manifest = tmp_path / "kernel-manifest.json"
        manifest.write_text(json.dumps([
            {"version": "6.12.0", "embedded_in_iso": True},
            {"version": "6.8.0",  "embedded_in_iso": False},
        ]))
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()), \
             patch("penguins_kernel_manager.hooks.KERNEL_MANIFEST_PATH", manifest):
            result = pre_remove("6.12.0")
            assert result is not None
            assert "6.12.0" in result

    def test_returns_none_when_kernel_not_embedded(self, tmp_path):
        """Kernel in manifest but embedded_in_iso=False → no warning."""
        manifest = tmp_path / "kernel-manifest.json"
        manifest.write_text(json.dumps([
            {"version": "6.8.0", "embedded_in_iso": True},
        ]))
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()), \
             patch("penguins_kernel_manager.hooks.KERNEL_MANIFEST_PATH", manifest):
            assert pre_remove("6.12.0") is None

    def test_returns_none_when_kernel_absent_from_manifest(self, tmp_path):
        """Kernel not in manifest at all → no warning."""
        manifest = tmp_path / "kernel-manifest.json"
        manifest.write_text(json.dumps([
            {"version": "6.8.0", "embedded_in_iso": True},
        ]))
        with patch("penguins_kernel_manager.hooks._cfg", return_value=_cfg()), \
             patch("penguins_kernel_manager.hooks.KERNEL_MANIFEST_PATH", manifest):
            assert pre_remove("5.15.0") is None

    def test_noop_when_warn_disabled(self):
        with patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg(pre_remove_warn=False)):
            assert pre_remove("6.12.0") is None


# ---------------------------------------------------------------------------
# post_remove_old
# ---------------------------------------------------------------------------

class TestPostRemoveOld:
    def test_noop_when_sync_disabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks.subprocess") as mock_sub, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg(post_remove_old_sync=False)):
            post_remove_old(["6.12.0"])
            mock_sub.Popen.assert_not_called()

    def test_noop_when_eggs_unavailable(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=False), \
             patch("penguins_kernel_manager.hooks.subprocess") as mock_sub, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg(post_remove_old_sync=True)):
            post_remove_old(["6.12.0"])
            mock_sub.Popen.assert_not_called()

    def test_fires_eggs_produce_when_sync_enabled(self):
        with patch("penguins_kernel_manager.hooks._available", return_value=True), \
             patch("penguins_kernel_manager.hooks.subprocess") as mock_sub, \
             patch("penguins_kernel_manager.hooks._cfg",
                   return_value=_cfg(post_remove_old_sync=True)):
            post_remove_old(["6.12.0"])
            mock_sub.Popen.assert_called_once()
            cmd = mock_sub.Popen.call_args[0][0]
            assert "eggs" in cmd
            assert "produce" in cmd
