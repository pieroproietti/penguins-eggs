# tethering-boot

https://forum.ipxe.org/showthread.php?tid=12662

So by using a phone that you connect to the wifi (all wifi settings are done on the phone) you will be able to "get" wifi. But do note that it will be a separate network between computer and phone, so iPXE will not see the wifi network, only the "phone network"

https://github.com/ipxe/ipxe/issues/125

With my Android device (Samsung Galaxy S9), you need the acm driver since it presents as an ACM (RNDIS) device. This may be Android version-specific.

I am able to successfully use bin-x86_64-efi/snp--ecm--ncm--acm.usb to obtain an address from DHCP via my tethered S9 (attached as a USB device passed through to a qemu VM).

```
cd src
make
```
start: 16:05 end: 16:10

make bin/<rom-name>.<output-format>

build usb
make bin-x86_64-efi/snp--ecm--ncm--acm.usb

424K bin-x86_64-efi/snp--ecm--ncm--acm.usb

build iso
make bin-x86_64-efi/snp--ecm--ncm--acm.iso

The result is an iso file who I used with ventoy, it boot, but don't see my tethering via USB as a cable network.

God know why!



