# pod

Here we have scripts to build on local system, using podman container.

* debian.sh
° arch.sh
* ubuntu.sh

Due the actual limitations, debian must tp run on a system Debian bootkworm, and arch to Arch. 

# build eggs tarballs
Here we use a tarballs version of eggs to but free from the different package managers. To build, just:

`pnpm tarballs`

# running the container
`./pod/debian.sh`

Container is build, eggs is installed inside. Run:
`cd ci`
`1001-debian...` or `1003-arch...` in accord of the image.


Materials and relative installable live ISOs can be found [here](https://drive.google.com/drive/folders/15jAwpk-k27dSuqD4iUZkjADgh9-tRI-4?dmr=1&ec=wgc-drive-globalnav-goto)
