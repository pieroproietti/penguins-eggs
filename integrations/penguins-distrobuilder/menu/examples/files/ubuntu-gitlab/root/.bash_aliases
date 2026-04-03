# gitlab
alias reconfig='gitlab-ctl reconfigure'
alias gitedit='nano /etc/gitlab/gitlab.rb'

# misc
alias log='tail -n 100 /var/log/syslog'
alias ns='netstat -lptun'
alias mail='less /var/mail/${whoami}'

# user
alias ulogin='machinectl shell ubuntu@'

# services
alias start='systemctl start'
alias stop='systemctl stop'
alias restart='systemctl restart'
alias reload='systemctl reload'
alias enable='systemctl enable'
alias disable='systemctl disable'
alias status='systemctl status'

# You may uncomment the following lines if you want `ls' to be colorized:
export LS_OPTIONS='-h --color=auto --group-directories-first'
alias ls='ls $LS_OPTIONS'
alias ll='ls $LS_OPTIONS -l'
alias l='ls $LS_OPTIONS -lA'
alias la='ls $LS_OPTIONS -la'

## Some more alias to avoid making mistakes:
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'
