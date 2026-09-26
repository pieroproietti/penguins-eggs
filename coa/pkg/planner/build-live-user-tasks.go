package planner

import (
	"coa/pkg/parser"
	"coa/pkg/utils"
	"fmt"
)

func buildLiveUserTasks(settings parser.RemasterConfig, step parser.Step, workPath string) []OATask {
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
	// Aggiungiamo la creazione preventiva di /etc/skel a prova di Alpine!
	skelCmd := fmt.Sprintf("mkdir -p %s/liveroot/etc/skel && mkdir -p %s/liveroot%s && cp -a %s/liveroot/etc/skel/. %s/liveroot%s/",
		workPath, workPath, homeDir, workPath, workPath, homeDir)

	// Inseriamo il primo task nella NOSTRA lista locale "tasks"
	// CORREZIONE: Usiamo Module "shell" e Params "command"
	tasks = append(tasks, OATask{
		Step: parser.Step{
			Name:        "create-live-home", // Aggiunto il nome che mancava!
			Module:      "shell",
			Description: fmt.Sprintf("Creating home directory for user %s", targetUser),
			Params: map[string]interface{}{
				"command": skelCmd,
			},
		},
	})

	usersToInject := step.Users
	usingDefaultLiveUser := len(usersToInject) == 0
	if usingDefaultLiveUser {
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
			Description: fmt.Sprintf("Live user identity injection (%s)", targetUser),
			Params: map[string]interface{}{
				"users": usersToInject, // Il motore C lo cercherà qui dentro!
			},
		},
		LiveRoot: getActualLiveFs(workPath),
	})

	// 5. If root is already enabled with a real password on this distro
	// (its /etc/shadow entry has a real crypt hash, i.e. starts with '$'),
	// set it in the live copy to match the live user's own password, so
	// the ISO doesn't silently inherit the master host's root password.
	// Standard mode only (this function is never called for clone/crypted,
	// which must preserve the original host credentials as-is).
	//
	// If root is locked/disabled by default (e.g. Ubuntu-based, sudo-only
	// distros -- shadow field is empty, '*' or starts with '!'), we leave
	// it locked: this deliberately avoids enabling root login on distros
	// that don't ship it enabled.
	if usingDefaultLiveUser {
		// getActualLiveFs (not a naive workPath+"/liveroot" concatenation)
		// is required here: workPath itself can already point at the
		// liveroot directory depending on the caller, and a naive
		// concatenation would silently produce a nonexistent doubled path
		// ("…/liveroot/liveroot/etc/shadow"), making 'grep' fail and the
		// trailing '|| true' swallow the error with no visible sign that
		// root's password was never actually touched.
		shadow := fmt.Sprintf("%s/etc/shadow", getActualLiveFs(workPath))
		rootSyncCmd := fmt.Sprintf(
			"grep -q '^root:\\$' %s && sed -i 's|^root:[^:]*:|root:%s:|' %s || true",
			shadow, targetPassword, shadow,
		)
		tasks = append(tasks, OATask{
			Step: parser.Step{
				Name:        "sync-root-password",
				Module:      "shell",
				Description: "Setting live root password to match the live user's password (only if root is already password-enabled on this distro)",
				Params: map[string]interface{}{
					"command": rootSyncCmd,
				},
			},
		})
	}

	// Restituiamo i task generati al pianificatore principale
	return tasks
}
