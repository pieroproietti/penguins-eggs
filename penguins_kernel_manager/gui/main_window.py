"""
Main application window.

Layout:
  Toolbar  — Refresh | Build… | Remove Old | About
  Tab bar  — All | Mainline | XanMod | Liquorix | Distro | lkf Build | Gentoo | Void | NixOS
  Table    — KernelView (filterable, sortable)
  Log      — collapsible live log panel at the bottom

Right-click context menu on any kernel row:
  Install / Remove / Hold / Unhold / Edit Note
"""
from __future__ import annotations

from penguins_kernel_manager.core.kernel import KernelEntry, KernelFamily
from penguins_kernel_manager.core.manager import KernelManager
from penguins_kernel_manager.gui.widgets.kernel_view import KernelView
from penguins_kernel_manager.gui.widgets.log_panel import LogPanel
from penguins_kernel_manager.gui.widgets.note_dialog import NoteDialog
from penguins_kernel_manager.qt import (
    QAction,
    QMainWindow,
    QMenu,
    QMessageBox,
    QStatusBar,
    Qt,
    QTabWidget,
    QThread,
    QToolBar,
    QVBoxLayout,
    QWidget,
    Signal,
    Slot,
)

# ---------------------------------------------------------------------------
# Background worker for streaming operations
# ---------------------------------------------------------------------------

class _OpWorker(QThread):
    line_ready   = Signal(str)
    finished_ok  = Signal()
    finished_err = Signal(str)

    def __init__(self, gen_fn) -> None:
        super().__init__()
        self._gen_fn = gen_fn

    def run(self) -> None:
        try:
            for line in self._gen_fn():
                self.line_ready.emit(line)
            self.finished_ok.emit()
        except Exception as e:
            self.finished_err.emit(str(e))


# ---------------------------------------------------------------------------
# Main window
# ---------------------------------------------------------------------------

class MainWindow(QMainWindow):

    def __init__(self) -> None:
        super().__init__()
        self._mgr    = KernelManager()
        self._worker: _OpWorker | None = None
        # Full unfiltered entry list — KernelView tabs each hold a filtered copy
        self._all_entries: list[KernelEntry] = []

        self.setWindowTitle("penguins-kernel-manager — Penguins Kernel Manager")
        self.setMinimumSize(1000, 640)
        self._setup_ui()
        self._check_warnings()
        self._refresh(background=False)

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _setup_ui(self) -> None:
        # Toolbar
        tb = QToolBar("Main")
        tb.setMovable(False)
        self.addToolBar(tb)

        self._refresh_action = QAction("⟳ Refresh", self)
        self._refresh_action.setShortcut("F5")
        self._refresh_action.triggered.connect(lambda: self._refresh(background=True))
        tb.addAction(self._refresh_action)

        tb.addSeparator()

        self._build_action = QAction("⚙ Build…", self)
        self._build_action.triggered.connect(self._open_build_dialog)
        tb.addAction(self._build_action)
        # Disable if lkf not available
        if self._mgr.lkf_provider is None:
            self._build_action.setEnabled(False)
            self._build_action.setToolTip("lkf is not installed")

        tb.addSeparator()

        remove_old_action = QAction("🗑 Remove Old…", self)
        remove_old_action.triggered.connect(self._remove_old)
        tb.addAction(remove_old_action)

        tb.addSeparator()

        about_action = QAction("? About", self)
        about_action.triggered.connect(self._about)
        tb.addAction(about_action)

        # Central widget
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(4, 4, 4, 4)

        # Tabs — one per family + "All"
        self._tabs = QTabWidget()
        self._views: dict[str, KernelView] = {}

        tab_specs = [
            ("All",       None),
            ("Mainline",  KernelFamily.MAINLINE),
            ("XanMod",    KernelFamily.XANMOD),
            ("Liquorix",  KernelFamily.LIQUORIX),
            ("Distro",    KernelFamily.DISTRO),
            ("lkf Build", KernelFamily.LKF_BUILD),
            ("Gentoo",    KernelFamily.GENTOO),
        ]
        for label, family in tab_specs:
            view = KernelView()
            view.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
            view.customContextMenuRequested.connect(
                lambda pos, v=view: self._context_menu(v, pos)
            )
            self._views[label] = view
            self._tabs.addTab(view, label)

        layout.addWidget(self._tabs)

        # Log panel
        self._log = LogPanel()
        self._log.hide_panel()
        layout.addWidget(self._log)

        # Status bar
        self._status = QStatusBar()
        self.setStatusBar(self._status)
        self._status.showMessage("Ready")

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def _refresh(self, background: bool = True) -> None:
        self._status.showMessage("Refreshing kernel list…")
        self._refresh_action.setEnabled(False)

        def _load():
            return self._mgr.list_all(refresh=background)

        # For listing we don't need streaming; just call synchronously in a thread
        self._list_worker = QThread()

        class _Lister(QThread):
            done = Signal(list)
            def run(self_):
                entries = self._mgr.list_all(refresh=background)
                self_.done.emit(entries)

        self._lister = _Lister()
        self._lister.done.connect(self._on_entries_loaded)
        self._lister.start()

    @Slot(list)
    def _on_entries_loaded(self, entries: list[KernelEntry]) -> None:
        self._all_entries = entries
        self._populate_tabs(entries)
        self._refresh_action.setEnabled(True)
        self._status.showMessage(f"{len(entries)} kernels loaded")

    def _populate_tabs(self, entries: list[KernelEntry]) -> None:
        family_map = {
            "All":       None,
            "Mainline":  KernelFamily.MAINLINE,
            "XanMod":    KernelFamily.XANMOD,
            "Liquorix":  KernelFamily.LIQUORIX,
            "Distro":    KernelFamily.DISTRO,
            "lkf Build": KernelFamily.LKF_BUILD,
            "Gentoo":    KernelFamily.GENTOO,
        }
        for label, family in family_map.items():
            view = self._views.get(label)
            if view is None:
                continue
            filtered = entries if family is None else [e for e in entries if e.family == family]
            view.set_entries(filtered)

    # ------------------------------------------------------------------
    # Context menu
    # ------------------------------------------------------------------

    def _context_menu(self, view: KernelView, pos) -> None:
        entry = view.selected_entry()
        if entry is None:
            return

        menu = QMenu(self)

        if not entry.is_installed:
            install_act = menu.addAction("Install")
            install_act.triggered.connect(lambda: self._install(entry))
        else:
            remove_act = menu.addAction("Remove")
            remove_act.triggered.connect(lambda: self._remove(entry))

            if entry.held:
                unhold_act = menu.addAction("Unhold")
                unhold_act.triggered.connect(lambda: self._unhold(entry))
            else:
                hold_act = menu.addAction("Hold")
                hold_act.triggered.connect(lambda: self._hold(entry))

        menu.addSeparator()
        note_act = menu.addAction("Edit Note…")
        note_act.triggered.connect(lambda: self._edit_note(entry))

        # Gentoo compile shortcut
        if entry.family == KernelFamily.GENTOO and entry.local_path:
            menu.addSeparator()
            compile_act = menu.addAction("Compile…")
            compile_act.triggered.connect(lambda: self._gentoo_compile(entry))

        menu.exec(view._table.viewport().mapToGlobal(pos))

    # ------------------------------------------------------------------
    # Operations
    # ------------------------------------------------------------------

    def _run_op(self, gen_fn, success_msg: str) -> None:
        """Run a streaming operation in a background thread."""
        if self._worker and self._worker.isRunning():
            QMessageBox.warning(self, "Busy", "Another operation is in progress.")
            return
        self._log.clear()
        self._log.show_panel()
        self._worker = _OpWorker(gen_fn)
        self._worker.line_ready.connect(self._log.append)
        self._worker.finished_ok.connect(lambda: self._op_done(success_msg))
        self._worker.finished_err.connect(self._op_error)
        self._worker.start()

    @Slot()
    def _op_done(self, msg: str) -> None:
        self._log.append(f"\n✓ {msg}\n")
        self._status.showMessage(msg)
        self._refresh(background=False)

    @Slot(str)
    def _op_error(self, msg: str) -> None:
        self._log.append(f"\n✗ {msg}\n")
        self._status.showMessage(f"Error: {msg}")
        QMessageBox.critical(self, "Operation failed", msg)

    def _install(self, entry: KernelEntry) -> None:
        self._run_op(
            lambda: self._mgr.install(entry),
            f"Installed {entry.display_name}",
        )

    def _remove(self, entry: KernelEntry) -> None:
        if QMessageBox.question(
            self, "Confirm remove",
            f"Remove {entry.display_name}?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        ) != QMessageBox.StandardButton.Yes:
            return
        self._run_op(
            lambda: self._mgr.remove(entry),
            f"Removed {entry.display_name}",
        )

    def _hold(self, entry: KernelEntry) -> None:
        rc, _, err = self._mgr.hold(entry)
        if rc != 0:
            QMessageBox.critical(self, "Hold failed", err)
        else:
            self._status.showMessage(f"Held {entry.display_name}")
            self._refresh(background=False)

    def _unhold(self, entry: KernelEntry) -> None:
        rc, _, err = self._mgr.unhold(entry)
        if rc != 0:
            QMessageBox.critical(self, "Unhold failed", err)
        else:
            self._status.showMessage(f"Unheld {entry.display_name}")
            self._refresh(background=False)

    def _edit_note(self, entry: KernelEntry) -> None:
        dlg = NoteDialog(entry.display_name, entry.notes, self)
        if dlg.exec():
            self._mgr.set_note(entry, dlg.note)
            self._refresh(background=False)

    def _gentoo_compile(self, entry: KernelEntry) -> None:
        from penguins_kernel_manager.core.providers.gentoo import GentooProvider
        from penguins_kernel_manager.gui.widgets.gentoo_compile_dialog import GentooCompileDialog
        prov = self._mgr.provider("gentoo")
        if prov is None or not isinstance(prov, GentooProvider):
            QMessageBox.warning(self, "Unavailable", "Gentoo provider not available.")
            return
        dlg = GentooCompileDialog(prov, self)
        dlg.exec()

    def _remove_old(self) -> None:
        self._run_op(
            lambda: self._mgr.remove_old(keep=1),
            "Removed old kernels",
        )

    # ------------------------------------------------------------------
    # Build dialog (task D)
    # ------------------------------------------------------------------

    def _open_build_dialog(self) -> None:
        lkf = self._mgr.lkf_provider
        if lkf is None:
            QMessageBox.warning(
                self, "lkf not found",
                "lkf is not installed or not on PATH.\n\n"
                "Clone https://github.com/Interested-Deving-1896/lkf "
                "and run 'make install'.",
            )
            return

        from penguins_kernel_manager.gui.widgets.lkf_build_dialog import LkfBuildDialog
        dlg = LkfBuildDialog(lkf, self)
        dlg.build_succeeded.connect(self._on_build_succeeded)
        dlg.exec()

    @Slot(str)
    def _on_build_succeeded(self, pkg_path: str) -> None:
        """Called when LkfBuildDialog reports a successful build."""
        if not pkg_path:
            self._refresh(background=False)
            return

        reply = QMessageBox.question(
            self,
            "Build complete",
            f"Build succeeded.\n\nInstall {pkg_path}?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if reply == QMessageBox.StandardButton.Yes:
            self._run_op(
                lambda: self._mgr.install_local(pkg_path),
                f"Installed {pkg_path}",
            )
        else:
            self._refresh(background=False)

    # ------------------------------------------------------------------
    # Warnings / About
    # ------------------------------------------------------------------

    def _check_warnings(self) -> None:
        for warn_fn in (self._mgr.secure_boot_warning, self._mgr.nixos_build_warning):
            msg = warn_fn()
            if msg:
                QMessageBox.warning(self, "Warning", msg)

    def _about(self) -> None:
        QMessageBox.about(
            self,
            "About penguins-kernel-manager",
            "<b>penguins-kernel-manager — Penguins Kernel Manager</b><br>"
            "Version 0.1.0<br><br>"
            "Merged from <b>lkf</b> (Linux Kernel Framework) and "
            "<b>ukm</b> (Universal Kernel Manager).<br><br>"
            "Supports apt, pacman, dnf, zypper, apk, portage, xbps, and nix.<br>"
            "Distro-agnostic · Architecture-agnostic · GPL-3.0-or-later",
        )
