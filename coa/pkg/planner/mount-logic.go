package planner

import (
	"coa/pkg/census"
	"coa/pkg/parser"
	"fmt"
)

func mountLogic(basePath string, isGitHubAction bool, mode string) []OATask {
	parentID := census.GetAnonymizedMachineID()
	// Puntiamo al nuovo script Bash "tuttofare"
	scriptPath := "/etc/penguins-eggs.d/scripts/bootstrap-liveroot.sh"
	cmd := fmt.Sprintf("%s %s %v %s %s", scriptPath, basePath, isGitHubAction, mode, parentID)

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
