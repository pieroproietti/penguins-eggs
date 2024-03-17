# syncto e syncfrom

Sto pensando di ristrutturare, ed anche semplificare syncto e syncfrom.

Quando ho creato questi comandi mi sono innamorato di LUKS che però presenta un problema non trascurabile e cioè
la necessità di conoscere a priori lo spazio richiesto sul device. 

Dopo il tuo intervento ho pensato che forse era meglio utilizzare un file `payload.tar.gz.gpg` creato apputo con tar, gz e gpg, tuttavia questo significherebbe rinunciare alla exclude list.

Allora ho deciso di utilizzare mksquashfs e criptare il risultato finale con LUKS, ho analizzato i comandi da questo [link](https://gist.github.com/ansemjo/6f1cf9d9b8f7ce8f70813f52c63b74a6)


```
sudo mksquashfs /home /etc/passwd /etc/shadow /etc/group payload.sfs
sudo truncate -s +32M payload.sfs # aggiungiamo 32M per cryptsetup
sudo cryptsetup -q reencrypt --encrypt --type luks2 --resilience none --disable-locks --reduce-device-size 32M payload.sfs
```

payload andrebbe montato con i comando:
```
sudo cryptsetup open payload.sfs payload
sudo mount /dev/payload /tmp/payload
```

e si potrebbero copiare direttamente i file contenuti in /.


