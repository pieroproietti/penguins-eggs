# autologin cli

Create a drop-in plugin in /etc/systemd/system/getty@.service.d/override.conf

```sudo mkdir /etc/systemd/system/getty@.service.d```
```sudo nano /etc/systemd/system/getty@.service.d/override.conf```

And fill with lines:

```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noclear --autologin your_user_name %I $TERM
```

Questo potrebbe essere creato in ovary, solo per ambienti cli, e rimosso da eggs install

Rimarrebbe il caso di una naked che diventa dressed!
