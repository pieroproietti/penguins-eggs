# dracut
E' solo un tentativo...:

* copiare `99custom` in `/usr/lib/dracut/modules.d`
* installare dracut in Alpine
* modificare initrdAlpine in ovary.ts
  * create modulo 99custom
  * create script 99custom/module-setup.sh
  * create script 99custom/mount-live.sh
  * create script 99custom/init-live.sh

## 99custom
```
mkdir -p /usr/lib/dracut/modules.d/99custom
```

## 99custom/module-setup.sh
```
#!/bin/bash

check() {
    return 0
}

depends() {
    echo "shutdown"
    return 0
}

install() {
    inst_hook cmdline 90 "$moddir/mount-live.sh"
    inst_hook pre-mount 50 "$moddir/init-live.sh"
}
```

## 99custom/mount-live.sh
```
#!/bin/sh

mount_live() {
    # Trova il dispositivo CD-ROM
    for device in $(ls /dev/sr*); do
        if mount -r $device /mnt; then
            break
        fi
    done

    # Monta il filesystem squashfs in RO
    if [ -e /mnt/live/filesystem.squashfs ]; then
        mkdir -p /run/rootro
        mount -t squashfs -o ro /mnt/live/filesystem.squashfs /run/rootro
    fi

    # Monta il filesystem union (overlay)
    if [ -d /run/rootro ]; then
        mkdir -p /run/root-rw /run/overlay
        mount -t tmpfs -o rw,noatime,mode=755 tmpfs /run/root-rw
        mount -t overlay -o lowerdir=/run/rootro,upperdir=/run/root-rw,workdir=/run/overlay overlay /sysroot
    fi
}

mount_live
```

## 99custom/init-live.sh
```
#!/bin/sh

# Esempio di inizializzazioni aggiuntive
echo "Inizializzazioni aggiuntive possono essere aggiunte qui"
```

# Comando in ovary
```
    let initrdImg = 'initramfs-lts'
    // dracut
    const pathConf = path.resolve(__dirname, `../../dracut/dracut.conf.d`)
    await exec(`dracut --confdir ${pathConf} ${this.settings.iso_work}live/${initrdImg}`, Utils.setEcho(true))
```

# TESTING
sudo ./install-dracut-99-custom
sudo dracut --confdir dracut/dracut.conf.d initramfs-dummy

