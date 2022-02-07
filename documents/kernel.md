# kernel

eggs to produce and install an iso, needs:

* overlayfs: (we need almost kernel 3.19)
* compression xz, lz4

## The situation on Debian
* buster and following: are just ok!
* stretch: we lack lz4 ability to read filesystem.squash - so we can use just xz.
* jessie: we lack overlayfs with the default kernel 3.16.84, we lack lz4 ability to read filesystem.squash, we can use just xz compression.




