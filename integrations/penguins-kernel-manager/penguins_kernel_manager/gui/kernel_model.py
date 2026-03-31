"""QAbstractTableModel wrapping a list of KernelEntry objects."""
from __future__ import annotations

from penguins_kernel_manager.core.kernel import KernelEntry, KernelStatus
from penguins_kernel_manager.qt import (
    QAbstractTableModel,
    QColor,
    QFont,
    QModelIndex,
    Qt,
)

_COLUMNS = ["Version", "Family", "Flavor", "Arch", "Status", "Notes"]
_COL_VERSION = 0
_COL_FAMILY  = 1
_COL_FLAVOR  = 2
_COL_ARCH    = 3
_COL_STATUS  = 4
_COL_NOTES   = 5

_STATUS_COLORS = {
    KernelStatus.RUNNING:   "#2ecc71",
    KernelStatus.INSTALLED: "#3498db",
    KernelStatus.HELD:      "#e67e22",
    KernelStatus.AVAILABLE: None,
}


class KernelTableModel(QAbstractTableModel):

    def __init__(self, entries: list[KernelEntry] | None = None, parent=None) -> None:
        super().__init__(parent)
        self._entries: list[KernelEntry] = entries or []

    def set_entries(self, entries: list[KernelEntry]) -> None:
        self.beginResetModel()
        self._entries = entries
        self.endResetModel()

    def entry_at(self, row: int) -> KernelEntry | None:
        if 0 <= row < len(self._entries):
            return self._entries[row]
        return None

    # ------------------------------------------------------------------
    # QAbstractTableModel interface
    # ------------------------------------------------------------------

    def rowCount(self, parent: QModelIndex = QModelIndex()) -> int:
        return len(self._entries)

    def columnCount(self, parent: QModelIndex = QModelIndex()) -> int:
        return len(_COLUMNS)

    def headerData(self, section: int, orientation, role=Qt.ItemDataRole.DisplayRole):
        if orientation == Qt.Orientation.Horizontal and role == Qt.ItemDataRole.DisplayRole:
            return _COLUMNS[section]
        return None

    def data(self, index: QModelIndex, role=Qt.ItemDataRole.DisplayRole):
        if not index.isValid():
            return None
        entry = self._entries[index.row()]
        col   = index.column()

        if role == Qt.ItemDataRole.DisplayRole:
            return self._display(entry, col)

        if role == Qt.ItemDataRole.ForegroundRole:
            color = _STATUS_COLORS.get(entry.status)
            if color:
                return QColor(color)

        if role == Qt.ItemDataRole.FontRole and entry.is_running:
            f = QFont()
            f.setBold(True)
            return f

        if role == Qt.ItemDataRole.UserRole:
            return entry

        return None

    def _display(self, entry: KernelEntry, col: int) -> str:
        if col == _COL_VERSION:
            return str(entry.version)
        if col == _COL_FAMILY:
            return entry.family.value
        if col == _COL_FLAVOR:
            return entry.flavor
        if col == _COL_ARCH:
            return entry.arch
        if col == _COL_STATUS:
            s = entry.status.value
            return s + " [held]" if entry.held else s
        if col == _COL_NOTES:
            return entry.notes[:60] if entry.notes else ""
        return ""
