### Mini Rescue
**Mini Rescue** is a mini and fast live CD/USB system that focus quick rescue of your system.
<p><b>QQ group: 19346666, 111601117</b></p>


## Features

  * Free and open source software
  * Live system; works on machines that won't even boot
  * Extremely fast boot, mini size
  * Provides GParted with btrfs support
  * Provides zstd for backup or restore
  * Provides arch-chroot for quick fix
  * UEFI Secure Boot support
  * Based on 64-bit Debian Linux
  * ISO can be written to CD or USB
  * Blackbox windows manager
  * Network support DHCP or static ip
  * Integrated Chinese font


## Notes

* By default the system login as the `live` user with password `live`.


## Build

To build an ISO image from within Debian Linux:

  1. `git clone git@github.com:loaden/mini-rescue.git`
  2. `cd mini-rescue`
  3. `sudo ./make`

After building, it's easy to modify a file or install a package without rebuilding and downloading all the packages again:

  1. `sudo ./make changes`
  1. Make your changes to the live system image
  1. `exit` and the ISO will be updated automatically

It is possible to change the mirror of the source, add extra packages, or both:

  1. `sudo MIRROR=https://mirrors.ustc.edu.cn/debian ./make`
  2. `sudo EXTRA_PACKAGES=fonts-noto-cjk ./make`
  3. `sudo MIRROR=https://mirrors.ustc.edu.cn/debian EXTRA_PACKAGES=fonts-noto-cjk ./make`

## Thanks

Mini Rescue based on **Redo Rescue**: https://github.com/redorescue/redorescue
