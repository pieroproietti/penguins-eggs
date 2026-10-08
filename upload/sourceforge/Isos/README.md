[![](https://penguins-eggs.net/img/penguins-header.png)](https://penguins-eggs.net)
# Penguins' Eggs — ISO images

This directory contains ISO images produced with **penguins-eggs**.

All ISO images have ```user=artisan password=evolution```

The ISO images are not all the same: some are minimal systems intended as a starting point for customization, while others are already configured as complete desktop systems.

## Choosing an ISO

### `naked`

A `naked` ISO is a **minimal, CLI-oriented system**.

It is intentionally kept without a complete desktop environment and is useful when you want to:

* start from a clean Linux system;
* build your own configuration;
* use `penguins-tailor` to apply a costume;
* create your own customized remaster;
* use the system as a server or development base.

Think of `naked` as the **bare penguin**: the system is functional, but it has not yet been dressed.

### Named desktop editions

Other ISO images have names such as:

* `colibri` use xfce4 desktop
* `albatros` use kde desktop
* `duck` use cinnamon desktop
* `eagle` use gnome desktop
* `swallow` use lxqt desktop
* `sparrow` use mate desktop
* and other names appearing in the filename.

These are **already customized systems** using chef. The name identifies the configuration or costume used when the ISO was produced.

They may include:

* a desktop environment;
* applications;
* desktop configuration;
* themes and artwork;
* system configuration;
* a customized live environment.

These images are intended to be used directly as desktop systems, or as examples of what can be produced with the Penguins ecosystem.

## Distribution matters

The distribution is part of the ISO identity.

For example:

```text
egg-of-debian-trixie-naked-amd64-...
egg-of-fedora-44-naked-amd64-...
egg-of-opensuse-slowroll-...-amd64-...
```

The ISO is a remaster of the distribution named in the filename.

This is important because the underlying distribution determines:

* the package system;
* the kernel and initramfs;
* the boot infrastructure;
* the available installers;
* the system configuration.

Penguins' Eggs does not turn all distributions into the same operating system. It remasters the running system while respecting the characteristics of the original distribution.
