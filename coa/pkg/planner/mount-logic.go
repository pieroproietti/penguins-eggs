package planner

import (
	"coa/pkg/parser"
	"fmt"
)

func mountLogic(basePath string, isGitHubAction bool) []OATask {
	// Puntiamo al nuovo script Bash "tuttofare"
	scriptPath := "/etc/oa-tools.d/scripts/bootstrap-liveroot.sh"
	cmd := fmt.Sprintf("%s %s %v", scriptPath, basePath, isGitHubAction)

	// Ritorna un singolo task moderno di tipo "shell"
	return []OATask{
		{
			Step: parser.Step{
				Module: "shell",
				Name:   "Bootstrap ambiente liveroot",
				Params: map[string]interface{}{
					"command": cmd,
				},
			},
		},
	}
}
