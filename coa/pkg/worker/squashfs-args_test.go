package worker

import (
	"reflect"
	"testing"
)

func TestSquashfsCompressionArgs(t *testing.T) {
	tests := []struct {
		name   string
		algo   string
		level  string
		goarch string
		want   []string
	}{
		// Unchanged behaviour on x86: same arguments as before.
		{"xz amd64", "xz", "3", "amd64", []string{"-comp", "xz", "-Xbcj", "x86", "-Xdict-size", "1M"}},
		{"xz 386", "xz", "3", "386", []string{"-comp", "xz", "-Xbcj", "x86", "-Xdict-size", "1M"}},
		// No x86 filter where it cannot help.
		{"xz arm64", "xz", "3", "arm64", []string{"-comp", "xz", "-Xdict-size", "1M"}},
		{"xz riscv64", "xz", "3", "riscv64", []string{"-comp", "xz", "-Xdict-size", "1M"}},
		// The xz level is ignored.
		{"xz ignores level", "xz", "19", "amd64", []string{"-comp", "xz", "-Xbcj", "x86", "-Xdict-size", "1M"}},
		{"zstd", "zstd", "19", "amd64", []string{"-comp", "zstd", "-Xcompression-level", "19"}},
		{"zstd arm64", "zstd", "3", "arm64", []string{"-comp", "zstd", "-Xcompression-level", "3"}},
		{"gzip", "gzip", "3", "amd64", []string{"-comp", "gzip"}},
		{"lz4", "lz4", "3", "amd64", []string{"-comp", "lz4"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := squashfsCompressionArgs(tt.algo, tt.level, tt.goarch)
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
		})
	}
}

// The dictionary can never be larger than the block: mksquashfs refuses to
// run otherwise ("-Xdict-size is larger than block_size").
func TestSquashfsDictionaryMatchesBlock(t *testing.T) {
	args := squashfsCompressionArgs("xz", "3", "amd64")
	if got := args[len(args)-1]; got != squashfsBlockSize {
		t.Fatalf("xz dictionary %q differs from block size %q", got, squashfsBlockSize)
	}
}
