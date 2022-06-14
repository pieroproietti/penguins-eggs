# penguins-eggs manjaro

To not depend from manjaro-tools-iso - who bring a lot of stuffs not necessary for eggs - we need:

* copy [initcpio stuffs](https://gitlab.manjaro.org/tools/development-tools/manjaro-tools/-/tree/master/initcpio) from [manjaro-tools](https://gitlab.manjaro.org/tools/development-tools/manjaro-tools) to /usr/lib/initcpio
* copy manjaro-tools/initcpio/script/miso_shutdown in /etc/initcpio/ 

## Install manjaro-toos

Copy and paste follow instructions

```
git clone https://gitlab.manjaro.org/tools/development-tools/manjaro-tools
sudo cp manjaro-tools/initcpio/hooks/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/install/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/script/miso_shutdown /etc/initcpio/
```

## Build and install penguins-eggs

Copy and paste follow instructions
```
mkdir try-penguins-eggs
cd try-penguins-eggs
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs-manjaro/main/PKGBUILD
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs-manjaro/main/penguins-eggs.install
makepkg -srcCi
```

panguins-eggs on [manjaro-forum](https://forum.manjaro.org/t/penguins-eggs-help-needed-for-manjaro-compatibility/96799)
