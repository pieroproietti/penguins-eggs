# make-efi.ts

```
    const grubCfg1 = `${efiMemdiskDir}/boot/grub/grub.cfg`
    let grubText1 = `# grub.cfg 1\n`
    grubText1 += `# created on ${efiMemdiskDir}\n`
    grubText1 += `\n`
    grubText1 += `search --file --set=root /.disk/id/${this.uuid}\n`
    grubText1 += "set prefix=($root)/boot/grub\n"
    grubText1 += "source $prefix/${grub_cpu}-efi/grub.cfg\n" // trixie
    // grubText1 += `source ($root)/boot/grub/grub.cfg\n` // precedente
    Utils.write(grubCfg1, grubText1)
```

ma cosa c'è in /boot/grub/x86_64-efi/grub.cfg? In `/lib/grub/x86_64-efi/` 
non esiste un `grub.cfg`, e viene copiata in`/boot/grub`.

Questo è il contenuto di /lib/grub/x86_64-efi/grub.cfg`:

```
source /boot/grub/grub.cfg
```











