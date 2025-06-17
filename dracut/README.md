# dracut on Fedora

## Install

### fedora 
```
sudo dnf -y install \
	dracut \
	dracut-live
```

### opensuse
```
sudo zypper -y install \
	dracut \
	dracut-tools
```

### pacchetti da installare/rimuovere per opensuse
zypper rm multipath-tools,
zypper install libxkbcommon-tools util-linux kf6-qqc2-desktop-styl
