# NAKED arch
Arch like debian has both a `penguins-eggs` package and a repository to keep it up to date. 

And as with Debian, it can be useful to use this during development.

## Procedure
We start from a recent `archlinux-yyyy.mm.dd-x86_64.iso` image and just install it using `archinstall` or old style way.

## reboot
After reboot just run `sudo ./PREREQUISITES/install.sh`, then after finish, con in the main folder `~/penguins-eggs` and run `./install-eggs-dev.sh`.

That's all!

You can start producing your iso with: `eggs love` or dress it like a colibri using `eggs wardrobe get` and `sudo eggs wardrobe wear colibri`.
