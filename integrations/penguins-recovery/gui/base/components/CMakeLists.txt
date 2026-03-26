ecm_add_qml_module(plasmananoshellprivateplugin
    URI "org.kde.plasma.private.nanoshell"
    VERSION 2.0
    GENERATE_PLUGIN_SOURCE
    QML_FILES
    qml/StartupFeedback.qml
    DEPENDENCIES QtQuick
)

target_sources(plasmananoshellprivateplugin PRIVATE
    fullscreenoverlay.cpp
    fullscreenoverlay.h
    startupnotifier.cpp
    startupnotifier.h
    )

target_link_libraries(plasmananoshellprivateplugin PRIVATE Qt::Core Qt::Qml Qt::Quick  KF6::WindowSystem Plasma::KWaylandClient KF6::Service)

ecm_finalize_qml_module(plasmananoshellprivateplugin)
