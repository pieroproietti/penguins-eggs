[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine)

penguins-eggs
=============

### Penguins&#39; eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Index
<!-- toc -->
* [Index](#index)
* [Introduction](#Introduction)
* [Technology](#technology)
* [Features](#features)
* [Packages](#packages)
* [Usage](#usage)
* [Commands](#commands)
* [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->


# Introduction

<p align="justify">
 <b>penguins-eggs</b>b> is a console tool, under continuous development, that allows you to remaster your system and redistribute it as live images on USB sticks or via PXE.
The concept behind Penguins’ Eggs stems from the idea of “reproduction” and “population selection” applied to operating systems. During the era of popular remastering programs like Remastersys and Systemback, both of which experienced maintenance issues and were eventually abandoned, the need for a new, modern tool became evident. The inspiration for Penguins’ Eggs led to the development of a new tool written in a modern, cross-distribution language, utilizing its own packaging system. Initially built with node.js and later transitioning to Typescript as the primary development language, the tool’s design resembles an egg production process, consisting of operations such as “produce” for creating the eggs, “hatch” for installation, and other commands like “kill” for removing produced ISOs, “update” for software updates, and “install” for configuring the graphical installer. It also has prerequisites to install the .deb packages necessary for the process, namely, calamares.
Considered a work-in-progress, the ultimate goal for Penguins’ Eggs is to implement a PXE server for local network distribution, drawing inspiration from the behavior of the cuckoo bird, which relies on others to hatch its eggs. Written primarily in TypeScript, Penguins’ Eggs is designed to be compatible with various Linux distributions, despite differences in package managers, file paths, and more. The tool currently supports Debian, Devuan, Ubuntu, Arch, Manjaro, and their derivatives, across multiple architectures including amd64, i386, and arm64. With the release of version 9.6.x, Penguins’ Eggs is now available as a Debian package, catering to a wide range of systems including PCs, older machines, and single-board ARM systems like the Raspberry Pi, across amd64, i386, and arm64 architectures. For more information and updates, visit the Penguins’ Eggs official website.</p>

 > [!TIP]
> "Penguins-eggs" is an actively developed console tool designed to help you customize and distribute your system as live images on USB sticks or through PXE. By using this tool, you can remaster your system according to your preferences.
> [!TIP]
> By default, "penguins-eggs" completely removes the system's data and users. However, it also offers the option to remaster the system while including the data and accounts of existing users. This can be done using the "--clone" flag. Additionally, you can preserve the users and files by storing them in an encrypted LUKS file within the resulting ISO file, which can be achieved with the "--cryptedclone" flag.
> [!TIP]
> The resulting live system can be easily installed using either the Calamares installer or the internal TUI Krill installer. Furthermore, if you prefer an unattended installation, you can utilize the "--unattended" flag.

> [!TIP]
> One interesting feature of "penguins-eggs" is its integration with the "penguins-wardrobe." This allows you to create or utilize scripts to switch between different configurations. For example, you can start with a bare version of the system, featuring only a command-line interface (CLI), and then easily transition to a full graphical user interface (GUI) or server configurations.
> [!NOTE]
> For more information and customization options, you can explore "penguins-wardrobe," a related project. You can fork it and adapt it to meet your specific needs.

See [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe), fork it, and adapt it to your needs.

# Technology
"eggs" is primarily written in TypeScript and is designed to be compatible with various Linux distributions. While there may be differences in package managers, paths, and other aspects, the underlying programs used to build the live system are generally the same.
Currently, "eggs" supports several Linux distributions, including [Debian](https://www.debian.org/), [Devuan](https://www.devuan.org/), [Ubuntu](https://ubuntu.com/), [Arch](https://archlinux.org/), [Manjaro](https://manjaro.org/) and [derivatives](./conf/derivatives.yaml); and their derivatives. It also caters to different architectures, namely amd64, i386, and arm64.
Starting from version 9.6.x, "Penguins' eggs" is released as a Debian package, available for amd64, i386, and arm64 architectures. This allows it to support a wide range of PCs, including older machines, as well as single-board ARM systems like the Raspberry Pi. You can learn more about this release in the article titled Triple Somersault! [Triple somersault!](https://penguins-eggs.net/blog/triple-somersault).
For more information on the supported distributions and architectures, you can visit the blog [blog](https://penguins-eggs.net/blog/distros-that-can-be-remastered-with-eggs). Additionally, you can find examples of remastered ISO images created with "eggs" on the project's SourceForge page [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/ISOS/).


**penGUI take cure of eggs!**

![icon](https://github.com/pieroproietti/pengui/blob/main/assets/pengui.png?raw=true)

The development of a GUI for "penguins-eggs" with the penGUI project sounds promising. It's exciting to see that work on the GUI has started and is progressing rapidly. GUIs can greatly enhance the user experience and make it more accessible to a wider range of users. I hope the penGUI [penGUI](https://github.com/pieroproietti/pengui) project continues to thrive and brings a user-friendly interface to "penguins-eggs". If you have any specific questions or need further information about the penGUI project, feel free to ask!



# Features
Penguins-eggs is a versatile tool that offers an array of features and benefits for Linux users. Whether you want to create an installable ISO from your current Linux system or explore various customization options, Penguins-eggs has got you covered. To get started with Penguins-eggs, you'll need to install it on your Linux distribution. The tool supports a wide range of Linux distributions and their major derivatives, including Arch, Debian, Devuan, Manjaro, Ubuntu, and more. Additionally, you can easily add support for additional derivatives, expanding the tool's capabilities even further.

1. fast and efficient
Penguins-eggs is designed to be fast and efficient. Unlike traditional methods that involve copying the entire file system, Penguins-eggs utilizes livefs, which allows for instant acquisition of the live system. By default, the tool 

2. Supports Compression Algorithm
Employs the zstd compression algorithm, significantly reducing the time required for the process, often up to 10 times faster. When creating an installable ISO. 

3. Supports Clone
Penguins-eggs provides various options to suit your needs. With the --clone flag, you can preserve the data and accounts of unencrypted users, ensuring a seamless experience for users accessing the live system. Moreover, you can opt for a crypted clone, where user data and accounts are saved in an encrypted LUKS volume within the ISO image, enhancing security and privacy.

4. Cuckoo and PXE boot
In addition to ISO creation, Penguins-eggs offers a unique feature called Cuckoo. By starting Cuckoo from the live system, you can set up a PXE boot server, making it accessible to all computers on the network. This functionality opens up possibilities for network booting and streamlined deployment.Penguins Eggs Linux ushers in a new era of innovation and convenience with its groundbreaking default feature, Cuckoo live network boot, which transforms any computer running Penguins Eggs into a PXE (Preboot eXecution Environment) boot server. This revolutionary paradigm of network booting and seamless deployment underscores Penguins Eggs Linux’s commitment to redefining the parameters of accessibility and efficiency within the realm of Linux distributions

5. Supports Both TUI/GUI Installer
To simplify the installation process, Penguins-eggs provides its own system installer called krill. This installer is particularly useful when a GUI (Graphical User Interface) is not available, allowing for installation in various situations. However, if you are using a desktop system, Penguins-eggs recommends and configures the calamares GUI installer, ensuring a seamless and user-friendly experience. 
Penguins Eggs Linux spearheads a transformative revolution in the realm of system installation with the incorporation of its TUI (Text-based User Interface) / GUI (Graphical User Interface) installer, setting a new standard of versatility and accessibility within the landscape of Linux distributions. 

6. repository lists
One of the key advantages of Penguins-eggs is its commitment to utilizing only the original distro's packages. This means that no modifications are made to your repository lists, ensuring a safe and reliable environment. Penguins-eggs prioritizes maintaining the integrity and authenticity of your Linux distribution.

7. Wardrobe
To enhance customization options, Penguins-eggs introduces the concept of Wardrobe. With Wardrobe and its various components, such as costumes, you can easily organize and manage your customizations, samples, and more. This feature enables a streamlined and efficient workflow, allowing you to tailor your Linux system to your preferences.

8. supporting multiple distributions
Eggs supporting multiple distributions and their derivatives
Supports: Arch, Debian, Devuan, Manjaro, Ubuntu,
 and major derivatives: Linuxmint, KDE neon, EndeavourOS, Garuda, etc. You can easily add more derivatives.

10. supports hardware architectures
supports a wide range of hardware architectures.
Supports: i386, amd64 and arm64 architecture, from old PCs, and common PCs to single board computers like Raspberry Pi 4/5

11. Supports privacy and security 
Safe: only use the original distro's packages, without any modification in your repository lists. Penguins Eggs Linux embarks on a steadfast commitment to user security and system integrity through its default practice of exclusively utilizing original distributions’ packages without any modifications in the repository lists. This resolute dedication to maintaining the pristine authenticity of packages reinforces Penguins Eggs’ fundamental ethos of safety and reliability, fostering an environment characterized by unwavering trust in the integrity of the software ecosystem.

## more features 
[https://github.com/pieroproietti/penguins-eggs/tree/master/changelog.d]


## Wardrobe, Themes, and Addons
In April 2022, the "wardrobe" feature was introduced to "eggs." This addition serves as a comprehensive tool to assist and streamline the process of creating a customized version of Linux, starting from a command-line interface (CLI) system. I have embraced wardrobe for all my editions to enhance convenience, enabling me to better organize, consolidate, and manage my work effectively.
To add a unique touch to my customizations, I have assigned bird names to each edition. Except for the "naked" edition, there are various options available, including "Colibri," "eagle," "duck," "owl," and "chicks" under the bookworm and plastilinux distributions. [bookworm](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/)  and [plastilinux](https://sourceforge.net/projects/penguins-eggs/files/ISOS/plastilinux/),.Furthermore, under Waydroid on the eggs' SourceForge page, you can find "wagtail" and "warbier."
I have high hopes that people will take an interest in wardrobe and consider forking the main repository to incorporate their own customizations. By collaborating, we can achieve significant progress that would be challenging for a single developer to accomplish. If you would like to delve deeper into the wardrobe, I recommend reading the Penguins' eggs blog [Penguins' eggs blog](https://penguins-eggs.net/blog/wardrobe-colibri-duck-eagle-and-owl/). post titled Wardrobe: Colibri, Duck, Eagle, and Owl, which provides further insights into its features and benefits.
Furthermore, addons, predominantly themes, have been organized under the vendor's folder in the penguin's wardrobe. I encourage utilizing your wardrobe for all your customization needs to maintain consistency and organization throughout your work.
> [!NOTE]
> For detailed instructions on using a wardrobe, please consult the wardrobe users' guide  [wardrobe users' guide](https://penguins-eggs.net/docs/Tutorial/wardrobe-users-guide)..


## Clone/Cryptedclone
When creating a live distribution of your system, you have different options to consider: the default mode, clone, and cryptedclone.
•	The default mode, achieved by using the command "eggs produce," completely removes user data from the live distribution. This ensures that no private data remains in the live system.

•	The "eggs produce --clone" command allows you to save both user data and system data directly in the generated ISO. This means that if someone obtains a copy of the ISO, they will be able to see and access the 
user data directly from the live system. It's important to note that this data is not encrypted, so it may not be suitable for sensitive information.

•	On the other hand, the "eggs produce --cryptedclone" command saves the data within the generated ISO using a LUKS (Linux Unified Key Setup) volume. With this option, the user data will not be visible in the live system. However, it can be automatically reinstalled during the system installation process using the "krill" installer. Even if someone has the generated ISO, they won't be able to access the user data without the LUKS passphrase. This ensures that your data remains protected.

To summarize the available options:

•	"eggs produce" (default): All private data is removed from the live system.

•	"eggs produce --clone": All user data is included unencrypted directly in the live system.

•	"eggs produce --cryptedclone": All user data is included encrypted within a LUKS volume inside the ISO.
> [!TIP]
> During the installation process, you can use the "krill" installer to restore your crypted data automatically. By running the command "sudo eggs install" with the "krill" installer, your encrypted data will be securely transferred and made available in the installed system.


## calamares and krill
Calamares and Krill are powerful tools in the Eggs project [calamares](https://calamares.io) , offering versatile installation options for Linux systems. The Eggs project was specifically designed to utilize Calamares as the default system installer, providing users with the flexibility to customize their installations using themes. However, Eggs goes beyond Calamares by introducing its own installer called Krill, which focuses on command-line interface (CLI) installations, particularly for server environments.
Krill, like Calamares, adopts a CLI interface that closely resembles Calamares, ensuring a consistent user experience. Leveraging the same configuration files created by Eggs for Calamares, Krill maintains compatibility and allows for seamless transitions between desktop and server installations. By simply adding the ```--unattended``` flag during installation, Krill enables unattended installations, streamlining the process for system administrators. Fine-tuning installation parameters becomes effortless as the configuration values can be modified in the ```/etc/penguins-eggs.d/krill.yaml``` file, facilitating automated deployments.
> [!TIP]
> Thanks to the Eggs project's integration of Calamares and the introduction of Krill, users can enjoy a comprehensive installation toolkit. Whether one prefers the graphical interface of Calamares or the command-line efficiency of Krill, Eggs caters to diverse installation needs, making Linux setup a breeze.

## cuckoo 
Just like the cuckoo bird lays its eggs in the nests of other birds, the Eggs project introduces a similar concept in the form of a self-configuring PXE service. This service allows you to boot and install your ISO on networked computers that are not originally configured for your specific ISO.
With the command "cuckoo," you can deploy a newly created ISO on an already installed system, or you can live to boot the ISO itself. This means that you can either install your ISO on existing systems or directly run the ISO without the need for a permanent installation.
> [!TIP]
> By leveraging the cuckoo command, the Eggs project provides a convenient method for deploying and testing your ISO on a variety of networked computers, expanding the possibilities for system installations and evaluations.

## mom and dad
I have introduced two helpful built-in assistants: Mom and Dad. Mom, based on the easybashgui [easybashgui](https://github.com/BashGui/easybashgui) script, serves as a comprehensive guide, providing explanations of various commands and documentation. This ensures that users have access to clear instructions and information as they navigate through Eggs' functionalities.
On the other hand, Dad serves as a convenient shortcut for properly configuring Eggs. By simply typing ```sudo eggs dad``` and following the straightforward instructions, users can quickly configure Eggs to meet their specific requirements. For even faster configuration, utilizing the command ```sudo eggs dad -d``` allows for a complete reset of the configuration, loading default settings, and deleting any created ISOs.
Once Eggs is properly configured, generating your live environment becomes a breeze. Just type ```sudo produce``` to effortlessly generate your live ISO. With this streamlined workflow, Eggs empowers users to efficiently create customized live environments tailored to their needs. Whether you rely on Mom's guidance or Dad's configuration shortcuts, Eggs offers a user-friendly experience for ISO creation and customization.

## yolk 
Yolk is a local repository that is bundled within the LiveCD of Eggs. This repository contains a carefully curated selection of essential packages required for installation. Yolk serves as a valuable resource, as it allows you to install your system confidently, even without an active internet connection.
By including Yolk in the LiveCD, Eggs ensures that all the necessary packages are readily available during the installation process. This eliminates the dependency on an internet connection, making it possible to install your system in offline environments or situations where internet access is limited or unavailable.
Yolk acts as a safety net, providing the minimum set of indispensable packages required for a successful installation. This guarantees a smooth and reliable installation experience, regardless of the availability of an internet connection. With Yolk by your side, you can confidently proceed with system installations, knowing that the essential packages are at your disposal.

# Packages
Eggs offers support for a variety of packages. Specifically, for Debian, Devuan, and Ubuntu, Eggs utilizes .deb packages that are compatible with both amd_64 and i386 architectures. This ensures seamless integration with these distributions, allowing users to easily install and utilize Eggs' features.
On the other hand, Arch and ManjaroLinux have their own packaging system known as PKGBUILDs. Eggs is designed to work harmoniously with these distributions, leveraging the specific packaging structure provided by PKGBUILDs. This ensures that Eggs can seamlessly integrate into Arch and ManjaroLinux environments, providing users with a consistent and optimized experience.
By adapting to the packaging systems used by different distributions, Eggs ensures compatibility and ease of use across a wide range of Linux environments. Whether you're using Debian, Devuan, Ubuntu, Arch, or ManjaroLinux, Eggs is equipped to support your preferred distribution, enabling you to make the most of its features and functionalities.


## Debian families
Eggs caters to the Debian family of distributions, offering a seamless installation experience through deb packages. These deb packages are available for multiple architectures, including amd64, i386, and arm64.
The availability of Eggs as a deb package simplifies the installation process for users of Debian-based distributions. Whether you are running a 64-bit (amd64) or 32-bit (i386) architecture, or even an arm64 architecture, Eggs has you covered. This ensures that users across a wide range of Debian-based systems can easily download, install, and utilize Eggs' features.
By providing deb packages for various architectures, Eggs promotes accessibility and inclusivity, allowing users on different hardware platforms to benefit from its functionality. Whether you're using a traditional desktop computer or an ARM-based device, Eggs ensures compatibility and a consistent experience across the Debian family of distributions.

 the packages can be installed on Debian, Devuan, or Ubuntu-based distributions without the need to worry about the specific version. Whether you're using Buster, Bullseye, Bookworm, Trixie, Chimaera, Daedalus, Bionic, Focal, or Jammy, Eggs is reported to work across these versions. However, it's important to ensure compatibility with the respective processor architecture.
The packages provided by Eggs include standard scripts for preinst, postinst, prerm, and postrm. These scripts play a crucial role in the installation and management of the packages. The preinst script is executed before the package is installed, allowing for any necessary preparations or configurations. The postinst script is executed after the package installation, enabling additional setup or customization. Similarly, the prerm script is executed before the package is removed, while the postrm script is executed after the package removal.
In addition to the scripts, Eggs packages also include man pages. These man pages serve as documentation for the installed packages, providing detailed information on their usage, configuration options, and other relevant details. The inclusion of man pages ensures that users have access to comprehensive documentation, enabling them to effectively utilize and manage the Eggs packages.
Overall, Eggs' packages offer a comprehensive and user-friendly experience, with standard scripts and detailed documentation, making installation and management hassle-free on Debian, Devuan, and Ubuntu-based distributions.


### Install eggs
there are multiple methods available, but one of the most practical approaches is to utilize the penguins-eggs-ppa repository.
The penguins-eggs-ppa repository provides a convenient and reliable way to access and install Eggs on your system. By adding this repository to your package manager's sources list, you gain access to the latest versions of Eggs and can easily install or update it with a few simple commands.
Adding the penguins-eggs-ppa repository ensures that you have a trusted and official source for Eggs, which simplifies the installation process and ensures that you receive updates and security patches on time.
By leveraging the penguins-eggs-ppa repository, you can enjoy the benefits of a streamlined installation process, convenient updates, and a reliable source for Eggs. It's a practical solution that allows you to effortlessly install and manage Eggs as a .deb package, enhancing your overall experience with this powerful software.


#### Download the package and install it with dpkg

To install Eggs, the simplest method is to download the package from the project's SourceForge page  [package eggs](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) and install it on your system. You can find the Eggs package on the SourceForge page here.
After downloading the appropriate package based on your system's architecture, you can proceed with the installation. If you are using an amd64 system, run the following command in the terminal:
```sudo dpkg -i eggs_9.6.24_amd64.deb```
For i386 systems, the command would be:
```sudo dpkg -i eggs_9.6.24_i386.deb```
Executing these commands will initiate the installation process and install Eggs on your system.
Once Eggs is successfully installed, you have the option to enhance its functionality by adding the penguins-eggs-ppa repository. This repository provides additional tools and features for Eggs. To add the penguins-eggs-ppa repository, run the following command in the terminal:
```sudo eggs tools ppa --install```
This command will add the penguins-eggs-ppa repository to your system, allowing you to access updated versions of Eggs and additional tools provided by the repository.
By following these steps, you can easily install Eggs, add the penguins-eggs-ppa repository, [penguins-eggs-ppa](https://pieroproietti.github.io/penguins-eggs-ppa), and unlock further capabilities and enhancements for your Eggs installation.

#### Using penguins-eggs-ppa (stable version)
To simplify the process of using the penguins-eggs-ppa repository and installing Eggs, you can utilize a utility called `get-eggs`. Follow these steps to use `get-eggs`:
1. Clone the `get-eggs` repository by running the following command:
```
git clone https://github.com/pieroproietti/get-eggs
```

2. Navigate into the `get-eggs` directory:
```
cd get-eggs
```

3. Execute the utility with root privileges:
```
sudo ./get-eggs
```

On Debian, Devuan, and Ubuntu, running `get-eggs` will add the penguins-eggs-ppa repository and install Eggs seamlessly.
> [!TIP]
> For derivatives of Debian, Devuan, and Ubuntu, such as Linuxmint, LMDE, etc., `get-eggs` will typically work as well. However, if needed, you can manually add the penguins-eggs-ppa repository by copying and pasting the following two lines into a terminal:

```
curl -fsSL https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/penguins-eggs.gpg
echo "deb [arch=$(dpkg --print-architecture)] https://pieroproietti.github.io/penguins-eggs-ppa ./" | sudo tee /etc/apt/sources.list.d/penguins-eggs.list > /dev/null
```

After adding the repository, update your package repositories and install Eggs by running the following command:

```
sudo apt update && sudo apt install eggs
```

Executing these commands will update your package sources and install Eggs on your system.

> [!TIP]
> By using the `get-eggs` utility or manually adding the penguins-eggs-ppa repository, you can easily install Eggs on various Debian, Devuan, and Ubuntu-based distributions, including their derivatives, ensuring a smooth and hassle-free installation process.


### Upgrade eggs
To upgrade Eggs, the process will vary depending on whether you are using the penguins-eggs-ppa repository or not. Here's how you can upgrade Eggs with both approaches:
If you have already added the penguins-eggs-ppa repository, you can upgrade Eggs alongside other packages on your system by running the following command:
```
sudo apt upgrade
```
> [!TIP]
> This command will check for updates for all installed packages, including Eggs, and upgrade them to their latest versions if available.

> [!NOTE]
> On the other hand, if you have not added the penguins-eggs-ppa repository, you can manually upgrade Eggs by downloading the new version from the SourceForge page [here](https://sourceforge.net/projects/penguins-eggs/files/DEBS/). Once you have downloaded the appropriate package for your system architecture, follow these steps:

1. Install the package using the `gdebi` command (assuming you have `gdebi` installed):
```
sudo gdebi eggs_9.6.24_amd64.deb
```
or for i386 systems:
```
sudo dpkg -i eggs_9.6.24_i386.deb
```

2. In case of any missing dependencies, you can resolve them by running the following command:
```
sudo apt install -f
```
This will automatically install any required dependencies for Eggs.
> [!TIP]
> By following these instructions, you can upgrade Eggs either through the penguins-eggs-ppa repository or by manually downloading and installing the latest version from the SourceForge page. Ensure that you choose the appropriate method based on your current setup to keep Eggs up to date with the latest enhancements and bug fixes.

## Arch families
Eggs have been available in the Arch User Repository (AUR) for quite some time, thanks to the support of the Arch Linux community. Although I was initially unaware of its presence, I am now directly maintaining the AUR version of [penguins-eggs](https://aur.archlinux.org/packages/penguins-eggs). Additionally, I am actively participating in the Manjaro Community Repository, specifically for the [penguins-eggs](https://gitlab.manjaro.org/packages/community/penguins-eggs) package.

Being present in the AUR signifies that Eggs is available for Arch Linux users to easily install and manage through their package managers. The AUR is a community-driven repository that allows users to contribute and maintain packages that are not officially supported by Arch Linux. By maintaining the AUR version of penguins-eggs, I can ensure that Arch Linux users have access to the latest updates and improvements for Eggs.
> [!TIP]
> Furthermore, my participation in the Manjaro Community Repository demonstrates my commitment to providing support for Eggs on the Manjaro distribution. Manjaro is a popular Arch-based Linux distribution known for its user-friendly approach and community-driven development. By actively contributing to the Manjaro Community Repository, I can ensure that Eggs remains compatible and well-integrated with the Manjaro ecosystem.
> [!TIP]
> In summary, Eggs is available in the AUR and is directly maintained by me. Additionally, I am actively involved in the Manjaro Community Repository to provide support for Eggs on the Manjaro distribution. This ensures that users of Arch Linux and its derivatives, such as Manjaro, can easily access and benefit from using Eggs in their systems.


### Arch
To install penguins-eggs on Arch Linux, there are multiple methods available. One option is to install it directly from the Arch User Repository (AUR) by adding the Chaotic-AUR repository. Here's how you can do it:

1. Add the Chaotic-AUR repository to your system. You can find the repository at [https://aur.chaotic.cx/](https://aur.chaotic.cx/).

2. After adding the Chaotic-AUR repository, open a terminal and run the following command to install penguins-eggs using `pacman`:
```
sudo pacman -Sy penguins-eggs
```
This command will synchronize the package databases and install penguins-eggs on your system.

Alternatively, you can use a utility called `get-eggs` that I have written. Here's how to use it:

1. Clone the `get-eggs` repository by running the following command:
```
git clone https://github.com/pieroproietti/get-eggs
```

2. Change to the `get-eggs` directory:
```
cd get-eggs
```

3. Run the `get-eggs` script with sudo privileges:
```
sudo ./get-eggs
```
This script will add the AUR repository and install penguins-eggs on your system.

Additionally, you have the option to use the popular AUR helper tool called `yay`. Simply run the following command:
```
yay penguins-eggs
```
`yay` will handle the installation process for you, including any necessary dependencies.

If you prefer to build from source, you can download the sources from the AUR repository. Here are the steps:

1. Clone the `penguins-eggs` repository from the AUR:
```
git clone https://aur.archlinux.org/packages/penguins-eggs
```

2. Change to the `penguins-eggs` directory:
```
cd penguins-eggs
```

3. Build and install the package using `makepkg`:
```
makepkg -srcCi
```
> [!TIP]
> This command will compile the source code, create a package, and install it on your system.
These methods provide various ways to install penguins-eggs on Arch Linux, allowing you to choose the one that suits your preferences and workflow.


### Manjaro
 Starting from version 9.4.3, penguins-eggs is now included in the Manjaro community repository, making it even easier to install on Manjaro Linux. To install penguins-eggs on Manjaro, you can use the `pamac` package manager with the following command:
```
pamac install penguins-eggs
```
This command will fetch the package from the Manjaro community repository and install it on your system.

Alternatively, if you prefer to manually manage the installation process, you can clone the penguins-eggs package from the Manjaro community repository and build it from source. Here are the steps:

1. Clone the penguins-eggs package from the Manjaro community repository:
```
git clone https://gitlab.manjaro.org/packages/community/penguins-eggs/
```

2. Change to the penguins-eggs directory:
```
cd penguins-eggs
```

3. Build and install the package using `makepkg`:
```
makepkg -srcCi
```
> [!TIP]
> This command will compile the source code, create a package, and install it on your system.

By including penguins-eggs in the Manjaro community repository, Manjaro Linux users can easily access and install the package using their preferred package manager. The Manjaro community repository is specifically dedicated to packages that are supported by the Manjaro community, ensuring that penguins-eggs is well-integrated and compatible with the Manjaro distribution.

> [!TIP]
> Whether you choose to install penguins-eggs using `pamac` or by manually building it from source, you can enjoy the benefits of this package on your Manjaro Linux system.


# Usage
Once the package has been installed, you can have the new ```eggs``` command. Typing ```eggs``` will get the list of commands, and typing ```eggs produce --help``` will get the eggs produce command help screen. You can also use the command autocomplete with the TABS key, you will get the possible choices for each command. In addition, there is a man page, so by typing ```man eggs``` you will get that help as well. You can also use the ```eggs mom``` command that interactively allows you to consult the help for all commands and online documentation.

## Examples
Here are some examples of how to use penguins-eggs to create live systems with different configurations:

1. To create a live system without user data, run the following command with `sudo`:
```
sudo eggs produce
```
This command will generate a live system without any user data included.

2. To create a live system with user data that is not encrypted, use the `--clone` flag:
```
sudo eggs produce --clone
```
This command will produce a live system that includes user data without encryption.

3. If you want to create a live system with encrypted user data, use the `--cryptedclone` flag:
```
sudo eggs produce --cryptedclone
```
This command will generate a live system with encrypted user data.

By default, penguins-eggs uses fast compression for efficiency during the creation process. However, if you want a more compressed ISO file, you can use the `--max` flag during the final compression step. For example:
```
sudo eggs produce --max
```
> [!TIP]
> This command will apply maximum compression to the ISO file, resulting in a smaller file size.
In addition to the command descriptions provided in this README, you can refer to the [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) for more detailed information on how to use penguins-eggs and its various features. The official guide offers comprehensive documentation to help you make the most out of this tool.

# Commands
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs analyze`](#eggs-analyze)
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs calamares`](#eggs-calamares)
* [`eggs config`](#eggs-config)
* [`eggs cuckoo`](#eggs-cuckoo)
* [`eggs dad`](#eggs-dad)
* [`eggs export deb`](#eggs-export-deb)
* [`eggs export iso`](#eggs-export-iso)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs mom`](#eggs-mom)
* [`eggs produce`](#eggs-produce)
* [`eggs status`](#eggs-status)
* [`eggs syncfrom`](#eggs-syncfrom)
* [`eggs syncto`](#eggs-syncto)
* [`eggs tools clean`](#eggs-tools-clean)
* [`eggs tools ppa`](#eggs-tools-ppa)
* [`eggs tools skel`](#eggs-tools-skel)
* [`eggs tools stat`](#eggs-tools-stat)
* [`eggs tools yolk`](#eggs-tools-yolk)
* [`eggs update`](#eggs-update)
* [`eggs version`](#eggs-version)
* [`eggs wardrobe get [REPO]`](#eggs-wardrobe-get-repo)
* [`eggs wardrobe list [WARDROBE]`](#eggs-wardrobe-list-wardrobe)
* [`eggs wardrobe show [COSTUME]`](#eggs-wardrobe-show-costume)
* [`eggs wardrobe wear [COSTUME]`](#eggs-wardrobe-wear-costume)

## `eggs adapt`
The `eggs adapt` command is used to adjust the monitor resolution specifically for virtual machines (VMs). It provides a convenient way to optimize the display settings within a VM environment.
Here is the usage information for the `eggs adapt` command:

```
USAGE
  $ eggs adapt [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  adapt monitor resolution for VM only
```

To use the command, you simply need to run `eggs adapt` in the terminal. There are also two optional flags you can include:

- `-h` or `--help`: This flag displays the help information for the `eggs adapt` command, providing a brief description of its usage and available flags.
- `-v` or `--verbose`: Including this flag enables verbose mode, which provides more detailed output during the resolution adaptation process.

> [!NOTE]
> Here is an example of how to use the `eggs adapt` command:

```
$ eggs adapt
```
> [!TIP]
> By running this command, the monitor resolution will be adjusted specifically for the virtual machine environment.
The `eggs adapt` command is particularly useful when working with VMs, as it allows you to optimize the display settings to match your specific requirements. Whether you need to adjust the resolution for better readability or to ensure compatibility with certain applications, the `eggs adapt` command provides a straightforward way to achieve the desired monitor configuration within your VM.

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/adapt.ts)


## `eggs analyze`
The `eggs analyze` command is used to perform an analysis specifically for the syncto feature. It provides a way to examine and gather information related to the syncto functionality in the penguins-eggs tool.
Here is the usage information for the `eggs analyze` command:

```
USAGE
  $ eggs analyze [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  analyze for syncto
```
To use the command, you can simply run `eggs analyze` in the terminal. There are also two optional flags you can include:

- `-h` or `--help`: This flag displays the help information for the `eggs analyze` command, providing a brief description of its usage and available flags.
- `-v` or `--verbose`: Including this flag enables verbose mode, which provides more detailed output during the analysis process.

Here is an example of how to use the `eggs analyze` command:

```
sudo eggs analyze
```

By running this command with `sudo`, you initiate the analysis process specifically for the syncto feature.
The `eggs analyze` command is a powerful tool for examining and gathering information related to syncto in penguins-eggs. It allows you to gain insights into the synchronization mechanism and analyze its behavior within your system. The analysis can help identify potential issues, optimize performance, and ensure the smooth operation of the syncto feature.
> [!TIP]
> To explore the code implementation of the `eggs analyze` command, you can refer to the [src/commands/analyze.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/analyze.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs analyze` functionality, providing a deeper understanding of how the command is implemented and executed.


## `eggs autocomplete [SHELL]`
The `eggs autocomplete` command is used to display installation instructions for setting up autocomplete functionality with the penguins-eggs tool in your preferred shell. Autocomplete allows you to conveniently auto-fill commands and options as you type, enhancing your productivity and reducing errors.
> [!TIP]
> Here is the usage information for the `eggs autocomplete` command:

```
USAGE
  $ eggs autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions
```

To use the command, you can run `eggs autocomplete` in the terminal. There is also an optional `SHELL` argument that you can provide to specify your shell type. The available shell options include bash and zsh. If no shell is specified, general autocomplete installation instructions will be displayed.
> [!TIP]
> Additionally, there is an optional `-r` or `--refresh-cache` flag. When included, this flag refreshes the cache and ignores displaying the installation instructions.

Here are some examples of how to use the `eggs autocomplete` command:

```
$ eggs autocomplete
```
This command displays general installation instructions for autocomplete functionality.

```
$ eggs autocomplete bash
```
This command provides installation instructions specifically for the bash shell.

```
$ eggs autocomplete zsh
```
This command provides installation instructions specifically for the zsh shell.

```
$ eggs autocomplete --refresh-cache
```
This command refreshes the cache for autocomplete, without displaying any installation instructions.
> [!TIP]
> To explore the code implementation of the `eggs autocomplete` command, you can refer to the [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.8/src/commands/autocomplete/index.ts) repository. This repository contains the source code responsible for the autocomplete functionality, providing a deeper understanding of its implementation and how it integrates with the penguins-eggs tool.
 
## `eggs calamares`
The `eggs calamares` command is used to configure, install, or remove the Calamares tool. Calamares is a powerful installation framework that simplifies the process of setting up operating systems on various platforms. With the `eggs calamares` command, you can easily manage Calamares and its associated tasks.

Here is the usage information for the `eggs calamares` command:

```
USAGE
  $ eggs calamares [-h] [-i] [-n] [-r] [--remove] [--theme <value>] [-v]

FLAGS
  -h, --help           Show CLI help.
  -i, --install        install calamares and its dependencies
  -n, --nointeractive  no user interaction
  -p, --policies       configure calamares policies
  -r, --release        release: remove calamares and all its dependencies after the installation
  -v, --verbose
  --remove             remove calamares and its dependencies
  --theme=<value>      theme/branding for eggs and calamares

DESCRIPTION
  configure calamares or install or configure it
```
> [!NOTE]
> To use the command, you can run `eggs calamares` in the terminal. The command supports several flags and options:

- `-h` or `--help`: This flag displays the help information for the `eggs calamares` command, providing a brief description of its usage and available flags.
- `-i` or `--install`: Including this flag installs Calamares and its dependencies on your system.
- `-n` or `--nointeractive`: This flag enables non-interactive mode, where no user interaction is required during the Calamares configuration process.
- `-p` or `--policies`: Including this flag allows you to configure Calamares policies.
- `-r` or `--release`: This flag triggers the removal of Calamares and all its dependencies after the installation.
- `-v` or `--verbose`: Enabling this flag provides more detailed output.

There are two additional flags related to removing Calamares:
- `--remove`: Including this flag removes Calamares and its dependencies from your system.
- `--theme=<value>`: This option allows you to specify a theme or branding for both the `eggs` tool and Calamares.

Here are some examples of how to use the `eggs calamares` command:

```
sudo eggs calamares
```
This command configures Calamares without installing or removing it.

```
sudo eggs calamares --install
```
This command installs Calamares and its dependencies on your system.

```
sudo eggs calamares --install --theme=/path/to/theme
```
This command installs Calamares and applies a specific theme or branding to both the `eggs` tool and Calamares.

```
sudo eggs calamares --remove
```
This command removes Calamares and its dependencies from your system.

> [!TIP]
> To explore the code implementation of the `eggs calamares` command, you can refer to the [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/calamares.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs calamares` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs config`
 The `eggs config` command is used to configure and install the necessary Debian packages required to run the `eggs` tool. The `eggs` tool is a versatile utility that helps manage various tasks related to system configuration and administration. By running the `eggs config` command, you can easily set up the prerequisites and dependencies needed for the smooth execution of the `eggs` tool.

Here is the usage information for the `eggs config` command:

```
USAGE
  $ eggs config [-c] [-h] [-n] [-v]

FLAGS
  -c, --clean          remove old configuration before to create new one
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -N, --noicons        no icons

DESCRIPTION
  Configure and install prerequisites deb packages to run it
```
> [!NOTE]
> To use the command, you can run `eggs config` in the terminal. The command supports several flags and options:

- `-c` or `--clean`: Including this flag will remove the old configuration before creating a new one. This allows for a fresh setup of the `eggs` tool.
- `-h` or `--help`: This flag displays the help information for the `eggs config` command, providing a brief description of its usage and available flags.
- `-n` or `--nointeractive`: This flag enables non-interactive mode, where no user interaction is required during the configuration process.
- `-N` or `--noicons`: Including this flag disables the display of icons during the configuration process.

The `eggs config` command is primarily responsible for configuring and installing the required Debian packages needed to run the `eggs` tool. It ensures that the necessary dependencies are in place, allowing for seamless execution of subsequent `eggs` commands.

Here are some examples of how to use the `eggs config` command:

```
sudo eggs config
```
This command configures and installs the prerequisite Debian packages without removing any old configuration.

```
sudo eggs config --clean
```
This command removes the old configuration before creating a new one, ensuring a fresh setup of the `eggs` tool.

```
sudo eggs config --clean --nointeractive
```
This command removes the old configuration and performs a fresh setup without requiring any user interaction.
> [!TIP]
> To explore the code implementation of the `eggs config` command, you can refer to the [src/commands/config.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/config.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs config` functionality, providing a deeper understanding of how the command is implemented and executed.


## `eggs cuckoo`
The `eggs cuckoo` command is used to initiate a PXE start with proxy-dhcp using the `eggs` tool. PXE (Preboot Execution Environment) is a technology that allows computers to boot and install an operating system over a network connection. The `eggs` tool leverages this functionality to facilitate the PXE start process with the help of a proxy-dhcp server.

Here is the usage information for the `eggs cuckoo` command:

```
USAGE
  $ eggs cuckoo [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  PXE start with proxy-dhcp
```

> [!NOTE]
> To use the command, you can run `eggs cuckoo` in the terminal. The command supports a single flag:

- `-h` or `--help`: This flag displays the help information for the `eggs cuckoo` command, providing a brief description of its usage.

The primary purpose of the `eggs cuckoo` command is to initiate a PXE start process with the assistance of a proxy-dhcp server. This allows the system to boot and install an operating system using network resources. By running this command, you can initiate the PXE start process seamlessly with the necessary configurations in place.

Here is an example of how to use the `eggs cuckoo` command:

```
sudo eggs cuckoo
```

This command initiates the PXE start process with proxy-dhcp by leveraging the `eggs` tool. It ensures that the necessary configurations are in place to facilitate the booting and installation of an operating system over the network.
> [!TIP]
> To explore the code implementation of the `eggs cuckoo` command, you can refer to the [src/commands/cuckoo.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/cuckoo.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs cuckoo` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs dad`
The `eggs dad` command is used to seek assistance from a "daddy" figure, acting as a TUI (Text User Interface) configuration helper within the `eggs` tool. This command allows users to get guidance and support for configuring their system settings and options. By running the `eggs dad` command, users can interact with the TUI configuration helper to receive help and make necessary changes.

Here is the usage information for the `eggs dad` command:

```
USAGE
  $ eggs dad [-c] [-d] [-h] [-v]

FLAGS
  -c, --clean    remove old configuration before to create
  -d, --default  remove old configuration and force default
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  ask help from daddy - TUI configuration helper
```
> [!NOTE]
> To use the command, you can run `eggs dad` in the terminal. The command supports several flags and options:

- `-c` or `--clean`: Including this flag will remove the old configuration before creating a new one. This allows for a fresh setup of the configuration settings.
- `-d` or `--default`: Including this flag will remove the old configuration and enforce the default settings. This can be useful when reverting back to the default configuration.
- `-h` or `--help`: This flag displays the help information for the `eggs dad` command, providing a brief description of its usage and available flags.
- `-v` or `--verbose`: Including this flag enables verbose mode, providing more detailed information during the configuration process.

The `eggs dad` command acts as a TUI configuration helper, allowing users to seek assistance from the "daddy" figure. It provides guidance and support for configuring system settings, ensuring a smooth and user-friendly experience.

Here are some examples of how to use the `eggs dad` command:

```
sudo eggs dad
```
This command initiates the TUI configuration helper, allowing users to seek help and guidance for configuring system settings.

```
sudo eggs dad --clean
```
This command removes the old configuration before creating a new one, ensuring a fresh setup of the configuration settings.

```
sudo eggs dad --default
```
This command removes the old configuration and enforces the default settings, reverting back to the default configuration.
> [!TIP]
> To explore the code implementation of the `eggs dad` command, you can refer to the [src/commands/dad.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/dad.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs dad` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs export deb`
The `eggs export deb` command is used to export Debian packages (`deb`), documentation files (`docs`), or ISO images to a specified destination host using the `eggs` tool. This command enables users to transfer these files from one system to another conveniently. By running the `eggs export deb` command, users can export the desired files to the destination host.

Here is the usage information for the `eggs export deb` command:

```
USAGE
  $ eggs export deb [-a] [-c] [-h] [-v]

FLAGS
  -a, --all      export all archs
  -c, --clean    remove old .deb before to copy
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  export deb/docs/iso to the destination host
```
> [!NOTE]
> To use the command, you can run `eggs export deb` in the terminal. The command supports several flags and options:

- `-a` or `--all`: Including this flag will export all available architectures. This allows for exporting files for multiple architectures simultaneously.
- `-c` or `--clean`: Including this flag will remove the old `.deb` files before copying the new ones. This ensures a clean transfer of files to the destination host.
- `-h` or `--help`: This flag displays the help information for the `eggs export deb` command, providing a brief description of its usage and available flags.
- `-v` or `--verbose`: Including this flag enables verbose mode, providing more detailed information during the export process.

The `eggs export deb` command facilitates the export of Debian packages, documentation files, or ISO images to the destination host. This allows users to transfer these files conveniently and efficiently.

Here are some examples of how to use the `eggs export deb` command:

```
eggs export deb
```
This command exports the specified Debian packages, documentation files, or ISO images to the destination host.

```
eggs export deb --clean
```
This command removes the old `.deb` files before copying the new ones, ensuring a clean transfer of files to the destination host.

```
eggs export deb --all
```
This command exports the files for all available architectures, facilitating the transfer of files for multiple architectures simultaneously.
> [!TIP]
> To explore the code implementation of the `eggs export deb` command, you can refer to the [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/export/deb.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs export deb` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs export iso`
The `eggs export iso` command is used to export ISO images to a specified destination host using the `eggs` tool. This command allows users to transfer ISO images from one system to another conveniently. By running the `eggs export iso` command, users can export the desired ISO image to the destination host.

Here is the usage information for the `eggs export iso` command:

```
USAGE
  $ eggs export iso [-c] [-h] [-v]

FLAGS
  -c, --clean    delete old ISOs before to copy
  -C, --checksum  export checksums md5 and sha256
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  export iso in the destination host
```
> [!NOTE]
> To use the command, you can run `eggs export iso` in the terminal. The command supports several flags and options:

- `-c` or `--clean`: Including this flag will delete the old ISO images before copying the new ones. This ensures a clean transfer of ISO images to the destination host.
- `-C` or `--checksum`: Including this flag will export the checksums (md5 and sha256) for the ISO images. This provides additional verification for the integrity of the transferred ISO images.
- `-h` or `--help`: This flag displays the help information for the `eggs export iso` command, providing a brief description of its usage and available flags.
- `-v` or `--verbose`: Including this flag enables verbose mode, providing more detailed information during the export process.

The `eggs export iso` command facilitates the export of ISO images to the destination host. This allows users to conveniently transfer ISO images from one system to another.

Here are some examples of how to use the `eggs export iso` command:

```
eggs export iso
```
This command exports the specified ISO image to the destination host.

```
eggs export iso --clean
```
This command deletes the old ISO images before copying the new ones, ensuring a clean transfer of ISO images to the destination host.
> [!TIP]
> To explore the code implementation of the `eggs export iso` command, you can refer to the [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/export/iso.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs export iso` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs help [COMMAND]`
The `eggs help [COMMAND]` command is used to display help information for the `eggs` tool. This command provides users with detailed instructions and explanations on how to use specific commands or the `eggs` tool in general. By running the `eggs help [COMMAND]` command, users can access comprehensive documentation and guidance.

Here is the usage information for the `eggs help [COMMAND]` command:

```
USAGE
  $ eggs help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for eggs.
```
> [!NOTE]
> To use the command, you can run `eggs help [COMMAND]` in the terminal. The command supports the following arguments and flags:

- `COMMAND`: This is an optional argument that specifies the particular command for which you want to view help information. By providing a command name, you can access detailed instructions and explanations for that specific command.
- `-n` or `--nested-commands`: Including this flag will include all nested commands in the output. This means that not only the specified command's help information will be displayed but also the help information for any sub-commands or nested commands associated with it.

The primary purpose of the `eggs help [COMMAND]` command is to provide users with detailed guidance and documentation for the `eggs` tool. It allows users to access comprehensive information about commands, their usage, and available options.
> [!TIP]
> To explore the code implementation of the `eggs help [COMMAND]` command, you can refer to the [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.23/src/commands/help.ts) file in the plugin-help GitHub repository. This file contains the source code responsible for the `eggs help [COMMAND]` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs install` or `eggs krill`
The `eggs install` or `eggs krill` command is used to install the CLI system installer called "krill" using the `eggs` tool. This command allows users to conveniently install the krill CLI system installer, which is represented metaphorically as an egg transforming into a penguin. The installation process provides various options and configurations to cater to different installation requirements.

Here is the usage information for the `eggs install` or `eggs krill` command:

```
USAGE
  $ eggs install [-k] [-c <value>] [-d <value>] [-H] [-h] [-i] [-n] [-N] [-p] [-r] [-s] [-S] [-u] [-v]

FLAGS
  -H, --halt            Halt the system after installation
  -N, --none            Swap none: 256M
  -S, --suspend         Swap suspend: RAM x 2
  -c, --custom=<value>  custom unattended configuration
  -d, --domain=<value>  Domain name, default: .local
  -h, --help            Show CLI help.
  -i, --ip              hostname as IP, e.g., ip-192-168-1-33
  -k, --crypted         Crypted CLI installation
  -n, --nointeractive   no user interaction
  -p, --pve             Proxmox VE install
  -r, --random          Add random to hostname, e.g., colibri-ay412dt
  -s, --small           Swap small: RAM
  -u, --unattended      Unattended installation
  -v, --verbose         Verbose

DESCRIPTION
  krill: the CLI system installer - the egg became a penguin!
```
> [!NOTE]
> To use the command, you can run `eggs install` or `eggs krill` in the terminal. The command supports numerous flags and options to customize the installation process:

- `-H` or `--halt`: Including this flag will halt the system after installation.
- `-N` or `--none`: Including this flag will configure no swap memory allocation (256M).
- `-S` or `--suspend`: Including this flag will configure swap memory allocation as double the RAM size.
- `-c` or `--custom=<value>`: This option allows users to provide a custom unattended configuration for the installation.
- `-d` or `--domain=<value>`: This option specifies the domain name for the installation. The default is set to `.local`.
- `-h` or `--help`: This flag displays the help information for the `eggs install` or `eggs krill` command, providing a brief description of its usage and available flags.
- `-i` or `--ip`: Including this flag will use the hostname as an IP address, such as `ip-192-168-1-33`.
- `-k` or `--crypted`: Including this flag enables crypted CLI installation.
- `-n` or `--nointeractive`: Including this flag ensures a non-interactive installation process, without requiring any user interaction.
- `-p` or `--pve`: Including this flag specifies a Proxmox VE installation.
- `-r` or `--random`: Including this flag adds a random string to the hostname, such as `colibri-ay412dt`.
- `-s` or `--small`: Including this flag configures swap memory allocation based on the RAM size.
- `-u` or `--unattended`: Including this flag enables unattended installation.
- `-v` or `--verbose`: Including this flag enables verbose mode, providing more detailed information during the installation process.

The primary purpose of the `eggs install` or `eggs krill` command is to install the krill CLI system installer. This allows users to configure and customize the installation process based on their specific requirements.

Here are some examples of how to use the `eggs install` or `eggs krill` command:

```
sudo eggs install
```
This command installs the krill CLI system installer.

```
sudo eggs install --unattended
```
This command performs an unattended installation of the krill CLI system installer.

```
sudo eggs install --custom it
```
This command performs the installation of the krill CLI system installer using a custom unattended configuration named "it".
> [!TIP]
> To explore the code implementation of the `eggs install` or `eggs krill` command, you can refer to the [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/install.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs install` or `eggs krill` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs kill`
The `eggs kill` command is used to terminate and remove eggs, metaphorically representing freeing the nest. This command allows users to delete eggs and perform additional actions related to the nest.

Here is the usage information for the `eggs kill` command:

```
USAGE
  $ eggs kill [-h] [-n] [-v]

FLAGS
  -h, --help           Show CLI help.
  -i, --isos           Erase all ISOs on remote mount
  -n, --nointeractive  No user interaction
  -v, --verbose        Verbose

DESCRIPTION
  Kill the eggs/free the nest
```
> [!NOTE]
> To use the command, you can run `eggs kill` in the terminal. The command supports several flags to customize the process:

- `-h` or `--help`: This flag displays the help information for the `eggs kill` command, providing a brief description of its usage and available flags.
- `-i` or `--isos`: Including this flag will erase all ISOs on the remote mount.
- `-n` or `--nointeractive`: Including this flag ensures a non-interactive execution, without requiring any user interaction.
- `-v` or `--verbose`: Including this flag enables verbose mode, providing more detailed information during the execution.

The primary purpose of the `eggs kill` command is to terminate and remove eggs, symbolizing the act of freeing the nest. It offers additional options, such as erasing ISOs on the remote mount.

Here is an example of how to use the `eggs kill` command:

```
sudo eggs kill
```

This command terminates and removes eggs, freeing the nest.
> [!TIP]
> To explore the code implementation of the `eggs kill` command, you can refer to the [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/kill.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for the `eggs kill` functionality, providing a deeper understanding of how the command is implemented and executed.

## `eggs mom`
The `eggs mom` command is a feature that allows users to seek assistance from a "mommy" helper in a TUI (Text-based User Interface) environment. By invoking this command, users can request help and guidance from the "mommy" helper, who is specifically designed to provide support and aid within the TUI context.

Here is the usage information for the `eggs mom` command:

```
USAGE
  $ eggs mom [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  Ask help from mommy - TUI helper
```

To utilize this command, you simply need to execute `eggs mom` in the terminal. The command includes a single flag:

- `-h` or `--help`: This flag displays the help information for the `eggs mom` command, providing a brief description of its usage and available flags.

The primary purpose of the `eggs mom` command is to seek assistance from the "mommy" helper, who is specifically designed as a TUI helper. This implies that the "mommy" helper is equipped to provide guidance, support, and help within a text-based user interface environment.

Here is an example of how to use the `eggs mom` command:

```
$ eggs mom
```

Executing this command allows users to seek help and guidance from the "mommy" helper within the TUI environment.
> [!TIP]
> If you are interested in exploring the code implementation of the `eggs mom` command, you can refer to the [src/commands/mom.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/mom.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for implementing the functionality of the `eggs mom` command. By examining this code, you can gain a deeper understanding of how the command interacts with the "mommy" helper and facilitates user assistance within the TUI.


## `eggs produce`
The `eggs produce` command is a powerful feature that allows users to generate a live image from their system, excluding their personal data. This command enables users to create a self-contained image of their system, which can be used for various purposes such as system backup, distribution, or testing.

Here is the usage information for the `eggs produce` command:

```
USAGE
  $ eggs produce [--addons <value>] [--basename <value>] [-c] [-C] [-h] [-m] [-n] [-p <value>] [--release]
    [-s] [-f] [--theme <value>] [-v] [-y]

FLAGS
  -C, --cryptedclone    Enable crypted clone
  -c, --clone           Enable clone
  -f, --standard        Use standard compression
  -h, --help            Show CLI help.
  -m, --max             Use max compression
  -N, --noicons         Exclude icons
  -n, --nointeractive   Disable user interaction
  -p, --prefix=<value>  Set prefix
  -s, --script          Enable script mode. Generate scripts to manage ISO build
  -u, --unsecure        Include /home/* and full /root contents in the live image
  -v, --verbose         Enable verbose mode
  -y, --yolk            Force yolk renew
  --addons=<value>...   Specify addons to be used: adapt, ichoice, pve, rsupport
  --basename=<value>    Set the basename
  --filters=<value>...  Specify filters to be used: custom, dev, homes, usr
  --release             Use max compression and remove penguins-eggs and calamares after installation
  --theme=<value>       Set the theme for livecd, calamares branding, and partitions

DESCRIPTION
  Generate a live image from your system without including your personal data.

EXAMPLES
  sudo eggs produce

  sudo eggs produce --max

  sudo eggs produce --clone
  
  sudo eggs produce --clone --max
  
  sudo eggs produce --basename=colibri

  sudo eggs produce --filters custom homes usr

  sudo eggs produce --theme /path/to/theme --addons adapt
```

> [!NOTE]
> To use the `eggs produce` command, you can run it with various options and flags depending on your requirements. Here are some notable options and flags:

- `--addons`: Specify additional addons to be included in the live image, such as `adapt`, `ichoice`, `pve`, or `rsupport`.
- `--basename`: Set a custom basename for the live image.
- `-c` or `--clone`: Enable cloning functionality, allowing the live image to replicate the system's configuration.
- `-m` or `--max`: Use maximum compression for the live image.
- `-s` or `--script`: Enable script mode, which generates scripts to manage the ISO build process.
- `-u` or `--unsecure`: Include `/home/*` and the full contents of `/root` in the live image.
- `--theme`: Set a specific theme for the live CD, Calamares branding, and partitions.
- `--filters`: Specify filters to be applied during the live image generation, such as `custom`, `dev`, `homes`, or `usr`.
- `--release`: Use maximum compression, and remove `penguins-eggs` and `calamares` after installation.

The `eggs produce` command is highly customizable and offers flexibility in generating live images according to specific needs. It provides a comprehensive set of options and flags to tailor the output image and its behavior.
> [!TIP]
> If you are interested in exploring the code implementation of the `eggs produce` command, you can refer to the [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/produce.ts) file in the penguins-eggs GitHub repository. This file contains the source code responsible for implementing the functionality of the `eggs produce` command. Examining this code can provide further insights into the inner workings of the command and its interaction with the system to generate the live image.

## `eggs status`
 The `eggs status` command provides information about the status of eggs. It is a command-line interface (CLI) command that can be executed with various options. Here is a breakdown of the command's usage:

**USAGE**
```
eggs status [-h] [-v]
```

**FLAGS**
- `-h, --help`: Shows help information for the command.
- `-v, --verbose`: Enables verbose mode, which provides more detailed output.

**DESCRIPTION**
The `eggs status` command provides information about the status of eggs. It likely retrieves and displays information such as the number of eggs, their condition, or any relevant details about their status.

**EXAMPLES**
```
eggs status
```
This example executes the `eggs status` command without any additional options.

To learn more about the implementation and source code of the `eggs status` command, you can visit the following link: [src/commands/status.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/status.ts)
## `eggs syncfrom`
 The `eggs syncfrom` command is used to restore users and user data from a LUKS (Linux Unified Key Setup) volume. It is a command-line interface (CLI) command that can be executed with various options. Here is a breakdown of the command's usage:

**USAGE**
```
eggs syncfrom [--delete <value>] [-f <value>] [-h] [-r <value>] [-v]
```

**FLAGS**
- `-f, --file=<value>`: Specifies the file path of the LUKS volume that is encrypted.
- `-h, --help`: Shows help information for the command.
- `-r, --rootdir=<value>`: Specifies the root directory of the installed system when used from a live environment.
- `-v, --verbose`: Enables verbose mode, which provides more detailed output.
- `--delete=<value>`: Uses `rsync --delete` to delete extraneous files from the destination directories.

**DESCRIPTION**
The `eggs syncfrom` command is used to restore users and user data from a LUKS volume. It likely performs operations such as decrypting the LUKS volume, copying user data, and restoring user accounts on the system.

**EXAMPLES**
```
sudo eggs syncfrom
```
This example executes the `eggs syncfrom` command with default options.

```
sudo eggs syncfrom --file /path/to/fileLUKS
```
This example executes the `eggs syncfrom` command while specifying the file path of the LUKS volume to restore from.
> [!TIP]
> To learn more about the implementation and source code of the `eggs syncfrom` command, you can visit the following link: [src/commands/syncfrom.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/syncfrom.ts)

## `eggs syncto`
 The `eggs syncto` command is designed to save users and user data in a LUKS (Linux Unified Key Setup) volume located inside the iso. It is a command-line interface (CLI) command that can be executed with various options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs syncto [--delete <value>] [-f <value>] [-h] [-v]
```

**FLAGS**
- `-f, --file=<value>`: Specifies the file path of the LUKS volume that will be encrypted.
- `-h, --help`: Displays help information for the command.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.
- `--delete=<value>`: Utilizes `rsync --delete` to delete extraneous files from the destination directories.

**DESCRIPTION**
The `eggs syncto` command allows users to save users and user data within a LUKS volume that is located inside the iso. This command is typically used to create a secure and encrypted storage space within the iso, where user-related information can be stored and protected.

> [!NOTE]
> By executing this command, the user data is encrypted and stored in a LUKS volume, ensuring the confidentiality and security of the information. The LUKS volume is embedded within the iso, making it portable and self-contained.

**EXAMPLES**
```
sudo eggs syncto
```
This example executes the `eggs syncto` command with default options.

```
sudo eggs syncto --file /path/to/fileLUKS
```
This example executes the `eggs syncto` command while specifying the file path of the LUKS volume to create and save the user data.
> [!TIP]
> To gain a deeper understanding of the implementation and view the source code of the `eggs syncto` command, you can refer to the following link: [src/commands/syncto.js](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/syncto.ts)

## `eggs tools clean`
 The `eggs tools clean` command is used to clean various system logs, apt cache, and other unnecessary files. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs tools clean [-h] [-n] [-v]
```
**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-n, --nointeractive`: Performs the cleaning process without any user interaction.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs tools clean` command is designed to remove unnecessary files and clean up system logs and apt cache. By executing this command, you can free up disk space and improve system performance by removing temporary files, log files, and cached package files.

The cleaning process may include deleting system logs, which contain records of system events and activities. It may also involve cleaning up the apt cache, which stores downloaded package files. By removing these files, you can reclaim disk space and ensure that your system operates more efficiently.

**EXAMPLES**
```
sudo eggs tools clean
```
This example executes the `eggs tools clean` command with default options.

**To gain a deeper understanding of the implementation and view the source code of the `eggs tools clean` command, you can refer to the following link:** [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/clean.ts)

## `eggs tools ppa`
 The `eggs tools ppa` command is used to add or remove PPA (Personal Package Archive) repositories in the Debian family of operating systems. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs tools ppa [-a] [-h] [-n] [-r] [-v]
```

**FLAGS**
- `-a, --add`: Adds the penguins-eggs PPA repository.
- `-h, --help`: Displays help information for the command.
- `-n, --nointeractive`: Performs the operation without any user interaction.
- `-r, --remove`: Removes the penguins-eggs PPA repository.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs tools ppa` command allows users to manage PPA repositories in the Debian family of operating systems. PPA repositories are external software repositories that provide additional packages and updates not found in the official Debian repositories. By adding or removing PPA repositories, users can access a wider range of software packages and ensure their system stays up to date.

To add a PPA repository, you can use the `-a` or `--add` flag. This will add the penguins-eggs PPA repository to your system, allowing you to install software packages from that repository.
To remove a PPA repository, you can use the `-r` or `--remove` flag. This will remove the penguins-eggs PPA repository from your system, preventing you from installing or updating packages from that repository.

**EXAMPLES**
```
sudo eggs tools ppa --add
```
This example adds the penguins-eggs PPA repository to the system.

```
sudo eggs tools ppa --remove
```
This example removes the penguins-eggs PPA repository from the system.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code of the `eggs tools ppa` command, you can refer to the following link:** [src/commands/tools/ppa.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/ppa.ts)

## `eggs tools skel`
 The `eggs tools skel` command is used to update the "skel" directory with the configuration files from the user's home directory. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs tools skel [-h] [-u <value>] [-v]
```

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-u, --user=<value>`: Specifies the user whose home directory configuration files will be used to update the "skel" directory.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs tools skel` command is designed to update the "skel" directory with configuration files from a user's home directory. The "skel" directory, short for "skeleton," is a directory in Linux systems that contains default configuration files and directories used as templates when creating new user accounts.

By executing the `eggs tools skel` command, you can update the "skel" directory with the latest configuration files from a specified user's home directory. This ensures that new user accounts created on the system will have the same configuration settings as the specified user.

**EXAMPLES**
```
sudo eggs tools skel
```
This example updates the "skel" directory with the configuration files from the current user's home directory.

```
sudo eggs tools skel --user user-to-be-copied
```
This example updates the "skel" directory with the configuration files from the specified user's home directory (`user-to-be-copied`).
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code of the `eggs tools skel` command, you can refer to the following link:** [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/skel.ts)


## `eggs tools stat`
 The `eggs tools stat` command is used to retrieve statistics from SourceForge. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs tools stat [-h] [-m] [-y]
```

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-m, --month`: Retrieves statistics for the current month.
- `-y, --year`: Retrieves statistics for the current year.

**DESCRIPTION**
The `eggs tools stat` command allows users to obtain statistics from SourceForge, a web-based service that provides version control, collaboration, and distribution tools for software development projects. By executing this command, users can retrieve various metrics and data related to their projects hosted on SourceForge.

**EXAMPLES**
```
eggs tools stat
```
This example retrieves general statistics from SourceForge, which may include information such as the number of downloads, active users, or project popularity.

```
eggs tools stat --month
```
This example retrieves statistics specifically for the current month, providing more detailed insights into the project's performance during that period.

```
eggs tools stat --year
```
This example retrieves statistics specifically for the current year, allowing users to analyze the project's overall progress and growth over time.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code of the `eggs tools stat` command, you can refer to the following link:** [src/commands/tools/stat.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/stat.ts)

## `eggs tools yolk`
 The `eggs tools yolk` command is used to configure the "eggs" tool to enable installation without an internet connection. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs tools yolk [-h] [-v]
```

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs tools yolk` command allows users to configure the "eggs" tool to enable installation without requiring an internet connection. The "eggs" tool is a software package manager or installer that is designed to simplify the process of installing and managing software packages on a computer system.

By executing the `eggs tools yolk` command with the appropriate options, users can set up the "eggs" tool to work in an offline mode. This means that it will be able to install software packages from local sources, such as a local repository or package cache, without needing to connect to the internet.

**EXAMPLES**
```
sudo eggs tools yolk
```
This example configures the "eggs" tool to install software packages without an internet connection. The `sudo` command is used to run the command with administrative privileges.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code of the `eggs tools yolk` command, you can refer to the following link:** [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/yolk.ts)

## `eggs update`
 The `eggs update` command is used to update the Penguins' eggs tool. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs update [-h] [-v]
```

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs update` command allows users to update the Penguins' eggs tool to the latest version. The Penguins' eggs tool is a software utility or package manager that is specifically designed for managing and installing software packages related to the Penguins project.

By executing the `eggs update` command, users can check for updates to the Penguins' eggs tool and install the latest version if available. This ensures that users have the most up-to-date features, bug fixes, and improvements for the Penguins' eggs tool.

**EXAMPLES**
```
eggs update
```
This example checks for updates to the Penguins' eggs tool and installs the latest version if available.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code related to the `eggs update` command, you can refer to the following link:** [src/update.js](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/update.ts)


## `eggs version`
 The `eggs version` command is used to retrieve information about the version of the "eggs" command-line interface (CLI). It is a command-line command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs version [--json] [--verbose]
```

**FLAGS**
- `--verbose`: Shows additional information about the CLI.
- `--json`: Formats the output as JSON.

**GLOBAL FLAGS**
- `--json`: Formats the output as JSON.

**FLAG DESCRIPTIONS**
- `--verbose`: Shows additional information about the CLI. This includes details such as the architecture, Node.js version, operating system, and versions of plugins used by the CLI.

The `eggs version` command retrieves information about the version of the "eggs" CLI. By default, it provides basic version information. However, you can use the `--verbose` flag to get more detailed information, including the architecture, Node.js version, operating system, and versions of plugins used by the CLI.

Additionally, you can use the `--json` flag to format the output as JSON, which can be useful for automated processing or integration with other tools.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code related to the `eggs version` command, you can refer to the following link:** [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.1.4/src/commands/version.ts)


## `eggs wardrobe get [REPO]`
 The `eggs wardrobe get [REPO]` command is used to retrieve a wardrobe from a repository. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs wardrobe get [REPO] [-h] [-v]
```

**ARGUMENTS**
- `REPO`: The repository from which to retrieve the wardrobe.

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs wardrobe get [REPO]` command allows users to retrieve a wardrobe from a repository. A wardrobe, in this context, refers to a collection of clothing items that are stored and managed in a repository.

By executing the `eggs wardrobe get [REPO]` command, users can specify the repository from which they want to retrieve the wardrobe. This allows users to access and view the clothing items stored in the specified repository.

**EXAMPLES**
```
eggs wardrobe get
```
This example retrieves a wardrobe from a default repository.

```
eggs wardrobe get your-wardrobe
```
This example retrieves a wardrobe from a specific repository called "your-wardrobe".
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code related to the `eggs wardrobe get [REPO]` command, you can refer to the following link:** [src/commands/wardrobe/get.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/get.ts)

## `eggs wardrobe list [WARDROBE]`
 The `eggs wardrobe list [WARDROBE]` command is used to list costumes and accessories stored in a wardrobe. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs wardrobe list [WARDROBE] [-h] [-v]
```

**ARGUMENTS**
- `WARDROBE`: The specific wardrobe to list costumes and accessories from.

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.

**DESCRIPTION**
The `eggs wardrobe list [WARDROBE]` command allows users to view a list of costumes and accessories stored in a wardrobe. A wardrobe, in this context, is a collection of clothing items and accessories that can be used for various purposes, such as dressing up or creating outfits.

> [!NOTE]
> By executing the `eggs wardrobe list [WARDROBE]` command, users can specify the wardrobe they want to list costumes and accessories from. This command provides a convenient way to view the items available in a specific wardrobe.

**EXAMPLES**
```
eggs wardrobe list
```
This example lists costumes and accessories from a default wardrobe.

```
eggs wardrobe list your-wardrobe
```
This example lists costumes and accessories from a specific wardrobe called "your-wardrobe".
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code related to the `eggs wardrobe list [WARDROBE]` command, you can refer to the following link:** [src/commands/wardrobe/list.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/list.ts)


## `eggs wardrobe show [COSTUME]`
The `eggs wardrobe show [COSTUME]` command is used to display costumes and accessories stored in a wardrobe. It is a command-line interface (CLI) command that can be executed with different options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs wardrobe show [COSTUME] [-h] [-j] [-v] [-w <value>]
```

**ARGUMENTS**
- `COSTUME`: The specific costume or accessory to show.

**FLAGS**
- `-h, --help`: Displays help information for the command.
- `-j, --json`: Outputs the result in JSON format.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.
- `-w, --wardrobe=<value>`: Specifies the wardrobe to show costumes and accessories from.

**DESCRIPTION**
The `eggs wardrobe show [COSTUME]` command allows users to view details and information about specific costumes and accessories stored in a wardrobe. A wardrobe, in this context, is a collection of clothing items and accessories.
> [!NOTE]
> By executing the `eggs wardrobe show [COSTUME]` command, users can specify the costume or accessory they want to view. This command provides a way to retrieve information about a particular item in the wardrobe.

**EXAMPLES**
```
eggs wardrobe show colibri
```
This example shows details about the "colibri" costume.

```
eggs wardrobe show accessories/firmwares
```
This example shows details about the "firmwares" accessory within the "accessories" category.

```
eggs wardrobe show accessories/
```
This example shows all available costumes and accessories within the "accessories" category.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code related to the `eggs wardrobe show [COSTUME]` command, you can refer to the following link:** [src/commands/wardrobe/show.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/show.ts)


## `eggs wardrobe wear [COSTUME]`
 The `eggs wardrobe wear [COSTUME]` command is used to wear costumes and accessories from a wardrobe. It is a command-line interface (CLI) command that can be executed with various options. Here is an expanded and rewritten explanation of the command:

**USAGE**
```
eggs wardrobe wear [COSTUME] [-h] [-a] [-f] [-s] [-v] [-w <value>]
```

**ARGUMENTS**
- `COSTUME`: The specific costume or accessory to wear.

**FLAGS**
- `-a, --no_accessories`: Specifies not to install accessories when wearing the costume.
- `-f, --no_firmwares`: Specifies not to install firmwares when wearing the costume.
- `-h, --help`: Displays help information for the command.
- `-s, --silent`: Enables silent mode, suppressing unnecessary output.
- `-v, --verbose`: Enables verbose mode, providing more detailed output.
- `-w, --wardrobe=<value>`: Specifies the wardrobe to wear costumes and accessories from.

**DESCRIPTION**
The `eggs wardrobe wear [COSTUME]` command allows users to wear specific costumes and accessories from a wardrobe. By executing this command, users can choose a costume or accessory they want to wear, and it will be applied or installed accordingly.

The command provides flexibility with the following options:
- The `-a, --no_accessories` flag can be used to exclude installing accessories when wearing the costume.
- The `-f, --no_firmwares` flag can be used to exclude installing firmwares when wearing the costume.
- The `-s, --silent` flag enables silent mode, reducing unnecessary output.
- The `-v, --verbose` flag enables verbose mode, providing more detailed output.
> [!NOTE]
> Users can also specify the wardrobe to wear the costumes and accessories by using the `-w, --wardrobe=<value>` option.

**EXAMPLES**
```
sudo eggs wardrobe wear duck
```
This example wears the "duck" costume from the wardrobe.

```
sudo eggs wardrobe wear accessories/firmwares
```
This example wears the "firmwares" accessory within the "accessories" category.

```
sudo eggs wardrobe wear wagtail/waydroid
```
This example wears the "waydroid" costume from the "wagtail" category.
> [!TIP]
> **To gain a deeper understanding of the implementation and view the source code related to the `eggs wardrobe wear [COSTUME]` command, you can refer to the following link:** [src/commands/wardrobe/wear.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/wear.ts)


# Penguins' eggs official guide 
**Penguins' Eggs Official Guide and Resources**

Welcome to the Penguins' Eggs Official Guide! This comprehensive manual provides detailed instructions on using Penguins' Eggs, a software tool designed to facilitate various tasks. Initially released in Italian, the guide can be translated into other languages using machine translation for wider accessibility.

To access the guide, click [here](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide). It offers valuable information and step-by-step tutorials to help users navigate through the software's features. However, please note that some of the terminal samples in the guide may need updating.

For a visual demonstration of Penguins' Eggs in action, check out these helpful [terminal samples](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/terminal-lessons/eggs_help.gif?raw=true). They provide a practical overview of how to use the tool effectively.

## That's all, Folks!

One of the standout features of Penguins' Eggs is its hassle-free setup. It comes with all the necessary configurations, making it a convenient choice for users. Just like in real life, the magic of Penguins' Eggs lies within - no additional setup required! :-D

## More Information

In addition to the official guide, there are other resources available for Penguins' Eggs users, particularly developers. These resources can be found in the [penguins-eggs repository](https://github.com/pieroproietti/penguins-eggs) under the [documents](https://github.com/pieroproietti/penguins-eggs/tree/master/documents) section.

Some noteworthy documents include:
- [Hens: Different Species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md): A brief guide on using Penguins' Eggs in Debian, Arch, and Manjaro.
- [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html): A blog post detailing how to create an Arch naked live, install it, and customize the resulting system into a graphics development station.

If you have any questions or need further assistance, feel free to contact me via email at pieroproietti@gmail.com. You can also stay updated by following my blog [here](https://penguins-eggs.net) or connecting with me on [Facebook](https://www.facebook.com/groups/128861437762355/), [GitHub](https://github.com/pieroproietti/penguins-krill), [Jitsi](https://meet.jit.si/PenguinsEggsMeeting), [Reddit](https://www.reddit.com/user/Artisan61), [Telegram](https://t.me/penguins_eggs), or [Twitter](https://twitter.com/pieroproietti).


# Copyright and licenses
Copyright (c) 2017, 2023 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
