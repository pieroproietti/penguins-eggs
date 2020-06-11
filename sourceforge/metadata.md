# sourceforge/admin/metadata

# English

Penguin's eggs is a terminal utility, in active development, which allows you to remaster your system and redistribute it as an ISO image, on a USB stick or through the network via PXE remote boot.

Install the package in .deb or npm version, install the prerequisites with the command:

sudo eggs prerequisites

You are ready to re-produce your penguin:

sudo eggs produce -fv

## Features 
* Created on Debian stable (buster) support oldstable (stretch) and testing (bullseye) too.

* Compatible Ubuntu 20.20 LTS, 19.10, 18.04 LTS, 16.04 LTS / Linux Mint 19.x / LMDE4 / Deepin 20.

* Fast: does not copy the original filesystem but is obtained instantly, through binding and overlay. In addition, the --fast option creates the ISO using lz4, reducing compression time during the development up to 10 times!

* Safe: only use original .deb packages, without any modification to the standard repo.

* Tips: if you want more control on the production of your iso, try the new --dry flag, it's instantaneous: will generate filesystem directory, iso structure complete and the related scripts to bind/ubind filesystem, squash it and create iso.


* Please: feel free to contact me for any suggestions and don't forgot to rate the project in sourceforge.