# NAKED Debian
Debian is the first distro we adopt and there are both: a package `penguins-eggs` to install, and a repositorory `penguins-eggs_ppa`, to be always updated.

Hhowever, it is possible to install and use eggs in this way, and in some cases, especially development, it can help save time.

## Procedure
We start from a recent `debian-12.6.x-amd64-netinst.iso` image and just install it at minimum delecting all, except standard sysstem utilies.

## reboot
After reboot just run `sudo ./PREREQUISITES/install.sh`, then after finish, con in the main folder `~/penguins-eggs` and run `./install-eggs-dev.sh`.

That's all!

You can start producing your iso with: `eggs love` or dress it like a colibri using `eggs wardrobe get` and `sudo eggs wardrobe wear colibri`.



