#!/usr/bin/env bash

# This function joins an array using a character passed in
# e.g. ARRAY=(one two three) -> join_by ":" ${ARRAY[@]} -> "one:two:three"
function join_by { local IFS="$1"; shift; echo "$*"; }

_eggs_autocomplete()
{

  local cur="${COMP_WORDS[COMP_CWORD]}" opts normalizedCommand colonPrefix IFS=$' \t\n'
  COMPREPLY=()

  local commands="
adapt --help --verbose
analyze --help --verbose
calamares --help --install --nointeractive --policies --release --remove --theme --verbose
config --clean --help --nointeractive --verbose
cuckoo --help --verbose
dad --clean --default --file --nointeractive --help --verbose
export:iso --checksum --clean --help --verbose
export:pkg --all --clean --help --verbose
export:tarballs --clean --help --verbose
install --btrfs --chroot --crypted --domain --halt --help --ip --nointeractive --none --pve --random --replace --small --suspend --testing --unattended --verbose
krill --btrfs --chroot --crypted --domain --halt --help --ip --nointeractive --none --pve --random --replace --small --suspend --testing --unattended --verbose
kill --help --isos --nointeractive --verbose
love --help --verbose --nointeractive --clone --cryptedhome --cryptedfull
mom --help
pods --help
produce --addons --basename --clone --cryptedhome --cryptedfull --excludes --help --kernel --links --max --noicon --nointeractive --pendrive --prefix --release --script --standard --theme --includeRoot --verbose --yolk
status --help --verbose
tools:clean --help --nointeractive --verbose
tools:repo --add --help --nointeractive --remove --verbose
tools:skel --help --user --verbose
tools:stat --help --month --year
tools:yolk --help --verbose
update --help --verbose
wardrobe:get --help --verbose
wardrobe:list --distro --help --verbose
wardrobe:show --help --json --verbose --wardrobe
wardrobe:wear --help --no_accessories --no_firmwares --verbose --wardrobe
help --nested-commands
version --json --verbose
autocomplete --refresh-cache
"

  function __trim_colon_commands()
  {
    # Turn $commands into an array
    commands=("${commands[@]}")

    if [[ -z "$colonPrefix" ]]; then
      colonPrefix="$normalizedCommand:"
    fi

    # Remove colon-word prefix from $commands
    commands=( "${commands[@]/$colonPrefix}" )

    for i in "${!commands[@]}"; do
      if [[ "${commands[$i]}" == "$normalizedCommand" ]]; then
        # If the currently typed in command is a topic command we need to remove it to avoid suggesting it again
        unset "${commands[$i]}"
      else
        # Trim subcommands from each command
        commands[$i]="${commands[$i]%%:*}"
      fi
    done
  }

  if [[ "$cur" != "-"* ]]; then
    # Command
    __COMP_WORDS=( "${COMP_WORDS[@]:1}" )

    # The command typed by the user but separated by colons (e.g. "mycli command subcom" -> "command:subcom")
    normalizedCommand="$( printf "%s" "$(join_by ":" "${__COMP_WORDS[@]}")" )"

    # The command hirarchy, with colons, leading up to the last subcommand entered (e.g. "mycli com subcommand subsubcom" -> "com:subcommand:")
    colonPrefix="${normalizedCommand%"${normalizedCommand##*:}"}"

    if [[ -z "$normalizedCommand" ]]; then
      # If there is no normalizedCommand yet the user hasn't typed in a full command
      # So we should trim all subcommands & flags from $commands so we can suggest all top level commands
      opts=$(printf "%s " "${commands[@]}" | grep -Eo '^[a-zA-Z0-9_-]+')
    else
      # Filter $commands to just the ones that match the $normalizedCommand and turn into an array
      commands=( $(compgen -W "$commands" -- "${normalizedCommand}") )
      # Trim higher level and subcommands from the subcommands to suggest
      __trim_colon_commands "$colonPrefix"

      opts=$(printf "%s " "${commands[@]}") # | grep -Eo '^[a-zA-Z0-9_-]+'
    fi
  else 
    # Flag

    # The full CLI command separated by colons (e.g. "mycli command subcommand --fl" -> "command:subcommand")
    # This needs to be defined with $COMP_CWORD-1 as opposed to above because the current "word" on the command line is a flag and the command is everything before the flag
    normalizedCommand="$( printf "%s" "$(join_by ":" "${COMP_WORDS[@]:1:($COMP_CWORD - 1)}")" )"

    # The line below finds the command in $commands using grep
    # Then, using sed, it removes everything from the found command before the --flags (e.g. "command:subcommand:subsubcom --flag1 --flag2" -> "--flag1 --flag2")
    opts=$(printf "%s " "${commands[@]}" | grep "${normalizedCommand}" | sed -n "s/^${normalizedCommand} //p")
  fi

  COMPREPLY=($(compgen -W "$opts" -- "${cur}"))
}

complete -F _eggs_autocomplete eggs
