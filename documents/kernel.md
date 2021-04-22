# kernel

eggs to produce and install an iso, needs:

* overlayfs: (we need almost kernel 3.19)
* compression xz, lz4


## The situation on Debian
* buster and bullseye are just ok!
* stretch we lack lz4 ability to read filesystem.squash - so we can use just xz.
* jessie We lack overlayfs with the default kernel 3.16.84. We lack lz4 ability to read filesystem.squash - and we can use just xz.



