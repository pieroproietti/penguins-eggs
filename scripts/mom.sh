#!/usr/bin/env bash 
function main() {
    config

    # root    
    root=$(cat /usr/lib/penguins-eggs/.oclif.manifest.json | jq .)
    result=$(echo ${root} | jq ".commands[].id")
    result+=("documentation" "quit")

    while true; do
        clear
        # NOTE [@]
        menu ${result[@]}
        answer=$(0< "${dir_tmp}/${file_tmp}" )
        case "$answer" in 
            quit)
                exit ;;
            documentation)
                documentation ;;
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
function documentation() {
   while true; do

      menu "book" "manual" "man" "repository" "sourceforge" "quit"
      choose=$(0< "${dir_tmp}/${file_tmp}" )

      case "$choose" in 
         book)
            documentation_book ;;
         manual)
            documentation_html ;;
         man)
            documentation_man ;;
         repository)
            documentation_repository ;;
         sourceforge)
            documentation_sourceforge ;;
         quit)
            break ;;
      esac
   done
}

################################
function documentation_book() {
   xdg-open "https://penguins-eggs.net/book/italiano"
}

################################
function documentation_site() {
   xdg-open "https://penguins-eggs.net"
}

################################
function documentation_html() {
   xdg-open "file:///usr/lib/penguins-eggs/manpages/doc/man/eggs.html"
}

################################
function documentation_man() {
   man eggs
}

################################
function documentation_repository() {
   xdg-open "https://github.com/pieroproietti/penguins-eggs"
}

################################
function documentation_sourceforge() {
   xdg-open "https://sourceforge.com/project/penguins-eggs"
}



################################
function press_a_key_to_continue {
   read -rp "Press enter to continue"
}

main

# EOF()