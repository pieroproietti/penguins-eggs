/* === This file is part of Calamares - <http://github.com/calamares> ===
 *
 *   Copyright 2015, Teo Mrnjavac <teo@kde.org>
 *   Copyright 2018, Jonathan Carter <jcc@debian.org>
 *
 *   Calamares is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, or (at your option) any later version.
 *
 *   Calamares is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with Calamares. If not, see <http://www.gnu.org/licenses/>.
 */


// https://github.com/calamares/calamares-extensions


import QtQuick 2.0;
import calamares.slideshow 1.0;

Presentation
{
    id: presentation

    Timer {
        interval: 10000
        running: true
        repeat: true
        onTriggered: presentation.goToNextSlide()
    }
    Slide {
        Image {
            id: 01-ufficiozero
            source: "slide-01-ufficiozero.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide-01-ufficiozero.horizontalCenter
            anchors.top: slide-01-ufficiozero.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>da professionisti a professionisti</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }
    Slide {
        Image {
            id: slice-02-versioni
            source: "slice-02-versioni.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slice-02-versioni.horizontalCenter
            anchors.top: slice-02-versioni.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Scegliete la versione più adatta delle nostre remix</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide-03-roma
            source: "slide-03-roma.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide-03-roma.horizontalCenter
            anchors.top: slide-03-roma.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Roma 2.0.1 per pc con processori a 32bit, basato su Devuan 3 Beowulf e con desktop manager Xfce</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide-04-mantova
            source: "slide-04-mantova.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide-04-mantova.horizontalCenter
            anchors.top: slide-04-mantova.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Mantova 2.0.1 per pc con processori a 64bit, basato su PCLinuxOS e con desktop manager Mate</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide-05-vieste
            source: "slide-05-vieste.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide-05-vieste.horizontalCenter
            anchors.top: slide-05-vieste.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Vieste 2.0.1 per pc con processori a 64bit, basato su Linux Mint 19.3 e con desktop manager Mate</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide6
            source: "slide-06-gabii.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            text: qsTr("<h1>UfficioZero</h1><p>Gabii 2.0.1 per pc con processori a 64bit, basato su Linux Mint 20 e con desktop manager cinnamon</p>")
            anchors.horizontalCenter: slide-06-gabii.horizontalCenter
            anchors.top: slide-06-gabii.verticalCenter
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide-07-ovi
            source: "slide-07-ovi.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide7.horizontalCenter
            anchors.top: slide-07-ovi.verticalCenter
            text: qsTr("<h1>Penguin'eggs</h1><p>Sistema riproduttivo per pinguini</p><p>Perri's brevery editition</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

}
