# sourceforge/admin/metadata

# English

# name
Penguin's eggs

# Homepage
https://penguin-s-eggs.gitbook.io/project/

# Video
www.youtube.com/embed/teG6EKcuPuI?rel=0

# Short Summary
On the road of Remastersys and systemBack

# Full Description
Penguin's eggs is a terminal utility, in active development, which allows you to remaster your system and redistribute it as an ISO image, on a USB stick or through the network via PXE remote boot.

Install the package in .deb or npm version, install the prerequisites with the command:

sudo eggs prerequisites

You are ready to re-produce your penguin:

sudo eggs produce -fv

## Features 
* Created on Debian stable (buster) support oldstable (stretch) and testing (bullseye) too.

* Compatible Ubuntu 20.20 LTS, 19.10, 18.04 LTS, 16.04 LTS / Linux Mint 19.x / LMDE4 / Deepin 20.

Fast: does not copy the original filesystem but the livefs is obtained instantly, through binding and overlay. In addition, the --fast option creates the ISO using lz4, reducing compression time during the development up to 10 times!

Versatile: if you want more control on the production of your iso, try the flag --dry in produce. It's instantaneous: will generate filesystem directory, iso structure complete and the related scripts to bind/ubind filesystem, squash it and create iso. You can change the liveFs and the iso structure as much as you need, stop the work and restart tomorrow.

Safe: only use original .deb packages, without any modification to your repository lists.

Supported: I'm trying to give as documentation and support possible: sources, sources documentation generate automatically, gitbook (only italian), facebook page and group, gitter.

Please: feel free to contact me for any suggestions and don't forgot to rate the project.