# dracut 

```
dracut: Executing: /usr/bin/dracut --force
dracut: dracut module 'bootchart' will not be installed, because command '/sbin/bootchartd' could not be found!
dracut: dracut module 'modsign' will not be installed, because command 'keyctl' could not be found!
dracut: dracut module 'rngd' will not be installed, because command 'rngd' could not be found!
dracut: dracut module 'multipath' will not be installed, because command 'multipath' could not be found!
dracut: dracut module 'nvmf' will not be installed, because command 'nvme' could not be found!
dracut: dracut module 'biosdevname' will not be installed, because command 'biosdevname' could not be found!
```
* bootchard: is a tool for performance analysis and visualization of the Linux boot process
* keyctl: manipulate the kernel's key management facility
* rngd: this daemon feeds data from a random number generator to the kernel's random number entropy poo
* multipath: multipath is used to detect multiple paths to devices for fail-over or performance reasons and coalesces them
* nvme: NVM-Express is a fast, scalable host controller interface designed to address the needs for not only PCI Express based solid state drives, but also NVMe-oF(over fabrics).
* biosdevname: takes a kernel device name as an argument, and returns the BIOS-given name it "should" be.

# Packages to install

* nvme-cli 
* keyutils
* rng-tools-debian
* multipath-tools
* biosdevname non si trova in packages

After that we have just this: 
```
dracut: dracut module 'bootchart' will not be installed, because command '/sbin/bootchartd' could not be found!
dracut: dracut module 'nvmf' depends on 'network', which can't be installed
dracut: dracut module 'biosdevname' will not be installed, because command 'biosdevname' could not be found!
```