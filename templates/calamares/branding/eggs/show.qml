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
            anchors.top: image1.verticalCenter
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/>Creato da Piero Proietti, pensato per la comunità.<br/>"+
                  "<br/>sources: htts://github.com/pieroproietti/penguins-eggs"+
                  "<br/>email: piero.proietti@gmail.com")
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
            anchors.horizontalCenter: slide2.horizontalCenter
            anchors.top: image2.verticalCenter
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Un sistema riproduttivo per pinguini!</p></br>")
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
            anchors.horizontalCenter: slide3.horizontalCenter
            anchors.top: image3.verticalCenter
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Con Penguin's eggs il tuo sistema si riproduce! Crea l'immagine ISO del tuo sistema e reinstallalo su un altro pc. Puoi farlo, è semplice e legale.</p>")
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
            anchors.horizontalCenter: slide4.horizontalCenter
            anchors.top: image4.verticalCenter
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Con Penguin's eggs puoi ottenere la copia del tuo sistema da portare in tasca su una usb o da installare ad un amico.</p>")
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
            anchors.horizontalCenter: slide5.horizontalCenter
            anchors.top: image5.verticalCenter
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Eggs si usa da terminale, ma è semplice ed ha pochi comandi. Usa eggs senza parametri per avere l'aiuto</p></br>")
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
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Attenzione, processo di cova in corso... Non disturbare la chiccia! In poco tempo vedrete nascere un pulcino nuovo.</p>")
            anchors.horizontalCenter: slide6.horizontalCenter
            anchors.top: image6.verticalCenter
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
            anchors.horizontalCenter: slide7.horizontalCenter
            anchors.top: image7.verticalCenter
            text: qsTr("<h1>Penguin's eggs</h1><br/>"+
                  "<br/><p>Segui lo sviluppo dei tuoi pulcini, è divertente ed istruttivo.</p>" +
                  "<p>Penguin's eggs ed il suo sviluppatore cercano aiuto, " +
                  "utilizza questo prodotto, divertiti e, se puoi, collabora.</p>"+
                  "<br/>Grazie")
            wrapMode: Text.WordWrap
            width: 600
            horizontalAlignment: Text.Center
        }
    }

}
