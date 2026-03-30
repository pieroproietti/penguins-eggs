"""
lkf Build dialog — GUI front-end for the lkf build pipeline.

Two modes:
  Profile mode  — pick a remix.toml from the discovered profile list and
                  run `lkf remix --file <profile>`.
  Custom mode   — specify version, flavor, arch, compiler flags manually
                  and run `lkf build`.

The dialog streams lkf output live via a QThread worker, then optionally
installs the resulting package through the system backend.

This dialog is modelled on GentooCompileDialog and uses the same LogPanel
and worker pattern.
"""
from __future__ import annotations

import os
from pathlib import Path

from lkm.qt import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QComboBox,
    QPushButton, QCheckBox, QLineEdit, QSpinBox, QGroupBox,
    QTabWidget, QWidget, QSizePolicy, QFileDialog,
    QThread, Signal, Slot, QMessageBox,
)
from lkm.gui.widgets.log_panel import LogPanel
from lkm.core.providers.lkf_build import LkfBuildProvider
from lkm.core.system import system_info


# ---------------------------------------------------------------------------
# Worker thread
# ---------------------------------------------------------------------------

class _BuildWorker(QThread):
    line_ready   = Signal(str)
    finished_ok  = Signal(str)   # emits path to output package (may be "")
    finished_err = Signal(str)

    def __init__(
        self,
        provider: LkfBuildProvider,
        mode: str,                  # "profile" | "custom"
        profile_path: str = "",
        version: str = "",
        flavor: str = "mainline",
        arch: str = "",
        llvm: bool = False,
        lto: str = "none",
        output_fmt: str = "deb",
    ) -> None:
        super().__init__()
        self._provider    = provider
        self._mode        = mode
        self._profile     = profile_path
        self._version     = version
        self._flavor      = flavor
        self._arch        = arch
        self._llvm        = llvm
        self._lto         = lto
        self._output_fmt  = output_fmt

    def run(self) -> None:
        try:
            if self._mode == "profile":
                gen = self._provider.build_only(self._profile)
            else:
                gen = self._provider.build_custom(
                    version=self._version,
                    flavor=self._flavor,
                    arch=self._arch or None,
                    llvm=self._llvm,
                    lto=self._lto,
                    output_fmt=self._output_fmt,
                )
            for line in gen:
                self.line_ready.emit(line)

            # Locate the output package
            from lkm.core.providers.lkf_build import _find_output_package
            pkg = _find_output_package(
                self._provider.output_dir,
                self._version,
            )
            self.finished_ok.emit(str(pkg) if pkg else "")
        except Exception as e:
            self.finished_err.emit(str(e))


# ---------------------------------------------------------------------------
# Dialog
# ---------------------------------------------------------------------------

class LkfBuildDialog(QDialog):
    """
    Full-featured build dialog for the lkf pipeline.

    Opened from the Build tab in the main window.
    On successful build, emits build_succeeded(pkg_path) so the main window
    can offer to install the result.
    """

    build_succeeded = Signal(str)   # absolute path to the output package

    def __init__(self, provider: LkfBuildProvider, parent=None) -> None:
        super().__init__(parent)
        self._provider = provider
        self._worker: _BuildWorker | None = None
        self.setWindowTitle("Build Kernel with lkf")
        self.setMinimumSize(720, 580)
        self._setup_ui()
        self._populate_profiles()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _setup_ui(self) -> None:
        root = QVBoxLayout(self)

        self._tabs = QTabWidget()
        self._tabs.addTab(self._make_profile_tab(), "Profile")
        self._tabs.addTab(self._make_custom_tab(),  "Custom")
        root.addWidget(self._tabs)

        # Output dir label
        out_row = QHBoxLayout()
        out_row.addWidget(QLabel("Output dir:"))
        self._out_label = QLabel(str(self._provider.output_dir))
        self._out_label.setWordWrap(True)
        out_row.addWidget(self._out_label, 1)
        change_btn = QPushButton("Change…")
        change_btn.clicked.connect(self._change_output_dir)
        out_row.addWidget(change_btn)
        root.addLayout(out_row)

        # Log
        self._log = LogPanel()
        root.addWidget(self._log)

        # Buttons
        btn_row = QHBoxLayout()
        btn_row.addStretch()
        self._build_btn = QPushButton("Build")
        self._build_btn.setDefault(True)
        self._build_btn.clicked.connect(self._start_build)
        btn_row.addWidget(self._build_btn)

        self._install_btn = QPushButton("Build && Install")
        self._install_btn.clicked.connect(self._start_build_and_install)
        btn_row.addWidget(self._install_btn)

        self._close_btn = QPushButton("Close")
        self._close_btn.clicked.connect(self.reject)
        btn_row.addWidget(self._close_btn)
        root.addLayout(btn_row)

        self._pending_install = False

    def _make_profile_tab(self) -> QWidget:
        w      = QWidget()
        layout = QVBoxLayout(w)

        row = QHBoxLayout()
        row.addWidget(QLabel("Profile:"))
        self._profile_combo = QComboBox()
        self._profile_combo.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        row.addWidget(self._profile_combo)

        browse_btn = QPushButton("Browse…")
        browse_btn.clicked.connect(self._browse_profile)
        row.addWidget(browse_btn)
        layout.addLayout(row)

        # Profile details (read-only)
        self._profile_detail = QLabel("")
        self._profile_detail.setWordWrap(True)
        layout.addWidget(self._profile_detail)
        layout.addStretch()

        self._profile_combo.currentIndexChanged.connect(self._update_profile_detail)
        return w

    def _make_custom_tab(self) -> QWidget:
        w      = QWidget()
        layout = QVBoxLayout(w)

        # Version
        row1 = QHBoxLayout()
        row1.addWidget(QLabel("Version:"))
        self._version_edit = QLineEdit()
        self._version_edit.setPlaceholderText("e.g. 6.12")
        row1.addWidget(self._version_edit)
        layout.addLayout(row1)

        # Flavor + arch
        row2 = QHBoxLayout()
        row2.addWidget(QLabel("Flavor:"))
        self._flavor_combo = QComboBox()
        for f in ["mainline", "xanmod", "cachyos", "zen", "rt", "tkg", "android", "custom"]:
            self._flavor_combo.addItem(f)
        row2.addWidget(self._flavor_combo)

        row2.addWidget(QLabel("Arch:"))
        self._arch_combo = QComboBox()
        host_arch = system_info().arch_raw
        for a in ["(host)", "x86_64", "aarch64", "arm", "riscv64"]:
            self._arch_combo.addItem(a)
        row2.addWidget(self._arch_combo)
        layout.addLayout(row2)

        # Compiler options
        compiler_box = QGroupBox("Compiler")
        cb_layout    = QHBoxLayout(compiler_box)
        self._llvm_cb = QCheckBox("Clang/LLVM")
        cb_layout.addWidget(self._llvm_cb)
        cb_layout.addWidget(QLabel("LTO:"))
        self._lto_combo = QComboBox()
        for lto in ["none", "thin", "full"]:
            self._lto_combo.addItem(lto)
        cb_layout.addWidget(self._lto_combo)
        cb_layout.addStretch()
        layout.addWidget(compiler_box)

        # Output format
        row3 = QHBoxLayout()
        row3.addWidget(QLabel("Output format:"))
        self._fmt_combo = QComboBox()
        for fmt in ["deb", "rpm", "pkg.tar.zst", "tar.gz", "efi-unified", "android-boot"]:
            self._fmt_combo.addItem(fmt)
        row3.addWidget(self._fmt_combo)
        row3.addStretch()
        layout.addLayout(row3)

        layout.addStretch()
        return w

    # ------------------------------------------------------------------
    # Profile helpers
    # ------------------------------------------------------------------

    def _populate_profiles(self) -> None:
        from lkm.core.providers.lkf_build import _find_profiles, _find_lkf_root
        profiles = _find_profiles(_find_lkf_root())
        if not profiles:
            self._profile_combo.addItem("No profiles found", "")
            self._build_btn.setEnabled(self._tabs.currentIndex() != 0)
            return
        for p in profiles:
            from lkm.core.providers.lkf_build import _parse_profile_name, _parse_profile_version
            label = f"{_parse_profile_name(p)}  ({_parse_profile_version(p)})"
            self._profile_combo.addItem(label, str(p))

    def _update_profile_detail(self, _: int) -> None:
        path = self._profile_combo.currentData()
        if not path:
            self._profile_detail.setText("")
            return
        try:
            text = Path(path).read_text()
            # Show first 8 lines of the TOML
            preview = "\n".join(text.splitlines()[:8])
            self._profile_detail.setText(f"<pre>{preview}</pre>")
        except OSError:
            self._profile_detail.setText("")

    def _browse_profile(self) -> None:
        path, _ = QFileDialog.getOpenFileName(
            self, "Select remix.toml", str(Path.home()), "TOML files (*.toml)"
        )
        if path:
            self._profile_combo.insertItem(0, Path(path).name, path)
            self._profile_combo.setCurrentIndex(0)

    def _change_output_dir(self) -> None:
        d = QFileDialog.getExistingDirectory(
            self, "Select output directory", str(self._provider.output_dir)
        )
        if d:
            self._provider._output_dir = Path(d)
            self._out_label.setText(d)

    # ------------------------------------------------------------------
    # Build actions
    # ------------------------------------------------------------------

    def _start_build(self) -> None:
        self._pending_install = False
        self._run_build()

    def _start_build_and_install(self) -> None:
        self._pending_install = True
        self._run_build()

    def _run_build(self) -> None:
        if self._worker and self._worker.isRunning():
            return

        self._log.clear()
        self._log.show_panel()
        self._build_btn.setEnabled(False)
        self._install_btn.setEnabled(False)

        mode = "profile" if self._tabs.currentIndex() == 0 else "custom"

        if mode == "profile":
            profile = self._profile_combo.currentData()
            if not profile:
                QMessageBox.warning(self, "No profile", "Select a profile first.")
                self._build_btn.setEnabled(True)
                self._install_btn.setEnabled(True)
                return
            self._worker = _BuildWorker(
                provider=self._provider,
                mode="profile",
                profile_path=profile,
            )
        else:
            version = self._version_edit.text().strip()
            if not version:
                QMessageBox.warning(self, "No version", "Enter a kernel version.")
                self._build_btn.setEnabled(True)
                self._install_btn.setEnabled(True)
                return
            arch_text = self._arch_combo.currentText()
            arch = "" if arch_text == "(host)" else arch_text
            self._worker = _BuildWorker(
                provider=self._provider,
                mode="custom",
                version=version,
                flavor=self._flavor_combo.currentText(),
                arch=arch,
                llvm=self._llvm_cb.isChecked(),
                lto=self._lto_combo.currentText(),
                output_fmt=self._fmt_combo.currentText(),
            )

        self._worker.line_ready.connect(self._log.append)
        self._worker.finished_ok.connect(self._on_build_done)
        self._worker.finished_err.connect(self._on_build_error)
        self._worker.start()

    @Slot(str)
    def _on_build_done(self, pkg_path: str) -> None:
        self._log.append("\n✓ Build complete.\n")
        if pkg_path:
            self._log.append(f"Package: {pkg_path}\n")
        self._build_btn.setEnabled(True)
        self._install_btn.setEnabled(True)

        if pkg_path:
            self.build_succeeded.emit(pkg_path)
            if self._pending_install:
                self.accept()   # close dialog; main window handles install

    @Slot(str)
    def _on_build_error(self, msg: str) -> None:
        self._log.append(f"\n✗ Build failed: {msg}\n")
        self._build_btn.setEnabled(True)
        self._install_btn.setEnabled(True)
