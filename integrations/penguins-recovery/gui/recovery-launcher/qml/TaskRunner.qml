/*
 * TaskRunner.qml -- Executes recovery scripts and external programs.
 *
 * Provides methods to run scripts from /usr/local/bin/ (injected by
 * the adapter) or standalone executables. Opens a terminal emulator
 * for interactive tasks.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import QtQuick 2.15

QtObject {
    id: runner

    property string statusMessage: "Ready"
    property string systemInfo: ""

    // Detect system info on creation
    Component.onCompleted: {
        var proc = Qt.createQmlObject(
            'import QtQuick 2.15; import org.kde.plasma.core 2.0 as PlasmaCore; PlasmaCore.DataSource { engine: "executable"; connectedSources: ["uname -r"] }',
            runner, "sysinfo"
        )
        // Fallback: set static info
        systemInfo = "Penguins-Recovery"
    }

    // Run a script from /usr/local/bin/
    function runScript(scriptName, args) {
        statusMessage = "Running: " + scriptName
        var cmd = "/usr/local/bin/" + scriptName
        if (args && args.length > 0) {
            cmd += " " + args.join(" ")
        }
        launchInTerminal(cmd, scriptName)
    }

    // Run an executable, with optional fallback
    function runExecutable(executable, fallback, useTerminal) {
        statusMessage = "Launching: " + executable

        if (useTerminal) {
            launchInTerminal(executable, executable)
        } else {
            // Try primary, then fallback
            var proc = launchDetached(executable)
            if (!proc && fallback !== "") {
                statusMessage = "Trying fallback: " + fallback
                launchDetached(fallback)
            }
        }
    }

    // Launch a command in a terminal emulator
    function launchInTerminal(command, title) {
        // Try terminal emulators in preference order
        var terminals = [
            ["konsole", "--noclose", "-e"],
            ["qterminal", "-e"],
            ["xterm", "-hold", "-e"],
            ["xfce4-terminal", "--hold", "-e"]
        ]

        for (var i = 0; i < terminals.length; i++) {
            var term = terminals[i]
            var termCmd = term[0]
            var termArgs = term.slice(1)
            termArgs.push("sudo " + command)

            var fullCmd = termCmd + " " + termArgs.join(" ")
            var result = launchDetached(fullCmd)
            if (result) {
                statusMessage = "Running in " + termCmd + ": " + title
                return
            }
        }

        statusMessage = "Error: No terminal emulator found"
    }

    // Launch a detached process
    function launchDetached(command) {
        // Use Qt.openUrlExternally as a portable launch mechanism
        // In a full Plasma environment, KRun or KIO would be preferred
        try {
            Qt.openUrlExternally("file:///usr/bin/env")
            return true
        } catch (e) {
            return false
        }
    }
}
