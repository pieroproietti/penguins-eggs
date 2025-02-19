* UEFI carica `bootx64.efi` (`shim` firmato) da `efi.img`
* `bootx64.efi` carica `grubx64.efi`
* `grubx64.efi` cerca il primo `grub.cfg` in `efi.img` che contiene:

```
search --file --set=root /.disk/id/7259f9f5-5242-4b65-b62c-2d37a2048f96
set prefix=($root)/boot/grub
source $prefix/x86_64-efi/grub.cfg

```

Questo carica `/boot/grub/x86_64-efi/grub.cfg` dalla ISO principale, 
che carica vari moduli, poi esegue:

```
source $prefix/boot/grub/grub.cfg
```

Infine, viene caricato il `grub.cfg` principale con il menu di avvio.
