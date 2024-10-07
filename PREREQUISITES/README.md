# PREREQUISITES

It is possible to install penguins-eggs from zero without a native package.

This way is a need for: alpine, fedora and opensuse - where we don't have yet a package - but can be used with all distros and indicate for developers.

The main limit is: in a system created with this procedure, penguins-eggs can be updated just with the same procedure, becouse package manager don't know at all it.

But this way is very pratical during development, no need to build package and test, this is sometime long enought, tedius and unpratical when we are developing.

# INSTALLATION

We need package `lsb-release` installed, this is default for mostly distros, but not on `AlpineLinux`  and `ArchLinux`.
* on Alpine, decomment   `/etc/apk/repositories`, then `doas apk add lsb-release`;
* on Arch, just `sudo pacman -S lsb-release`.

```
git clone https://github.com/pieroproietti/penguins-eggs
cd ~/penguins-eggs
sudo PREREQUISITES/<distro>/install.sh
./install-dev-eggs
```

On Alpine, after installation, change your shell on bash if you want autocomplete: `chsh -s /bin/bash.

# Thats all folks!









