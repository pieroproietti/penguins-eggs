# UEI Live Images

An image UEI is different from a common image produced by eggs, the difference consist in its ability to start system installation automatically.

So be warned: you may be in danger of formatting your hard disk if you use this image. But are pratical for massive installation on laboratories, in short time you will renew all the machines.

## USAGE
A UEI image is different from a traditional image, in which case the installer is automatically started. 

As with a traditional image produced with eggs you have the ability to start the PXE server by simply typing: sudo eggs cuckoo.

In this case, however, the booted machines will directly try to install the system by means of a completely unattended installation. At the end of the process the client machines will shut down.

This can be extremely convenient in some cases or disastrous in others; it should, of course, be used in laboratory or school environments where valuable user data are not present.

### Start the server 
We will boot our first machine from live on DVD ROM or USB stick and have the care to stop the automatic installation as the warning comes out.

At this point we can start our PXE server which, in the presence of any dhcp server that releases ip addresses, will complete them with its address and the file to download for starting the installation via LAN.

### Starting the machines to be installed
If you have a method to automatically boot all machines and if they are configured with network boot as the first option, we are in the best situation: just turn on the machines and wait for them to install the system and perform shutdown.


### PXE service stop and client restart
At this point we can restart the machines, which will no longer find an available PXE server and will reboot from hard disk with the previously installed system.

# Recommendations
Of course, this methodology must be carried out in controlled environments and by experienced personnel; the risk-if proper care is not taken-is to erase important machines.

# Disclaimer
The use of eggs for the installation of systems and especially the automatic installation is ENTIRELY YOUR SOLE RESPONSIBILITY.



