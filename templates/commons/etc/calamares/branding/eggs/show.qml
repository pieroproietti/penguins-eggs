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
            id: image1
            source: "penguins1.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image1.horizontalCenter
            anchors.top: background1.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> è fatto dalla comunità.<br/>"+
                  "<p></p>."
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }
    Slide {
        Image {
            id: image2
            source: "penguins2.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image2.horizontalCenter
            anchors.top: background2.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                    "<p>Questo programma è mantenuto dalla comunità</p>" +
                    "<b>slide 2</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: image3
            source: "penguins3.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image3.horizontalCenter
            anchors.top: background3.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                    "<p>Questo programma è mantenuto dalla comunità</p>" +
                    "<b>slide 3</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: image4
            source: "penguins4.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image3.horizontalCenter
            anchors.top: background4.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                    "<p>Questo programma è mantenuto dalla comunità</p>" +
                    "<b>slide 4</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: image5
            source: "penguins5.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image3.horizontalCenter
            anchors.top: background5.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                    "<p>Questo programma è mantenuto dalla comunità</p>" +
                    "<b>slide 5</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: image6
            source: "penguins6.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image3.horizontalCenter
            anchors.top: background6.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                    "<p>Questo programma è mantenuto dalla comunità</p>" +
                    "<b>slide 6</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

    Slide {
        Image {
            id: image7
            source: "penguins7.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
         Text {
            anchors.horizontalCenter: image3.horizontalCenter
            anchors.top: background7.bottom
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                    "<p>Questo programma è mantenuto dalla comunità</p>" +
                    "<b>slide 7</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

}
