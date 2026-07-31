package utils

import (
	"testing"
)

func TestHasNetworkConnectivity(t *testing.T) {
	// Verifichiamo che la chiamata non generi panico o blocchi indefiniti
	_ = HasNetworkConnectivity()
}
