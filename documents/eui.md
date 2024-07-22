# EUI: Eggs Unattended Installation

It is a bit long to explain, and the function is not yet to be considered fully stable.

The idea is to be able to perform automatic installations in laboratories or classrooms-essentially we are talking about public places-in which the presence of relevant user data can be reasonably excluded.

We basically have two ways forward: the first is more practical, the second more secure.

The practical solution involves enabling for all PCs to boot PXE as the first option, this is very practical: we turn on our clients and - in the presence of PXE server and eui image - they are reinstalled. 

The second solution, on the other hand, is more traditional: we configure our computers to boot to local disk and, if no system is present, we enable booting via PXE. This solution has the advantage of greater stability, unfortunately it presents the need to go through each computer to select booting via PXE each time we need to run the installation

Eggs unattended install basically applies to a solution of the first type and provides a fully automated installation of the machines on first boot. Where it is applicable, you have to decide.

In most cases it is sufficient to use traditional eggs images, considering that you will still have a pre-configured PXE server by simply booting the iso and running the command: `sudo eggs cuckoo`.

It is possible, however, to further facilitate multiple installations by configuring where possible - default PXE boot machines and using an eui image.

# eui images

Creating an eui image is done through the script: `uei-create-image.sh` that you find inside the eggs installation folder, normally `/usr/lib/penguins-eggs/uei`.

All this script does is produce a system image that will auto-start the installation when the system boots.

I got the idea from Matteo from LUG Rimini and valuable information from Hakim - a Malaysian entrepreneur and developer - who has previously used the more traditional approach to install hundreds of systems.

In my opinion, the method is already good for experimentation, but it could be improved if we could find a method to: detect the installed system, report it by [epoptes](https://epoptes.org/) to the installer on the server machine, and let the human to decide whether to proceed or not. At the moment, the system runs automatically, and so care must be taken.

If you use it on a system configured with epoptes, you will have the ability to control your machines from the first boot, but - of course - this still requires some experimentation in a real environment.

I have prepared two versions called chicks and pulcini from Debian bullseye and Ubuntu jammy, ready for use to evaluate the approach, but of course you can create your own uei. 

You will find them at [plastilinux](https://sourceforge.net/projects/penguins-eggs/files/ISOS/plastilinux).

