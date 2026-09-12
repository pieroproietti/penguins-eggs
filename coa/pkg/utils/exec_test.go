package utils

import "testing"

func TestExecCaptureWaitsForOutput(t *testing.T) {
	want := "c12a7328-f81f-11d2-ba4b-00a0c93ec93b vfat\n"
	out, err := ExecCapture("printf '%s\\n' 'c12a7328-f81f-11d2-ba4b-00a0c93ec93b vfat'")
	if err != nil {
		t.Fatal(err)
	}
	if out != want {
		t.Fatalf("output = %q, want %q", out, want)
	}
}

func TestExecCapturePreservesFailureAndOutput(t *testing.T) {
	out, err := ExecCapture("printf 'partial'; exit 7")
	if err == nil || out != "partial" {
		t.Fatalf("output = %q, error = %v", out, err)
	}
}
