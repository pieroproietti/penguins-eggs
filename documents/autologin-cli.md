# autologin cli

Create a drop-in plugin in /etc/systemd/system/getty.target.wants/@.service.d/override.conf

```sudo mkdir /etc/systemd/system/getty@.service.d```
```sudo nano /etc/systemd/system/getty.target.wants/@.service.d/override.conf```

And fill with lines:

```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noclear --autologin your_user_name %I $TERM
```

Questo potrebbe essere creato in ovary, solo per ambienti cli, e rimosso da eggs install

Rimarrebbe il caso di una naked che diventa dressed!


Customizzazione motd (message of the day)

Possiamo aggiungere a motd la seguente frase:

#eggs-message

This is a live eggs system, your current username is: ${USER}

You are logged automatically. This feathure will be removed when you install the system.

#eggs-message-stop
