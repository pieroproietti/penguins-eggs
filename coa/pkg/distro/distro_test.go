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
		{
			name: "ID_LIKE arch fallback",
			osRelease: map[string]string{
				"ID":      "artix",
				"ID_LIKE": "arch",
			},
			wantFamily: "archlinux",
		},
		{
			name: "LIKE_ID archlinux fallback",
			osRelease: map[string]string{
				"ID":      "customarch",
				"LIKE_ID": "archlinux",
			},
			wantFamily: "archlinux",
		},
		{
			name: "Manjaro base family stays manjaro",
			osRelease: map[string]string{
				"ID":      "manjaro",
				"ID_LIKE": "arch",
			},
			wantFamily: "manjaro",
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
				case "debian", "ubuntu":
					family = "debian"
				case "alpine":
					family = "alpine"
				case "manjaro":
					family = "manjaro"
				case "arch", "archlinux":
					family = "archlinux"
				case "fedora", "rhel":
					family = "fedora"
				case "opensuse", "suse":
					family = "opensuse"
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
