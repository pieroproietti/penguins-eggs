# EducaAndDOS theme

Work in progress... 

## theme modifications:
* started with your guadalinex
* added:
  * livecd/grub.theme.cfg (please take cure to adapt the colors)
  * livecd/isolinux.theme.cfg (please take cure to adapt the colors)

* updated applications/install-debian.desktop (you don't need to use sudo with calamares it you installed it with ```sudo eggs calaamres --install```. This command not only install calamares and dependencies but also configure policy for it.

## general modifications:

I use to configure my user with autologin, simply edit ```/etc/gdm/custom.conf``` and add:

```
[daemon]
AutomaticLoginEnable=true
AutomaticLogin=artisan
```

In this way You will get the live user to autologin too.

* Note: I call just a sed command, so don't use spaces: AutomaticLogin=artisan

* copied your ```users.yml``` to /usr/lib/penguins-eggs/conf/distros/focal/calamares/modules/users.yml

I think to place your ```users.yml``` inside the theme under calamares/modules, but this will happen in future.
