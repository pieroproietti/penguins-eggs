#!/usr/bin/env bash

if ! type __ltrim_colon_completions >/dev/null 2>&1; then
  #   Copyright © 2006-2008, Ian Macdonald <ian@caliban.org>
  #             © 2009-2017, Bash Completion Maintainers
  __ltrim_colon_completions() {
      # If word-to-complete contains a colon,
      # and bash-version < 4,
      # or bash-version >= 4 and COMP_WORDBREAKS contains a colon
      if [[
          "$1" == *:* && (
              ${BASH_VERSINFO[0]} -lt 4 ||
              (${BASH_VERSINFO[0]} -ge 4 && "$COMP_WORDBREAKS" == *:*)
          )
      ]]; then
          # Remove colon-word prefix from COMPREPLY items
          local colon_word=${1%${1##*:}}
          local i=${#COMPREPLY[*]}
          while [ $((--i)) -ge 0 ]; do
              COMPREPLY[$i]=${COMPREPLY[$i]#"$colon_word"}
          done
      fi
  }
fi

_eggs()
{

  local cur="${COMP_WORDS[COMP_CWORD]}" opts IFS=$' \t\n'
  COMPREPLY=()

  local commands="
adapt --verbose --help
calamares --help --verbose --install --final --remove --theme
config --nointeractive --clean --help --verbose
dad --help --clean --default --verbose
export:deb --help --clean --amd64 --i386 --armel --arm64 --all
export:docs --help
export:iso --help --backup --clean
info --verbose --help
install --cli --help --verbose
kill --help --verbose
mom --help
produce --prefix --basename --backup --fast --normal --max --verbose --yolk --script --help --theme --addons --release
remove --purge --autoremove --help --verbose
tools:clean --help --verbose
tools:locales --help --reinstall --verbose
tools:skel --help --user --verbose
tools:stat --help --month --year
tools:yolk --help --verbose
update --help --apt --basket --npm --verbose
autocomplete --refresh-cache
help --all
"

  if [[ "${COMP_CWORD}" -eq 1 ]] ; then
      opts=$(printf "$commands" | grep -Eo '^[a-zA-Z0-9:_-]+')
      COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
       __ltrim_colon_completions "$cur"
  else
      if [[ $cur == "-"* ]] ; then
        opts=$(printf "$commands" | grep "${COMP_WORDS[1]}" | sed -n "s/^${COMP_WORDS[1]} //p")
        COMPREPLY=( $(compgen -W  "${opts}" -- ${cur}) )
      fi
  fi
  return 0
}

complete -F _eggs eggs
