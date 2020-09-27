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
    }

    Slide {
        Image {
            id: slide2
            source: "slide2"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
        }
    }

    Slide {
        Image {
            id: slide03
            source: "slide3.png"
            anchors.centerIn: parent
            width: 810
            height: 485
            fillMode: Image.PreserveAspectFit
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
    }
}
