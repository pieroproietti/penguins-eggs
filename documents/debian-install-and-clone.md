# Debian stable: install eggs and clone the system

This apply to all Debian family, included Devuan and Ubuntu.

We will start with a pre-existing installation of Debian-probably our system that we want to make reproducible. 

## Download last package

* Download the latest available eggs package from the project's [debs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) page on sourceforge. In our case the latest available version is eggs_9.2.1_amd64.deb.

* eggs needs some dependencies, so it is convenient to first run a command to upgrade:

```sudo apt update```

* it is also advisable to perform apt full-upgrade and eventual reboot, in case of kernel upgrade

```sudo apt full-upgrade```

```sudo reboot```

* At this point, we start the eggs installation with the command:

```sudo dpkg -i eggs_9.2.1_amd64.deb```

* Most likely you will find an error for lack of dependencies. Don't worry, just a command will fix it:

```sudo apt install -f```


## Configuration
* We will be brief, get help from dad and request default values, there will be time to see the possibilities:

```sudo eggs dad -d```

* If you wish to use the calamares graphical installer, these are the instructions for installing it:

```sudo eggs calamares --install```


## Uso

### normal and fast (remove all users)

```sudo eggs produce --fast```

### clone and fast (users are saved uncrypted on the live and will be restored too)

```sudo eggs produce --fast --clone```
