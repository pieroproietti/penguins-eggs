I'm trying to made a way to easy customize livecd boot.

* grub.template.cfg
* grub.theme.cfg
* isolinux.template.cfg
* isolinux.theme.cfg
* splash.png

# How it work
eggs take cure to copy to fill the template with the necessary values and copy configurations on /boot/grub and /isolinux on the ISO image.

# grub
You can adapt the template and the grub theme file i accord to your needs. During the production of eggs file grub.template.cfg will be convertent in grub.cfg and copied under /boot/grub directory of the image.
* __grub.template.cfg__ -> will became -> __/boot/grub/grub.cfg__ under the iso
* __grub.theme.cfg__

# isolinux
You can adapt the template for isolinux and the isolinux theme. During the production of eggs file isolinux.template.cfg will be convertent in isolilinux.cfg and copied under /isolinux directory of the image.
* __isolinux.template.cfg__ -> will became -> __/isolinux/isolinux.cfg__ under the iso
* __isolinux.theme.cfg__

# splash
both the themes will use the same splash file, who will be copied under /isolinux directory of the image.
