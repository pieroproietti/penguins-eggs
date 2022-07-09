mkdir /run/archiso/cowspace/.lower
mount /run/archiso/bootmnt/live/filesystem.squashfs /run/archiso/cowspace/.lower
mkdir /run/archiso/cowspace/.upper
mkdir /run/archiso/cowspace/.work
mount -t overlay overlay -o lowerdir=/run/archiso/cowspace/.lower,upperdir=/run/archiso/cowspace/.upper,workdir=/run/archiso/cowspace/.work /new_root

init="/sbin/init"
echo exec env -i "TERM=$TERM" /usr/bin/switch_root $init "$@"
exec env -i "TERM=$TERM" /usr/bin/switch_root $init "$@"

#     --help                      Show this help
#     --version                   Show version
#     --test                      Determine initial transaction, dump it and exit
#     --system                    Combined with --test: operate in system mode
#     --user                      Combined with --test: operate in user mode
#     --dump-configuration-items  Dump understood unit configuration items
#     --dump-bus-properties       Dump exposed bus properties
#     --bus-introspect=PATH       Write XML introspection data
#     --unit=UNIT                 Set default unit
#     --dump-core[=BOOL]          Dump core on crash
#     --crash-vt=NR               Change to specified VT on crash
#     --crash-reboot[=BOOL]       Reboot on crash
#     --crash-shell[=BOOL]        Run shell on crash
#     --confirm-spawn[=BOOL]      Ask for confirmation when spawning processes
#     --show-status[=BOOL]        Show status updates on the console during boot
#     --log-target=TARGET         Set log target (console, journal, kmsg,
