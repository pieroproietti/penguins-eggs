# AppImage x86_64

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![basket](https://img.shields.io/badge/basket-packages-blue)](https://penguins-eggs.net/basket/)
[![drive](https://img.shields.io/badge/drive-isos-blue)](https://penguins-eggs.net/drive)
[![sourceforge](https://img.shields.io/badge/sourceforge-all-blue)](https://sourgeforge.net/project/penguins-eggs)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Get it as AppImage](https://img.shields.io/badge/Get%20it%20as-AppImage-important.svg)](https://appimage.github.io/penguins-eggs/)


<a href="https://drive.google.com/drive/folders/19fwjvsZiW0Dspu2Iq-fQN0J-PDbKBlYY">
  <img src="https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/images/penguins-eggs-300x300.png" width="280" height="300" alt="CD-ROM">
</a>

It took years of work to create the penguins-eggs, and I also incurred expenses for renting the site and subscribing to Google Gemini, for the artificial intelligence that is now indispensable.

[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)

# AppImage x86_64
I have introduced dependency management in the AppImage version using native meta-packages for each supported distribution. This resolves any incompatibilities at the root and has the advantage of allowing easy removal of dependencies installed by penguins-eggs AppImage, without the risk of removing pre-existing packages.

Essentially, at this point, using native penguins-eggs or penguins-eggs AppImage should give exactly the same results and behave in exactly the same way.

The meta-packages incorporated into the AppImage were built on specific distributions, while my tests - so far - are mainly related to Debian and - in particular - to the trixie version, but it should reasonably apply to all supported distributions. 

Conceptually, I am even thinking of discontinuing the native packages altogether and releasing only the AppImage for all distributions, then perhaps trying to extend support to others.

However, proving this takes time, so I am relying heavily on your opinions and the results of your suggestions.

## AppImage requisites

Before to try AppImage depending on your distro, you need this packages installed:
* Alpine: `sudo apk add fuse`
* Arch/Manjaro: `sudo pacman -S fuse2`
* Debian/Devuan/Ubuntu: `sudo apt-get install fuse libfuse2`
* Fedora/RHEL: `sudo dnf install fuse fuse-libs`
* Opensuse: `sudo zypper install fuse fuse-libs`

## AppImage installation
penguins-eggs as an AppImage, it can be installed on all supported distributions. Download it from [github.com/pieroproietti](https://github.com/pieroproietti/penguins-eggs/releases) or on [appimage.github.io](https://appimage.github.io/penguins-eggs), then run the following commands:
```
$ chmod +x penguins-eggs-25.11.29-1-x86_64.AppImage
$ sudo ./penguins-eggs-25.11.29-1-x86_64.AppImage
```

[![Get it as AppImage](https://img.shields.io/badge/Get%20it%20as-AppImage-important.svg)](https://appimage.github.io/penguins-eggs/)


