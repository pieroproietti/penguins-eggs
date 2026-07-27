/* === This file is part of Calamares - <http://github.com/calamares> === */

import QtQuick 2.0;
import calamares.slideshow 1.0;

Presentation
{
    id: presentation

    function nextSlide() { presentation.goToNextSlide(); }

    Timer {
        id: advanceTimer
        interval: 7500
        running: true
        repeat: true
        onTriggered: nextSlide()
    }

    // --- VARIABILI GLOBALI DEL TEMA ---
    property string themeColor: "#C59B27"      // Oro antico
    property string shadowColor: "#1a1a1a"     // Ombra scura
    property string textFont: "Helvetica"
    property int textSize: 22
    property color panelColor: "#000000"       // Vlak achter de tekst
    property real panelOpacity: 0.45
    property int panelRadius: 8
    property int panelMargin: 6

    // Sfondo globale per fondere gli eventuali margini con la sidebar
    Rectangle {
        anchors.fill: parent
        color: "#292F34" 
        z: -1
    }

    // --- SLIDE 1 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "1-reproductive-system.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text1.contentWidth + panelMargin * 2; height: text1.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text1.horizontalCenter
                anchors.top: text1.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text1
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter;
                anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><br/><h2>eggs: the reproductive system of penguins!</h2>")
            }
        }
    }

    // --- SLIDE 2 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "2-start-reproduction.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text2.contentWidth + panelMargin * 2; height: text2.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text2.horizontalCenter
                anchors.top: text2.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text2
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><br/><h2>Reproduce your system: pack everything into an egg. You can do it!</h2>")
            }
        }
    }

    // --- SLIDE 3 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "3-its-your-system.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text3.contentWidth + panelMargin * 2; height: text3.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text3.horizontalCenter
                anchors.top: text3.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text3
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><br/><h2>Take it anywhere! Boot your environment live or install it on any hardware</h2>")
            }
        }
    }

    // --- SLIDE 4 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "4-eggs-presentation.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text4.contentWidth + panelMargin * 2; height: text4.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text4.horizontalCenter
                anchors.top: text4.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text4
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><br/><h2>It's a CLI tool, but it's simple and intuitive. Just type eggs to get the command list</h2>")
            }
        }
    }

    // --- SLIDE 5 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "5-wait-hatching.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text5.contentWidth + panelMargin * 2; height: text5.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text5.horizontalCenter
                anchors.top: text5.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text5
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><br/><h3>Please wait, we're hatching...<br/>Don't interrupt the process,<br/>your new penguin will be ready soon!</h3>")
            }
        }
    }

    // --- SLIDE 6 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "6-follow-penguins.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text6.contentWidth + panelMargin * 2; height: text6.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text6.horizontalCenter
                anchors.top: text6.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text6
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><h3>Join the penguins-eggs development, it's fun!</h3><h3>Use the tool, enjoy it, and collaborate if you want.</h3><br><h3>That's all, folks!</h3>")
            }
        }
    }

    // --- SLIDE 7 ---
    Slide {
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "7-created-by.png"; anchors.fill: parent }
            Rectangle {
                color: panelColor; opacity: panelOpacity; radius: panelRadius
                width: text7.contentWidth + panelMargin * 2; height: text7.contentHeight + panelMargin * 2
                anchors.horizontalCenter: text7.horizontalCenter
                anchors.top: text7.top; anchors.topMargin: -panelMargin
            }
            Text {
                id: text7
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                textFormat: Text.RichText
                text: qsTr("<h1>penguins-eggs</h1><h2>Created by Piero Proietti</h2><h4>Issues: github.com/pieroproietti/penguins-eggs/issues</h4><h4>Email: piero.proietti@gmail.com</h4><h4>Website: penguins-eggs.net</h4>")
            }
        }
    }
    
    function onActivate() { presentation.currentSlide = 0; }
}
