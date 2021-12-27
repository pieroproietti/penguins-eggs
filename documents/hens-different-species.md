# Prepare a Debian hen
* 


# Prepare a manjaro hen
We try to install a light version on manjaro
* install manjaro-xfce-21.1.6-minimal-211017-linux513.iso

## Addind developing tools
* install code: ```sudo pacman -S vscode```
* install base-devel: ```sudo pacman -S base-devel```
* install node: ```sudo pacman -S "nodejs=16.13.1"
* install npm: ```sudo pacman -S npm```
* install spice-vdgent: ```sudo pacman -S spice-vdagent```

## Downloading eggs from repo:
* get eggs: ```git clone https://pieroproietti/penguins-eggs```
* install node packages in eggs
    * ```cd penguins-eggs```
    * ```npm i```

## Configure eggs
eggs need differents packages to work, this packages are installed by the command: sudo config, 
the same command take cure to add in /etc/bash_completion.d eggs-bash.sh for autocompletion,
create an eggs.yml and a tools.yml in /etc/penguins-eggs.d.

* ```sudo ./eggs config --clean --verbose``` this will install prerequisites
* ```sudo ./eggs config --clean --verbose``` the second config will configure correctly eggs
* ```sudo ./eggs dad -d``` will config eggs to defaults (prefix, etx)

## Producing our first iso
* sudo ./eggs produce --fast --verbose





