# eggs-9.7.8
* Added remotion of live-boot* packages on Debian, during installation wehen it's used flag --release;

# eggs-9.7.7
I had to duplicate in branding the style for calamares menus. Version 3.2.x wants the first letter lowercase, calamares version 3.3.x uppercase. While waiting to do better, I repeated the variables for the two versions in branding.ts.

```
    style: {
      sidebarBackground: "#010027"
      sidebarText: "#FFFFFF",
      sidebarTextCurrent: "#fbfbfb",
      sidebarBackgroundCurrent: "#017877",
      // repeat them for calamares 3.3
      SidebarBackground: "#010027"
      SidebarText: "#FFFFFF",
      SidebarTextCurrent: "#fbfbfb",
      SidebarBackgroundCurrent: "#017877"
    }...
```
# eggs-9.7.6
* just a little bugfix on the menu of calamares 3.2.x;

# eggs-9.7.5
* added ManjaroLinux/Wynsdey;

# eggs-9.7.4
* realigned the versions for Debian and Arch;
* added a patch to detect vmlinuz path on raspberry. Currently generating an ISO on rasberry does not make booting possible, but includes the entire filestem to be placed on the rootfs partition, a prerequisite for generating images suitable for raspberry pi.

# eggs-9.7.3
* I added as a comment the ip settings as a kernel parameter `#ip=ens18:192.168.1.4:255.255.255.0:192.168.1.1:8.8.8` in the grub and isolinux options for the live. This is handy in case there is no dhcp server available when starting the live, just remove the # and set the appropriate values.

The syntax looks like this, although it is reported differently on [kernel.org](https://www.kernel.org/doc/Documentation/filesystems/nfs/nfsroot.txt):

`ip=device:address:netmask:gateway:nameserver`

Example, for **eth0**:
`ip=eth0:10.10.10.10:255.255.255.0:10.10.10.1:8.8.8.8`

# eggs-9.7.2
Well, we passed to **9.7.x** releases! I chose to update the release number because of the many changes and the introduction of penGUI.

* renamed the produce flag `--filters` to `--excludes`, this is more clear;
* excludes list changed the names, we have now: `master.list`, `home.list`, `usr.list` and `var.list` under `/etc/penguins-eggs.d/exlude.list.d`. You can choice that to exclude, using `sudo eggs produce --excludes ` or just use penGUI;
* in addition, `--excludes static` inhibits the creation of a new exclude.list and the present `/etc/penguins-eggs.d/exclude.list` will be used. This is convenient for working with a personal exclude.list. To avoid the risk of losing your laboriously created exclude.list, it may be advisable to use a symbolic link, eg: `ln -s /etc/penguins-eggs.d/exclude.list ~/personal_exclude.list`;
* again, with `--excludes mine`, the entire home of the main user can be excluded. This is usefull almost for me, to test clone without get a lot of space.
* I have removed "press a key to continue" from all eggs commands. They were included for ease of use with penGUI, but are no longer needed;
* last but not least: probably the best of this version - expecially for new users coming - is the fact **[penGUI](https://github.com/pieroproietti/pengui?tab=readme-ov-file#pengui-take-cure-of-eggs)** - a GUI for eggs - is finally usable!
