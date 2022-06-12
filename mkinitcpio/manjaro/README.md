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

necessary files are:


* hooks/miso
* hooks/miso_pxe_common
* hooks/miso_pxe_nbd
* hooks/miso_shutdown
* hooks/miso_loop_mnt
* hooks/miso_pxe_http
* hooks/miso_pxe_nf

* install/miso
* installmiso_loop_mnt
* install/ miso_pxe_http
* install/miso_pxe_nfs
* install/miso_kms
* install/miso_pxe_common
* install/miso_pxe_nbd
* install/miso_shutdown

* script/miso_shutdown