"""QApplication entry point for lkm-gui."""
from __future__ import annotations

import sys

from lkm.gui.main_window import MainWindow
from lkm.qt import QApplication

_STYLESHEET = """
QMainWindow, QDialog {
    background-color: #1e1e2e;
    color: #cdd6f4;
}
QTabWidget::pane {
    border: 1px solid #45475a;
}
QTabBar::tab {
    background: #313244;
    color: #cdd6f4;
    padding: 6px 14px;
    border-radius: 4px 4px 0 0;
}
QTabBar::tab:selected {
    background: #89b4fa;
    color: #1e1e2e;
}
QTableView {
    background-color: #181825;
    alternate-background-color: #1e1e2e;
    gridline-color: #313244;
    color: #cdd6f4;
    selection-background-color: #45475a;
}
QHeaderView::section {
    background-color: #313244;
    color: #cdd6f4;
    padding: 4px;
    border: none;
}
QToolBar {
    background-color: #181825;
    border-bottom: 1px solid #313244;
    spacing: 4px;
}
QStatusBar {
    background-color: #181825;
    color: #a6adc8;
}
QPushButton {
    background-color: #313244;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 4px 12px;
}
QPushButton:hover  { background-color: #45475a; }
QPushButton:pressed { background-color: #585b70; }
QPushButton:default { border-color: #89b4fa; }
QLineEdit, QComboBox, QTextEdit, QSpinBox {
    background-color: #313244;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 2px 6px;
}
QGroupBox {
    border: 1px solid #45475a;
    border-radius: 4px;
    margin-top: 8px;
    color: #a6adc8;
}
QGroupBox::title {
    subcontrol-origin: margin;
    left: 8px;
    padding: 0 4px;
}
QCheckBox { color: #cdd6f4; }
QLabel    { color: #cdd6f4; }
"""


def main() -> None:
    app = QApplication(sys.argv)
    app.setApplicationName("lkm")
    app.setApplicationVersion("0.1.0")
    app.setStyleSheet(_STYLESHEET)

    win = MainWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
