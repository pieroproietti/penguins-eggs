# isolinux.cfg
Aggiungo ad APPEND

archisobasedir=live archisolabel=naked cow_spacesize=4G

in questo modo, la live trov il disco naked e lo monta in
/run/archiso/bootmnt

Purtroppo la compatibilita finisce qua, archiso crea 

mkdir /run/archiso/cowspace/persistent-naked

a mano monto filesystem.squashfs 

mount /run/archiso/bootmnt/live/filesystem.squashfs /run/archiso/cowspace/persistent-naked

e provo a montaro in rw

mkdir /run/archiso/.work
mkdir /run/archiso/.upper
mount -t overlay overlay -o lowerdir=/run/archive/.lower,upperdir=/run/archive/.upper,workdir=/run/archive/.work /new_root

A rigor di logica dando exit dovrebbe andare, sfortunatamente non va!

