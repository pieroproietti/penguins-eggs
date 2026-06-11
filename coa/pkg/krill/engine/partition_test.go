package engine

import "testing"

func TestDevPart(t *testing.T) {
	cases := []struct {
		device string
		n      int
		want   string
	}{
		{"/dev/sda", 1, "/dev/sda1"},
		{"/dev/sdb", 3, "/dev/sdb3"},
		{"/dev/vda", 2, "/dev/vda2"},
		{"/dev/nvme0n1", 1, "/dev/nvme0n1p1"},
		{"/dev/mmcblk0", 2, "/dev/mmcblk0p2"},
	}
	for _, c := range cases {
		if got := devPart(c.device, c.n); got != c.want {
			t.Errorf("devPart(%q, %d) = %q, atteso %q", c.device, c.n, got, c.want)
		}
	}
}

func TestPartsForGptConSwap(t *testing.T) {
	plan := &Plan{Device: "/dev/sda", TableType: "gpt", Swap: "small"}
	l := partsFor(plan)
	if l.Esp != "/dev/sda1" || l.Swap != "/dev/sda2" || l.Root != "/dev/sda3" {
		t.Errorf("layout gpt+swap errato: %+v", l)
	}
}

func TestPartsForGptSenzaSwap(t *testing.T) {
	for _, swap := range []string{"none", "file"} {
		plan := &Plan{Device: "/dev/nvme0n1", TableType: "gpt", Swap: swap}
		l := partsFor(plan)
		if l.Esp != "/dev/nvme0n1p1" || l.Swap != "" || l.Root != "/dev/nvme0n1p2" {
			t.Errorf("layout gpt swap=%s errato: %+v", swap, l)
		}
	}
}

func TestPartsForMsdos(t *testing.T) {
	plan := &Plan{Device: "/dev/sda", TableType: "msdos", Swap: "none"}
	l := partsFor(plan)
	if l.Esp != "" || l.Swap != "" || l.Root != "/dev/sda1" {
		t.Errorf("layout msdos errato: %+v", l)
	}

	plan.Swap = "small"
	l = partsFor(plan)
	if l.Esp != "" || l.Swap != "/dev/sda1" || l.Root != "/dev/sda2" {
		t.Errorf("layout msdos+swap errato: %+v", l)
	}
}

func TestSwapSizeMiB(t *testing.T) {
	if got := swapSizeMiB("none"); got != 0 {
		t.Errorf("none = %d, atteso 0", got)
	}
	if got := swapSizeMiB("file"); got != 0 {
		t.Errorf("file = %d, atteso 0 (niente partizione)", got)
	}
	if got := swapSizeMiB("small"); got != 2048 {
		t.Errorf("small = %d, atteso 2048", got)
	}
	if got := swapSizeMiB("suspend"); got <= 0 {
		t.Errorf("suspend = %d, atteso > 0", got)
	}
}

func TestLabelFor(t *testing.T) {
	if got := labelFor("unpackfs"); got == "" {
		t.Error("labelFor(unpackfs) vuota")
	}
	if got := labelFor("shellprocess@oa_bootloader"); got != "Running oa_bootloader" {
		t.Errorf("labelFor shellprocess = %q", got)
	}
}
