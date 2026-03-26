/*
 * Penguins-Recovery Launcher
 * Main QML entry point -- fullscreen grid of recovery tasks.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

ApplicationWindow {
    id: root
    visible: true
    visibility: Window.FullScreen
    title: "Penguins-Recovery"
    color: "#1a1a2e"

    property int taskColumns: width > 1200 ? 4 : (width > 800 ? 3 : 2)

    // Header
    Rectangle {
        id: header
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 80
        color: "#16213e"

        RowLayout {
            anchors.fill: parent
            anchors.margins: 16
            spacing: 16

            Image {
                source: "../resources/logo.svg"
                sourceSize.height: 48
                sourceSize.width: 48
                fillMode: Image.PreserveAspectFit
                Layout.preferredHeight: 48
                Layout.preferredWidth: 48
            }

            ColumnLayout {
                spacing: 2
                Label {
                    text: "Penguins-Recovery"
                    font.pixelSize: 22
                    font.bold: true
                    color: "#e0e0e0"
                }
                Label {
                    text: "System rescue and recovery toolkit"
                    font.pixelSize: 13
                    color: "#a0a0a0"
                }
            }

            Item { Layout.fillWidth: true }

            // System info
            Label {
                text: taskRunner.systemInfo
                font.pixelSize: 12
                color: "#808080"
                horizontalAlignment: Text.AlignRight
            }
        }
    }

    // Category tabs
    TabBar {
        id: categoryBar
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        background: Rectangle { color: "#0f3460" }

        TabButton {
            text: "All Tasks"
            font.pixelSize: 14
            width: implicitWidth + 32
        }
        TabButton {
            text: "Boot Repair"
            font.pixelSize: 14
            width: implicitWidth + 32
        }
        TabButton {
            text: "Disk & Data"
            font.pixelSize: 14
            width: implicitWidth + 32
        }
        TabButton {
            text: "System"
            font.pixelSize: 14
            width: implicitWidth + 32
        }
        TabButton {
            text: "Network"
            font.pixelSize: 14
            width: implicitWidth + 32
        }
    }

    // Task grid
    ScrollView {
        anchors.top: categoryBar.bottom
        anchors.bottom: statusBar.top
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 16
        clip: true

        GridLayout {
            id: taskGrid
            width: parent.width
            columns: root.taskColumns
            columnSpacing: 16
            rowSpacing: 16

            // Boot Repair tasks
            TaskButton {
                category: "boot"
                title: "Restore GRUB"
                description: "Reinstall GRUB bootloader to MBR or EFI"
                icon: "../resources/icons/grub.svg"
                script: "grub-restore.sh"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 1
            }

            TaskButton {
                category: "boot"
                title: "UEFI Boot Repair"
                description: "Check and repair UEFI boot entries"
                icon: "../resources/icons/uefi.svg"
                script: "uefi-repair.sh"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 1
            }

            TaskButton {
                category: "boot"
                title: "Update GRUB"
                description: "Regenerate GRUB configuration"
                icon: "../resources/icons/grub.svg"
                script: "chroot-rescue.sh"
                scriptArgs: ["update-grub"]
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 1
            }

            // Disk & Data tasks
            TaskButton {
                category: "disk"
                title: "Detect Disks"
                description: "Show disk layout, LUKS, LVM, and EFI info"
                icon: "../resources/icons/disk.svg"
                script: "detect-disks.sh"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 2
            }

            TaskButton {
                category: "disk"
                title: "Chroot Rescue"
                description: "Mount and chroot into an installed system"
                icon: "../resources/icons/terminal.svg"
                script: "chroot-rescue.sh"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 2
            }

            TaskButton {
                category: "disk"
                title: "GParted"
                description: "Graphical partition editor"
                icon: "../resources/icons/gparted.svg"
                executable: "gparted"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 2
            }

            TaskButton {
                category: "disk"
                title: "TestDisk"
                description: "Recover lost partitions and repair boot sectors"
                icon: "../resources/icons/testdisk.svg"
                executable: "testdisk"
                terminal: true
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 2
            }

            TaskButton {
                category: "disk"
                title: "PhotoRec"
                description: "Recover deleted files from disk"
                icon: "../resources/icons/photorec.svg"
                executable: "photorec"
                terminal: true
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 2
            }

            // System tasks
            TaskButton {
                category: "system"
                title: "Reset Password"
                description: "Reset a Linux user's password"
                icon: "../resources/icons/password.svg"
                script: "password-reset.sh"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 3
            }

            TaskButton {
                category: "system"
                title: "File Manager"
                description: "Browse and recover files"
                icon: "../resources/icons/files.svg"
                executable: "dolphin"
                fallbackExecutable: "thunar"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 3
            }

            TaskButton {
                category: "system"
                title: "Terminal"
                description: "Open a root terminal"
                icon: "../resources/icons/terminal.svg"
                executable: "konsole"
                fallbackExecutable: "qterminal"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 3
            }

            // Network tasks
            TaskButton {
                category: "network"
                title: "Network Settings"
                description: "Configure WiFi and network connections"
                icon: "../resources/icons/network.svg"
                executable: "nm-connection-editor"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 4
            }

            TaskButton {
                category: "network"
                title: "Web Browser"
                description: "Open a web browser for documentation"
                icon: "../resources/icons/browser.svg"
                executable: "firefox"
                fallbackExecutable: "firefox-esr"
                visible: categoryBar.currentIndex === 0 || categoryBar.currentIndex === 4
            }
        }
    }

    // Status bar
    Rectangle {
        id: statusBar
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 36
        color: "#16213e"

        RowLayout {
            anchors.fill: parent
            anchors.margins: 8
            spacing: 16

            Label {
                text: taskRunner.statusMessage
                font.pixelSize: 12
                color: "#a0a0a0"
            }

            Item { Layout.fillWidth: true }

            Label {
                text: "Penguins-Recovery"
                font.pixelSize: 11
                color: "#606060"
            }
        }
    }

    TaskRunner {
        id: taskRunner
    }
}
