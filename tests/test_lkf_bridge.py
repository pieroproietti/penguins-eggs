"""
Tests for the lkf build bridge (LkfBuildProvider).

All subprocess and filesystem calls are mocked.
"""
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open

from lkm.core.providers.lkf_build import (
    LkfBuildProvider,
    _find_output_package,
    _parse_profile_name,
    _parse_profile_version,
)
from lkm.core.kernel import KernelFamily, KernelStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_backend():
    b = MagicMock()
    b.install_local.return_value = iter(["installed\n"])
    return b


# ---------------------------------------------------------------------------
# Profile parsing
# ---------------------------------------------------------------------------

class TestProfileParsing:
    def test_parse_name(self, tmp_path):
        p = tmp_path / "gaming.toml"
        p.write_text('[remix]\nname = "gaming"\nversion = "6.12"\n')
        assert _parse_profile_name(p) == "gaming"

    def test_parse_version(self, tmp_path):
        p = tmp_path / "gaming.toml"
        p.write_text('[remix]\nname = "gaming"\nversion = "6.12"\n')
        assert _parse_profile_version(p) == "6.12"

    def test_parse_name_fallback_to_stem(self, tmp_path):
        p = tmp_path / "server.toml"
        p.write_text("[remix]\n# no name field\n")
        assert _parse_profile_name(p) == "server"

    def test_parse_version_fallback(self, tmp_path):
        p = tmp_path / "server.toml"
        p.write_text("[remix]\n# no version field\n")
        assert _parse_profile_version(p) == "0.0.0"

    def test_missing_file(self, tmp_path):
        p = tmp_path / "nonexistent.toml"
        assert _parse_profile_name(p) == "nonexistent"
        assert _parse_profile_version(p) == "0.0.0"


# ---------------------------------------------------------------------------
# _find_output_package
# ---------------------------------------------------------------------------

class TestFindOutputPackage:
    def test_finds_deb_by_version(self, tmp_path):
        pkg = tmp_path / "linux-image-6.12.0-lkf_amd64.deb"
        pkg.write_text("")
        result = _find_output_package(tmp_path, "6.12.0")
        assert result == pkg

    def test_finds_rpm(self, tmp_path):
        pkg = tmp_path / "kernel-6.12.0-lkf.x86_64.rpm"
        pkg.write_text("")
        result = _find_output_package(tmp_path, "6.12.0")
        assert result == pkg

    def test_fallback_any_package(self, tmp_path):
        pkg = tmp_path / "linux-image-6.12.0_amd64.deb"
        pkg.write_text("")
        # version string that won't match filename directly
        result = _find_output_package(tmp_path, "9.9.9")
        assert result == pkg

    def test_returns_none_when_empty(self, tmp_path):
        result = _find_output_package(tmp_path, "6.12.0")
        assert result is None


# ---------------------------------------------------------------------------
# LkfBuildProvider.is_available
# ---------------------------------------------------------------------------

class TestLkfBuildProviderAvailability:
    def test_available_when_lkf_on_path(self):
        with patch("shutil.which", return_value="/usr/local/bin/lkf"):
            p = LkfBuildProvider(_make_backend())
            assert p.is_available() is True

    def test_not_available_when_lkf_missing(self):
        with patch("shutil.which", return_value=None):
            p = LkfBuildProvider(_make_backend())
            assert p.is_available() is False

    def test_availability_reason_mentions_lkf(self):
        with patch("shutil.which", return_value=None):
            p = LkfBuildProvider(_make_backend())
            assert "lkf" in p.availability_reason().lower()


# ---------------------------------------------------------------------------
# LkfBuildProvider.list
# ---------------------------------------------------------------------------

class TestLkfBuildProviderList:
    def test_returns_entry_per_profile(self, tmp_path):
        profiles_dir = tmp_path / "profiles"
        profiles_dir.mkdir()
        for name, ver in [("gaming", "6.12"), ("server", "6.6")]:
            (profiles_dir / f"{name}.toml").write_text(
                f'[remix]\nname = "{name}"\nversion = "{ver}"\n'
            )

        with patch("shutil.which", return_value="/usr/local/bin/lkf"):
            with patch("lkm.core.providers.lkf_build._find_profiles",
                       return_value=list(profiles_dir.glob("*.toml"))):
                p = LkfBuildProvider(_make_backend())
                entries = p.list("amd64")

        assert len(entries) == 2
        names = {e.flavor for e in entries}
        assert "gaming" in names
        assert "server" in names
        assert all(e.family == KernelFamily.LKF_BUILD for e in entries)
        assert all(e.status == KernelStatus.AVAILABLE for e in entries)

    def test_returns_empty_when_no_profiles(self):
        with patch("shutil.which", return_value="/usr/local/bin/lkf"):
            with patch("lkm.core.providers.lkf_build._find_profiles", return_value=[]):
                p = LkfBuildProvider(_make_backend())
                assert p.list("amd64") == []


# ---------------------------------------------------------------------------
# LkfBuildProvider.build_custom — streaming
# ---------------------------------------------------------------------------

class TestLkfBuildCustom:
    def _make_provider(self):
        with patch("shutil.which", return_value="/usr/local/bin/lkf"):
            return LkfBuildProvider(_make_backend())

    def test_streams_output(self, tmp_path):
        p = self._make_provider()
        p._output_dir = tmp_path

        fake_proc = MagicMock()
        fake_proc.stdout = iter(["Fetching sources...\n", "Compiling...\n", "Done.\n"])
        fake_proc.returncode = 0
        fake_proc.__enter__ = lambda s: s
        fake_proc.__exit__ = MagicMock(return_value=False)

        with patch("subprocess.Popen", return_value=fake_proc):
            lines = list(p.build_custom(version="6.12", flavor="mainline"))

        assert "Fetching sources...\n" in lines
        assert "Compiling...\n" in lines

    def test_raises_on_nonzero_exit(self, tmp_path):
        p = self._make_provider()
        p._output_dir = tmp_path

        fake_proc = MagicMock()
        fake_proc.stdout = iter([])
        fake_proc.returncode = 1
        fake_proc.__enter__ = lambda s: s
        fake_proc.__exit__ = MagicMock(return_value=False)

        with patch("subprocess.Popen", return_value=fake_proc):
            with pytest.raises(RuntimeError, match="exited with code 1"):
                list(p.build_custom(version="6.12"))

    def test_passes_llvm_flag(self, tmp_path):
        p = self._make_provider()
        p._output_dir = tmp_path

        fake_proc = MagicMock()
        fake_proc.stdout = iter([])
        fake_proc.returncode = 0
        fake_proc.__enter__ = lambda s: s
        fake_proc.__exit__ = MagicMock(return_value=False)

        with patch("subprocess.Popen", return_value=fake_proc) as mock_popen:
            list(p.build_custom(version="6.12", llvm=True, lto="thin"))
            cmd = mock_popen.call_args[0][0]
            assert "--llvm" in cmd
            assert "--lto" in cmd
            assert "thin" in cmd

    def test_passes_output_format(self, tmp_path):
        p = self._make_provider()
        p._output_dir = tmp_path

        fake_proc = MagicMock()
        fake_proc.stdout = iter([])
        fake_proc.returncode = 0
        fake_proc.__enter__ = lambda s: s
        fake_proc.__exit__ = MagicMock(return_value=False)

        with patch("subprocess.Popen", return_value=fake_proc) as mock_popen:
            list(p.build_custom(version="6.12", output_fmt="rpm"))
            cmd = mock_popen.call_args[0][0]
            assert "--output" in cmd
            assert "rpm" in cmd


# ---------------------------------------------------------------------------
# LkfBuildProvider.install — full build+install pipeline
# ---------------------------------------------------------------------------

class TestLkfBuildInstall:
    def test_install_calls_backend_after_build(self, tmp_path):
        backend = _make_backend()

        with patch("shutil.which", return_value="/usr/local/bin/lkf"):
            p = LkfBuildProvider(backend)
        p._output_dir = tmp_path

        # Pre-create the output package so _find_output_package finds it
        pkg = tmp_path / "linux-image-6.12.0-lkf_amd64.deb"
        pkg.write_text("")

        fake_proc = MagicMock()
        fake_proc.stdout = iter(["building...\n"])
        fake_proc.returncode = 0
        fake_proc.__enter__ = lambda s: s
        fake_proc.__exit__ = MagicMock(return_value=False)

        from lkm.core.kernel import KernelEntry, KernelFamily, KernelStatus, KernelVersion
        entry = KernelEntry(
            version=KernelVersion.parse("6.12.0"),
            family=KernelFamily.LKF_BUILD,
            flavor="gaming",
            arch="amd64",
            provider_id="lkf_build",
            local_path=str(tmp_path / "gaming.toml"),
        )
        (tmp_path / "gaming.toml").write_text('[remix]\nname="gaming"\nversion="6.12.0"\n')

        with patch("subprocess.Popen", return_value=fake_proc):
            lines = list(p.install(entry))

        backend.install_local.assert_called_once_with(str(pkg))
        assert any("installing" in l.lower() for l in lines)

    def test_install_raises_when_no_package_produced(self, tmp_path):
        backend = _make_backend()

        with patch("shutil.which", return_value="/usr/local/bin/lkf"):
            p = LkfBuildProvider(backend)
        p._output_dir = tmp_path  # empty — no package file

        fake_proc = MagicMock()
        fake_proc.stdout = iter([])
        fake_proc.returncode = 0
        fake_proc.__enter__ = lambda s: s
        fake_proc.__exit__ = MagicMock(return_value=False)

        from lkm.core.kernel import KernelEntry, KernelFamily, KernelVersion
        entry = KernelEntry(
            version=KernelVersion.parse("6.12.0"),
            family=KernelFamily.LKF_BUILD,
            flavor="gaming",
            arch="amd64",
            provider_id="lkf_build",
            local_path=str(tmp_path / "gaming.toml"),
        )
        (tmp_path / "gaming.toml").write_text('[remix]\nname="gaming"\nversion="6.12.0"\n')

        with patch("subprocess.Popen", return_value=fake_proc):
            with pytest.raises(RuntimeError, match="no package file found"):
                list(p.install(entry))
