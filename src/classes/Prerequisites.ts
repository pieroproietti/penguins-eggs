/**
 * penguins-eggs: Prerequisites.ts
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

"use strict";
import utils from "../lib/utils";
import { IOses } from "../interfaces";

class Prerequisites {
    // Properties

    private o: IOses;

    constructor(o: IOses){
        this.o = o;
    }



    // Methods
    public async install() {
    console.log(`Prerequisites: ${this.o.distroLike}`);

    if (this.o.distroLike === "Arch") {
        this.arch();
    } else if (this.o.distroLike === "Debian") {
        this.debian();
    } else if (this.o.distroLike === "Ubuntu") {
        this.debian();
    } else if (this.o.distroLike === "RedHat") {
        this.redhat();
    }
}

arch(): void {
    console.log(
        ">>> eggs: Installing the prerequisites packages..."
    );

    utils.exec(`pacman -Sy`);
    utils.exec(`pacman -S lvm2 --noconfirm`);
    utils.exec(`pacman -S parted --noconfirm`);
    utils.exec(`pacman -S squashfs-tools --noconfirm`);
    utils.exec(`pacman -S xorriso --noconfirm`);
    utils.exec(`pacman -S syslinux --noconfirm`);
    utils.exec(`pacman -S isolinux --noconfirm`);
    //https://wiki.manjaro.org/index.php?title=Manjaro-tools
    //https://gitlab.manjaro.org/tools/development-tools/manjaro-tools-livecd
}


debian(): void {
    console.log(
        ">>> eggs: Installing the prerequisites packages..."
    );
    utils.exec(`apt-get update`);
    utils.exec(`apt-get --yes install lvm2 \
                            parted \
                            squashfs-tools \
                            xorriso \
                            live-boot \
                            live-config \
                            syslinux \
                            syslinux-common \
                            isolinux pxelinux`);

    utils.exec(`apt-get --yes install calamares \
                            calamares-settings-debian \
                            qml-module-qtquick2 \
                            qml-module-qtquick-controls`);

    utils.exec(`apt-get clean`);
    utils.exec(`apt-get autoclean`);
}

redhat(): void {
    console.log(
        ">>> eggs: Installing the prerequisites packages..."
    );
    utils.exec(`dnf check-update`);
    utils.exec(`dnf upgrade`);
    utils.exec(`dnf install -y lvm2`);
    utils.exec(`dnf install -y parted`);
    utils.exec(`dnf install -y squashfs-tools`);
    utils.exec(`dnf install -y xorriso`);
    // utils.exec(`dnf install -y live-boot`);
    utils.exec(`dnf install -y syslinux`);
    // utils.exec(`dnf install -y isolinux`);
    // utils.exec(`dnf install -y pxelinux`);
    utils.exec(`dnf install -y calamares`);
    // utils.exec(`dnf install -y qml-module-qtquick2`);
    // utils.exec(`dnf install -y qml-module-qtquick-controls`);
}

/**
 * Centos
 * 
 * yum check-update
 * yum update
 * yum install package
 */

mule(): void {
    utils.exec(`apt-get remove --purge --yes calamares`);
    utils.exec(`apt-get remove --purge --yes isolinux`);
    utils.exec(`apt-get remove --purge --yes live-boot`);
    utils.exec(`apt-get remove --purge --yes pxelinux`);
    utils.exec(`apt-get remove --purge --yes qml-module-qtgraphicaleffects`);
    utils.exec(`apt-get remove --purge --yes qml-module-qtquick-controls `);
    utils.exec(`apt-get remove --purge --yes qml-module-qtquick2 `);
    utils.exec(`apt-get remove --purge --yes syslinux`);
    utils.exec(`apt-get autoclean`);

}

}
export default Prerequisites;