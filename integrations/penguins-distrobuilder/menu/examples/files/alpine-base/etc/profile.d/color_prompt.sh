# Setup a red prompt for root and a green one for users.
# rename this file to color_prompt.sh to actually enable it
NORMAL="\[\e[0m\]"
RED="\[\e[1;31m\]"
GREEN="\[\e[1;32m\]"
PURPLE="\[\e[1;35m\]"
YELLOW="\[\e[1;33m\]"
BLUE="\[\e[1;34m\]"
CYAN="\[\e[1;36m\]"

if [ "$USER" = root ]; then
        PS1="$PURPLE\u@\h [$NORMAL\w$PURPLE]# $NORMAL"
else
        PS1="$CYAN\h [$NORMAL\w$CYAN]\$ $NORMAL"
fi
