package krill

import (
	"github.com/charmbracelet/bubbles/textinput"
	"strings"
	"testing"
)

func TestCloneSkipsUserPage(t *testing.T) {
	for _, clone := range []bool{false, true} {
		m := identityModel()
		for i := range m.userInputs {
			m.userInputs[i] = textinput.New()
		}
		modules := []string{"partition", "mount", "unpackfs", "fstab", "umount"}
		if !clone {
			modules = append(modules, "users")
		}
		m.cfg.Settings.Sequence = []map[string][]string{{"exec": modules}}
		next, _ := m.advanceToUsersOrSummary()
		got := next.(model)
		want := StateUsers
		if clone {
			want = StateSummary
		}
		if got.state != want {
			t.Fatalf("clone=%t: state=%v, want %v", clone, got.state, want)
		}
		if clone {
			if got.confirmChoice != 0 {
				t.Fatal("clone bypassed confirmation")
			}
			if !strings.Contains(got.viewSummary(), "Preserve cloned users") {
				t.Fatal("summary asks for new user")
			}
			plan := got.buildPlan()
			for _, step := range plan.Exec {
				if step == "users" || step == "removeuser" || step == "displaymanager" {
					t.Fatalf("clone plan mutates accounts via %s", step)
				}
			}
		}
	}
}
