# Prepare a Debian hen
* 


# Prepare a manjaro hen

* install manjaro-xfce-21.1.6-minimal-211017-linux513.iso
* install code ```git clone https://AUR.archlinux.org/cgit/aur.git/snapshot/visual-studio-code-bin```
    * ```cd visual-studio-code-bin```
    *```makepkg -si```
* ```sudo pacman -S base-devel```
* install node ```sudo pacman -S "nodejs=16.13.1"
* install npm ```sudo pacman -S npm```
* install spice-vdgent ```sudo pacman -S spice-vdagent```
* get eggs: ```git clone https://pieroproietti/penguins-eggs```
* install node packages in eggs
    * ```cd penguins-eggs```
    * ```npm i```
* eggs configuration
    * ```sudo ./eggs config --clean --verbose``` this will install prerequisites
    * ```sudo ./eggs config --clean --verbose``` the second config will configure correctly eggs
    * ```sudo ./eggs dad -d``` will config eggs to defaults (prefix, etx)
* sudo ./eggs produce --fast --verbose




