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

# Il mio telefonino come è visto?

```
  description: Wireless interface
  product: SDM660-MTP _SN:64302735
  vendor: Xiaomi
  physical id: b
  bus info: usb@1:b
  version: 4.04
  serial: 12573e51
  capabilities: usb-2.00
  configuration: driver=rndis_host maxpower=500mA speed=480Mbit/s
```
ipp-usb         # Daemon for IPP over USB printer support
libgusb2        # GLib wrapper around libusb1
libusb          # userspace USB programming library
libusb-1.0-0    # userspace USB programming library
libusbmuxd6 # USB multiplexor daemon for iPhone and iPod Touch devices - library
usb-modeswitch  # mode switching tool for controlling "flip flop" USB devices
usb-modeswitch-data # mode switching data for usb-modeswitch
usb.ids         # USB ID Repository
usbmuxd         # USB multiplexor daemon for iPhone and iPod Touch devices
usbutils        # Linux USB utilities


sudo apt install ipp-usb \
libgusb2 \
libusb \
libusb-1.0-0 \
libusbmuxd6 \
usb-modeswitch \
usb-modeswitch-data \
usb.ids \
usbmuxd \
usbutils 
