package census

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"runtime"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/parser"
)

// ShouldSkip evaluates all privacy and opt-out rules:
// 1. Explicit --anonymous flag
// 2. Global opt-out via EGGS_ANONYMOUS environment variable
// 3. Global opt-out via custom.yaml configuration
func ShouldSkip(anonymousFlag bool) bool {
	if anonymousFlag {
		return true
	}

	envVal := strings.TrimSpace(strings.ToLower(os.Getenv("EGGS_ANONYMOUS")))
	if envVal == "1" || envVal == "true" || envVal == "yes" {
		return true
	}

	if cfg, err := parser.LoadCustomSettings(); err == nil && cfg != nil {
		if cfg.Anonymous || cfg.Remaster.Anonymous {
			return true
		}
	}

	return false
}

// Send dispatches the census telemetry with a strict timeout.
// It fails completely silently on any error and never alters CLI exit behavior.
func Send(opts EventOptions) {
	defer func() {
		_ = recover()
	}()

	if ShouldSkip(opts.Anonymous) {
		return
	}

	if opts.EggsVersion == "" {
		opts.EggsVersion = strings.TrimSpace(os.Getenv("EGGS_VERSION"))
	}
	opts.EggsVersion = strings.TrimSpace(strings.TrimPrefix(opts.EggsVersion, "penguins-eggs "))

	targetRoot := resolveTargetRoot(opts.TargetRoot, opts.Action)

	uuid, err := getOrCreateUUIDForTarget(targetRoot)
	if err != nil || uuid == "" {
		return
	}

	payload := BuildPayload(uuid, opts)
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), DefaultTimeout)
	defer cancel()

	saveDone := make(chan struct{})
	go func() {
		defer close(saveDone)
		defer func() {
			_ = recover()
		}()
		saveLocalPayload(data)
		if targetRoot != "" {
			saveTargetPayload(data, targetRoot, opts.TargetUser)
		}
	}()

	httpDone := make(chan struct{})
	go func() {
		defer close(httpDone)
		defer func() {
			_ = recover()
		}()

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, Endpoint, bytes.NewReader(data))
		if err != nil {
			return
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "penguins-eggs/"+opts.EggsVersion)

		client := &http.Client{
			Timeout: DefaultTimeout,
		}
		resp, err := client.Do(req)
		if err != nil {
			return
		}
		defer resp.Body.Close()
		_, _ = io.Copy(io.Discard, resp.Body)
	}()

	select {
	case <-saveDone:
	case <-ctx.Done():
	}

	select {
	case <-httpDone:
	case <-ctx.Done():
	}
}

// BuildPayload constructs the Payload from the current system and EventOptions.
func BuildPayload(uuid string, opts EventOptions) Payload {
	d := opts.Distro
	if d == nil {
		d = distro.NewDistro()
	}

	arch := d.Arch
	if arch == "" {
		arch = runtime.GOARCH
	}

	parentID := strings.TrimSpace(opts.ParentID)
	if parentID == "" {
		parentID = DetectParentID(opts.TargetRoot)
	}
	if parentID == "" {
		parentID = DetectParentIDFromSource("")
	}

	return Payload{
		UUID:        uuid,
		ParentID:    parentID,
		EggsVersion: opts.EggsVersion,
		Action:      opts.Action,
		Distro: DistroInfo{
			ID:       strings.ToLower(d.DistroID),
			Like:     strings.ToLower(d.DistroLike),
			Codename: strings.ToLower(d.CodenameID),
			Release:  d.ReleaseID,
		},
		System: SystemInfo{
			Arch:          arch,
			Desktop:       detectDesktop(),
			DisplayServer: detectDisplayServer(),
			Virt:          detectVirt(),
			Init:          detectInit(),
		},
		Options: OptionsInfo{
			Clone: opts.Clone,
		},
	}
}
