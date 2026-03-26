/*
 * TaskButton.qml -- A clickable recovery task card.
 *
 * Displays an icon, title, and description. On click, executes either
 * a script from common/scripts/ or a standalone executable.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: taskButton

    property string category: ""
    property string title: ""
    property string description: ""
    property string icon: ""
    property string script: ""
    property var scriptArgs: []
    property string executable: ""
    property string fallbackExecutable: ""
    property bool terminal: false

    Layout.fillWidth: true
    Layout.preferredHeight: 120
    radius: 12
    color: mouseArea.containsMouse ? "#2a2a4e" : "#1e1e3a"
    border.color: mouseArea.containsMouse ? "#533483" : "#2a2a4e"
    border.width: 1

    Behavior on color { ColorAnimation { duration: 150 } }
    Behavior on border.color { ColorAnimation { duration: 150 } }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor

        onClicked: {
            if (taskButton.script !== "") {
                taskRunner.runScript(taskButton.script, taskButton.scriptArgs)
            } else if (taskButton.executable !== "") {
                taskRunner.runExecutable(
                    taskButton.executable,
                    taskButton.fallbackExecutable,
                    taskButton.terminal
                )
            }
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // Icon
        Rectangle {
            Layout.preferredWidth: 56
            Layout.preferredHeight: 56
            radius: 12
            color: {
                switch (taskButton.category) {
                    case "boot":    return "#1a3a5c"
                    case "disk":    return "#1a4a3c"
                    case "system":  return "#4a1a3c"
                    case "network": return "#3c3a1a"
                    default:        return "#2a2a4e"
                }
            }

            Image {
                anchors.centerIn: parent
                source: taskButton.icon
                sourceSize.width: 32
                sourceSize.height: 32
                fillMode: Image.PreserveAspectFit
                smooth: true
            }
        }

        // Text
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 4

            Label {
                text: taskButton.title
                font.pixelSize: 16
                font.bold: true
                color: "#e0e0e0"
                elide: Text.ElideRight
                Layout.fillWidth: true
            }

            Label {
                text: taskButton.description
                font.pixelSize: 12
                color: "#a0a0a0"
                wrapMode: Text.WordWrap
                Layout.fillWidth: true
                maximumLineCount: 2
                elide: Text.ElideRight
            }
        }

        // Arrow indicator
        Label {
            text: "›"
            font.pixelSize: 24
            color: "#606080"
            Layout.alignment: Qt.AlignVCenter
        }
    }
}
