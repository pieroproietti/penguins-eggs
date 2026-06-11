package engine

import "testing"

func TestMaskToPrefix(t *testing.T) {
	cases := []struct {
		mask string
		want int
	}{
		{"255.255.255.0", 24},
		{"255.255.0.0", 16},
		{"255.0.0.0", 8},
		{"255.255.255.128", 25},
		{"255.255.255.252", 30},
		{"", 24},        // fallback
		{"junk", 24},    // fallback
		{"1.2.3.4", 24}, // non è una netmask valida
	}
	for _, c := range cases {
		if got := maskToPrefix(c.mask); got != c.want {
			t.Errorf("maskToPrefix(%q) = %d, atteso %d", c.mask, got, c.want)
		}
	}
}
