package utils

import "os"

// IsLive returns true when running on a live system.
func IsLive() bool {
	liveDirs := []string{
		"/run/live/medium",
		"/lib/live/mount/medium",
		"/run/archiso/bootmnt",
		"/run/miso/bootmnt",
		"/run/initramfs/live",
	}
	for _, d := range liveDirs {
		if info, err := os.Stat(d); err == nil && info.IsDir() {
			return true
		}
	}
	return false
}
