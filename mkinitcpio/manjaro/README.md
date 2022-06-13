# manjaro-tools-iso

To not depend from manjaro-tools-iso, who bring a lot of stuffs not necessary for eggs, we need:

* copy [initcpio stuffs](https://gitlab.manjaro.org/tools/development-tools/manjaro-tools/-/tree/master/initcpio) from [manjaro-tools](https://gitlab.manjaro.org/tools/development-tools/manjaro-tools) to /usr/lib/initcpio
* copy manjaro-tools/initcpio/script/miso_shutdown in /etc/initcpio/ 


cut and paste
```
git clone https://gitlab.manjaro.org/tools/development-tools/manjaro-tools
sudo cp manjaro-tools/initcpio/hooks/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/install/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/script/miso_shutdown /etc/initcpio/
```
