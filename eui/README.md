# eggs unattended install

Eggs unattended install è basato su semplici script ed, al momento, funziona così:

```
cd /usr/lib/penguins-eggs/eui
./eui-create-image.sh
```
Verrà generata una immagine fast, quindi abbastanza veloce, e lanciato il comando cuckoo.

# Modifiche necessarie

* /etc/sudoers.d/eui-users

Create a file:
```
sudo nano /etc/sudoers.d/eui-users
```
and copy and past, following code:

```
live ALL=(ALL) NOPASSWD: /usr/bin/eui-start.sh
artisan ALL=(ALL) NOPASSWD: /usr/bin/eui-start.sh
```
Change permissions to /etc/sudoers.d/eui-users
```
chmod 0440 /etc/sudoers.d/eui-users
```

* /etc/xdg/autostart/eui.desktop

```
[Desktop Entry]
Type=Application
Name=Eggs unattended install
Exec=sudo /usr/bin/eui-start.sh
StartupNotify=false
NoDisplay=true
Terminal=true  #basically will open terminal and people can see the script executing
```
