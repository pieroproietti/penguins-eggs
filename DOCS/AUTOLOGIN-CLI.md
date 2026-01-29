# autologin cli

Create a drop-in plugin in `/etc/systemd/system/getty.target.wants/@.service.d/override.conf`

```sudo mkdir /etc/systemd/system/getty@.service.d```
```sudo nano /etc/systemd/system/getty.target.wants/@.service.d/override.conf```

And fill with lines:

```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noclear --autologin your_user_name %I $TERM
```

This is created on `ovary.ts`, only on CLI system, then is removed from krill `sudo eggs install`.

The same must happen when a `naked` is dressed.

# Customization `motd` (message of the day)

Possiamo aggiungere a `/etc/motd` the following lines:

```
#eggs-message

This is a live eggs system, your current username is: ${USER}

You are logged automatically. This feathure will be removed when you install the system.

#eggs-message-stop
```

Again this must be removed during installation by krill.

