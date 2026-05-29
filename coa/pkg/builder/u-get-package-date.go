package builder

import "time"

func getPackageDate() string {
	// Il formato RFC 1123Z è quello standard per il changelog Debian
	// e molto ben tollerato dai sistemi di packaging in generale
	return time.Now().Format("Mon, 02 Jan 2006 15:04:05 -0700")
}
