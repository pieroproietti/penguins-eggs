// Copyright 2026 Piero Proietti <piero.proietti@gmail.com>.
// All rights reserved.

package utils

import (
	"net"
	"time"
)

// HasNetworkConnectivity verifica se è presente una connessione di rete/internet attiva
// provando a connettersi via TCP ai resolver DNS pubblici (8.8.8.8, 1.1.1.1, 9.9.9.9) sulla porta 53.
func HasNetworkConnectivity() bool {
	endpoints := []string{"8.8.8.8:53", "1.1.1.1:53", "9.9.9.9:53"}
	for _, endpoint := range endpoints {
		conn, err := net.DialTimeout("tcp", endpoint, 2*time.Second)
		if err == nil {
			conn.Close()
			return true
		}
	}
	return false
}
