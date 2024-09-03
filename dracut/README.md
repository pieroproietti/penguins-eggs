# dracut on Fedora

```
sudo dnf install dracut dracut-live
```

`dracut-live` installa i moduli: `dmsquash-live*`


A questo punto dando il comando:
```
ls /usr/lib/dracut/modules.d/ | grep dmsquash
```
Otteniamo:
```
90dmsquash-live
90dmsquash-live-autooverlay
90dmsquash-live-ntfs
```

