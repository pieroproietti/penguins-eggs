# sourceforge/admin/metadata

# English

# name
Penguin's eggs

# Homepage
https://penguins-eggs.net

# Video
www.youtube.com/embed/teG6EKcuPuI?rel=0

# Short Summary
On the road of Remastersys, SystemBack and father Knoppix!

# Full Description
Penguin's eggs is a terminal utility, in active development, which allows you to remaster your system and redistribute it as an ISO image, on a USB stick or through the network via PXE remote boot.

Install the package in .deb or npm version, install the prerequisites with the command:

sudo eggs prerequisites

You are ready to re-produce your penguin:

sudo eggs produce -fv

## Features 
Created on Debian stable (buster), support oldstable (stretch) and testing (bullseye).

Support: i386/amd64 BIOS/UEFI with follow distros and derivates: Debian buster/bullseye, Devuan beowulf, Ubuntu focal LTS/bionic LTS/groovy, Linux Mint ulyana/tricia/LMDE, Deepin 20, etc.

Fast: does not copy the original filesystem but the livefs is obtained instantly, through binding and overlay. In addition, the --fast option creates the ISO using lz4, reducing compression time during the development up to 10 times!

Safe: only use the original distro's packages, without any modification in your repository lists.

Script: if you want more control on the production of your iso, try the flag --script in produce. eggs will generate filesystem directory, iso structure complete and the related scripts to bind/ubind live filesystem, squash it and create or re-create yours iso as much times as you need, and customize the user live home.

Book: use guide in four different languages: english,  español, italiano, português

Supported: I'm trying to give you as documentation and support is possible: sources, automatic documentation sources, user guide, facebook page and group, gitter. 

Community: currently the biggest problem with this software is the lack of a community. I hope that over time it will grow. You can help by following the project and helping to spread it. "No man is an island entire of itself..." John Donne 

Important: please rate this project on sourgeforce and help to spread it's diffusion. 

Please: feel free to contact me for any suggestions.


<a href='https://gitter.im/penguins-eggs-1/community'>gitter</a>

www.youtube.com/embed/teG6EKcuPuI?rel=0
