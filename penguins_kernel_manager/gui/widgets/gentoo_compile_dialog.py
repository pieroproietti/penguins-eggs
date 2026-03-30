"""
Gentoo kernel compilation dialog.

Lets the user pick a source tree, choose genkernel vs make,
set job count, and stream compilation output live.
"""
from __future__ import annotations

import os

from penguins_kernel_manager.core.providers.gentoo import GentooProvider
from penguins_kernel_manager.gui.widgets.log_panel import LogPanel
from penguins_kernel_manager.qt import (
    QCheckBox,
    QComboBox,
    QDialog,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QSizePolicy,
    QThread,
    QVBoxLayout,
    Signal,
    Slot,
)


class _CompileWorker(QThread):
    line_ready   = Signal(str)
    finished_ok  = Signal()
    finished_err = Signal(str)

    def __init__(self, provider: GentooProvider, src: str,
                 use_genkernel: bool, jobs: int) -> None:
        super().__init__()
        self._provider      = provider
        self._src           = src
        self._use_genkernel = use_genkernel
        self._jobs          = jobs

    def run(self) -> None:
        try:
            for line in self._provider.compile(self._src, self._use_genkernel, self._jobs):
                self.line_ready.emit(line)
            self.finished_ok.emit()
        except Exception as e:
            self.finished_err.emit(str(e))


class GentooCompileDialog(QDialog):

    def __init__(self, provider: GentooProvider, parent=None) -> None:
        super().__init__(parent)
        self._provider = provider
        self._worker: _CompileWorker | None = None
        self.setWindowTitle("Compile Gentoo Kernel")
        self.setMinimumSize(640, 480)
        self._setup_ui()
        self._load_sources()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)

        row1 = QHBoxLayout()
        row1.addWidget(QLabel("Source tree:"))
        self._src_combo = QComboBox()
        self._src_combo.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        row1.addWidget(self._src_combo)
        layout.addLayout(row1)

        row2 = QHBoxLayout()
        self._genkernel_cb = QCheckBox("Use genkernel")
        self._genkernel_cb.setChecked(self._provider._backend.has_genkernel())
        row2.addWidget(self._genkernel_cb)
        row2.addWidget(QLabel("Jobs:"))
        self._jobs_combo = QComboBox()
        cpus = os.cpu_count() or 1
        self._jobs_combo.addItem("Auto", 0)
        for j in range(1, cpus + 1):
            self._jobs_combo.addItem(str(j), j)
        row2.addWidget(self._jobs_combo)
        row2.addStretch()
        layout.addLayout(row2)

        self._log = LogPanel()
        layout.addWidget(self._log)

        self._compile_btn = QPushButton("Compile")
        self._compile_btn.clicked.connect(self._start_compile)
        self._close_btn = QPushButton("Close")
        self._close_btn.clicked.connect(self.reject)
        btn_row = QHBoxLayout()
        btn_row.addStretch()
        btn_row.addWidget(self._compile_btn)
        btn_row.addWidget(self._close_btn)
        layout.addLayout(btn_row)

    def _load_sources(self) -> None:
        sources = self._provider._backend.list_kernel_sources()
        for s in sources:
            self._src_combo.addItem(s, s)
        if not sources:
            self._compile_btn.setEnabled(False)
            self._log.append(
                "No kernel source trees found under /usr/src/.\n"
                "Install a *-sources package first.\n"
            )

    def _start_compile(self) -> None:
        src = self._src_combo.currentData()
        if not src:
            return
        use_genkernel = self._genkernel_cb.isChecked()
        jobs          = self._jobs_combo.currentData()
        self._compile_btn.setEnabled(False)
        self._log.clear()
        self._log.show_panel()
        self._worker = _CompileWorker(self._provider, src, use_genkernel, jobs)
        self._worker.line_ready.connect(self._log.append)
        self._worker.finished_ok.connect(self._on_done)
        self._worker.finished_err.connect(self._on_error)
        self._worker.start()

    @Slot()
    def _on_done(self) -> None:
        self._log.append("\n✓ Compilation complete.\n")
        self._compile_btn.setEnabled(True)

    @Slot(str)
    def _on_error(self, msg: str) -> None:
        self._log.append(f"\n✗ Error: {msg}\n")
        self._compile_btn.setEnabled(True)
