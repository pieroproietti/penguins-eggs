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

    function nextSlide() {
        console.log("QML Component (default slideshow) Next slide");
        presentation.goToNextSlide();
    }

    Timer {
        id: advanceTimer
        interval: 7500
        running: true
        repeat: true
        onTriggered: nextSlide()
    }

    Slide {
        Image {
            id: slide1
            source: "slide1.png"
            width: 810; height: 485
            fillMode: Image.PreserveAspectFit
            anchors.centerIn: parent
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#aa3333"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><h2>The reproductive system for penguins!</h2>")
            wrapMode: Text.WordWrap
            width: presentation.widt
            horizontalAlignment: Text.Center
        }
    }
    Slide {
        Image {
            id: slide2
            source: "slide2.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810; height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            // color: "#002439"
            color: "#aa3333"
            anchors.horizontalCenter: slide2.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Start the reproduction of your system! Produce yours eggs and simply install them on another computer. You can do it!</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide3
            source: "slide3.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#aa3333"
            anchors.horizontalCenter: slide3.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>With penguin's eggs you can bring your system with you and use or install elsewhere.</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide4
            source: "slide9.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#aa3333"
            anchors.horizontalCenter: slide4.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Eggs is a terminal tool, but it's simple and nice. Write eggs without else and get the commands list</p></br>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide5
            source: "slide5.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#aa3333"
            anchors.horizontalCenter: slide5.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Please wait, we are hatching the egg... <br/><br/>Don't disturb the process, in few time You will have a new penguin.</p>")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide6
            source: "slide6.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#aa3333"
            anchors.horizontalCenter: slide6.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/>"+
                  "<br/>"+
                  "<br/><p>Follow the penguin's eggs development, can be funny and istructive.</p>" +
                  "<p>Penguin's eggs and it's developer need help, " +
                  "use this tool, enjoy and if you can collaborate.</p>"+
                  "<br/>That's all peoples!")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: slide7
            source: "slide7.png"
            anchors.centerIn: parent
            anchors.top: background.bottom
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#aa3333"
            anchors.horizontalCenter: slide7.horizontalCenter
            anchors.top: background.top
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/>Created by Piero Proietti, thinking to the community.<br/>"+
                  "<br/>site: htts://penguins-eggs.net"+
                  "<br/>sources: htts://github.com/pieroproietti/penguins-eggs"+
                  "<br/>email: piero.proietti@gmail.com")
            wrapMode: Text.WordWrap
            width: 600
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

