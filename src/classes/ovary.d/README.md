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

Infine, viene caricato il `grub.cfg` principale con il menu di avvio, e questo carica il kernel.

Purtroppo, la catena di shim arriva sino al kernel anche se da qualche parte,
deve essere presente l'opzione: `BOOT_IMAGE=noverify` in un file `shim.cfg` 
interno ad `/etc`.

Debian/Ubuntu non lo leggono: ho provato a creare la iso con `/etc/shim/shim.cfg` e con 
`/etc/shim.cfg` ma non sembra variare il comportamente.

E questo fa si che creare una catena `bootx64.efi`, `grubx64.efi` si scontra con la firma.

Più semplice è sostituire `efi.img` con l'originale dalla distro.

`bootx64.efi`, `grubx64.efi` rimangono gli originali e vanno a caricare il 
kernel firmato dalla distro stessa.

Per qualche ragione, modifica su modifica anche questo non mi sta funzionando, ma ha funzionato con la versione precedente.

In Arch abbiamo lo stesso problema, e credo che la soluzione di Arch sia quella giusta: disabilitare Secure Boot durante l'installazione e riabilitarlo dopo.



