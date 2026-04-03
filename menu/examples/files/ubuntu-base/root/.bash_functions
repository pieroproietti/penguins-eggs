compress() {
        local ans= suffix="$(date +%d%m%y)-$(hostname)" archive=$($archive | sed 's|/|-|'g | cut -c2-)
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

extract ()
{
  if [ -f $1 ] ; then
    case $1 in
      *.tar.bz2)   tar xjvf $1  ;;
      *.tar.gz)    tar xzvf $1  ;;
      *.tar.xz)    tar xvf $1   ;;
      *.bz2)       bunzip2 $1   ;;
      *.rar)       unrar x $1   ;;
      *.gz)        gunzip $1    ;;
      *.tar)       tar xf $1    ;;
      *.tbz2)      tar xjf $1   ;;
      *.tgz)       tar xzf $1   ;;
      *.zip)       unzip $1     ;;
      *.Z)         uncompress $1;;
      *.7z)        7z x $1      ;;
      *)           echo "don't know how to extract '$1'..." ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}
