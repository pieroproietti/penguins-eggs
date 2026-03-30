"""
Tests for the xbps and nix backends.

All subprocess calls are mocked — no real package manager is required.
"""
import pytest
from unittest.mock import patch, MagicMock, call

from lkm.core.backends.xbps import XbpsBackend
from lkm.core.backends.nix  import NixBackend


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_run_result(rc=0, stdout="", stderr=""):
    m = MagicMock()
    m.returncode = rc
    m.stdout     = stdout
    m.stderr     = stderr
    return m


# ---------------------------------------------------------------------------
# XbpsBackend
# ---------------------------------------------------------------------------

class TestXbpsBackend:

    @pytest.fixture
    def backend(self):
        return XbpsBackend()

    def test_name(self, backend):
        assert backend.name == "xbps"

    def test_available_when_binary_present(self):
        with patch("shutil.which", return_value="/usr/bin/xbps-install"):
            assert XbpsBackend.available() is True

    def test_not_available_when_binary_missing(self):
        with patch("shutil.which", return_value=None):
            assert XbpsBackend.available() is False

    def test_install_packages_calls_xbps_install(self, backend):
        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
            with patch.object(backend, "_run_streaming", return_value=iter(["ok\n"])) as mock_stream:
                list(backend.install_packages(["linux6.6"]))
                mock_stream.assert_called_once_with(
                    ["sudo", "xbps-install", "-Sy", "linux6.6"]
                )

    def test_remove_packages_no_purge(self, backend):
        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
            with patch.object(backend, "_run_streaming", return_value=iter([])) as mock_stream:
                list(backend.remove_packages(["linux6.6"]))
                mock_stream.assert_called_once_with(
                    ["sudo", "xbps-remove", "-y", "linux6.6"]
                )

    def test_remove_packages_purge(self, backend):
        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
            with patch.object(backend, "_run_streaming", return_value=iter([])) as mock_stream:
                list(backend.remove_packages(["linux6.6"], purge=True))
                mock_stream.assert_called_once_with(
                    ["sudo", "xbps-remove", "-Ry", "linux6.6"]
                )

    def test_hold_calls_xbps_pkgdb(self, backend):
        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
            with patch.object(backend, "_run", return_value=(0, "", "")) as mock_run:
                rc, _, _ = backend.hold(["linux6.6"])
                assert rc == 0
                mock_run.assert_called_once_with(
                    ["sudo", "xbps-pkgdb", "-m", "hold", "linux6.6"]
                )

    def test_unhold_calls_xbps_pkgdb(self, backend):
        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
            with patch.object(backend, "_run", return_value=(0, "", "")) as mock_run:
                rc, _, _ = backend.unhold(["linux6.6"])
                assert rc == 0
                mock_run.assert_called_once_with(
                    ["sudo", "xbps-pkgdb", "-m", "unhold", "linux6.6"]
                )

    def test_is_installed_true(self, backend):
        with patch.object(backend, "_run", return_value=(0, "state: installed\n", "")):
            assert backend.is_installed("linux6.6") is True

    def test_is_installed_false_nonzero_rc(self, backend):
        with patch.object(backend, "_run", return_value=(1, "", "")):
            assert backend.is_installed("linux6.6") is False

    def test_is_installed_false_wrong_state(self, backend):
        with patch.object(backend, "_run", return_value=(0, "state: not-installed\n", "")):
            assert backend.is_installed("linux6.6") is False

    def test_list_available_kernels_parses_output(self, backend):
        xbps_output = (
            "[-] linux-6.6.30_1  The Linux kernel and modules\n"
            "[-] linux-lts-6.1.90_1  LTS Linux kernel\n"
            "[-] bash-5.2_1  The GNU Bourne Again shell\n"
        )
        with patch.object(backend, "_run", return_value=(0, xbps_output, "")):
            kernels = backend.list_available_kernels()
        assert "linux-6.6.30" in kernels
        assert "linux-lts-6.1.90" in kernels
        assert not any("bash" in k for k in kernels)

    def test_install_local_uses_repo_dir(self, backend, tmp_path):
        pkg = tmp_path / "linux-6.6.30-1.x86_64.xbps"
        pkg.write_text("")
        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
            with patch.object(backend, "_run_streaming", return_value=iter([])) as mock_stream:
                list(backend.install_local(str(pkg)))
                args = mock_stream.call_args[0][0]
                assert "xbps-install" in args
                assert "-R" in args
                assert str(tmp_path) in args


# ---------------------------------------------------------------------------
# NixBackend
# ---------------------------------------------------------------------------

class TestNixBackend:

    @pytest.fixture
    def backend(self):
        return NixBackend()

    def test_name(self, backend):
        assert backend.name == "nix"

    def test_available_with_nixos_rebuild(self):
        with patch("shutil.which", side_effect=lambda x: "/run/current-system/sw/bin/nixos-rebuild" if x == "nixos-rebuild" else None):
            assert NixBackend.available() is True

    def test_available_with_nix_env(self):
        with patch("shutil.which", side_effect=lambda x: "/nix/var/nix/profiles/default/bin/nix-env" if x == "nix-env" else None):
            assert NixBackend.available() is True

    def test_not_available_when_neither_present(self):
        with patch("shutil.which", return_value=None):
            assert NixBackend.available() is False

    def test_install_packages_emits_snippet(self, backend):
        with patch("shutil.which", return_value=None):  # no nixos-rebuild
            lines = list(backend.install_packages(["linuxPackages_6_6"]))
        combined = "".join(lines)
        assert "boot.kernelPackages" in combined
        assert "linuxPackages_6_6" in combined

    def test_install_packages_runs_rebuild_when_available(self, backend):
        with patch("shutil.which", return_value="/run/current-system/sw/bin/nixos-rebuild"):
            with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
                with patch.object(backend, "_run_streaming", return_value=iter(["switching...\n"])) as mock_stream:
                    lines = list(backend.install_packages(["linuxPackages_latest"]))
                    mock_stream.assert_called_once_with(
                        ["sudo", "nixos-rebuild", "switch"]
                    )

    def test_remove_packages_emits_instructions(self, backend):
        lines = list(backend.remove_packages(["linuxPackages_6_6"]))
        combined = "".join(lines)
        assert "configuration.nix" in combined
        assert "nixos-rebuild switch" in combined

    def test_hold_returns_zero_with_message(self, backend):
        rc, out, err = backend.hold(["linuxPackages_6_6"])
        assert rc == 0
        assert "NixOS" in out
        assert err == ""

    def test_unhold_same_as_hold(self, backend):
        rc1, out1, _ = backend.hold(["x"])
        rc2, out2, _ = backend.unhold(["x"])
        assert rc1 == rc2
        assert out1 == out2

    def test_current_kernel_attr_parses_config(self, backend, tmp_path):
        cfg = tmp_path / "configuration.nix"
        cfg.write_text(
            "{ config, pkgs, ... }:\n{\n"
            "  boot.kernelPackages = pkgs.linuxPackages_6_6;\n"
            "}\n"
        )
        with patch("builtins.open", return_value=open(cfg)):
            attr = backend.current_kernel_attr()
        assert "linuxPackages_6_6" in attr

    def test_current_kernel_attr_missing_file(self, backend):
        with patch("builtins.open", side_effect=OSError("not found")):
            assert backend.current_kernel_attr() == ""
