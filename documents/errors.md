# errors

During live boot

a start job is running for /sys/subsystem/net/devices/multi/user 

list files in /etc/systemd/system/multi-user.target.wants installata

1  anacron.service
2  avahi-daemon.service
3  binfmt-support.service
4  console-setup.service
5  cron.service
6  cups-browsed.service
7  cups.path
8  live-tools.service
9  lm-sensors.service
10 ModemManager.service
11 networking.service
12 NetworkManager.service
13 pppd-dns.service
14 remote-fs.target
15 rsync.service
16 rsyslog.service
17 ssh.service
18 wpa_supplicant.service

list files in /etc/systemd/system/multi-user.target.wants live 

1  anacron.service
2  avahi-daemon.service
3  binfmt-support.service
4  console-setup.service
5  cron.service
6  cups-browsed.service
7  cups.path
8  live-tools.service
9  lm-sensors.service
10 ModemManager.service
11 networking.service
12 NetworkManager.service
13 pppd-dns.service
# 14 remote-cryptsetup.target
15 remote-fs.target
16 rsync.service
17 rsyslog.service
18 speech-dispatcherd.service
19 ssh.service
20 systemd-networkd.service
21 systemd-resolved.service
22 wpa_supplicant-nl80211@.service
23 wpa_supplicant.service
24 wpa_supplicant@.service
25 wpa_supplicant-wired@.service

# differenze
1 remote-cryptsetup.target
2 speech-dispatcherd.service
3 systemd-networkd.service
4 systemd-resolved.service
5 wpa_supplicant-nl80211@.service
6 wpa_supplicant@.service
7 wpa_supplicant-wired@.service

remote-cryptsetup.target

Pur disattivando TUTTI nella live ottengo nuovamente gli stessi,
nonostante risultino in effetti cancellati

interessante, al boot segnala: Restore /etc/resolv.conf if the system was crashed before ppp link was shut down...
quindi segnale errore su speech-dispatcherd che dovrebbe essere disabilitato

/etc/resolv.con fa parte dei file esclusi, provo a reinserirlo

## differente di systemd-analyze

systemd-analyze
```
Startup finished in 2.928s (kernel) + 2.853s (userspace) = 5.781s 
graphical.target reached after 2.844s in userspace
```

systemd-analyze
```
tartup finished in 2.392s (kernel) + 1min 30.881s (userspace) = 1min 33.273s 
graphical.target reached after 1min 30.870s in userspace
```

## file log
```
/var/log/boot.log
```

## pulizia journal
```
sudo journalctl --vacuum-time=1h
```

## esame journal
```
sudo journalctl -xe 
```

## Trovato il seguente errore
```
mag 12 14:18:15 debu7 systemd[326]: /usr/lib/systemd/system-generators/live-config-getty-generator failed with exit status 127.
```


```log
mag 12 15:26:21 debu7 kernel: random: crng init done
mag 12 15:26:21 debu7 kernel: random: 7 urandom warning(s) missed due to ratelimiting
mag 12 15:26:21 debu7 NetworkManager[491]: <info>  [1589297181.9983] manager: startup complete
mag 12 15:26:22 debu7 systemd[1]: Started Network Manager Wait Online.
-- Subject: L'unità NetworkManager-wait-online.service termina la fase di avvio
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- L'unità NetworkManager-wait-online.service ha terminato la fase di avvio.
-- 
-- La fase di avvio è done.
mag 12 15:26:26 debu7 systemd[1]: NetworkManager-dispatcher.service: Succeeded.
-- Subject: Unit succeeded
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- The unit NetworkManager-dispatcher.service has successfully entered the 'dead' state.
mag 12 15:26:46 debu7 systemd[1]: systemd-hostnamed.service: Succeeded.
-- Subject: Unit succeeded
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- The unit systemd-hostnamed.service has successfully entered the 'dead' state.
mag 12 15:27:45 debu7 systemd[1]: sys-subsystem-net-devices-multi-user.device: Job sys-subsystem-net-devices-multi-user.device/start timed out.
mag 12 15:27:45 debu7 systemd[1]: Timed out waiting for device /sys/subsystem/net/devices/multi/user.
-- Subject: L'unità sys-subsystem-net-devices-multi-user.device è fallita
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- L'unità sys-subsystem-net-devices-multi-user.device è fallita.
-- 
-- Il risultato è timeout.
mag 12 15:27:45 debu7 systemd[1]: Dependency failed for WPA supplicant daemon (interface- and wired driver-specific version).
-- Subject: L'unità wpa_supplicant-wired@multi-user.service è fallita
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- L'unità wpa_supplicant-wired@multi-user.service è fallita.
-- 
-- Il risultato è dependency.
mag 12 15:27:45 debu7 systemd[1]: wpa_supplicant-wired@multi-user.service: Job wpa_supplicant-wired@multi-user.service/start failed with result 'dependency'.
mag 12 15:27:45 debu7 systemd[1]: Dependency failed for WPA supplicant daemon (interface-specific version).
-- Subject: L'unità wpa_supplicant@multi-user.service è fallita
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- L'unità wpa_supplicant@multi-user.service è fallita.
-- 
-- Il risultato è dependency.
mag 12 15:27:45 debu7 systemd[1]: wpa_supplicant@multi-user.service: Job wpa_supplicant@multi-user.service/start failed with result 'dependency'.
mag 12 15:27:45 debu7 systemd[1]: Dependency failed for WPA supplicant daemon (interface- and nl80211 driver-specific version).
-- Subject: L'unità wpa_supplicant-nl80211@multi-user.service è fallita
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- L'unità wpa_supplicant-nl80211@multi-user.service è fallita.
-- 
-- Il risultato è dependency.
mag 12 15:27:45 debu7 systemd[1]: wpa_supplicant-nl80211@multi-user.service: Job wpa_supplicant-nl80211@multi-user.service/start failed with result 'dependency'.
mag 12 15:27:45 debu7 systemd[1]: sys-subsystem-net-devices-multi-user.device: Job sys-subsystem-net-devices-multi-user.device/start failed with result 'timeout'.
mag 12 15:27:45 debu7 systemd[1]: Reached target Network.
-- Subject: L'unità network.target termina la fase di avvio
-- Defined-By: systemd
-- Support: https://www.debian.org/support
-- 
-- L'unità network.target ha terminato la fase di avvio.
```
