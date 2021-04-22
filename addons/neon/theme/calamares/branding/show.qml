/*
    Copyright 2019 Harald Sitter <sitter@kde.org>

    This program is free software; you can redistribute it and/or
    modify it under the terms of the GNU General Public License as
    published by the Free Software Foundation; either version 3 of
    the License or any later version accepted by the membership of
    KDE e.V. (or its successor approved by the membership of KDE
    e.V.), which shall act as a proxy defined in Section 14 of
    version 3 of the license.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    PLEASE NOTE:
    This is not the original neon theme, but an adpment made for eggs 
    from eggs author: Piero Proietti <piero.proietti@gmail.com> 
*/


import QtQuick 2.0;
import calamares.slideshow 1.0;


Presentation
{
    id: presentation

    function nextSlide() {
        console.log("QML Component (default slideshow) Next slide");
        presentation.goToNextSlide();
    }

    Timer {
        id: timer
        interval: 5000
        running: false
        repeat: true
        onTriggered: nextSlide()
    }

    Slide {
        Image {
            id: kde
            source: "kde.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 20
            color: "#fcfcfc"
            anchors.horizontalCenter: kde.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h2>One Blue Marble - a community of creators around the globe</h2>")
            wrapMode: Text.WordWrap
            width: kde.width
            horizontalAlignment: Text.Center
        }
    }
    Slide {
        Image {
            id: neon
            source: "neon.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 20
            color: "#fcfcfc"
            anchors.horizontalCenter: neon.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h2>KDE neon - the latest and greatest from the KDE community</h2>")
            wrapMode: Text.WordWrap
            width: neon.width
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: plasma
            source: "plasma.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 20
            color: "#aa3333"
            anchors.horizontalCenter: plasma.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h2>Plasma Desktop, simple by default and powerful when needed</h2>")
            wrapMode: Text.WordWrap
            width: plasma.width
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: secure
            source: "secure.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 20
            color: "#fcfcfc"
            anchors.horizontalCenter: secure.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h2>Security, privacy and autonomy with KDE, Plasma and Neon</h2>")
            wrapMode: Text.WordWrap
            width: secure.width
            horizontalAlignment: Text.Center
        }
    }

    // When this slideshow is loaded as a V1 slideshow, only
    // activatedInCalamares is set, which starts the timer (see above).
    //
    // In V2, also the onActivate() and onLeave() methods are called.
    // These example functions log a message (and re-start the slides
    // from the first).
    function onActivate() {
        console.log("QML Component (default slideshow) activated");
        presentation.currentSlide = 0;
    }

    function onLeave() {
        console.log("QML Component (default slideshow) deactivated");
    }
}
