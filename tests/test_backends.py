"""
Tests for the xbps and nix backends.

All subprocess calls are mocked — no real package manager is required.
"""
import pytest
from unittest.mock import patch, MagicMock, call

from lkm.core.backends.xbps import XbpsBackend
from lkm.core.backends.nix  import NixBackend, _patch_kernel_attr, _nixpkgs_attr_for


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

    def test_list_available_kernels_parses_flag_prefix(self, backend):
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

    def test_list_available_kernels_parses_installed_marker(self, backend):
        # [*] marks installed packages in some xbps versions
        xbps_output = (
            "[*] linux-6.6.30_1  The Linux kernel and modules\n"
            "[-] linux-mainline-6.12_1  Mainline Linux kernel\n"
        )
        with patch.object(backend, "_run", return_value=(0, xbps_output, "")):
            kernels = backend.list_available_kernels()
        assert "linux-6.6.30" in kernels
        assert "linux-mainline-6.12" in kernels

    def test_list_available_kernels_excludes_subpackages(self, backend):
        xbps_output = (
            "[-] linux-6.6.30_1  The Linux kernel\n"
            "[-] linux-6.6.30-headers_1  Kernel headers\n"
            "[-] linux-6.6.30-dbg_1  Debug symbols\n"
        )
        with patch.object(backend, "_run", return_value=(0, xbps_output, "")):
            kernels = backend.list_available_kernels()
        assert "linux-6.6.30" in kernels
        assert not any("headers" in k for k in kernels)
        assert not any("dbg" in k for k in kernels)

    def test_list_available_kernels_empty_on_error(self, backend):
        with patch.object(backend, "_run", return_value=(1, "", "error")):
            assert backend.list_available_kernels() == []

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
        cfg_text = "{\n  boot.kernelPackages = pkgs.linuxPackages;\n}\n"
        with patch("lkm.core.backends.nix._read_config", return_value=cfg_text):
            with patch("lkm.core.backends.nix._write_config", return_value=(0, "", "")):
                with patch("lkm.core.backends.nix._is_flake_system", return_value=False):
                    with patch("shutil.which", return_value="/run/current-system/sw/bin/nixos-rebuild"):
                        with patch("lkm.core.system.privilege_escalation_cmd", return_value=["sudo"]):
                            with patch.object(backend, "_run_streaming", return_value=iter(["switching...\n"])) as mock_stream:
                                list(backend.install_packages(["linuxPackages_latest"]))
                                mock_stream.assert_called_once_with(
                                    ["sudo", "nixos-rebuild", "switch"]
                                )

    def test_remove_packages_emits_instructions(self, backend):
        cfg_text = "{\n  boot.kernelPackages = pkgs.linuxPackages_6_6;\n}\n"
        with patch("lkm.core.backends.nix._read_config", return_value=cfg_text):
            with patch("lkm.core.backends.nix._write_config", return_value=(0, "", "")):
                with patch("lkm.core.backends.nix._is_flake_system", return_value=False):
                    with patch("shutil.which", return_value=None):  # no nixos-rebuild
                        lines = list(backend.remove_packages(["linuxPackages_6_6"]))
        combined = "".join(lines)
        assert "configuration.nix" in combined or "boot.kernelPackages" in combined

    def test_hold_returns_zero_with_message(self, backend):
        rc, out, err = backend.hold(["linuxPackages_6_6"])
        assert rc == 0
        assert "NixOS" in out
        assert err == ""

    def test_unhold_returns_zero(self, backend):
        with patch("lkm.core.backends.nix._is_flake_system", return_value=False):
            rc, out, err = backend.unhold(["linuxPackages_6_6"])
        assert rc == 0
        assert err == ""

    def test_current_kernel_attr_parses_config(self, backend, tmp_path):
        cfg = tmp_path / "configuration.nix"
        cfg.write_text(
            "{ config, pkgs, ... }:\n{\n"
            "  boot.kernelPackages = pkgs.linuxPackages_6_6;\n"
            "}\n"
        )
        with patch("lkm.core.backends.nix._read_config", return_value=cfg.read_text()):
            attr = backend.current_kernel_attr()
        assert "linuxPackages_6_6" in attr

    def test_current_kernel_attr_missing_file(self, backend):
        with patch("builtins.open", side_effect=OSError("not found")):
            assert backend.current_kernel_attr() == ""


# ---------------------------------------------------------------------------
# NixOS config patching helpers
# ---------------------------------------------------------------------------

class TestNixPatchKernelAttr:
    def test_replaces_existing_attr(self):
        text = "{ boot.kernelPackages = pkgs.linuxPackages; }"
        patched, changed = _patch_kernel_attr(text, "pkgs.linuxPackages_6_6")
        assert changed is True
        assert "pkgs.linuxPackages_6_6" in patched
        assert "pkgs.linuxPackages;" not in patched

    def test_no_change_when_same_value(self):
        text = "{ boot.kernelPackages = pkgs.linuxPackages_6_6; }"
        patched, changed = _patch_kernel_attr(text, "pkgs.linuxPackages_6_6")
        assert changed is False
        assert patched == text

    def test_inserts_when_absent(self):
        text = "{ networking.hostName = \"nixos\"; }"
        patched, changed = _patch_kernel_attr(text, "pkgs.linuxPackages_latest")
        assert changed is True
        assert "boot.kernelPackages = pkgs.linuxPackages_latest;" in patched

    def test_inserts_before_closing_brace(self):
        text = "{\n  networking.hostName = \"nixos\";\n}"
        patched, _ = _patch_kernel_attr(text, "pkgs.linuxPackages_latest")
        # closing brace must still be present
        assert patched.rstrip().endswith("}")

    def test_multiline_value(self):
        text = (
            "{\n"
            "  boot.kernelPackages = pkgs.linuxPackages_6_1;\n"
            "  networking.hostName = \"nixos\";\n"
            "}"
        )
        patched, changed = _patch_kernel_attr(text, "pkgs.linuxPackages_6_6")
        assert changed is True
        assert "linuxPackages_6_6" in patched
        assert "linuxPackages_6_1" not in patched


class TestNixpkgsAttrFor:
    @pytest.mark.parametrize("inp,expected", [
        ("pkgs.linuxPackages_6_6",  "pkgs.linuxPackages_6_6"),   # passthrough
        ("linuxPackages_6_6",       "pkgs.linuxPackages_6_6"),   # known attr
        ("linuxPackages",           "pkgs.linuxPackages"),        # known attr
        ("6.6",                     "pkgs.linuxPackages_6_6"),   # version string
        ("6.12.3",                  "pkgs.linuxPackages_6_12"),  # version with patch
        ("linux-6.6",               "pkgs.linux-6.6"),           # unknown → passthrough
    ])
    def test_conversion(self, inp, expected):
        assert _nixpkgs_attr_for(inp) == expected


class TestNixBackendInstallPatches:
    def test_patches_config_and_rebuilds(self, tmp_path):
        cfg = tmp_path / "configuration.nix"
        cfg.write_text("{\n  boot.kernelPackages = pkgs.linuxPackages;\n}\n")

        backend = NixBackend()
        with patch("lkm.core.backends.nix._config_path", return_value=cfg):
            with patch("lkm.core.backends.nix._write_config",
                       side_effect=lambda p, t: (0, "", "") or cfg.write_text(t)) as mock_write:
                with patch.object(backend, "_rebuild", return_value=iter(["rebuilding\n"])):
                    lines = list(backend.install_packages(["6.6"]))

        mock_write.assert_called_once()
        written_text = mock_write.call_args[0][1]
        assert "linuxPackages_6_6" in written_text

    def test_hold_flake_message(self):
        backend = NixBackend()
        with patch("lkm.core.backends.nix._is_flake_system", return_value=True):
            rc, out, _ = backend.hold(["linuxPackages_6_6"])
        assert rc == 0
        assert "flake" in out.lower()
        assert "nix flake lock" in out

    def test_hold_channel_message(self):
        backend = NixBackend()
        with patch("lkm.core.backends.nix._is_flake_system", return_value=False):
            rc, out, _ = backend.hold(["linuxPackages_6_6"])
        assert rc == 0
        assert "channel" in out.lower()
        assert "nix-channel" in out

    def test_unhold_flake_message(self):
        backend = NixBackend()
        with patch("lkm.core.backends.nix._is_flake_system", return_value=True):
            rc, out, _ = backend.unhold(["linuxPackages_6_6"])
        assert "nix flake update" in out

    def test_unhold_channel_message(self):
        backend = NixBackend()
        with patch("lkm.core.backends.nix._is_flake_system", return_value=False):
            rc, out, _ = backend.unhold(["linuxPackages_6_6"])
        assert "nix-channel" in out
