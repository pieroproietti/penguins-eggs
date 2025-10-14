# 90block

Debian usa un’architettura leggermente diversa dove parte delle funzionalità di block sono “fuse” dentro `95rootfs-block` e `99base`, ma non fornisce l’interfaccia di compatibilità `90block` che molti altri moduli (come `iso-scan`, `dmsquash-live`, `luks`, ecc.) si aspettano.

Quindi `iso-scan` cerca block, ma non lo trova né lo può risolvere, perché non esiste come directory in `/usr/lib/dracut/modules.d/`.