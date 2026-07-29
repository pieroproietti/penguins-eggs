package parser

import (
	"testing"
)

func TestDetectAndLoad(t *testing.T) {
	profile, err := DetectAndLoad(false)
	if err != nil {
		t.Fatalf("DetectAndLoad failed: %v", err)
	}

	if len(profile.Remaster) == 0 {
		t.Errorf("expected non-empty remaster steps in profile")
	}

	if len(profile.Install) == 0 {
		t.Errorf("expected non-empty install steps in profile")
	}
}
