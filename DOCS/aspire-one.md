
```
pepos-live
    description: Computer
    product: AO531h (Napa_Fab5)
    vendor: Acer
    version: 1
    serial: LUS750B0799140438B2500
    width: 32 bits
    capabilities: smbios-2.4 dmi-2.4
    configuration: boot=normal family=Intel_Mobile sku=Napa_Fab5 uuid=4a11e6a0-e282-11d4-8711-00238b9e2057
  *-core
       description: Motherboard
       vendor: Acer
       physical id: 0
       version: Base Board Version
       serial: Base Board Serial Number
       slot: Base Board Chassis Location
     *-firmware
          description: BIOS
          vendor: Acer
          physical id: 0
          version: v0.3301
          date: 08/25/2009
          size: 1MiB
          capacity: 1MiB
          capabilities: pci upgrade shadowing cdboot bootselect socketedrom edd int13floppynec int13floppytoshiba int13floppy360 int13floppy1200 int13floppy720 int13floppy2880 int9keyboard int10video acpi usb
     *-memory
          description: System Memory
          physical id: 14
          slot: System board or motherboard
          size: 1GiB
        *-bank:0
             description: DIMM DDR2 [empty]
             product: NO DIMM
             vendor: NO DIMM
             physical id: 0
             serial: NO DIMM
             slot: J2
        *-bank:1
             description: DIMM DDR2 Synchronous 533 MHz (1.9 ns)
             product: HMP112S6EFR6C-Y5
             vendor: Hynix Semiconductor (Hyundai Electronics)
             physical id: 1
             serial: 0x00006121
             slot: J6H2
             size: 1GiB
             width: 64 bits
             clock: 533MHz (1.9ns)
     *-cpu
          description: CPU
          product: Intel(R) Atom(TM) CPU N270   @ 1.60GHz
          vendor: Intel Corp.
          physical id: 1b
          bus info: cpu@0
          version: 6.12.2
          serial: 0001-06C2-0000-0000-0000-0000
          slot: CPU
          size: 1330MHz
          capacity: 1600MHz
          width: 32 bits
          clock: 533MHz
          capabilities: fpu fpu_exception wp vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat clflush dts acpi mmx fxsr sse sse2 ss ht tm pbe nx constant_tsc arch_perfmon pebs bts cpuid aperfmperf pni dtes64 monitor ds_cpl est tm2 ssse3 xtpr pdcm movbe lahf_lm dtherm cpufreq
          configuration: id=0 microcode=536
        *-cache:0
             description: L2 cache
             physical id: 1c
             slot: Unknown
             size: 512KiB
             capacity: 512KiB
             capabilities: synchronous internal write-back unified
             configuration: level=2
        *-cache:1
             description: L1 cache
             physical id: 1d
             slot: Unknown
             size: 32KiB
             capacity: 32KiB
             capabilities: synchronous internal write-back instruction
             configuration: level=1
        *-logicalcpu:0
             description: Logical CPU
             physical id: 0.1
             width: 32 bits
             capabilities: logical
        *-logicalcpu:1
             description: Logical CPU
             physical id: 0.2
             width: 32 bits
             capabilities: logical
     *-pci
          description: Host bridge
          product: Mobile 945GSE Express Memory Controller Hub
          vendor: Intel Corporation
          physical id: 100
          bus info: pci@0000:00:00.0
          version: 03
          width: 32 bits
          clock: 33MHz
        *-display:0
             description: VGA compatible controller
             product: Mobile 945GSE Express Integrated Graphics Controller
             vendor: Intel Corporation
             physical id: 2
             bus info: pci@0000:00:02.0
             logical name: /dev/fb0
             version: 03
             width: 32 bits
             clock: 33MHz
             capabilities: msi pm vga_controller bus_master cap_list rom fb
             configuration: depth=32 driver=i915 latency=0 resolution=1024,600
             resources: irq:16 memory:56380000-563fffff ioport:50d0(size=8) memory:40000000-4fffffff memory:56400000-5643ffff memory:c0000-dffff
        *-display:1 UNCLAIMED
             description: Display controller
             product: Mobile 945GM/GMS/GME, 943/940GML Express Integrated Graphics Controller
             vendor: Intel Corporation
             physical id: 2.1
             bus info: pci@0000:00:02.1
             version: 03
             width: 32 bits
             clock: 33MHz
             capabilities: pm bus_master cap_list
             configuration: latency=0
             resources: memory:56300000-5637ffff
        *-multimedia
             description: Audio device
             product: NM10/ICH7 Family High Definition Audio Controller
             vendor: Intel Corporation
             physical id: 1b
             bus info: pci@0000:00:1b.0
             logical name: card0
             logical name: /dev/snd/controlC0
             logical name: /dev/snd/hwC0D0
             logical name: /dev/snd/pcmC0D0c
             logical name: /dev/snd/pcmC0D0p
             version: 02
             width: 64 bits
             clock: 33MHz
             capabilities: pm msi pciexpress bus_master cap_list
             configuration: driver=snd_hda_intel latency=0
             resources: irq:25 memory:56440000-56443fff
           *-input:0
                product: HDA Digital PCBeep
                physical id: 0
                logical name: input19
                logical name: /dev/input/event11
                capabilities: pci
           *-input:1
                product: HDA Intel Mic
                physical id: 1
                logical name: input20
                logical name: /dev/input/event12
           *-input:2
                product: HDA Intel Headphone
                physical id: 2
                logical name: input21
                logical name: /dev/input/event13
        *-pci:0
             description: PCI bridge
             product: NM10/ICH7 Family PCI Express Port 1
             vendor: Intel Corporation
             physical id: 1c
             bus info: pci@0000:00:1c.0
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: pci pciexpress msi pm normal_decode bus_master cap_list
             configuration: driver=pcieport
             resources: irq:16 ioport:3000(size=8192) memory:55200000-562fffff ioport:50000000(size=16777216)
           *-network
                description: Ethernet interface
                product: AR8121/AR8113/AR8114 Gigabit or Fast Ethernet
                vendor: Qualcomm Atheros
                physical id: 0
                bus info: pci@0000:01:00.0
                logical name: enp1s0
                version: b0
                serial: 00:23:8b:9e:20:57
                capacity: 100Mbit/s
                width: 64 bits
                clock: 33MHz
                capabilities: pm msi pciexpress bus_master cap_list ethernet physical tp 10bt 10bt-fd 100bt 100bt-fd autonegotiation
                configuration: autonegotiation=on broadcast=yes driver=ATL1E driverversion=6.1.0-22-686-pae firmware=L1e latency=0 link=no multicast=yes port=twisted pair
                resources: irq:16 memory:55200000-5523ffff ioport:3000(size=128)
        *-pci:1
             description: PCI bridge
             product: NM10/ICH7 Family PCI Express Port 3
             vendor: Intel Corporation
             physical id: 1c.2
             bus info: pci@0000:00:1c.2
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: pci pciexpress msi pm normal_decode bus_master cap_list
             configuration: driver=pcieport
             resources: irq:18 ioport:2000(size=4096) memory:54100000-551fffff ioport:51000000(size=16777216)
           *-network
                description: Wireless interface
                product: AR242x / AR542x Wireless Network Adapter (PCI-Express)
                vendor: Qualcomm Atheros
                physical id: 0
                bus info: pci@0000:02:00.0
                logical name: wlp2s0
                version: 01
                serial: 00:24:2b:de:aa:77
                width: 64 bits
                clock: 33MHz
                capabilities: pm msi pciexpress msix bus_master cap_list ethernet physical wireless
                configuration: broadcast=yes driver=ath5k driverversion=6.1.0-22-686-pae firmware=N/A ip=192.168.1.182 latency=0 link=yes multicast=yes wireless=IEEE 802.11
                resources: irq:18 memory:54100000-5410ffff
        *-pci:2
             description: PCI bridge
             product: NM10/ICH7 Family PCI Express Port 4
             vendor: Intel Corporation
             physical id: 1c.3
             bus info: pci@0000:00:1c.3
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: pci pciexpress msi pm normal_decode bus_master cap_list
             configuration: driver=pcieport
             resources: irq:19 ioport:1000(size=4096) memory:53000000-540fffff ioport:52000000(size=16777216)
        *-usb:0
             description: USB controller
             product: NM10/ICH7 Family USB UHCI Controller #1
             vendor: Intel Corporation
             physical id: 1d
             bus info: pci@0000:00:1d.0
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: uhci bus_master
             configuration: driver=uhci_hcd latency=0
             resources: irq:16 ioport:50a0(size=32)
           *-usbhost
                product: UHCI Host Controller
                vendor: Linux 6.1.0-22-686-pae uhci_hcd
                physical id: 1
                bus info: usb@2
                logical name: usb2
                version: 6.01
                capabilities: usb-1.10
                configuration: driver=hub slots=2 speed=12Mbit/s
        *-usb:1
             description: USB controller
             product: NM10/ICH7 Family USB UHCI Controller #2
             vendor: Intel Corporation
             physical id: 1d.1
             bus info: pci@0000:00:1d.1
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: uhci bus_master
             configuration: driver=uhci_hcd latency=0
             resources: irq:17 ioport:5080(size=32)
           *-usbhost
                product: UHCI Host Controller
                vendor: Linux 6.1.0-22-686-pae uhci_hcd
                physical id: 1
                bus info: usb@3
                logical name: usb3
                version: 6.01
                capabilities: usb-1.10
                configuration: driver=hub slots=2 speed=12Mbit/s
        *-usb:2
             description: USB controller
             product: NM10/ICH7 Family USB UHCI Controller #3
             vendor: Intel Corporation
             physical id: 1d.2
             bus info: pci@0000:00:1d.2
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: uhci bus_master
             configuration: driver=uhci_hcd latency=0
             resources: irq:18 ioport:5060(size=32)
           *-usbhost
                product: UHCI Host Controller
                vendor: Linux 6.1.0-22-686-pae uhci_hcd
                physical id: 1
                bus info: usb@4
                logical name: usb4
                version: 6.01
                capabilities: usb-1.10
                configuration: driver=hub slots=2 speed=12Mbit/s
              *-usb
                   description: Keyboard
                   product: YICHIP Trust Wireless Mouse Consumer Control
                   vendor: YICHIP
                   physical id: 1
                   bus info: usb@4:1
                   logical name: input14
                   logical name: /dev/input/event7
                   logical name: /dev/input/mouse1
                   logical name: input15
                   logical name: /dev/input/event8
                   logical name: input16
                   logical name: /dev/input/event9
                   version: 0.02
                   serial: b120300001
                   capabilities: usb-2.00 usb
                   configuration: driver=usbhid maxpower=100mA speed=12Mbit/s
        *-usb:3
             description: USB controller
             product: NM10/ICH7 Family USB UHCI Controller #4
             vendor: Intel Corporation
             physical id: 1d.3
             bus info: pci@0000:00:1d.3
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: uhci bus_master
             configuration: driver=uhci_hcd latency=0
             resources: irq:19 ioport:5040(size=32)
           *-usbhost
                product: UHCI Host Controller
                vendor: Linux 6.1.0-22-686-pae uhci_hcd
                physical id: 1
                bus info: usb@5
                logical name: usb5
                version: 6.01
                capabilities: usb-1.10
                configuration: driver=hub slots=2 speed=12Mbit/s
              *-usb
                   description: Bluetooth wireless interface
                   product: Acer Module
                   vendor: Broadcom Corp
                   physical id: 2
                   bus info: usb@5:2
                   version: 1.00
                   capabilities: bluetooth usb-2.00
                   configuration: driver=btusb speed=12Mbit/s
        *-usb:4
             description: USB controller
             product: NM10/ICH7 Family USB2 EHCI Controller
             vendor: Intel Corporation
             physical id: 1d.7
             bus info: pci@0000:00:1d.7
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: pm debug ehci bus_master cap_list
             configuration: driver=ehci-pci latency=0
             resources: irq:16 memory:56444400-564447ff
           *-usbhost
                product: EHCI Host Controller
                vendor: Linux 6.1.0-22-686-pae ehci_hcd
                physical id: 1
                bus info: usb@1
                logical name: usb1
                version: 6.01
                capabilities: usb-2.00
                configuration: driver=hub slots=8 speed=480Mbit/s
              *-usb
                   description: Mass storage device
                   product: Ultra
                   vendor: SanDisk
                   physical id: 3
                   bus info: usb@1:3
                   logical name: scsi4
                   version: 1.00
                   serial: 4C531001351028114263
                   capabilities: usb-2.10 scsi emulated
                   configuration: driver=usb-storage maxpower=224mA speed=480Mbit/s
                 *-disk
                      description: SCSI Disk
                      product: Ultra
                      vendor: SanDisk
                      physical id: 0.0.0
                      bus info: scsi@4:0.0.0
                      logical name: /dev/sdb
                      version: 1.00
                      serial: 4C531001351028114263
                      size: 14GiB (15GB)
                      capabilities: removable
                      configuration: ansiversion=6 logicalsectorsize=512 sectorsize=512
                    *-medium
                         physical id: 0
                         logical name: /dev/sdb
                         size: 14GiB (15GB)
                         capabilities: partitioned partitioned:dos
                         configuration: signature=3c1dd76e
                       *-volume:0
                            description: Empty partition
                            physical id: 1
                            logical name: /dev/sdb1
                            logical name: /run/live/medium
                            logical name: /usr/lib/live/mount/medium
                            capacity: 1367MiB
                            capabilities: primary bootable nofs
                            configuration: mount.fstype=iso9660 mount.options=ro,noatime,nojoliet,check=s,map=n,blocksize=2048,iocharset=utf8 state=mounted
                       *-volume:1
                            description: Windows FAT volume
                            vendor: mkfs.fat
                            physical id: 2
                            logical name: /dev/sdb2
                            version: FAT12
                            serial: 6682-31e8
                            size: 15EiB
                            capabilities: primary boot fat initialized
                            configuration: FATs=2 filesystem=fat
        *-pci:3
             description: PCI bridge
             product: 82801 Mobile PCI Bridge
             vendor: Intel Corporation
             physical id: 1e
             bus info: pci@0000:00:1e.0
             version: e2
             width: 32 bits
             clock: 33MHz
             capabilities: pci subtractive_decode bus_master cap_list
        *-isa
             description: ISA bridge
             product: 82801GBM (ICH7-M) LPC Interface Bridge
             vendor: Intel Corporation
             physical id: 1f
             bus info: pci@0000:00:1f.0
             version: 02
             width: 32 bits
             clock: 33MHz
             capabilities: isa bus_master cap_list
             configuration: driver=lpc_ich latency=0
             resources: irq:0
           *-pnp00:00
                product: PnP device PNP0c02
                physical id: 0
                capabilities: pnp
                configuration: driver=system
           *-pnp00:01
                product: PnP device PNP0b00
                physical id: 1
                capabilities: pnp
                configuration: driver=rtc_cmos
           *-pnp00:02
                product: PnP device PNP0303
                physical id: 2
                capabilities: pnp
                configuration: driver=i8042 kbd
           *-pnp00:03
                product: PnP device SYN1b20
                physical id: 3
                capabilities: pnp
                configuration: driver=i8042 aux
        *-sata
             description: SATA controller
             product: 82801GBM/GHM (ICH7-M Family) SATA Controller [AHCI mode]
             vendor: Intel Corporation
             physical id: 1f.2
             bus info: pci@0000:00:1f.2
             logical name: scsi0
             version: 02
             width: 32 bits
             clock: 66MHz
             capabilities: sata msi pm ahci_1.0 bus_master cap_list emulated
             configuration: driver=ahci latency=0
             resources: irq:24 ioport:50c8(size=8) ioport:50dc(size=4) ioport:50c0(size=8) ioport:50d8(size=4) ioport:5020(size=16) memory:56444000-564443ff
           *-disk
                description: ATA Disk
                product: TOSHIBA MK1655GS
                vendor: Toshiba
                physical id: 0.0.0
                bus info: scsi@0:0.0.0
                logical name: /dev/sda
                version: 1J
                serial: 39KDF1QES
                size: 149GiB (160GB)
                capabilities: partitioned partitioned:dos
                configuration: ansiversion=5 logicalsectorsize=512 sectorsize=512 signature=ad1b1c90
              *-volume:0
                   description: EXT4 volume
                   vendor: Linux
                   physical id: 1
                   bus info: scsi@0:0.0.0,1
                   logical name: /dev/sda1
                   version: 1.0
                   serial: afa93070-e4a7-4cbd-8865-089aef86ad91
                   size: 300MiB
                   capacity: 300MiB
                   capabilities: primary bootable journaled extended_attributes large_files huge_files dir_nlink extents ext4 ext2 initialized
                   configuration: created=2024-08-08 04:07:03 filesystem=ext4 lastmountpoint=/mnt/boot modified=2024-08-08 06:08:45 mounted=2024-08-08 04:45:53 state=clean
              *-volume:1
                   description: Linux swap volume
                   physical id: 2
                   bus info: scsi@0:0.0.0,2
                   logical name: /dev/sda2
                   version: 1
                   serial: baecee67-f678-479f-8dc0-5008db4f047c
                   size: 1965MiB
                   capacity: 1965MiB
                   capabilities: primary nofs swap initialized
                   configuration: filesystem=swap pagesize=4096
              *-volume:2
                   description: EXT4 volume
                   vendor: Linux
                   physical id: 3
                   bus info: scsi@0:0.0.0,3
                   logical name: /dev/sda3
                   version: 1.0
                   serial: f3262428-e859-4f4d-830c-94e866334da2
                   size: 146GiB
                   capacity: 146GiB
                   capabilities: primary journaled extended_attributes large_files huge_files dir_nlink 64bit extents ext4 ext2 initialized
                   configuration: created=2024-08-08 04:07:05 filesystem=ext4 lastmountpoint=/ modified=2024-08-08 04:09:01 mounted=2024-08-08 04:45:52 state=clean
        *-serial
             description: SMBus
             product: NM10/ICH7 Family SMBus Controller
             vendor: Intel Corporation
             physical id: 1f.3
             bus info: pci@0000:00:1f.3
             version: 02
             width: 32 bits
             clock: 33MHz
             configuration: driver=i801_smbus latency=0
             resources: irq:17 ioport:5000(size=32)
  *-input:0
       product: AT Translated Set 2 keyboard
       physical id: 1
       logical name: input0
       logical name: /dev/input/event0
       logical name: input0::capslock
       logical name: input0::numlock
       logical name: input0::scrolllock
       capabilities: i8042
  *-input:1
       product: SynPS/2 Synaptics TouchPad
       physical id: 2
       logical name: input11
       logical name: /dev/input/event6
       logical name: /dev/input/mouse0
       capabilities: i8042
  *-input:2
       product: PC Speaker
       physical id: 3
       logical name: input18
       logical name: /dev/input/event10
       capabilities: isa
  *-input:3
       product: Power Button
       physical id: 4
       logical name: input5
       logical name: /dev/input/event1
       capabilities: platform
  *-input:4
       product: Lid Switch
       physical id: 5
       logical name: input6
       logical name: /dev/input/event2
       capabilities: platform
  *-input:5
       product: Sleep Button
       physical id: 6
       logical name: input7
       logical name: /dev/input/event3
       capabilities: platform
  *-input:6
       product: Power Button
       physical id: 7
       logical name: input8
       logical name: /dev/input/event4
       capabilities: platform
  *-input:7
       product: Video Bus
       physical id: 8
       logical name: input9
       logical name: /dev/input/event5
       capabilities: platform
```