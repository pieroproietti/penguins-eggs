#!/usr/bin/env bash 
function main() {
    config

    # root    
    root=$(cat /usr/lib/penguins-eggs/.oclif.manifest.json | jq .)
	COMMANDS=$(echo ${root} | jq ".commands[].id")
    result=("DOCUMENTATION" ${COMMANDS} "QUIT")

    while true; do
        clear
        menu ${result[@]}
        answer=$(0< "${dir_tmp}/${file_tmp}" )
        case "$answer" in 
            QUIT)
                exit ;;
            DOCUMENTATION)
                documentation ;;
            *)
                eggs $answer --help
                press_a_key_to_continue
        esac
    done

    exit 0
}


################################
function documentation() {
   while true; do

      menu "blog" "documents" "man" "repositories" "site" "sourceforge" "QUIT"
			choose=$(0< "${dir_tmp}/${file_tmp}" )

      case "$choose" in 
				blog)
					blog;;
				documents)
					documents;;
				man)
					man;;
				repositories)
					repositories;;
				site)
					site;;
				sourceforge)
					sourceforge;;
         man_page_html)
            man_page_htm ;;
         man)
            man ;;
         repositories)
            repositories ;;
         sourceforge)
            sourceforge ;;
         QUIT)
            break ;;
      esac
   done
}

################################
function blog() {
	xdg-open "https://penguins-eggs.net/blog"
}

################################
function documents() {
	xdg-open "https://penguins-eggs.net/docs/Tutorial/eggs-users-guide"
}

################################
function man() {
   xdg-open "file:///usr/lib/penguins-eggs/manpages/doc/man/eggs.html"
}

################################
function repositories() {
   xdg-open "https://github.com/pieroproietti/"
}

################################
function site() {
   xdg-open "https://penguins-eggs.net"
}

################################
function sourceforge() {
   xdg-open "https://sourceforge.com/project/penguins-eggs"
}



################################
function press_a_key_to_continue {
   read -rp "Press enter to continue"
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
    eb_incl easybashgui
}

##################################################################################
##################################################################################
##################################################################################
##################################################################################
#
# The master copy of the "easybashincl code snippet" is
# being maintained in easybashgui (as it loads easybashlib).
#
##################################################################################
##################################################################################
################## BEGIN easybashincl code snippet ###############################
##################################################################################
#

# avoid repeated definitions
function eb_incl_loading_required()
{
	local this_eb_incl_version="4"

	if    [ "${eb_incl_snippet__version:-0}" = "0" ] \
	   || [ "${this_eb_incl_version}" -gt "${eb_incl_snippet__version}" ]
	then
		declare eb_incl_snippet__version="${this_eb_incl_version}"
		return 0
	else
		return 1
	fi
}


declare eb_current_process_path="$(echo "${0}" | sed s\#'^-'#''# )"
if eb_incl_loading_required
then
	
	declare eb_runtime_invoke_path="${eb_current_process_path}"
	declare eb_runtime_invoke_name="$(basename "${eb_current_process_path}" )"
	declare eb_runtime_abs_invoke_dir


	function eb_absolute_path()
	# Returns the absolute path of the given path (or of the running script if no path is specified).
	{
		if [ "$#" = "0" ]
		then
			local given_path="$0"
		else
			local given_path="$1"
		fi

		# if path is already absolute
		if [ "x${given_path:0:1}" = 'x/' ]
		then
			echo $(dirname "$given_path")
		else
			echo $(dirname "$(pwd)/$given_path")
		fi
	}


	eb_runtime_abs_invoke_dir=$(eb_absolute_path)


	# eb_incl() lets you include files into your main script (modularization)
	#  it searches for file in system, same dir, and $SHELL_LIBRARY_PATH
	#		
	function eb_incl() { 
		local module=$1

		if [ "${module:-unspecified}" = "unspecified" ]
		then
			echo "$eb_runtime_invoke_name: eb_incl: No module specified." 1>&2
			return 1
		fi

		if [ "x${eb_runtime_abs_invoke_dir:-notset}" == "xnotset" ]
		then
			echo "$eb_runtime_invoke_name: eb_incl: Error, eb_runtime_abs_invoke_dir not set."
			exit 1
		fi

		if [ "x$eb_runtime_abs_invoke_dir" == "x" ]
		then
			echo "$eb_runtime_invoke_name: eb_incl: Error, eb_runtime_abs_invoke_dir is empty."
			exit 1
		fi

		# if installed in system's PATH
		if type "$module" &>/dev/null
		then
			source "$module"
			return 0
			
		# if in same dir
		elif [ -e "$eb_runtime_abs_invoke_dir/$module" ]
		then
			source "$eb_runtime_abs_invoke_dir/$module"
			return 0
			
		# if in includes/ subdir
		elif    [ -e "$eb_runtime_abs_invoke_dir/includes" ] \
		     && [ -e "$eb_runtime_abs_invoke_dir/includes/$module" ]
		then
			source "$eb_runtime_abs_invoke_dir/includes/$module"
			return 0	
			
		# if in "libexec_dir"
		elif [ -e "$libexec_dir/$module" ]
		then
			source "$libexec_dir/$module"
			return 0	
			
		# if lib path is defined
		elif [ "${SHELL_LIBRARY_PATH:-unset}" != "unset" ]
		then
			local saved_IFS="$IFS"
			IFS=':'
			for path in $SHELL_LIBRARY_PATH
				do
				if [ -e "$path/$module" ]
				then
					source "$path/$module"
					return 0
				fi
			done
			IFS="$saved_IFS"

		fi
	echo -e "$eb_runtime_invoke_name: eb_incl: Could not find requested module \"$module\" in \$PATH, $eb_runtime_abs_invoke_dir, an includes/ subdirectory, or \$SHELL_LIBRARY_PATH." 1>&2 && return 1
	#exit 1
	}
fi

################## END easybashincl code snippet #################################

main

# EOF()