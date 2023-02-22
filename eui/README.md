# eggs unattended install

## sudoers.d

```
localadmin ALL=NOPASSWD: /usr/bin/AutoInit.sh
live ALL=NOPASSWD: /usr/bin/AutoInit.sh
```
 
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
 