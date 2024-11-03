# opensuse naked

I used `openSUSE-Tumbleweed-DVD-x86_64-Snapshot20240820-Media.iso` minimal installation, choosing ext4 as filesystem.

After completed installation, just reboot, clone penguins-eggs,

`cd penguins-eggs/PREREQUISITES/opensudo`

`sudo ./PREREQUISITES/install.sh`

then after finish, con in the main folder `~/penguins-eggs` and run `./install-eggs-dev.sh`.

That's all!

You can start producing your iso with: `eggs love` or dress it like a colibri using `eggs wardrobe get` and `sudo eggs wardrobe wear colibri

# my notes
* added check if /etc/issue is a symlink;
* the disks at the boot are looked from dmsetup, to solve just added ```dmsetup remove_all``` in sequence, before partition,

