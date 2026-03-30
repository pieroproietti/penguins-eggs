"""Note editing dialog."""
from __future__ import annotations

from penguins_kernel_manager.qt import (
    QDialog,
    QDialogButtonBox,
    QLabel,
    QTextEdit,
    QVBoxLayout,
)


class NoteDialog(QDialog):

    def __init__(self, kernel_name: str, current_note: str = "", parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle(f"Note — {kernel_name}")
        self.setMinimumWidth(400)
        self._setup_ui(current_note)

    def _setup_ui(self, current_note: str) -> None:
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("Note:"))
        self._edit = QTextEdit()
        self._edit.setPlainText(current_note)
        self._edit.setMinimumHeight(80)
        layout.addWidget(self._edit)

        btns = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        btns.accepted.connect(self.accept)
        btns.rejected.connect(self.reject)
        layout.addWidget(btns)

    @property
    def note(self) -> str:
        return self._edit.toPlainText().strip()
