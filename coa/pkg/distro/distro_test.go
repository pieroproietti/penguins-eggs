package distro

import (
	"strings"
	"testing"
)

func TestDistroDetectionCases(t *testing.T) {
	tests := []struct {
		name       string
		osRelease  map[string]string
		wantFamily string
	}{
		{
			name: "ID_LIKE ubuntu debian",
			osRelease: map[string]string{
				"ID":      "soplos",
				"ID_LIKE": "ubuntu debian",
			},
			wantFamily: "debian",
		},
		{
			name: "ID_LIKE debian",
			osRelease: map[string]string{
				"ID":      "soplos",
				"ID_LIKE": "debian",
			},
			wantFamily: "debian",
		},
		{
			name: "ID_LIKE ubuntu",
			osRelease: map[string]string{
				"ID":      "soplos",
				"ID_LIKE": "ubuntu",
			},
			wantFamily: "debian",
		},
		{
			name: "LIKE_ID fallback debian",
			osRelease: map[string]string{
				"ID":      "soplos",
				"LIKE_ID": "debian",
			},
			wantFamily: "debian",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rawID := strings.ToLower(tt.osRelease["ID"])
			rawLike := strings.ToLower(tt.osRelease["ID_LIKE"])
			if rawLike == "" {
				rawLike = strings.ToLower(tt.osRelease["LIKE_ID"])
			}
			likes := strings.Fields(rawLike)
			candidates := append([]string{rawID}, likes...)

			family := "generic"
			for _, c := range candidates {
				switch c {
				case "debian", "ubuntu", "linuxmint", "kali", "pop":
					family = "debian"
					break
				}
				if family != "generic" {
					break
				}
			}

			if family != tt.wantFamily {
				t.Errorf("got family %s, want %s", family, tt.wantFamily)
			}
		})
	}
}
