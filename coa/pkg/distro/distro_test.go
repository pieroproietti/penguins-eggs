package distro

import (
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
		{
			name:       "Manjaro derivative via ID_LIKE",
			osRelease:  map[string]string{"ID": "custom-manjaro", "ID_LIKE": "manjaro arch"},
			wantFamily: "manjaro",
		},
		{
			name:       "Manjaro derivative via LIKE_ID fallback",
			osRelease:  map[string]string{"ID": "custom-manjaro", "LIKE_ID": "manjaro arch"},
			wantFamily: "manjaro",
		},
		{
			name:       "BigLinux matches the brain module even with Arch ancestry",
			osRelease:  map[string]string{"ID": "biglinux", "ID_LIKE": "arch"},
			wantFamily: "manjaro",
		},
		{
			name:       "BigCommunity without ID_LIKE",
			osRelease:  map[string]string{"ID": "bigcommunity"},
			wantFamily: "manjaro",
		},
		{
			name:       "BigLinux derivative",
			osRelease:  map[string]string{"ID": "custom-biglinux", "ID_LIKE": "biglinux manjaro arch"},
			wantFamily: "manjaro",
		},
		{
			name: "Garuda explicit detection",
			osRelease: map[string]string{
				"ID":      "garuda",
				"ID_LIKE": "arch",
			},
			wantFamily: "archlinux",
		},
		{
			name: "Garuda without ID_LIKE",
			osRelease: map[string]string{
				"ID": "garuda",
			},
			wantFamily: "archlinux",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			family := fromOSRelease(tt.osRelease).FamilyID

			if family != tt.wantFamily {
				t.Errorf("got family %s, want %s", family, tt.wantFamily)
			}
		})
	}
}
