"""Filterable, sortable kernel table widget."""
from __future__ import annotations

from lkm.core.kernel import KernelEntry, KernelFamily
from lkm.gui.kernel_model import KernelTableModel
from lkm.qt import (
    QAbstractItemView,
    QComboBox,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QLineEdit,
    QSortFilterProxyModel,
    Qt,
    QTableView,
    QVBoxLayout,
    QWidget,
    Signal,
)


class KernelView(QWidget):
    """
    A table of KernelEntry objects with a search bar and family/status filters.

    Emits selection_changed(entry) when the selected row changes.
    """

    selection_changed = Signal(object)  # KernelEntry | None

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._model = KernelTableModel()
        self._proxy = QSortFilterProxyModel()
        self._proxy.setSourceModel(self._model)
        self._proxy.setFilterCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self._proxy.setFilterKeyColumn(-1)  # search all columns
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Filter bar
        bar = QHBoxLayout()
        bar.addWidget(QLabel("Search:"))
        self._search = QLineEdit()
        self._search.setPlaceholderText("version, flavor, …")
        self._search.textChanged.connect(self._proxy.setFilterFixedString)
        bar.addWidget(self._search)

        bar.addWidget(QLabel("Family:"))
        self._family_combo = QComboBox()
        self._family_combo.addItem("All", None)
        for f in KernelFamily:
            self._family_combo.addItem(f.value, f)
        self._family_combo.currentIndexChanged.connect(self._apply_family_filter)
        bar.addWidget(self._family_combo)

        bar.addWidget(QLabel("Status:"))
        self._status_combo = QComboBox()
        for s in ["All", "available", "installed", "running", "held"]:
            self._status_combo.addItem(s)
        self._status_combo.currentIndexChanged.connect(self._apply_status_filter)
        bar.addWidget(self._status_combo)

        layout.addLayout(bar)

        # Table
        self._table = QTableView()
        self._table.setModel(self._proxy)
        self._table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self._table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self._table.setSortingEnabled(True)
        self._table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.ResizeToContents)
        self._table.horizontalHeader().setStretchLastSection(True)
        self._table.verticalHeader().setVisible(False)
        self._table.setAlternatingRowColors(True)
        self._table.selectionModel().selectionChanged.connect(self._on_selection)
        layout.addWidget(self._table)

    def set_entries(self, entries: list[KernelEntry]) -> None:
        self._model.set_entries(entries)

    def selected_entry(self) -> KernelEntry | None:
        indexes = self._table.selectionModel().selectedRows()
        if not indexes:
            return None
        src_idx = self._proxy.mapToSource(indexes[0])
        return self._model.entry_at(src_idx.row())

    def _on_selection(self) -> None:
        self.selection_changed.emit(self.selected_entry())

    def _apply_family_filter(self, _: int) -> None:
        # Re-apply combined filter
        self._apply_combined_filter()

    def _apply_status_filter(self, _: int) -> None:
        self._apply_combined_filter()

    def _apply_combined_filter(self) -> None:
        family = self._family_combo.currentData()
        status = self._status_combo.currentText()

        # Use a custom filter function via a subclassed proxy would be cleaner,
        # but for simplicity we filter the source model directly.
        entries = self._model._entries  # access underlying list
        # Re-filter by rebuilding the proxy filter string — simplest approach
        # that doesn't require subclassing QSortFilterProxyModel.
        # We store the full entry list on the model and re-set a filtered view.
        # This is acceptable for the typical kernel count (<200 entries).
        filtered = [
            e for e in entries
            if (family is None or e.family == family)
            and (status == "All" or e.status.value == status)
        ]
        # Temporarily swap model entries for the proxy
        self._model.beginResetModel()
        self._model._entries = filtered
        self._model.endResetModel()
