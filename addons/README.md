# eggs addons

## Themes

You can customize the boot of live images made with eggs using **themes**.

A **theme** consists of a simple folder under addons, called with the name of 
vendor (in the example: blissos), that includes:

```
blissos/
    theme
        applications
        artwork
        calamares
            branding
            modules
        livecd
```

* in **applications** we have the desktop link named **install-system.desktop** into calamares startup;
* in **artwork** the icon named **install-system.png** for the calamares launcher
* in **calamares** we have two directories: **branding** with your slides for calamares and **modules**
* **livecd** includes grub and isolinux templates, buoot splash named **splash.png** and theme for grub and isolinux.


# How to proceed in creating an original theme
Copy the structure of an existing theme and rename it with your desired name. mutheme

Example with sources: need to install build-essential, git and nodejs v.16.

```
sudo apt install build-essential git nodejs 
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
npm install
cp -r addons/blissos addons/mytheme
```
edit your theme with a nice editor.
```
sudo ./eggs produce --fast --theme mytheme
```
Example with eggs installed as package:
```
sudo cd /usr/lib/penguins-eggs
sudo cp -r addons/blissos addons/mytheme
```
edit your theme with a nice editor.
```
sudo eggs produce --fast --theme mytheme
```


# Other addons (vendor eggs)

Themes are nothing more than addons developed by third parties: vendors.

For eggs - the default vendor, named **eggs** - in addition to the default 
theme there are additional addons provided:

* **--adapt** it is an addon that I often use - working mainly on virtual machines - 
and allows me to to adapt with a click the monitor of the VM to the set 
video window;
* __--pve__ create a desktop icon to admin a [proxmox-ve](https://www.proxmox.com/en/proxmox-ve) installed locally, it's incredible but can work on the live iso too. You can follow this easy guide: [Install Proxmox VE on Debian 11 Bullseye](https://pve.proxmox.com/wiki/Install_Proxmox_VE_on_Debian_11_Bullseye);
* __--rsupport__ create an icon for [dwagent](https://www.dwservice.net) that must be installed locally.

# More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) and same other documentation - mostly for developers - on [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under **DOCUMENTATION**.

* [Penguins' eggs blog](https://penguins-eggs.net)    
* [facebook Penguins' eggs group](https://www.facebook.com/groups/128861437762355/)
* [twitter](https://twitter.com/pieroproietti)
* [sources](https://github.com/pieroproietti/penguins-krill)

You can contact me at pieroproietti@gmail.com or [meet me](https://meet.jit.si/PenguinsEggsMeeting)

## Copyright and licenses
Copyright (c) 2017, 2021 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
