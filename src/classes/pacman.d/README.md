# pacman.d

This classes named after the distro, abstract same `pacman` functions used with eggs to install/remove/check packages, then the resulting methods are used on eggs.

## History
I started with Debian but always with the idea to expand eggs to others distros, come a long time before to really trying: just eggs was not mature enought and too difficult to have all together.

So, after the first time of eggs, when I wrote just mockup for fedora ans SuSE, the first reall addiction was manjaro, then archlinux.

At this point started with AlpineLinux, then with fedora and opensuse. 

When I was able to remaster fedora, came on Almalinux and RockyLinux two RHEL compatible distros.

Finally users asked for VoidLinux, Openmamba and ALDOS, I tried with all them but, until now I'm able to remaster just Openmamba.

## Plan
Finally on november 2024, after remasterering openmamba I decided to restruture a bit the code to stabilize it and be able to get others distros.

We have actually the follow limis:
* aldos (not working)
* alpine (remaster and instll with krill, using a "sidecar.sh" script on initramfs disk, when initramfs gp in recovery shell);
* archlinux;
* debian;
* fedora: (work just with BIOS, and install with krill)
* openmamba: (work just with BIOS)
* opensuse: (work just with BIOS, and install with krill)
* voidlinux (to be completed)

# mockup
I'm trying to reorganize a bit and have a clean mockup to follow.

