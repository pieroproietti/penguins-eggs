import {
  QMainWindow,
  QWidget,
  QLabel,
  QPushButton,
  QBoxLayout,
  Direction,
  QTabWidget,
  QPlainTextEdit,
  QStatusBar,
  QIcon,
  WindowType,
} from "@nodegui/nodegui";
import { DaemonClient } from "./client";

const client = new DaemonClient();

// Stylesheet matching eggsmaker's dark theme
const STYLESHEET = `
  #mainWindow {
    background-color: #051226;
  }
  QLabel {
    color: #ffffff;
    font-size: 14px;
  }
  QLabel#title {
    color: #00BFFF;
    font-size: 18px;
    font-weight: bold;
  }
  QLabel#version {
    color: #ffffff;
    font-size: 15px;
    font-weight: bold;
  }
  QPushButton {
    background-color: #0E48C5;
    color: #ffffff;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: bold;
    min-width: 150px;
  }
  QPushButton:hover {
    background-color: #1741a6;
  }
  QPushButton:disabled {
    background-color: #333333;
    color: #666666;
  }
  QPushButton#danger {
    background-color: #ff052b;
  }
  QPushButton#danger:hover {
    background-color: #a8001a;
  }
  QPushButton#success {
    background-color: #006400;
  }
  QPushButton#success:hover {
    background-color: #005000;
  }
  QPlainTextEdit#terminal {
    background-color: #0e1010;
    color: #87CEFA;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 13px;
    border: 1px solid #444C5E;
    border-radius: 10px;
  }
  QTabWidget::pane {
    border: 1px solid #444C5E;
    background-color: #001835;
  }
  QTabBar::tab {
    background-color: #001835;
    color: #888888;
    padding: 8px 16px;
    font-size: 14px;
  }
  QTabBar::tab:selected {
    color: #FD8637;
    font-weight: bold;
    border-bottom: 2px solid #FD8637;
  }
  QStatusBar {
    background-color: #001835;
    color: #ffffff;
  }
`;

async function main() {
  // Connect to daemon
  try {
    await client.connect();
  } catch (err) {
    console.error("Failed to connect to eggs-gui daemon. Is it running?");
    console.error("Start it with: eggs-daemon");
    process.exit(1);
  }

  const win = new QMainWindow();
  win.setObjectName("mainWindow");
  win.setWindowTitle("eggs-gui");
  win.setMinimumSize(1024, 768);
  win.setStyleSheet(STYLESHEET);

  const centralWidget = new QWidget();
  const rootLayout = new QBoxLayout(Direction.TopToBottom);
  centralWidget.setLayout(rootLayout);

  // Tab widget
  const tabs = new QTabWidget();

  // --- Main Tab ---
  const mainTab = new QWidget();
  const mainLayout = new QBoxLayout(Direction.TopToBottom);
  mainTab.setLayout(mainLayout);

  // Terminal output
  const terminal = new QPlainTextEdit();
  terminal.setObjectName("terminal");
  terminal.setReadOnly(true);
  terminal.setPlainText("Ready.\n");
  mainLayout.addWidget(terminal);

  // Phase buttons row
  const buttonRow = new QWidget();
  const buttonLayout = new QBoxLayout(Direction.LeftToRight);
  buttonRow.setLayout(buttonLayout);

  const btnPrepare = new QPushButton();
  btnPrepare.setText("Phase 1: Prepare");
  btnPrepare.addEventListener("clicked", async () => {
    terminal.setPlainText("");
    appendOutput(terminal, "=== Phase 1: Prepare ===\n");
    try {
      await client.callStream(
        "eggs.dad",
        { default: true },
        (line) => appendOutput(terminal, line + "\n")
      );
      appendOutput(terminal, "\n✅ Preparation complete.\n");
    } catch (err) {
      appendOutput(terminal, `\n❌ Error: ${err}\n`);
    }
  });
  buttonLayout.addWidget(btnPrepare);

  const btnProduce = new QPushButton();
  btnProduce.setText("Phase 3: Produce");
  btnProduce.addEventListener("clicked", async () => {
    terminal.setPlainText("");
    appendOutput(terminal, "=== Phase 3: Produce ISO ===\n");
    try {
      await client.callStream("eggs.produce", {}, (line) =>
        appendOutput(terminal, line + "\n")
      );
      appendOutput(terminal, "\n✅ ISO produced.\n");
    } catch (err) {
      appendOutput(terminal, `\n❌ Error: ${err}\n`);
    }
  });
  buttonLayout.addWidget(btnProduce);

  const btnKill = new QPushButton();
  btnKill.setText("Kill ISOs");
  btnKill.setObjectName("danger");
  btnKill.addEventListener("clicked", async () => {
    appendOutput(terminal, "\n=== Killing ISOs ===\n");
    try {
      await client.callStream("eggs.kill", {}, (line) =>
        appendOutput(terminal, line + "\n")
      );
      appendOutput(terminal, "\n✅ ISOs killed.\n");
    } catch (err) {
      appendOutput(terminal, `\n❌ Error: ${err}\n`);
    }
  });
  buttonLayout.addWidget(btnKill);

  const btnAuto = new QPushButton();
  btnAuto.setText("AUTO");
  btnAuto.setObjectName("success");
  btnAuto.addEventListener("clicked", async () => {
    terminal.setPlainText("");
    appendOutput(terminal, "=== AUTO MODE ===\n");
    try {
      // Phase 1
      appendOutput(terminal, "\n--- Phase 1: Prepare ---\n");
      await client.callStream("eggs.kill", { nointeractive: true }, (line) =>
        appendOutput(terminal, line + "\n")
      );
      await client.callStream("tools.clean", { nointeractive: true }, (line) =>
        appendOutput(terminal, line + "\n")
      );
      await client.callStream("eggs.dad", { default: true }, (line) =>
        appendOutput(terminal, line + "\n")
      );

      // Phase 3
      appendOutput(terminal, "\n--- Phase 3: Produce ---\n");
      await client.callStream("eggs.produce", {}, (line) =>
        appendOutput(terminal, line + "\n")
      );

      appendOutput(terminal, "\n✅ AUTO mode complete.\n");
    } catch (err) {
      appendOutput(terminal, `\n❌ Error: ${err}\n`);
    }
  });
  buttonLayout.addWidget(btnAuto);

  mainLayout.addWidget(buttonRow);
  tabs.addTab(mainTab, new QIcon(), "Main");

  // --- Wardrobe Tab ---
  const wardrobeTab = new QWidget();
  const wardrobeLayout = new QBoxLayout(Direction.TopToBottom);
  wardrobeTab.setLayout(wardrobeLayout);

  const wardrobeLabel = new QLabel();
  wardrobeLabel.setObjectName("title");
  wardrobeLabel.setText("Wardrobe");
  wardrobeLayout.addWidget(wardrobeLabel);

  const wardrobeInfo = new QLabel();
  wardrobeInfo.setText("Browse costumes, accessories, and servers from ~/.wardrobe");
  wardrobeLayout.addWidget(wardrobeInfo);

  const btnWardrobeGet = new QPushButton();
  btnWardrobeGet.setText("Download Wardrobe");
  btnWardrobeGet.addEventListener("clicked", async () => {
    try {
      await client.callStream("wardrobe.get", {}, (line) =>
        appendOutput(terminal, line + "\n")
      );
    } catch (err) {
      console.error(err);
    }
  });
  wardrobeLayout.addWidget(btnWardrobeGet);

  tabs.addTab(wardrobeTab, new QIcon(), "Wardrobe");

  // --- Config Tab ---
  const configTab = new QWidget();
  const configLayout = new QBoxLayout(Direction.TopToBottom);
  configTab.setLayout(configLayout);

  const configLabel = new QLabel();
  configLabel.setObjectName("title");
  configLabel.setText("Configuration");
  configLayout.addWidget(configLabel);

  tabs.addTab(configTab, new QIcon(), "Config");

  // --- Tools Tab ---
  const toolsTab = new QWidget();
  const toolsLayout = new QBoxLayout(Direction.TopToBottom);
  toolsTab.setLayout(toolsLayout);

  const toolsLabel = new QLabel();
  toolsLabel.setObjectName("title");
  toolsLabel.setText("Tools");
  toolsLayout.addWidget(toolsLabel);

  const toolButtons = [
    { text: "Clean", method: "tools.clean" },
    { text: "PPA Add", method: "tools.ppa.add" },
    { text: "PPA Remove", method: "tools.ppa.remove" },
    { text: "Skel", method: "tools.skel" },
    { text: "Yolk", method: "tools.yolk" },
    { text: "Install Calamares", method: "calamares.install" },
    { text: "Remove Calamares", method: "calamares.remove" },
  ];

  for (const tb of toolButtons) {
    const btn = new QPushButton();
    btn.setText(tb.text);
    btn.addEventListener("clicked", async () => {
      tabs.setCurrentIndex(0); // switch to main tab to see output
      appendOutput(terminal, `\n=== ${tb.text} ===\n`);
      try {
        await client.callStream(tb.method, { nointeractive: true }, (line) =>
          appendOutput(terminal, line + "\n")
        );
        appendOutput(terminal, `\n✅ ${tb.text} complete.\n`);
      } catch (err) {
        appendOutput(terminal, `\n❌ Error: ${err}\n`);
      }
    });
    toolsLayout.addWidget(btn);
  }

  tabs.addTab(toolsTab, new QIcon(), "Tools");

  rootLayout.addWidget(tabs);

  // Version bar
  const statusBar = new QStatusBar();
  win.setStatusBar(statusBar);

  // Fetch versions on startup
  try {
    const versions = (await client.call("system.versions")) as {
      eggs: string;
      calamares: string;
      distro: string;
    };
    statusBar.showMessage(
      `Eggs: ${versions.eggs}  |  Calamares: ${versions.calamares}  |  ${versions.distro}  |  eggs-gui v1.0.0`,
      0
    );
  } catch {
    statusBar.showMessage("eggs-gui v1.0.0", 0);
  }

  win.setCentralWidget(centralWidget);
  win.show();

  (global as any).win = win; // prevent GC
}

function appendOutput(terminal: QPlainTextEdit, text: string) {
  terminal.insertPlainText(text);
  // Scroll to bottom
  const cursor = terminal.textCursor();
  cursor.movePosition(11); // MoveEnd
  terminal.setTextCursor(cursor);
}

main().catch(console.error);
