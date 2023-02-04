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
function documentation {
   while true; do

      menu "book" "book_transtated" "manual" "man" "quit"
      choose=$(0< "${dir_tmp}/${file_tmp}" )

      case "$choose" in 
         book)
            documentation_book ;;
         book_translated)
            documentation_book_translated ;;
         manual)
            documentation_html ;;
         man)
            documentation_man ;;
         quit)
            exit 0 ;;
      esac
   done
}

################################
function documentation_book {
   xdg-open "https://penguins-eggs.net/book/italiano"
}

################################
function documentation_book_translated {
   xdg-open "https://translate.google.com/translate?hl=en&sl=auto&tl=en&u=https%3A%2F%2Fpenguins-eggs.net%2Fbook%2Fitaliano"
}

################################
function documentation_site {
   xdg-open "https://penguins-eggs.net"
}

################################
function documentation_man {
   "man eggs"
}

################################
function documentation_html {
   xdg-open "file:///usr/lib/penguins-eggs/manpages/doc/man/eggs.html"
}

################################
function press_a_key_to_continue {
   read -rp "Press enter to continue"
}

main

# EOF()