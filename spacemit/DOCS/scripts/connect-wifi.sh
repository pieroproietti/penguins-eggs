#!/bin/bash
SSID="${1:-proietti-armaccancce}"
PASS="${2:-latus4ever}"
CONF="/etc/wpa_supplicant/wpa_supplicant.conf"

echo "=== Connessione Wi-Fi a $SSID ==="

# Usa ip -br (brief) per avere un output pulito di una riga per interfaccia, 
# e cerca la prima che inizia con "wl"
IFACE=$(ip -br link | awk '$1 ~ /^wl/ {print $1; exit}')

if [ -z "$IFACE" ]; then
    IFACE="wlan0"
fi

echo "Interfaccia rilevata: $IFACE"

cat << EOT > "$CONF"
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=IT

network={
    ssid="$SSID"
    psk="$PASS"
    key_mgmt=WPA-PSK
}
EOT
chmod 600 "$CONF"

killall wpa_supplicant dhcpcd 2>/dev/null || true
sleep 1

# Tira su l'interfaccia prima di lanciare wpa_supplicant (nella foto era in stato DOWN)
ip link set "$IFACE" up
sleep 1

wpa_supplicant -B -i "$IFACE" -c "$CONF"
sleep 1
dhcpcd "$IFACE"

echo "Connesso. Indirizzo IP su $IFACE:"
ip a show dev "$IFACE"
