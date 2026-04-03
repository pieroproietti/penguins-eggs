export PATH=$PATH:~/bin
export EDITOR=nano

alias ns='netstat -lptun'
alias log='tail -n 200 /var/log/messages'
alias cp='rm -i'
alias cp='cp -i'
alias df='df -h'
alias ls='ls -h --color=auto --group-directories-first'
alias ll='ls -l'
alias la='ls -a'
alias notes='$EDITOR ~/notes'

status() {
        [ -z "$1" ] || rc-service $1 status
}

start() {
        [ -z "$1" ] || rc-service $1 start
}

stop() {
        [ -z "$1" ] || rc-service $1 stop
}

restart() {
        [ -z "$1" ] || rc-service $1 restart
}

reload() {
        [ -z "$1" ] || rc-service $1 reload
}

# Extracting
extract () {
  if [ -f $1 ] ; then
      case $1 in
          *.tar.bz2)   tar xvjf $1    ;;
          *.tar.gz)    tar xvzf $1    ;;
          *.tar.xz)    tar xvfJ $1    ;;
          *.bz2)       bunzip2 $1     ;;
          *.rar)       unrar x $1     ;;
          *.gz)        gunzip $1      ;;
          *.tar)       tar xvf $1     ;;
          *.tbz2)      tar xvjf $1    ;;
          *.tgz)       tar xvzf $1    ;;
          *.zip)       unzip $1       ;;
          *.Z)         uncompress $1  ;;
          *.7z)        7z x $1        ;;
          *.apk)       mkdir ${1%.apk} && tar -C ${1%.apk} -zxvf $1 ;;
          *)           echo "don't know how to extract '$1'..." ;;
      esac
  else
      echo "'$1' is not a valid file!"
  fi
}

compress() {
        local ans= suffix="$(date +%d%m%y)-$(hostname)" archive=$(basename $1)
        if [ -f "$1" ] || [ -d "$1" ]; then
                echo -ne "Enter suffix for '$archive-$suffix.tar.xz' ? "; read ans
                if [ -n "$ans" ]; then
                        suffix="$ans"
                fi
                echo -e "Adding to archive...\n"
                tar cJvf $archive-$suffix.tar.xz $1
                echo -e "\nCreated $PWD/$archive-$suffix.tar.xz"
        else
                echo "file / dir '$1' does not exist"
        fi
}
