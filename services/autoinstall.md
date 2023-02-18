# eggs unattended install at boot

Creare il file:
```
sudo cp eggs-unattended-install.service /etc/systemd/system/
sudo systemctl enable eggs-unattended-install.service
sudo eggs cuckoo
```
