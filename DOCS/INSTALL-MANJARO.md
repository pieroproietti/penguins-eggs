# Using Manjaro Extra repository
Just install it: 
```
sudo pacman -S penguins-eggs
```

# Using the penguins-eggs Manjaro Linux Repository
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
Server = https://pieroproietti.github.io/penguins-eggs-repo/manjaro
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
sudo pacman-key --lsign-key F6773EA7D2F309BA3E5DE08A45B10F271525403F
```

## Step 3: Update and Install
Finally, refresh your package database and install penguins-eggs:

Synchronize the package databases:
```
sudo pacman -Syyu
```

Install the package:
```
sudo pacman -S penguins-eggs
```

That's it! penguins-eggs is now installed and will be automatically updated along with your other system packages whenever you run `sudo pacman -Syu`.