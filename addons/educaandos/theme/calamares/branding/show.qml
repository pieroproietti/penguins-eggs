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
            id: slide1
            source: "slide1.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }
    Slide {
        Image {
            id: slide2
            source: "slide2.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
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
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }
    
    Slide {
        Image {
            id: slide4
            source: "slide4.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
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
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
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
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
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
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            font.family: "Helvetica"
            font.pixelSize : 22
            color: "#002439"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: slide1.verticalCenter
            text: qsTr("<h2>EducaAndOs Plus - Unofficial ISO</h2><br/>"+
                  "<br/>Created by aosucas499<br/>"+
                  "<br/>sources: htts://github.com/aosucas499/guadalinex"+
                  "<br/>email: aosucas499@gmail.com")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }
}
