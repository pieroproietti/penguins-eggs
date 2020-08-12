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
            id: slide01ufficiozero
            source: "slide01ufficiozero.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide01ufficiozero.horizontalCenter
            anchors.top: slide01ufficiozero.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>da professionisti a professionisti</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide02versioni
            source: "slide02versioni.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide02versioni.horizontalCenter
            anchors.top: slide02versioni.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Scegliete la versione più adatta delle nostre remix</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide03roma
            source: "slide03roma.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide03roma.horizontalCenter
            anchors.top: slide03roma.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Roma 2.0.1 per pc con processori a 32bit, basato su Devuan 3 Beowulf e con desktop manager Xfce</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide04mantova
            source: "slide04mantova.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide04mantova.horizontalCenter
            anchors.top: slide04mantova.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Mantova 2.0.1 per pc con processori a 64bit, basato su PCLinuxOS e con desktop manager Mate</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide05vieste
            source: "slide05vieste.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide05vieste.horizontalCenter
            anchors.top: slide05vieste.verticalCenter
            text: qsTr("<h1>UfficioZero</h1><p>Vieste 2.0.1 per pc con processori a 64bit, basato su Linux Mint 19.3 e con desktop manager Mate</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide06gabii
            source: "slide06gabii.png"
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
            anchors.horizontalCenter: slide06gabii.horizontalCenter
            anchors.top: slide06gabii.verticalCenter
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide07ovi
            source: "slide07ovi.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide07ovi.horizontalCenter
            anchors.top: slide07ovi.verticalCenter
            text: qsTr("<h1>Penguin'eggs</h1><p>Sistema riproduttivo per pinguini</p><p>Perri's brevery editition</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }
}
