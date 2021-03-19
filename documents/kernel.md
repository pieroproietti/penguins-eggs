# kernel

eggs to produce and install an iso, needs:

* overlayfs: (we need almost kernel 3.19)
* compression xz, lz4


## The situation on Debian
* buster and bullseye are just ok!
* stretch we lack lz4 ability to read filesystem.squash - so we can use just xz.

* jessie We lack overlayfs with the default kernel 3.16.84. We lack lz4 ability to read filesystem.squash - and we can use just xz.


## kernel compitation for jessie

### prerequisites

We need ncurses

* `sudo apt-get install libncurses5-dev libncursesw5-dev`

We need build-essential and fakeroot

`sudo apt-get install build-essential fakeroot`

## dowonload kernel source

* `sudo apt-get install linux-source-3.19.8`

* `sudo apt-get build-dep linux`

* `apt-get source linux`

* `cd linux-3.19.8`

* `fakeroot make -f debian/rules.gen setup_amd64_none_amd64`

* `make -C debian/build/build_amd64_none_amd64 nconfig`