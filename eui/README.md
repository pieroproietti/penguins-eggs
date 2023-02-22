# eggs unattended install

## sudoers.d

sudo nano /etc/sudoers.d/eui-users

```
localadmin ALL=NOPASSWD: /usr/bin/AutoInit.sh
```
chmod 0440 /etc/sudoers.d/eui-users

5. Create a startup script at /etc/xdg/autostart/eui.desktop

```
[Desktop Entry]
Type=Application
Name=Eggs unattended install
Exec=sudo /usr/bin/eui-start.sh
StartupNotify=false
NoDisplay=true
Terminal=true  #basically will open terminal and people can see the script executing
```
 