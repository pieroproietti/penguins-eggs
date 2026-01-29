# Using the penguins-eggs Arch Linux Repository
Follow these simple steps to add the official penguins-eggs repository to your Arch Linux system. This will allow you to easily install and receive updates for penguins-eggs through pacman.

## Step 1: Add the Repository to pacman.conf
You need to tell pacman where to find the repository. Open the /etc/pacman.conf file with a text editor as root:
```
sudo nano /etc/pacman.conf
```
Scroll to the bottom of the file and add the following lines:
```
[penguins-eggs]
SigLevel = Optional TrustAll
Server = https://penguins-eggs.net/repos/arch
```

## Step 2: Import the GPG Key
The packages in this repository are signed for security. You must import the public GPG key to allow pacman to verify the packages.

Replace YOUR_GPG_KEY_ID in the commands below with the actual ID of the key you used to sign the repository.

Receive the key from a keyserver:
```
sudo pacman-key --recv-keys F6773EA7D2F309BA3E5DE08A45B10F271525403F
```

Locally sign the key to establish trust:
```
sudo pacman-key --lsign-key YOUR_GPG_KEY_ID
```

## Step 3: Update and Install
Finally, refresh your package database and install penguins-eggs:

Synchronize the package databases:
```
sudo pacman -Syu
```
Install the package:
```
sudo pacman -S penguins-eggs
```

# Using Chaotic-AUR
penguins-eggs, is published on [AUR](https://aur.archlinux.org/packages/penguins-eggs), so you can add [Chaotic-AUR](https://aur.chaotic.cx/) to get it.


Follow, this steps:

* start by retrieving the primary key to enable the installation of our keyring and mirror list.

```
sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
sudo pacman-key --lsign-key 3056513887B78AEB
```
* this allows us to install our chaotic-keyring and chaotic-mirrorlist packages.
```
sudo pacman -U 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst'
sudo pacman -U 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
```
* then, we append (adding at the end) the following to /etc/pacman.conf:

```
[chaotic-aur]
Include = /etc/pacman.d/chaotic-mirrorlist
```

That's it! penguins-eggs is now installed and will be automatically updated along with your other system packages whenever you run `sudo pacman -Syu`.