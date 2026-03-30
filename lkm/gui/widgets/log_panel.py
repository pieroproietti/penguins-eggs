"""Collapsible live log panel — shared by the kernel view and build dialogs."""
from __future__ import annotations

from lkm.qt import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QTextEdit, QSizePolicy, QFont, Qt, Slot,
)


class LogPanel(QWidget):
    """
    A collapsible text area that streams log output.

    Call append(line) from any thread via a Signal connection.
    """

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Toggle bar
        bar = QHBoxLayout()
        self._toggle_btn = QPushButton("▼ Log")
        self._toggle_btn.setFlat(True)
        self._toggle_btn.setCheckable(True)
        self._toggle_btn.setChecked(True)
        self._toggle_btn.clicked.connect(self._toggle)
        bar.addWidget(self._toggle_btn)

        self._clear_btn = QPushButton("Clear")
        self._clear_btn.setFlat(True)
        self._clear_btn.clicked.connect(self.clear)
        bar.addWidget(self._clear_btn)
        bar.addStretch()
        layout.addLayout(bar)

        # Log text area
        self._text = QTextEdit()
        self._text.setReadOnly(True)
        self._text.setLineWrapMode(QTextEdit.LineWrapMode.NoWrap)
        font = QFont("Monospace")
        font.setStyleHint(QFont.StyleHint.TypeWriter)
        font.setPointSize(9)
        self._text.setFont(font)
        self._text.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        layout.addWidget(self._text)

    @Slot(str)
    def append(self, text: str) -> None:
        self._text.insertPlainText(text)
        self._text.ensureCursorVisible()

    def clear(self) -> None:
        self._text.clear()

    def show_panel(self) -> None:
        self._text.setVisible(True)
        self._toggle_btn.setChecked(True)
        self._toggle_btn.setText("▼ Log")

    def hide_panel(self) -> None:
        self._text.setVisible(False)
        self._toggle_btn.setChecked(False)
        self._toggle_btn.setText("▶ Log")

    def _toggle(self, checked: bool) -> None:
        self._text.setVisible(checked)
        self._toggle_btn.setText("▼ Log" if checked else "▶ Log")
