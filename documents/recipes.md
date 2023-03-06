# Recipes

## Waydroid
We start from naked and install plasma-workspace-wayland 

```
sudo apt install plasma-workspace-wayland 
```
Suggested packages:
  squid-deb-proxy-client ubuntu-archive-keyring zstd shunit2 wodim cdrkit-doc
  btrfs-progs lvm2 python3-lxc qemu-user-static apt-transport-tor
  binfmt-support genext2fs perl-doc proot qemu-user squashfs-tools-ng

Reccomanded packages  
bridge-utils

```
export DISTRO="bookworm" && \
sudo curl https://repo.waydro.id/waydroid.gpg --output /usr/share/keyrings/waydroid.gpg && \ 
echo "deb [signed-by=/usr/share/keyrings/waydroid.gpg] https://repo.waydro.id/ $DISTRO main" > ~/waydroid.list && \
sudo mv ~/waydroid.list /etc/apt/sources.list.d/waydroid.list && \
sudo apt update
```

## Dariusz light kde for Lenovo 

## Install naked

Download from [penguins-eggs](https://penguins-eggs.net/iso) a naked version.

Prepare a LiveUSB with it with balena-etcher or similar.

Boot your computer with liveUSB and yuo will have a crude system, without any GUI or other. 

Login with:

* user: live
* password: evolution

At this point it's time to install the naked system:

```sudo eggs install```

and follow the instructions.

Reboot your system, login with your user and password. After:

```sudo update-initramfs -u ```

Well, we finish! It's time to start to configure.

## Configurations

``` apt install plasma-desktop plasma-nm gparted spice-vdagent nwipe synaptic ```

In same way download the package [slimjet_amd64.deb](https://www.slimjet.com/) and install it:

```dpkg -i slimjet_amd64.deb```

You can also choose firefox or chromium.

```sudo apt install firefox-esr``` for firefox, or ```sudo apt install chomium```.

Edit your apt sources.list and add non-free, like this example:

```
deb http://deb.debian.org/debian/ buster main non-free
deb-src http://deb.debian.org/debian/ buster main non-free

deb http://security.debian.org/debian-security buster/updates main non-free
deb-src http://security.debian.org/debian-security buster/updates main  non-free

# buster-updates, previously known as 'volatile'
deb http://deb.debian.org/debian/ buster-updates main non-free
deb-src http://deb.debian.org/debian/ buster-updates main non-free

```

Install the firmware you need. Example:

```apt install firmware-atheros firmware-ath9k-htc```



## Install eggs

Download from [sourceforge/project/penguins-eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) package eggs last version and install it:

```dpkg -i eggs-7.7.21-amd64.deb``` 

## Add prerequisites

We call prerequisites all the packages used by eggs to build the iso. 

```sudo eggs prerequisites```

eggs ask you if you want calamares, and install prerequisites packages for eggs.

Configuration files are preparated too. 

## Produce iso

Once this is end, you are ready to re-produce your penguin.

```eggs dad```

Ask help from dad: 

```
  ___  __ _  __ _ ___ 
  / _ \/ _` |/ _` / __|
 |  __/ (_| | (_| \__ \
  \___|\__, |\__, |___/
       |___/ |___/     
   penguins-eggs    Perri's Brewery edition     ver. 7.7.21   
command: dad 

Daddy, what else did you leave for me?
- prerequisites already present
- configuration already present
Edit and save LiveCD parameters
? LiveCD iso prefix:  penguin-
? LiveCD iso basename:  dariusz
? LiveCD user: live
? LiveCD user password:  evolution
? LiveCD root password:  evolution
? LiveCD theme:  eggs
? LiveCD compression:  (Use arrow keys)
  fast 
❯ normal 
  max 
```

Your iso will be prepared!


# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations

You can find more informations at [Penguins' eggs blog](https://penguins-eggs.net).

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* [blog](https://penguins-eggs.net)    
* [facebook](https://www.facebook.com/groups/128861437762355/) Penguins' eggs group
* [mail](mailto://piero.proietti@gmail.com): piero.proietti@gmail.com
* [sources](https://github.com/pieroproietti/penguins-krill)
* [telegram](https://t.me/penguins_eggs) Penguins' eggs channel
* [twitter](https://twitter.com/pieroproietti) pieroproietti

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.

