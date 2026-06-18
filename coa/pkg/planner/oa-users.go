package planner

import (
	"coa/pkg/parser"
	"coa/pkg/utils"
	"fmt"
)

// oaUsers crea e restituisce i task necessari per configurare l'utente live
func oaUsers(settings parser.RemasterConfig, step parser.Step, workPath string) []OATask {
	var tasks []OATask

	// 1. Utente dinamico (fallback su "live")
	targetUser := settings.User
	if targetUser == "" {
		targetUser = "live"
	}

	// 2. Hashiamo la password in Go!
	targetPassword := hashPassword(settings.Password)

	// ... (prima parte del file inalterata) ...

	// 3. Creiamo i percorsi dinamici per la home directory
	homeDir := fmt.Sprintf("/home/%s", targetUser)
	skelCmd := fmt.Sprintf("mkdir -p %s/liveroot%s && cp -a %s/liveroot/etc/skel/. %s/liveroot%s/", workPath, homeDir, workPath, workPath, homeDir)

	// Inseriamo il primo task nella NOSTRA lista locale "tasks"
	// CORREZIONE: Usiamo Module "shell" e Params "command"
	tasks = append(tasks, OATask{
		Step: parser.Step{
			Name:        "create-live-home", // Aggiunto il nome che mancava!
			Module:      "shell",
			Description: fmt.Sprintf("Creazione home directory per l'utente %s", targetUser),
			Params: map[string]interface{}{
				"command": skelCmd,
			},
		},
	})

	usersToInject := step.Users
	if len(usersToInject) == 0 {
		// Iniettiamo l'utente on-the-fly con la password appena hashata
		usersToInject = []parser.User{
			{
				Login:    targetUser,
				Password: targetPassword,
				Home:     homeDir,
				Shell:    "/bin/bash",
				UID:      1000,
				GID:      1000,
			},
		}
	}

	mirroredGroups := utils.GetUserGroups()
	for i := range usersToInject {
		usersToInject[i].Groups = mirroredGroups
	}

	// Inseriamo il secondo task nella NOSTRA lista locale "tasks"
	// CORREZIONE: Usiamo Module "users" e spostiamo "users" dentro i Params
	tasks = append(tasks, OATask{
		Step: parser.Step{
			Name:        "inject-live-users", // Aggiunto il nome che mancava!
			Module:      "users",
			Description: fmt.Sprintf("Iniezione identità utente live (%s)", targetUser),
			Params: map[string]interface{}{
				"users": usersToInject, // Il motore C lo cercherà qui dentro!
			},
		},
		LiveRoot: getActualLiveFs(workPath),
	})

	// Restituiamo i task generati al pianificatore principale
	return tasks
}
