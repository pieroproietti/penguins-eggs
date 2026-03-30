"""
PySide6 / PyQt6 compatibility shim.

Import Qt symbols from here rather than directly from PySide6 or PyQt6.
The binding is selected by the LKM_QT environment variable, falling back
to PySide6 then PyQt6.
"""
from __future__ import annotations

import os

_binding = os.environ.get("LKM_QT", "")

if _binding == "PyQt6":
    _use_pyqt6 = True
elif _binding == "PySide6":
    _use_pyqt6 = False
else:
    try:
        import PySide6  # noqa: F401
        _use_pyqt6 = False
    except ImportError:
        _use_pyqt6 = True

if _use_pyqt6:
    from PyQt6.QtCore import (
        QAbstractTableModel,
        QModelIndex,
        QSortFilterProxyModel,
        Qt,
        QThread,
        QTimer,
    )
    from PyQt6.QtCore import (
        pyqtSignal as Signal,
    )
    from PyQt6.QtCore import (
        pyqtSlot as Slot,
    )
    from PyQt6.QtGui import QColor, QFont, QIcon
    from PyQt6.QtWidgets import (
        QAbstractItemView,
        QAction,
        QApplication,
        QCheckBox,
        QComboBox,
        QDialog,
        QDialogButtonBox,
        QFileDialog,
        QGroupBox,
        QHBoxLayout,
        QHeaderView,
        QLabel,
        QLineEdit,
        QMainWindow,
        QMenu,
        QMessageBox,
        QPushButton,
        QSizePolicy,
        QSpinBox,
        QSplitter,
        QStatusBar,
        QTableView,
        QTabWidget,
        QTextEdit,
        QToolBar,
        QVBoxLayout,
        QWidget,
    )
else:
    from PySide6.QtCore import (
        QAbstractTableModel,
        QModelIndex,
        QSortFilterProxyModel,
        Qt,
        QThread,
        QTimer,
        Signal,
        Slot,
    )
    from PySide6.QtGui import QAction, QColor, QFont, QIcon
    from PySide6.QtWidgets import (
        QAbstractItemView,
        QApplication,
        QCheckBox,
        QComboBox,
        QDialog,
        QDialogButtonBox,
        QFileDialog,
        QGroupBox,
        QHBoxLayout,
        QHeaderView,
        QLabel,
        QLineEdit,
        QMainWindow,
        QMenu,
        QMessageBox,
        QPushButton,
        QSizePolicy,
        QSpinBox,
        QSplitter,
        QStatusBar,
        QTableView,
        QTabWidget,
        QTextEdit,
        QToolBar,
        QVBoxLayout,
        QWidget,
    )

__all__ = [
    "QApplication", "QMainWindow", "QWidget", "QDialog",
    "QVBoxLayout", "QHBoxLayout", "QLabel", "QComboBox",
    "QPushButton", "QCheckBox", "QDialogButtonBox",
    "QSizePolicy", "QTabWidget", "QTextEdit", "QLineEdit",
    "QSpinBox", "QGroupBox", "QSplitter", "QToolBar",
    "QStatusBar", "QMessageBox", "QFileDialog", "QAction",
    "QTableView", "QHeaderView", "QAbstractItemView", "QMenu",
    "Qt", "QThread", "QAbstractTableModel", "QModelIndex",
    "QSortFilterProxyModel", "Signal", "Slot", "QTimer",
    "QFont", "QColor", "QIcon",
]
