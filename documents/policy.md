This is penguins-eggs config

file: /usr/share/polkit-1/actions/com.github.pieroproietti.penguins-eggs.policy

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC
"-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
"http://www.freedesktop.org/standards/PolicyKit/1/policyconfig.dtd">
<policyconfig>

 <vendor>Penguins-eggsEggs</vendor>
 <vendor_url>https://github.com/penguins-eggs</vendor_url>

 <action id="com.github.calamares.calamares.pkexec.run">
    <description>Run Installer</description>
    <message>Authentication is required to run the installation program</message>
    <icon_name>drive-harddisk</icon_name>
    <defaults>
     <allow_any>no</allow_any>
     <allow_inactive>no</allow_inactive>
     <allow_active>yes</allow_active>
    </defaults>
    <annotate key="org.freedesktop.policykit.exec.path">/usr/bin/eggs</annotate>
    <annotate key="org.freedesktop.policykit.exec.allow_gui">false</annotate>
 </action>
</policyconfig>
```
## Authorization rules
Risiedono in /etc/polkit-1/rules.d 


```
/* Allow users in admin group to run GParted without authentication */
polkit.addRule(function(action, subject) {
    if (action.id == "org.archlinux.pkexec.gparted" &&
        subject.isInGroup("admin")) {
        return polkit.Result.YES;
    }
});
```