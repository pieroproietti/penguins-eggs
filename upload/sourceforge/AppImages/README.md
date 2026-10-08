## 🖥️ [penguins-gui](https://github.com/pieroproietti/penguins-gui)

**penguins-gui** is an optional graphical frontend for **penguins-eggs**.

![penguins-gui](https://github.com/pieroproietti/penguins-gui/blob/main/penguins-gui.png?raw=true)

It is an independent desktop application written in Go using Fyne and distributed both as native packages and as an **AppImage**.

The AppImage can run on virtually any modern Linux distribution without installation. When started, **penguins-gui** automatically detects whether **penguins-eggs** is available on the system and, if needed, downloads and installs the correct native package for the current distribution.

This means that the easiest way to remaster a Linux system is simply:

1. Download **penguins-gui** (AppImage).
2. Make it executable.
3. Run it.
4. Let the application install and configure **penguins-eggs** automatically.
5. Create your custom live ISO.

The graphical interface does not replace Eggs and does not contain the remastering engine.

Instead, it provides an easy and user-friendly way to operate the existing command-line tools.

With **penguins-gui** you can:

* create a standard remaster;
* create a complete system clone;
* create an encrypted clone;
* monitor the live command output;
* locate the generated ISO image;
* open the ISO output directory;
* install and configure Eggs;
* install and configure Calamares.

`penguins-eggs` remains fully usable from the command line, without the GUI.

The GUI is therefore completely **optional**, but for most users it represents the fastest and easiest way to create a custom Linux live ISO.
