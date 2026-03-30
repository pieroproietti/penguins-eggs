package nixos

// nixconfig.go — structured editor for /etc/nixos/configuration.nix.
//
// Rather than a full Nix parser, this implements a targeted editor for the
// environment.systemPackages attribute list. It handles the two canonical
// forms produced by nixos-generate-config and most community templates:
//
//   Form A — with pkgs; [ ... ]
//     environment.systemPackages = with pkgs; [
//       pkgs.git
//       pkgs.vim
//     ];
//
//   Form B — explicit pkgs prefix
//     environment.systemPackages = [
//       pkgs.git
//     ];
//
// The editor preserves all whitespace, comments, and unrelated attributes.
// It does NOT attempt to parse arbitrary Nix expressions.

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

const nixConfigPath = "/etc/nixos/configuration.nix"

// nixEditor holds the parsed state of a configuration.nix file.
type nixEditor struct {
	// raw is the original file content split into lines.
	raw []string

	// listStart is the index of the line containing "environment.systemPackages".
	listStart int

	// listEnd is the index of the line containing the closing "];".
	listEnd int

	// withPkgs is true when the list uses "with pkgs;" syntax.
	withPkgs bool
}

var (
	// reListOpen matches the opening of environment.systemPackages.
	reListOpen = regexp.MustCompile(`^\s*environment\.systemPackages\s*=`)

	// rePkgEntry matches a package entry line (with or without pkgs. prefix).
	rePkgEntry = regexp.MustCompile(`^\s*(pkgs\.)?(\S+)\s*$`)
)

// parseNixConfig reads and parses configPath into a nixEditor.
func parseNixConfig(configPath string) (*nixEditor, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("nixconfig: read %s: %w", configPath, err)
	}

	lines := strings.Split(string(data), "\n")
	ed := &nixEditor{raw: lines, listStart: -1, listEnd: -1}

	inList := false
	depth := 0

	for i, line := range lines {
		if !inList && reListOpen.MatchString(line) {
			ed.listStart = i
			ed.withPkgs = strings.Contains(line, "with pkgs")
			inList = true
			depth = strings.Count(line, "[") - strings.Count(line, "]")
			if depth <= 0 {
				// Single-line list — not supported for editing.
				return nil, fmt.Errorf(
					"nixconfig: single-line environment.systemPackages not supported")
			}
			continue
		}
		if inList {
			depth += strings.Count(line, "[") - strings.Count(line, "]")
			if depth <= 0 {
				ed.listEnd = i
				break
			}
		}
	}

	if ed.listStart == -1 {
		return nil, fmt.Errorf(
			"nixconfig: environment.systemPackages not found in %s", configPath)
	}
	if ed.listEnd == -1 {
		return nil, fmt.Errorf(
			"nixconfig: unclosed environment.systemPackages list in %s", configPath)
	}

	return ed, nil
}

// packages returns the current package names in the list (without pkgs. prefix).
func (ed *nixEditor) packages() []string {
	var pkgs []string
	for i := ed.listStart + 1; i < ed.listEnd; i++ {
		line := strings.TrimSpace(ed.raw[i])
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		m := rePkgEntry.FindStringSubmatch(line)
		if m != nil {
			pkgs = append(pkgs, m[2])
		}
	}
	return pkgs
}

// addPackage inserts pkg into the list if not already present.
// Returns true if the list was modified.
func (ed *nixEditor) addPackage(pkg string) bool {
	for _, existing := range ed.packages() {
		if existing == pkg {
			return false
		}
	}
	// Determine indentation from existing entries, defaulting to 4 spaces.
	indent := "    "
	for i := ed.listStart + 1; i < ed.listEnd; i++ {
		line := ed.raw[i]
		trimmed := strings.TrimSpace(line)
		if trimmed != "" && !strings.HasPrefix(trimmed, "#") {
			// Measure leading whitespace.
			indent = line[:len(line)-len(strings.TrimLeft(line, " \t"))]
			break
		}
	}

	entry := indent + pkgEntry(pkg, ed.withPkgs)

	// Insert before the closing ];
	newLines := make([]string, 0, len(ed.raw)+1)
	newLines = append(newLines, ed.raw[:ed.listEnd]...)
	newLines = append(newLines, entry)
	newLines = append(newLines, ed.raw[ed.listEnd:]...)
	ed.raw = newLines
	ed.listEnd++ // closing line shifted down by one
	return true
}

// removePackage removes pkg from the list.
// Returns true if the list was modified.
func (ed *nixEditor) removePackage(pkg string) bool {
	modified := false
	newLines := make([]string, 0, len(ed.raw))
	for i, line := range ed.raw {
		if i > ed.listStart && i < ed.listEnd {
			trimmed := strings.TrimSpace(line)
			m := rePkgEntry.FindStringSubmatch(trimmed)
			if m != nil && m[2] == pkg {
				ed.listEnd-- // closing line shifts up
				modified = true
				continue
			}
		}
		newLines = append(newLines, line)
	}
	ed.raw = newLines
	return modified
}

// write serialises the edited content back to configPath atomically.
func (ed *nixEditor) write(configPath string) error {
	content := strings.Join(ed.raw, "\n")
	tmp := configPath + ".ilf.tmp"
	if err := os.WriteFile(tmp, []byte(content), 0o644); err != nil {
		return fmt.Errorf("nixconfig: write tmp: %w", err)
	}
	if err := os.Rename(tmp, configPath); err != nil {
		_ = os.Remove(tmp)
		return fmt.Errorf("nixconfig: rename: %w", err)
	}
	return nil
}

// pkgEntry returns the formatted package entry for a given name.
func pkgEntry(name string, withPkgs bool) string {
	if withPkgs {
		// Inside "with pkgs; [ ... ]" the bare name is sufficient.
		return name
	}
	return "pkgs." + name
}

// EditNixConfig adds or removes packages from environment.systemPackages in
// configPath. It is the exported entry point used by PkgAdd / PkgRemove.
func EditNixConfig(configPath string, packages []string, add bool) error {
	ed, err := parseNixConfig(configPath)
	if err != nil {
		return err
	}

	changed := false
	for _, pkg := range packages {
		// Strip any leading "pkgs." the caller may have included.
		name := strings.TrimPrefix(pkg, "pkgs.")
		if add {
			if ed.addPackage(name) {
				changed = true
			}
		} else {
			if ed.removePackage(name) {
				changed = true
			}
		}
	}

	if !changed {
		return nil
	}

	return ed.write(configPath)
}
