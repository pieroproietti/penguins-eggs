# pacman.d

This classes named after the distro, abstract same `pacman` functions used with eggs to install/remove/check packages, then the resulting methods are used on eggs.

## History
I started with Debian but always with the idea to expand eggs to others distros, come a long time before to really trying: just eggs was not mature enought and too difficult to have all together.

So, after the first time of eggs, I wrote just mockup for fedora and SuSE, but the first real addiction was manjaro (thanks of insterest of Stefano Capitali from manjaro.org) then archlinux.

At this point started with AlpineLinux, fedora and opensuse. 

When I was able to remaster fedora, came on Almalinux and RockyLinux and generaly RHEL compatible distros.

## Plan
Finally on november 2024, after remasterering openmamba I decided to restruture a bit the code to stabilize it and be able to get others distros.

We have actually the follow limis:
* alpine (calamares is included on our repos);
* archlinux (calamares is included on our repos);
* debian;
* fedora:
* openmamba: (suspended at the moment)
* opensuse: (no working calamares available)


# mockup
I'm trying to reorganize a bit and have a clean mockup to follow.

