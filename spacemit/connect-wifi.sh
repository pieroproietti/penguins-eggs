#!/bin/bash
SSID="${1:-proietti-armaccancce}"
PASS="${2:-latus4ever}"
CONF="/etc/wpa_supplicant/wpa_supplicant.conf"

echo "=== Connessione Wi-Fi a $SSID ==="
IFACE=$(ip link | grep -E "wlan|mlan" | head -n 1 | awk -F": " '{print $2}' | tr -d " ")
if [ -z "$IFACE" ]; then
    IFACE="wlan0"
fi

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
wpa_supplicant -B -i "$IFACE" -c "$CONF"
sleep 1
dhcpcd "$IFACE"

echo "Connesso. Indirizzo IP su $IFACE:"
ip a show dev "$IFACE"
