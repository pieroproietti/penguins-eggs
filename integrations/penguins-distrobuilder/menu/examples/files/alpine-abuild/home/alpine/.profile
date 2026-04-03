# for gitlab
if [ -z $(pidof ssh-agent) ]; then
	eval $(ssh-agent)
	ssh-add ~/.ssh/id_ed25519
fi

# Set GPG TTY
# set 'pinentry-mode loopback' in gpg.conf
# so gpg works after 'su - alpine'' instead of chown
#chown $USER:tty $(tty)
export GPG_TTY=$(tty)

# Start the gpg-agent if not already running
#if ! pgrep -x gpg-agent >/dev/null 2>&1; then
#	gpg-connect-agent /bye >/dev/null 2>&1
##      eval $(gpg-agent --daemon --enable-ssh-support --sh)
#fi

# Set SSH to use gpg-agent
#unset SSH_AGENT_PID
#if [ "${gnupg_SSH_AUTH_SOCK_by:-0}" -ne $$ ]; then
#	export SSH_AUTH_SOCK="${HOME}/.gnupg/S.gpg-agent.ssh"
#fi

export PATH=$PATH:~/bin
export EDITOR=nano

alias cp="rm -i"                          # confirm before overwriting something
alias cp="cp -i"                          # confirm before overwriting something
alias df='df -h'                          # human-readable sizes
alias free='free -m'                      # show sizes in MB

# some more ls aliases
alias ll='ls -alFh'
alias la='ls -A'
alias l='ls -CF'
alias ls='ls -a'
alias ns='netstat -lptun'

#personal aliases
alias gitclean='git remote prune origin && git repack && git prune-packed && git reflog expire --expire=1.month.ago && git gc --aggressive'
alias gitmail='git send-email --to alpine-aports@lists.alpinelinux.org HEAD^'
alias gitmailfix='git send-email --annotate --subject-prefix "PATCH v2" --to alpine-aports@lists.alpinelinux.org HEAD^'
alias multimail='git send-email patches --compose --no-chain-reply-to --to alpine-aports@lists.alpinelinux.org'
alias cloneaports='git clone git://git.alpinelinux.org/aports'
alias clean='find ~/aports -type d \( -name src -o -name pkg \) -exec rm -rf {} \;'
alias log='doas tail -n 100 /var/log/messages'
alias update='doas apk update'
alias upgrade='doas apk update && sudo apk upgrade'

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
          *)           echo "don't know how to extract '$1'..." ;;
      esac
  else
      echo "'$1' is not a valid file!"
  fi
}

# Automatically do an ls after each cd
c() {
  if [ -n "$1" ]; then
    cd "$@" && ls
  else
    cd ~ && ls
  fi
}

gitpull () {
	git checkout master
	git fetch upstream
	git pull upstream master
	if [ $? = 0 ]; then
		printf "\ngit fetched into master ok: pushing => fork (origin)\n\n"
		git push origin +master
	fi
}

gitforce () {
	git checkout master
	git remote update
	git reset --hard upstream/master --
	if [ $? = 0 ]; then
		printf "\nhard reset completed: pushing => origin\n\n"
		git push origin +master
	fi
}
