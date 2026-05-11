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

    // Sfondo globale per fondere gli eventuali margini con la sidebar
    Rectangle {
        anchors.fill: parent
        color: "#292F34" 
        z: -1
    }

    // --- SLIDE 1 ---
    Slide {
        // Il Contenitore Matematico: mantiene la proporzione 810x485
        Item {
            anchors.centerIn: parent
            width: Math.min(parent.width, parent.height * (810.0/485.0))
            height: Math.min(parent.height, parent.width / (810.0/485.0))

            Image { source: "1-reproductive-system.png"; anchors.fill: parent }
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; 
                anchors.top: parent.top; anchors.topMargin: 20 // Ancorato all'immagine, non allo schermo!
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h2>eggs: the reproductive system of penguins!</h2><h3>https://penguins-eggs.net</h3>")
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
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h2>Start the reproduction of your system! Produce yours eggs and simply install them on another computer. You can do it!</h2>")
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
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h2>It's your system!<br/>Bring it with you and use/install it elsewhere.</h2>")
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
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h2>Eggs is a CLI tool,<br/>but it's simple and nice. Write eggs without else and get the commands list</h2>")
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
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h2>Please wait, we are hatching...<br/>Don't disturb the process, in few time You will have a new penguin.</h2>")
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
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h3>Follow oa-tools development, can be funny.</h3><h3>Developers, graphics and testers need feedback and help.</h3><h3>Use this tool, enjoy and if you can collaborate.</h3><br><h2>That's all peoples!</h2>")
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
            Text {
                font.family: textFont; font.pixelSize: textSize; font.bold: true; color: themeColor; style: Text.Outline; styleColor: shadowColor
                anchors.horizontalCenter: parent.horizontalCenter; anchors.top: parent.top; anchors.topMargin: 20
                wrapMode: Text.WordWrap; width: parent.width * 0.95; horizontalAlignment: Text.Center
                text: qsTr("<h1>oa-tools</h1><br/><h2>Created by Piero Proietti</h2><br/><h4>issues: https://github.com/pieroproietti/oa-tools</h4><h3>email: piero.proietti@gmail.com</h3>")
            }
        }
    }
    
    function onActivate() { presentation.currentSlide = 0; }
}
