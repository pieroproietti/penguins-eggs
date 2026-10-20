package worker

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestBuildXorrisoArgs(t *testing.T) {
	tests := []struct {
		name         string
		params       XorrisoParams
		actualOutput string
		actualSource string
		hasIsolinux  bool
		hasEfi       bool
		wantArgs     []string
	}{
		{
			name: "Basic without bootloaders",
			params: XorrisoParams{
				Volid: "TEST_VOLID",
			},
			actualOutput: "/tmp/test.iso",
			actualSource: "/tmp/isodir",
			hasIsolinux:  false,
			hasEfi:       false,
			wantArgs: []string{
				"-as", "mkisofs",
				"-r",
				"-l",
				"-iso-level", "3",
				"-J",
				"-joliet-long",
				"-volid", "TEST_VOLID",
				"-o", "/tmp/test.iso",
				"/tmp/isodir",
			},
		},
		{
			name: "Hybrid BIOS and UEFI boot",
			params: XorrisoParams{
				Volid:       "MY_DISTRO",
				IsolinuxBin: "isolinux/isolinux.bin",
				IsolinuxCat: "isolinux/boot.cat",
				Isohdpfx:    "/tmp/isohdpfx.bin",
				EfiImg:      "EFI/BOOT/efi.img",
			},
			actualOutput: "/out/live.iso",
			actualSource: "/staging/isodir",
			hasIsolinux:  true,
			hasEfi:       true,
			wantArgs: []string{
				"-as", "mkisofs",
				"-r",
				"-l",
				"-iso-level", "3",
				"-J",
				"-joliet-long",
				"-volid", "MY_DISTRO",
				"-eltorito-boot", "isolinux/isolinux.bin",
				"-eltorito-catalog", "isolinux/boot.cat",
				"-no-emul-boot",
				"-boot-load-size", "4",
				"-boot-info-table",
				"-isohybrid-mbr", "/tmp/isohdpfx.bin",
				"-eltorito-alt-boot",
				"-e", "EFI/BOOT/efi.img",
				"-no-emul-boot",
				"-isohybrid-gpt-basdat",
				"-o", "/out/live.iso",
				"/staging/isodir",
			},
		},
		{
			name: "UEFI only boot",
			params: XorrisoParams{
				Volid:  "UEFI_DISTRO",
				EfiImg: "EFI/BOOT/efi.img",
			},
			actualOutput: "/out/uefi.iso",
			actualSource: "/staging/isodir",
			hasIsolinux:  false,
			hasEfi:       true,
			wantArgs: []string{
				"-as", "mkisofs",
				"-r",
				"-l",
				"-iso-level", "3",
				"-J",
				"-joliet-long",
				"-volid", "UEFI_DISTRO",
				"-e", "EFI/BOOT/efi.img",
				"-no-emul-boot",
				"-isohybrid-gpt-basdat",
				"-o", "/out/uefi.iso",
				"/staging/isodir",
			},
		},
		{
			name: "With ExtraArgs",
			params: XorrisoParams{
				Volid:     "CUSTOM_ISO",
				ExtraArgs: []string{"-m", "*.tmp", "--protective-msdos-label"},
			},
			actualOutput: "/out/custom.iso",
			actualSource: "/staging/isodir",
			hasIsolinux:  false,
			hasEfi:       false,
			wantArgs: []string{
				"-as", "mkisofs",
				"-r",
				"-l",
				"-iso-level", "3",
				"-J",
				"-joliet-long",
				"-volid", "CUSTOM_ISO",
				"-m", "*.tmp",
				"--protective-msdos-label",
				"-o", "/out/custom.iso",
				"/staging/isodir",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := buildXorrisoArgs(tt.params, tt.actualOutput, tt.actualSource, tt.hasIsolinux, tt.hasEfi)
			if !reflect.DeepEqual(got, tt.wantArgs) {
				t.Fatalf("got %v, want %v", got, tt.wantArgs)
			}
		})
	}
}

func TestXorrisoPayloadUnmarshal(t *testing.T) {
	payloadWithExtra := []byte(`{
		"params": {
			"output_file": "/tmp/out.iso",
			"source_dir": "/tmp/isodir",
			"volid": "TEST_ISO",
			"extra_args": ["-rational-rock", "-cache-inodes"]
		}
	}`)

	var cfg struct {
		Params XorrisoParams `json:"params"`
	}
	if err := json.Unmarshal(payloadWithExtra, &cfg); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if len(cfg.Params.ExtraArgs) != 2 || cfg.Params.ExtraArgs[0] != "-rational-rock" || cfg.Params.ExtraArgs[1] != "-cache-inodes" {
		t.Fatalf("unexpected extra_args: %v", cfg.Params.ExtraArgs)
	}

	payloadWithoutExtra := []byte(`{
		"params": {
			"output_file": "/tmp/out.iso",
			"source_dir": "/tmp/isodir"
		}
	}`)

	var cfg2 struct {
		Params XorrisoParams `json:"params"`
	}
	if err := json.Unmarshal(payloadWithoutExtra, &cfg2); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if len(cfg2.Params.ExtraArgs) != 0 {
		t.Fatalf("expected empty extra_args, got %v", cfg2.Params.ExtraArgs)
	}
}
