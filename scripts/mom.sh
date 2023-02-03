#!/usr/bin/env bash 
function main() {
    config

    # root    
    root=$(cat /usr/lib/penguins-eggs/.oclif.manifest.json | jq .)
    result=$(echo ${root} | jq ".commands[].id")
    result+=("quit")

    while true; do
        clear
        # NOTE [@]
        menu ${result[@]}
        answer=$(0< "${dir_tmp}/${file_tmp}" )
        case "$answer" in 
            quit)
                exit ;;
            *)
                eggs $answer --help
                press_a_key_to_continue
        esac
    done

    exit 0
}

################################
function query() {
    local retval=$(echo ${root} | jq "${filter}")
    echo ${retval}    
}

################################
function config() {
    # configurations
    set -e

    # Disable unicode.
    LC_ALL=C
    LANG=C

    # easy-bash-gui
    MSP=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
    source ${MSP}/includes/easybashgui
    source ${MSP}/includes/easybashgui.lib
    source ${MSP}/includes/common.sh
}

################################
function press_a_key_to_continue {
   read -rp "Press enter to continue"
}

main

# EOF()