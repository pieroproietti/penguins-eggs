# MuseBook (Spacemit K1)

Hi everyone,

I am working on porting penguins-eggs (a tool to create live systems) to the MuseBook (RISC-V Spacemit K1). I’ve successfully replicated the original Bianbu 6-partition layout, but I’m hitting a wall during the hand-off between U-Boot and the Kernel.

🛠️ What I've achieved so far:
Partitioning: Created a GPT table identical to the original image.

Atomic Injection: Injected the bootloader components at the required offsets:

Sector 0: boot_header_sector0.bin (SDC signature).

Sector 256: env.bin.

Sector 2048: spl.bin.

Sector 4096: uboot.bin.

Created a env_k1-x.txt file in Partition 5 (bootfs, ext4).

* copied necessary files to Partition 5 (bootfs, ext4);
*copied /live/filesystem.squashfs to partition 6 (rootfs, ext4).

Firmware Recognition: The MuseBook recognizes the SD card and starts U-Boot (the Bianbu logo appears).

❌ The Issue: Reboot Loop
The system displays the logo, stays there for a few seconds, then clears the screen and reboots. This cycle repeats indefinitely.

🔍 Observations:
Config Files Ignored: I have placed both /extlinux/extlinux.conf and env_k1-x.txt on Partition 5 (bootfs, ext4). However, U-Boot seems to ignore them. I added echo debug commands in env_k1-x.txt, but they never show up on screen.

Kernel/DTB: I am using the official kernel and DTB (k1-x_MUSE-Book.dtb) extracted from a working SSD installation.

Bootargs: I am using the parameters from the working SSD: earlycon=sbi clk_ignore_unused swiotlb=65536 console=tty1 loglevel=8, yet no kernel logs appear before the reset.

❓ My Questions:
Does the stock U-Boot for the MuseBook have a hardcoded preference for the config file location? Is it possible it only looks at Partition 1 even if Partition 5 is the designated bootfs in the original layout?

Is there a specific "magic" file or script (like a compiled .scr) required to trigger the load of Partition 5 files?

Has anyone experienced a similar "silent" reboot loop where the kernel fails to initialize the console even with earlycon enabled?

Any insights or suggestions on how to debug the U-Boot environment without a serial console (using only the built-in display) would be greatly appreciated.

Thanks in advance!

* [Repository:](https://github.com/pieroproietti/penguins-eggs)
* [Download img here](https://sourceforge.net/projects/penguins-eggs/files/Isos/)

[Miniera d'oro](https://www.workswithriscv.guide/wiki/hardware/K1/bianbu-multiboot.html)