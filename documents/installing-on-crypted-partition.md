The steps are first:

* installation of the system in which the disk has to be full disk encrypted, lvm partitioning is done;

* a default encryption key is created at first. Post this the hostname is assigned the users created and - since we have been using the snapshot method for mx Linux all of the application and application files would have already been installed and available in the snapshot hence when we install the snapshot that would invariably be available in the current installation. 

* Once the system boots up we login and the system credentials are changed for the user as well as the encryption keys changed.

* We also add additional encryption keys so that if the user forgets the current key we could share the next one as well as the system admin could use the third key to log into the system. 

* In general 4 encryption keys are added 1 to be shared with thr user. 2 to be shared with the user if they forget the first one. 3 to be used by the sysadmin 4 to be used by management or company to log into the system if sysadmin is not available. The sysadmin and management keys are kept the same on all machines. 

* Once the installation is completed few files are copied from various locations and permission of the files and directories are set and the machine is handed over to the user. 

* So till now we have been using mx Linux where we install one system, install all applications copy files etc, then use the snapshot method to make a copy of the system snd use the installer to keep installing newer machines 

* With Ubuntu this is not possible since Ubuntu does not provide any snapshot facility.

MX crea 2 device: 
* /dev/mapper/root.fsm
* /dev/mapper/swap

I am configuring this partition to be an ext4 filesystem, mounted at /boot


# Pluggable devices are handled by uDev, they are not in fstab
/dev/mapper/root.fsm / ext4 noatime 1 1
UUID=524969b9-639a-4366-88fd-1b7fbfde1ec3 /boot ext4 noatime 1 1
/dev/mapper/swap swap swap defaults 0 0
UUID=B002-9DE1 /boot/efi vfat noatime,dmask=0002,fmask=0113 0 0

Device        Start      End  Sectors  Size Type
/dev/sda1      2048   526335   524288  256M EFI System (EFI)
/dev/sda2    526336  1574911  1048576  512M Linux filesystem (boot)
/dev/sda3   1574912 63686655 62111744 29,6G Linux filesystem (root.fsm)
/dev/sda4  63686656 67094527  3407872  1,6G Linux filesystem (swap)

Quindi:

/dev/sda1 256M efi
/dev/sda2 512M boot
/dev/sda3 92% root
/dev/sda4 0.5% swap


sudo fdisk /dev/sda g

