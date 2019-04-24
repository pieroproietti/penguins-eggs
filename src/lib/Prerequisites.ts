/**
 * Prerequisites
 * 
 */

"use strict";
import utils from "./utils";

class Prerequisites {
    // Properties

    // Methods
    static arch(): void {
        console.log(
            ">>> eggs: Installing the prerequisites packages..."
        );

         utils.exec(`pacman -Sy`);
         utils.exec(`pacman -S lvm2 --noconfirm`);
         utils.exec(`pacman -S parted --noconfirm`);
         utils.exec(`pacman -S squashfs-tools --noconfirm`);
         utils.exec(`pacman -S xorriso --noconfirm`);
        // await utils.exec(`pacman -S live-boot --noconfirm`);
         utils.exec(`pacman -S syslinux --noconfirm`);
         utils.exec(`pacman -S isolinux --noconfirm`);
        //await utils.exec(`pacman -S pxelinux --noconfirm`);
    }


    static debian(): void {
        console.log(
            ">>> eggs: Installing the prerequisites packages..."
        );
         utils.exec('apt-get update');
         utils.exec(`apt-get --yes install lvm2 \
                            parted \
                            squashfs-tools \
                            xorriso \
                            live-boot \
                            syslinux \
                            syslinux-common \
                            isolinux pxelinux`);

         utils.exec(`apt-get --yes install calamares \
                            qml-module-qtquick2 \
                            qml-module-qtquick-controls`);

         utils.exec('apt-get clean');
         utils.exec('apt-get autoclean');
    }

    static redhat(): void {
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
    

}
export default Prerequisites;