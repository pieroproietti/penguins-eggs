[ Recipes

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

Download from https://penguins-eggs.net package eggs last version

```dpkg -i eggs-7.7.21-amd64.deb``` 

```sudo eggs prerequisites```

eggs ask you if you want calamares, and install prerequisites packages for eggs.

Configuration files are preparated too. 

Once this is end, you are ready to reproduce your penguin.

```eggs dad```

Ask the questions of dad: 

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

Prepare your iso.


Configure basename_prefiz: penguin-
basename: myegg
live user: live
live user password: evolution


problemi

rimuovere mom.sh lasciare solo mom-cli

