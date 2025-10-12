#!/bin/bash
check() {
    return 0
}
depends() {
    echo "dmsquash-live crypt"
    return 0
}
install() {
    inst_script "$moddir/unlock.sh" "/usr/lib/dracut/hooks/pre-mount/99-unlock-live.sh"
}
