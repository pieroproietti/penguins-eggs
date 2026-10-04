package worker

// squashfsBlockSize is the data block size used for every compressor. 1M is
// the largest block mksquashfs accepts, so it gives the best ratio.
const squashfsBlockSize = "1M"

// squashfsCompressionArgs returns the mksquashfs arguments that select the
// compressor and set it up for the best ratio it can give.
//
// goarch is the architecture of the system being squashed (runtime.GOARCH).
func squashfsCompressionArgs(algo, level, goarch string) []string {
	switch algo {
	case "zstd":
		return []string{"-comp", "zstd", "-Xcompression-level", level}
	case "xz":
		// mksquashfs fixes the xz preset internally and exposes no level, so
		// this is the most it can do: the dictionary size is capped by the
		// block size (squashfsBlockSize, itself the maximum), plus the BCJ
		// filter when it can help.
		args := []string{"-comp", "xz"}
		if bcj := xzBcjFilter(goarch); bcj != "" {
			args = append(args, "-Xbcj", bcj)
		}
		return append(args, "-Xdict-size", squashfsBlockSize)
	case "gzip":
		return []string{"-comp", "gzip"}
	default:
		return []string{"-comp", algo}
	}
}

// xzBcjFilter returns the value for mksquashfs -Xbcj on the given
// architecture, or "" when no filter should be used.
//
// The x86 filter pre-processes x86/x86_64 machine code and improves the ratio
// by several percent. On any other architecture it finds nothing to convert,
// but mksquashfs still compresses every block twice (with and without the
// filter) to pick the best one, which doubles the compression time for the
// same output.
func xzBcjFilter(goarch string) string {
	switch goarch {
	case "amd64", "386":
		return "x86"
	default:
		return ""
	}
}
