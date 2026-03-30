"""Tests for LocalFileProvider — the handoff point for lkf-built packages."""
import pytest
from pathlib import Path
from unittest.mock import MagicMock

from penguins_kernel_manager.core.providers.local_file import LocalFileProvider
from penguins_kernel_manager.core.kernel import KernelFamily, KernelStatus


def _make_backend():
    b = MagicMock()
    b.install_local.return_value = iter(["ok\n"])
    return b


class TestLocalFileProviderEntryFromPath:
    @pytest.mark.parametrize("filename,expected_ver", [
        ("linux-image-6.12.3-lkf_amd64.deb",  "6.12.3"),
        ("kernel-6.6.30-1.x86_64.rpm",         "6.6.30"),
        ("linux-6.12.3-arch1-1-x86_64.pkg.tar.zst", "6.12.3"),
        ("linux-6.1.90_1.apk",                 "6.1.90"),
    ])
    def test_version_extracted(self, tmp_path, filename, expected_ver):
        f = tmp_path / filename
        f.write_text("")
        entry = LocalFileProvider.entry_from_path(str(f), "amd64")
        assert str(entry.version) == expected_ver

    def test_family_is_local_file(self, tmp_path):
        f = tmp_path / "linux-image-6.12.0_amd64.deb"
        f.write_text("")
        entry = LocalFileProvider.entry_from_path(str(f), "amd64")
        assert entry.family == KernelFamily.LOCAL_FILE

    def test_local_path_set(self, tmp_path):
        f = tmp_path / "linux-image-6.12.0_amd64.deb"
        f.write_text("")
        entry = LocalFileProvider.entry_from_path(str(f), "amd64")
        assert entry.local_path == str(f)

    def test_unknown_version_fallback(self, tmp_path):
        f = tmp_path / "my-custom-kernel.deb"
        f.write_text("")
        entry = LocalFileProvider.entry_from_path(str(f), "amd64")
        assert entry.version.major == 0


class TestLocalFileProviderInstall:
    def test_install_delegates_to_backend(self, tmp_path):
        backend = _make_backend()
        prov    = LocalFileProvider(backend)
        pkg     = tmp_path / "linux-image-6.12.0_amd64.deb"
        pkg.write_text("")

        from penguins_kernel_manager.core.kernel import KernelEntry, KernelVersion
        entry = KernelEntry(
            version=KernelVersion.parse("6.12.0"),
            family=KernelFamily.LOCAL_FILE,
            flavor="linux-image",
            arch="amd64",
            provider_id="local_file",
            local_path=str(pkg),
        )
        lines = list(prov.install(entry))
        backend.install_local.assert_called_once_with(str(pkg))

    def test_install_raises_without_local_path(self):
        backend = _make_backend()
        prov    = LocalFileProvider(backend)

        from penguins_kernel_manager.core.kernel import KernelEntry, KernelVersion
        entry = KernelEntry(
            version=KernelVersion.parse("6.12.0"),
            family=KernelFamily.LOCAL_FILE,
            flavor="linux-image",
            arch="amd64",
            provider_id="local_file",
        )
        with pytest.raises(RuntimeError, match="local_path"):
            list(prov.install(entry))

    def test_install_from_path_raises_for_missing_file(self, tmp_path):
        backend = _make_backend()
        prov    = LocalFileProvider(backend)
        with pytest.raises(RuntimeError, match="not found"):
            list(prov.install_from_path(str(tmp_path / "nonexistent.deb")))

    def test_install_from_path_raises_for_unsupported_format(self, tmp_path):
        backend = _make_backend()
        prov    = LocalFileProvider(backend)
        f = tmp_path / "kernel.tar.bz2"
        f.write_text("")
        with pytest.raises(RuntimeError, match="Unsupported"):
            list(prov.install_from_path(str(f)))

    def test_list_returns_empty(self):
        prov = LocalFileProvider(_make_backend())
        assert prov.list("amd64") == []
