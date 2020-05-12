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
# 18 speech-dispatcherd.service
19 ssh.service
# 20 systemd-networkd.service
# 21 systemd-resolved.service
# 22 wpa_supplicant-nl80211@.service
23 wpa_supplicant.service
# 24 wpa_supplicant@.service
# 25 wpa_supplicant-wired@.service

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


# Differenze 
sulla versione installata
systemd-analyze

Startup finished in 2.928s (kernel) + 2.853s (userspace) = 5.781s 
graphical.target reached after 2.844s in userspace

systemd-analyze
tartup finished in 2.392s (kernel) + 1min 30.881s (userspace) = 1min 33.273s 
graphical.target reached after 1min 30.870s in userspace


