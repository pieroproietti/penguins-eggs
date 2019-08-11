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
            color: "#ff2a00"
            anchors.horizontalCenter: slide1.horizontalCenter
            anchors.top: image1.verticalCenter
            text: qsTr("<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>Il pinguino fa le uova e riproduce se stesso! Utilizza penguin's eggs per creare il tuo sistema.</p></br>" +
                  "<p></p>.")
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
            color: "#ff2a00"
            anchors.horizontalCenter: slide2.horizontalCenter
            anchors.top: image2.verticalCenter
            text: qsTr("<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>Con eggs update puoi sempre scaricare l'ultima versione di penguin's eggs.</p></br>" +
                    "<b>slide 2</p")
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
            color: "#ff2a00"
            anchors.horizontalCenter: slide3.horizontalCenter
            anchors.top: image3.verticalCenter
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>Con eggs puoi ottenere una copia del tuo sistema da portare in tasca o da installare ad un amico.</p></br>" +
                    "<b>slide 3</p"
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
            color: "#ff2a00"
            anchors.horizontalCenter: slide4.horizontalCenter
            anchors.top: image4.verticalCenter
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>Con eggs il tuo sistema si riproduce, crea l'immagine iso del tuo sistema e reinstallala su un altro pc. Puoi farlo, è semplice e legale.</p></br>" +
                    "<b>slide 4</p"
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
            color: "#ff2a00"
            anchors.horizontalCenter: slide5.horizontalCenter
            anchors.top: image5.verticalCenter
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>Penguin's eggs, o meglio il suo sviluppatore cerca aiuto. Usa questo prodotto e, se puoi fatti sentire.</p></br>" +
                    "<b>slide 5</p"
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
            color: "#ff2a00"
            anchors.horizontalCenter: slide6.horizontalCenter
            anchors.top: image6.verticalCenter
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>Eggs è semplice, ha pochi comandi. Usa eggs senza parametri per avere l'elenco completo</p></br>" +
                    "<b>slide 6</p"
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
            color: "#ff2a00"
            anchors.horizontalCenter: slide7.horizontalCenter
            anchors.top: image7.verticalCenter
            text: "<h1>Benvenuto in Penguin's eggs</h1> .<br/>"+
                  "<b>Penguin's eggs</b> creato da Piero Proietti, sviluppato per la comunità.<br/>"+
                  "<br/><p>eggs: un sistema riproduttivo per pinguini!</p></br>" +
                    "<b>slide 7</p"
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

}
