package census

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

func TestGenerateAndValidateUUIDv4(t *testing.T) {
	id, err := generateUUIDv4()
	if err != nil {
		t.Fatalf("unexpected error generating UUID: %v", err)
	}
	if !isValidUUID(id) {
		t.Fatalf("generated UUID %q is not valid", id)
	}
	if id[14] != '4' {
		t.Errorf("expected UUID version 4, got %q", id)
	}
}

func TestDeriveUUIDFromMachineID(t *testing.T) {
	tmpDir := t.TempDir()
	midFile := filepath.Join(tmpDir, "machine-id")
	fallbackFile := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_MACHINE_ID_PATH", midFile)
	t.Setenv("EGGS_CENSUS_ID_PATH", fallbackFile)

	sampleMachineID := "a1b2c3d4e5f60123456789abcdef0123"
	if err := os.WriteFile(midFile, []byte(sampleMachineID+"\n"), 0644); err != nil {
		t.Fatalf("failed to write test machine-id: %v", err)
	}

	id1, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("unexpected error deriving UUID from machine-id: %v", err)
	}
	if !isValidUUID(id1) {
		t.Fatalf("derived UUID %q is not valid", id1)
	}
	if id1[14] != '5' {
		t.Errorf("expected deterministic UUID version 5, got %q", id1)
	}
	if id1 == sampleMachineID {
		t.Errorf("derived UUID must not expose raw machine-id")
	}

	// Must not create fallback .census_id when machine-id is valid
	if _, err := os.Stat(fallbackFile); !os.IsNotExist(err) {
		t.Errorf("fallback file %s should not be created when machine-id is valid", fallbackFile)
	}

	// Second call with uppercase/whitespace must produce the exact same UUID
	if err := os.WriteFile(midFile, []byte("  A1B2C3D4E5F60123456789ABCDEF0123 \n"), 0644); err != nil {
		t.Fatalf("failed to rewrite test machine-id: %v", err)
	}
	id2, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("unexpected error on second derivation: %v", err)
	}
	if id1 != id2 {
		t.Errorf("expected deterministic UUID %q, got %q", id1, id2)
	}

	// Different machine-id must produce a different UUID
	if err := os.WriteFile(midFile, []byte("ffffffffffffffffffffffffffffffff\n"), 0644); err != nil {
		t.Fatalf("failed to write second machine-id: %v", err)
	}
	id3, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("unexpected error on third derivation: %v", err)
	}
	if id3 == id1 {
		t.Errorf("different machine-ids should not collide: %q", id3)
	}

	// Invalid machine-id (all zeros or "uninitialized") must fall back to .census_id
	for _, invalid := range []string{"00000000000000000000000000000000", "uninitialized", "short"} {
		if isValidMachineID(invalid) {
			t.Errorf("expected isValidMachineID(%q) == false", invalid)
		}
	}
}

func TestGetOrCreateUUIDPersistence(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)

	id1, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("failed to create UUID: %v", err)
	}
	if !isValidUUID(id1) {
		t.Fatalf("invalid UUID created: %q", id1)
	}

	// Second call must return the exact same persistent UUID
	id2, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("failed to read existing UUID: %v", err)
	}
	if id1 != id2 {
		t.Errorf("expected persistent UUID %q, got %q", id1, id2)
	}
}

func TestParentIDTelemetry(t *testing.T) {
	tmpDir := t.TempDir()
	midFile := filepath.Join(tmpDir, "machine-id")
	t.Setenv("EGGS_MACHINE_ID_PATH", midFile)
	t.Setenv("EGGS_CENSUS_ID_PATH", filepath.Join(tmpDir, ".census_id"))
	t.Setenv("EGGS_CENSUS_PAYLOAD_PATH", filepath.Join(tmpDir, "census.json"))

	parentMachineID := "1111222233334444aaaabbbbccccdddd"
	if err := os.WriteFile(midFile, []byte(parentMachineID+"\n"), 0644); err != nil {
		t.Fatalf("failed to write test machine-id: %v", err)
	}

	// 1. GetAnonymizedMachineID generates valid deterministic UUID
	anonymized := GetAnonymizedMachineID()
	if !isValidUUID(anonymized) {
		t.Fatalf("expected valid UUID from GetAnonymizedMachineID, got %q", anonymized)
	}
	expectedUUID := DeriveUUIDFromMachineID(parentMachineID)
	if anonymized != expectedUUID {
		t.Errorf("expected %q, got %q", expectedUUID, anonymized)
	}

	// 2. DetectParentID from env var EGGS_PARENT_ID
	t.Setenv("EGGS_PARENT_ID", anonymized)
	if got := DetectParentID(""); got != anonymized {
		t.Errorf("expected parent ID %q from EGGS_PARENT_ID, got %q", anonymized, got)
	}
	t.Setenv("EGGS_PARENT_ID", "")

	// 3. DetectParentID from file via EGGS_PARENT_ID_PATH
	pFilePath := filepath.Join(tmpDir, "parent_id")
	_ = os.WriteFile(pFilePath, []byte(anonymized+"\n"), 0644)
	t.Setenv("EGGS_PARENT_ID_PATH", pFilePath)
	if got := DetectParentID(""); got != anonymized {
		t.Errorf("expected parent ID %q from EGGS_PARENT_ID_PATH, got %q", anonymized, got)
	}
	t.Setenv("EGGS_PARENT_ID_PATH", "")

	// 4. DetectParentIDFromSource relative to squashfs path
	liveDir := filepath.Join(tmpDir, "live")
	_ = os.MkdirAll(liveDir, 0755)
	sqPath := filepath.Join(liveDir, "filesystem.squashfs")
	_ = os.WriteFile(sqPath, []byte("fake-squashfs"), 0644)
	_ = os.WriteFile(filepath.Join(liveDir, "parent_id"), []byte(anonymized+"\n"), 0644)
	if got := DetectParentIDFromSource(sqPath); got != anonymized {
		t.Errorf("expected parent ID %q from source dir, got %q", anonymized, got)
	}

	// 5. Send with ParentID produces snake_case "parent_id" in JSON
	var receivedBody []byte
	var received Payload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, 4096)
		n, _ := r.Body.Read(buf)
		receivedBody = buf[:n]
		_ = json.Unmarshal(receivedBody, &received)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	targetRoot := filepath.Join(tmpDir, "target")
	_ = os.MkdirAll(filepath.Join(targetRoot, "etc"), 0755)

	Send(EventOptions{
		Action:      "sysinstall",
		EggsVersion: "26.10.23",
		ParentID:    anonymized,
		TargetRoot:  targetRoot,
	})

	if received.ParentID != anonymized {
		t.Errorf("expected received parent_id %q, got %q", anonymized, received.ParentID)
	}
	if !strings.Contains(string(receivedBody), `"parent_id"`) {
		t.Errorf("expected transmitted JSON to contain snake_case 'parent_id', got: %s", string(receivedBody))
	}

	// 6. Verify saveTargetPayload saved parent-id to <targetRoot>/etc/penguins-eggs.d/parent-id
	savedTargetParentID := filepath.Join(targetRoot, "etc", "penguins-eggs.d", "parent-id")
	data, err := os.ReadFile(savedTargetParentID)
	if err != nil {
		t.Fatalf("expected target parent-id file at %s: %v", savedTargetParentID, err)
	}
	if strings.TrimSpace(string(data)) != anonymized {
		t.Errorf("target parent-id mismatch: got %q, want %q", strings.TrimSpace(string(data)), anonymized)
	}
}

func TestInjectParentIDToLiveRoot(t *testing.T) {
	tmpDir := t.TempDir()
	midFile := filepath.Join(tmpDir, "machine-id")
	t.Setenv("EGGS_MACHINE_ID_PATH", midFile)
	t.Setenv("EGGS_CENSUS_ID_PATH", filepath.Join(tmpDir, ".census_id"))

	hostMachineID := "aaaa1111bbbb2222cccc3333dddd4444"
	if err := os.WriteFile(midFile, []byte(hostMachineID+"\n"), 0644); err != nil {
		t.Fatalf("failed to write test machine-id: %v", err)
	}
	expectedUUID := DeriveUUIDFromMachineID(hostMachineID)

	// Guard tests: invalid destinations must be rejected
	for _, invalidDest := range []string{"", "/", ".", "  ", " / "} {
		if _, err := InjectParentIDToLiveRoot(invalidDest); err == nil {
			t.Errorf("expected error when injecting to invalid liveRoot %q, got nil", invalidDest)
		}
	}

	// Valid liveRoot
	liveRoot := filepath.Join(tmpDir, "liveroot")
	parentID, err := InjectParentIDToLiveRoot(liveRoot)
	if err != nil {
		t.Fatalf("InjectParentIDToLiveRoot failed: %v", err)
	}
	if parentID != expectedUUID {
		t.Errorf("expected injected parentID %q, got %q", expectedUUID, parentID)
	}

	liveParentFile := filepath.Join(liveRoot, "etc", "penguins-eggs.d", "parent-id")
	data, err := os.ReadFile(liveParentFile)
	if err != nil {
		t.Fatalf("expected parent-id in liveRoot at %s: %v", liveParentFile, err)
	}
	if strings.TrimSpace(string(data)) != expectedUUID {
		t.Errorf("expected liveRoot parent-id %q, got %q", expectedUUID, strings.TrimSpace(string(data)))
	}
}

func TestLineageChainRootToDerivedRemaster(t *testing.T) {
	tmpBase := t.TempDir()

	// -------------------------------------------------------------
	// STAGE 1: Host 1 (Capostipite / Root Genesis Machine)
	// -------------------------------------------------------------
	host1Dir := filepath.Join(tmpBase, "host1")
	_ = os.MkdirAll(filepath.Join(host1Dir, "etc", "penguins-eggs.d"), 0755)
	host1MidFile := filepath.Join(host1Dir, "etc", "machine-id")
	host1Mid := "11111111222222223333333344444444"
	_ = os.WriteFile(host1MidFile, []byte(host1Mid+"\n"), 0644)
	t.Setenv("EGGS_MACHINE_ID_PATH", host1MidFile)
	t.Setenv("EGGS_CENSUS_ID_PATH", filepath.Join(host1Dir, ".census_id"))
	t.Setenv("EGGS_CENSUS_PAYLOAD_PATH", filepath.Join(host1Dir, "census.json"))
	t.Setenv("EGGS_PARENT_ID_PATH", filepath.Join(host1Dir, "etc", "penguins-eggs.d", "parent-id"))

	uuidHost1 := DeriveUUIDFromMachineID(host1Mid)

	// Mock server to inspect telemetry payloads
	var receivedPayloads []Payload
	var receivedRawBodies []string
	var mu sync.Mutex
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		buf := make([]byte, 4096)
		n, _ := r.Body.Read(buf)
		raw := string(buf[:n])
		receivedRawBodies = append(receivedRawBodies, raw)
		var p Payload
		_ = json.Unmarshal([]byte(raw), &p)
		receivedPayloads = append(receivedPayloads, p)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	// Host 1 does not have a parent (genesis machine)
	if got := DetectParentIDFromSource(""); got != "" {
		t.Errorf("expected genesis host to have empty parent-id, got %q", got)
	}

	// Host 1 runs remaster: telemetry sent
	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "26.10.24",
		ParentID:    DetectParentIDFromSource(""),
	})

	mu.Lock()
	if len(receivedPayloads) != 1 {
		t.Fatalf("expected 1 telemetry event for host1 remaster, got %d", len(receivedPayloads))
	}
	if receivedPayloads[0].UUID != uuidHost1 {
		t.Errorf("expected host1 remaster UUID %q, got %q", uuidHost1, receivedPayloads[0].UUID)
	}
	if receivedPayloads[0].ParentID != "" {
		t.Errorf("expected host1 remaster parent_id to be empty, got %q", receivedPayloads[0].ParentID)
	}
	if strings.Contains(receivedRawBodies[0], `"parent_id"`) {
		t.Errorf("expected transmitted JSON to omit empty parent_id, got: %s", receivedRawBodies[0])
	}
	mu.Unlock()

	// Host 1 injects parent-id into the new LiveRoot for ISO 1
	liveRoot1 := filepath.Join(host1Dir, "liveroot")
	injected1, err := InjectParentIDToLiveRoot(liveRoot1)
	if err != nil {
		t.Fatalf("failed injecting parent-id into liveroot1: %v", err)
	}
	if injected1 != uuidHost1 {
		t.Errorf("expected injected parent-id %q, got %q", uuidHost1, injected1)
	}

	// Verify host1's own /etc/penguins-eggs.d/parent-id was NOT created/polluted
	if _, err := os.Stat(filepath.Join(host1Dir, "etc", "penguins-eggs.d", "parent-id")); !os.IsNotExist(err) {
		t.Fatalf("host1 real filesystem must not have parent-id created during its own remaster")
	}

	// -------------------------------------------------------------
	// STAGE 2: Host 2 installs from ISO 1 (sysinstall)
	// -------------------------------------------------------------
	host2Target := filepath.Join(tmpBase, "host2_target")
	_ = os.MkdirAll(filepath.Join(host2Target, "etc", "penguins-eggs.d"), 0755)
	// Simulate stale .census_id in target to verify cleanup
	_ = os.WriteFile(filepath.Join(host2Target, "etc", "penguins-eggs.d", ".census_id"), []byte("stale-id\n"), 0644)

	// Target machine has its newly generated machine-id
	host2Mid := "22222222333333334444444455555555"
	_ = os.WriteFile(filepath.Join(host2Target, "etc", "machine-id"), []byte(host2Mid+"\n"), 0644)
	uuidHost2 := DeriveUUIDFromMachineID(host2Mid)

	// Unset custom machine ID path so getOrCreateUUIDForTarget derives directly from host2Target/etc/machine-id
	t.Setenv("EGGS_MACHINE_ID_PATH", "")
	t.Setenv("EGGS_CENSUS_ID_PATH", "")

	// Sysinstall detects parentID from the live media / liveroot of ISO 1
	liveParentFile := filepath.Join(liveRoot1, "etc", "penguins-eggs.d", "parent-id")
	detectedParent := readParentIDFromFile(liveParentFile)
	if detectedParent != uuidHost1 {
		t.Fatalf("expected detected parent from ISO1 to be %q, got %q", uuidHost1, detectedParent)
	}

	Send(EventOptions{
		Action:      "sysinstall",
		EggsVersion: "26.10.24",
		TargetRoot:  host2Target,
		ParentID:    detectedParent,
	})

	mu.Lock()
	if len(receivedPayloads) != 2 {
		t.Fatalf("expected 2 telemetry events, got %d", len(receivedPayloads))
	}
	sysinstallPayload := receivedPayloads[1]
	if sysinstallPayload.Action != "sysinstall" {
		t.Errorf("expected action 'sysinstall', got %q", sysinstallPayload.Action)
	}
	if sysinstallPayload.UUID != uuidHost2 {
		t.Errorf("expected sysinstall UUID to match host2 target machine-id %q, got %q", uuidHost2, sysinstallPayload.UUID)
	}
	if sysinstallPayload.ParentID != uuidHost1 {
		t.Errorf("expected sysinstall parent_id %q, got %q", uuidHost1, sysinstallPayload.ParentID)
	}
	if !strings.Contains(receivedRawBodies[1], `"parent_id"`) {
		t.Errorf("expected sysinstall JSON to include 'parent_id', got: %s", receivedRawBodies[1])
	}
	mu.Unlock()

	// Verify Host 2 target preserved/saved parent-id containing host1's UUID
	host2SavedParentFile := filepath.Join(host2Target, "etc", "penguins-eggs.d", "parent-id")
	savedData, err := os.ReadFile(host2SavedParentFile)
	if err != nil {
		t.Fatalf("expected host2 target to have saved parent-id at %s: %v", host2SavedParentFile, err)
	}
	if strings.TrimSpace(string(savedData)) != uuidHost1 {
		t.Errorf("host2 target parent-id mismatch: got %q, want %q", strings.TrimSpace(string(savedData)), uuidHost1)
	}
	// Verify stale .census_id was purged on target
	if _, err := os.Stat(filepath.Join(host2Target, "etc", "penguins-eggs.d", ".census_id")); !os.IsNotExist(err) {
		t.Errorf("expected stale .census_id on target to be deleted, but it still exists")
	}

	// -------------------------------------------------------------
	// STAGE 3: Host 2 derived remaster (Generation 2 Remaster)
	// -------------------------------------------------------------
	// Host 2 is now running as the active system
	t.Setenv("EGGS_MACHINE_ID_PATH", filepath.Join(host2Target, "etc", "machine-id"))
	t.Setenv("EGGS_PARENT_ID_PATH", host2SavedParentFile)

	// Derived remaster must detect Host 1 as parent
	derivedParent := DetectParentIDFromSource("")
	if derivedParent != uuidHost1 {
		t.Fatalf("derived remaster on host2 must detect parent %q, got %q", uuidHost1, derivedParent)
	}

	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "26.10.24",
		ParentID:    derivedParent,
	})

	mu.Lock()
	if len(receivedPayloads) != 3 {
		t.Fatalf("expected 3 telemetry events, got %d", len(receivedPayloads))
	}
	derivedRemasterPayload := receivedPayloads[2]
	if derivedRemasterPayload.Action != "remaster" {
		t.Errorf("expected action 'remaster', got %q", derivedRemasterPayload.Action)
	}
	if derivedRemasterPayload.UUID != uuidHost2 {
		t.Errorf("expected derived remaster UUID %q, got %q", uuidHost2, derivedRemasterPayload.UUID)
	}
	if derivedRemasterPayload.ParentID != uuidHost1 {
		t.Errorf("expected derived remaster parent_id %q, got %q", uuidHost1, derivedRemasterPayload.ParentID)
	}
	mu.Unlock()

	// Host 2 produces ISO 2: injects Host 2's own UUID as parent for ISO 2
	liveRoot2 := filepath.Join(host2Target, "liveroot2")
	injected2, err := InjectParentIDToLiveRoot(liveRoot2)
	if err != nil {
		t.Fatalf("failed injecting parent-id into liveroot2: %v", err)
	}
	if injected2 != uuidHost2 {
		t.Errorf("expected ISO 2 parent-id to be host2's UUID %q, got %q", uuidHost2, injected2)
	}

	// Crucial invariant: Host 2's own /etc/penguins-eggs.d/parent-id MUST NOT be overwritten!
	// It must still point to Host 1!
	host2OriginalParentData, err := os.ReadFile(host2SavedParentFile)
	if err != nil {
		t.Fatalf("failed reading host2 original parent file: %v", err)
	}
	if strings.TrimSpace(string(host2OriginalParentData)) != uuidHost1 {
		t.Fatalf("host2 parent-id was corrupted! Expected %q, got %q", uuidHost1, strings.TrimSpace(string(host2OriginalParentData)))
	}
}
