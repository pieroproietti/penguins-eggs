# PREREQUISITES

It is possible to install penguins-eggs from zero without a native package.

This way is a need for: alpine, fedora and opensuse - where we don't have yet a package - but can be used with all distros and indicate for developers.

The main limit is: in a system created with this procedure, penguins-eggs can be updated just with the same procedure, becouse package manager don't know it at all.

But this way is very pratical during development, no need to build the package and test it, this is sometime long enought, tedius and unpratical when we are developing, there are specialists.

# INSTALLATION

Before to start, we need the package `lsb-release` installed, this is default for mostly distros, but not on `AlpineLinux`  and `ArchLinux`.
* on Alpine, uncomment community from `/etc/apk/repositories`, then `doas apk add lsb-release`;
* on Arch, just install it: `sudo pacman -S lsb-release`.

```
git clone https://github.com/pieroproietti/penguins-eggs
cd ~/penguins-eggs
sudo PREREQUISITES/<distro>/install.sh
./install-dev-eggs
```

On Alpine, after installation, change your shell on bash if you want autocomplete: `chsh -s /bin/bash`.

# Produce your first live
Using this way, on mostly distros, we need to give: `sudo eggs dad --default` to create the configuration files, then we are one step from our ISO: `eggs love`.

Of course there is much more again to tell, consult this [repo](https://github.com/pieroproietti/penguins-eggs) and [penguins-eggs.net](https://penguins-eggs.net).

# That's all, Folks!

One of the standout features of Penguins' Eggs is its hassle-free setup. It comes with all the necessary configurations, making it a convenient choice for users. Just like in real life, the magic of Penguins' Eggs lies within - no additional setup required! 
