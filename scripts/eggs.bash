#!/usr/bin/env bash

_eggs()
{

  local cur="${COMP_WORDS[COMP_CWORD]}" opts IFS=$' \t\n'
  COMPREPLY=()

  local commands="
adapt --verbose --help
calamares --help --verbose --install --final --remove --theme
config --nointeractive --clean --help --verbose
dad --help --clean --verbose
export:deb --help --clean --armel --amd64 --i386 --all
export:docs --help
export:iso --help --clean
info --help --compressor --verbose
install --cli --mx --umount --lvmremove --help --verbose
kill --help --verbose
mom --help
produce --prefix --basename --fast --normal --max --verbose --yolk --script --help --theme --addons --release
remove --purge --autoremove --help --verbose
tools:clean --help --verbose
tools:locales --help --reinstall --verbose
tools:skel --help --user --verbose
tools:stat --help --month --year
tools:yolk --help --verbose
update --help --apt --basket --npm --verbose
help --all
autocomplete --refresh-cache
"

  if [[ "$cur" != "-"* ]]; then
    opts=$(printf "$commands" | grep -Eo '^[a-zA-Z0-9:_-]+')
  else
    local __COMP_WORDS
    if [[ ${COMP_WORDS[2]} == ":" ]]; then
      #subcommand
      __COMP_WORDS=$(printf "%s" "${COMP_WORDS[@]:1:3}")
    else
      #simple command
      __COMP_WORDS="${COMP_WORDS[@]:1:1}"
    fi
    opts=$(printf "$commands" | grep "${__COMP_WORDS}" | sed -n "s/^${__COMP_WORDS} //p")
  fi
  _get_comp_words_by_ref -n : cur
  COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
  __ltrim_colon_completions "$cur"
  return 0

}

complete -o default -F _eggs eggs
