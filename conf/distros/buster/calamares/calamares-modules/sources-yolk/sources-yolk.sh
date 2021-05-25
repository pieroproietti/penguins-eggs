#!/bin/bash

# sources-yolk
#
# utilizza solo la repository yolk durante l'installazione.
# 
# sources-yolk -u
# rimuove yolk e reimposta le apt-list

function main {
    #####################################################################
    # unmount: remove yolk.list
    #####################################################################
    if [ "$1" = "-u" ]; then
        remove_yolk
    else
        add_yolk
    fi
}


#####################################################################
function remove_list {
    if [ -f "${SOURCES_LIST_BACKUP}" ]; then
        echo rm "${SOURCES_LIST_BACKUP}"
        rm "${SOURCES_LIST_BACKUP}"
    fi
    echo "mv ${SOURCES_LIST} ${SOURCES_LIST_BACKUP}"
    "mv ${SOURCES_LIST} ${SOURCES_LIST_BACKUP}"

    if [ -d "${SOURCES_LIST_D_BACKUP}" ]; then
        echo rm "${SOURCES_LIST_D_BACKUP}" -rf
        rm "${SOURCES_LIST_D_BACKUP}" -rf
    fi
    echo "mv ${SOURCES_LIST_D} ${SOURCES_LIST_D_BACKUP}"
    "mv ${SOURCES_LIST_D} ${SOURCES_LIST_D_BACKUP}"
}

function add_list {
    if [ -f "${SOURCES_LIST}" ]; then
        rm "${SOURCES_LIST}"
    fi
    "mv ${SOURCES_LIST_BACKUP} ${SOURCES_LIST}"

    if [ -d "${SOURCES_LIST_D}" ]; then
        rm "${SOURCES_LIST_D}" -rf
    fi
    "mv ${SOURCES_LIST_D_BACKUP} ${SOURCES_LIST_D}"
}


function add_yolk {
    remove_list
    cat << EOF > $CHROOT/etc/apt/sources.list.d/yolk.list
    deb [trusted=yes] file:/usr/local/yolk ./
EOF
    chroot ${CHROOT} apt-get --allow-unauthenticated update -y
}

function remove_yolk {
    add_list
    rm ${CHROOT}/etc/apt/sources.list.d/yolk.list
    chroot ${CHROOT} apt-get update -y
}



# Lo script inizia qui
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

SOURCES_LIST="${CHROOT}/etc/apt/sources.list"
SOURCES_LIST_BACKUP="${SOURCES_LIST}.backup"

SOURCES_LIST_D="${CHROOT}/etc/apt/sources.list.d"
SOURCES_LIST_D_BACKUP="${SOURCES_LIST_D}.backup"

echo "sources.list: $SOURCES_LIST"
echo "sources.list.backup: $SOURCES_LIST_BACKUP"
echo "sources.list.s: $SOURCES_LIST_D"
echo "sources.list.d.backup: $SOURCES_LIST_D_BACKUP"

main $1
exit 0
