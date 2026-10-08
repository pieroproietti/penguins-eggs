![](https://penguins-eggs.net/img/penguins-header.png)
# Penguins' Eggs — Packages

This directory contains native packages belonging to the **Penguins Linux ecosystem**.

The projects are intentionally separated: each tool has a different job.

## The ecosystem

```text
                    Linux system
                         │
              ┌──────────┴──────────┐
              │                     │
           Chef                  Tailor (debian family only)
              │                     │
        desktop/costumes     desktop/costumes
              │                     │
              └──────────┬──────────┘
                         │
                    penguins-eggs
                         │
                    live ISO
                         │
                    penguins-gui
                    (optional GUI)
```

The tools can be used independently. They are not different editions of the same program.

---
## 🖥️ [penguins-gui](https://github.com/pieroproietti/penguins-gui)

See: [AppImages/README.md](../AppImages/)

---

## 🥚 [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)

**penguins-eggs is the remastering engine.**

Its purpose is to take a running Linux system and turn it into a bootable live ISO.

Eggs deals with the core remastering process:

* collecting the running system;
* preparing the live filesystem;
* creating the SquashFS;
* preparing the initramfs and boot environment;
* creating the ISO;
* providing installation through Krill or integration with Calamares.

The normal command is:

```bash
sudo eggs remaster
```

Eggs is the **core of the ecosystem**.

---
## 👨‍🍳 [penguins-chef](https://github.com/pieroproietti/penguins-chef)

**Chef configures systems by applying explicit recipes.**

Chef is a standalone tool for system provisioning and configuration. A recipe describes operations that should be performed on a Linux system.

Typical uses include:

* configuring a base system;
* installing packages;
* enabling or configuring services;
* applying reproducible system changes;
* preparing a system before it is remastered by Eggs.

For example, to obtain my colibri where I develop eggs:

```bash
chef get
sudo chef apply .chef/recipes/costumes/colibri/colibri.yaml
sudo chef apply .chef/recipes/dev/devel.yaml
```

Chef is therefore concerned primarily with **system configuration and provisioning**.

It does not replace Eggs.

Think of Chef as the person who **cooks the system**.

---

## ✂️ [penguins-tailor](https://github.com/pieroproietti/penguins-tailor) (only debian based systems)
Tailor was the first version of chef, and work only on Debian/Devuan/Ubuntu systems.

**Tailor dresses the system.**

Tailor is the companion tool for applying desktop configurations, themes, packages and other customizations collected in a **wardrobe**.

A costume can describe things such as:

* desktop environment;
* applications;
* themes;
* icons;
* `/etc/skel` configuration;
* desktop-specific settings;
* additional system configuration.

Typical workflow:

```bash
tailor get
tailor list
sudo tailor wear <costume>
```

Tailor is especially useful when starting from a `naked` system and preparing it before creating an ISO.

---


## 🕰️ [penguins-eggs-legacy](https://github.com/pieroproietti/penguins-eggs-legacy)

`penguins-eggs-legacy` is the **previous generation of Penguins' Eggs**.

It is the original TypeScript/Node.js implementation that preceded the current C/Go implementation.

The current `penguins-eggs` is the active implementation.

Legacy is kept available for:

* existing installations;
* compatibility;
* users who still depend on the old implementation;
* historical/reference purposes.

For a new installation, **use `penguins-eggs` unless you specifically need Legacy**.

---

## Which package should I install?

| What you want to do                        | Package                  |
| ------------------------------------------ | ------------------------ |
| Create a live ISO                          | **penguins-eggs**        |
| Configure a Linux system from recipes      | **penguins-chef**        |
| Customize a desktop with costumes (debian) | **penguins-tailor**      |
| Use penguins-eggs via GUI                  | **penguins-gui**         |
| Continue using the old Eggs implementation | **penguins-eggs-legacy** |

### Typical workflows

#### Build a customized Linux ISO

```text
base Linux system (CLI/naked)
       ↓
     Chef
       ↓
     Eggs
       ↓
    Live ISO
```

#### Use Eggs directly

```text
running Linux system
       ↓
     Eggs
       ↓
    Live ISO
```

#### Use eggs in a graphical desktop

```text
penguins-gui
       ↓
     Eggs
       ↓
    Live ISO
```

The tools are complementary, not competing implementations.

---

## Where to start

If you are new to Penguins' Eggs:

1. Install **penguins-eggs**.
2. Create a standard remaster.
3. If you want a customized desktop, look at **penguins-cher** or **penguins-tailor**.
4. If you prefer a desktop application, install **penguins-gui**.
5. Use **legacy** only when you have a specific reason to use the previous implementation.
