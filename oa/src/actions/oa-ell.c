/*
 * src/actions/oa-ell.c
 * Remastering core: The Declarative-to-Imperative Bridge
 * oa: eggs in my dialect🥚🥚
 * * oa-ell.c (Il Sottocomando): Il braccio destro nativo. Richiama il package interno
 * di Go (coa ell) passandogli la singola azione tramite STDIN.
 * * Author: Piero Proietti <piero.proietti@gmail.com>
 * License: GPL-3.0-or-later
 */

#include "oa.h"
#include <sys/wait.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

/**
 * @brief Invia un task JSON al sottocomando 'coa ell' tramite Standard Input.
 */
int oa_ell(OA_Context *ctx) {
    cJSON *name_obj = cJSON_GetObjectItemCaseSensitive(ctx->task, "name");
    const char *task_name = cJSON_IsString(name_obj) ? name_obj->valuestring : "unknown_ell_action";
    
    LOG_INFO("ell Exec: Routing task [%s] to 'coa ell'", task_name);

    // 1. Risolviamo il path target come in oa_shell, ma invece di entrare
    //    nel chroot da C, iniettiamo il risultato nel JSON per il Go.
    cJSON *path_obj = cJSON_GetObjectItemCaseSensitive(ctx->task, "pathLiveFs");
    if (!path_obj) {
        path_obj = cJSON_GetObjectItemCaseSensitive(ctx->root, "pathLiveFs");
    }

    if (path_obj && cJSON_IsString(path_obj)) {
        char target_root[PATH_SAFE];
        cJSON *mode_obj = cJSON_GetObjectItemCaseSensitive(ctx->root, "mode");

        if (cJSON_IsString(mode_obj) && strcmp(mode_obj->valuestring, "install") == 0) {
            snprintf(target_root, sizeof(target_root), "%s", path_obj->valuestring);
        } else {
            snprintf(target_root, sizeof(target_root), "%s/liveroot", path_obj->valuestring);
        }
        
        // Magia dell'incapsulamento: Go troverà la chiave "resolved_target_root" pronta all'uso!
        cJSON_AddStringToObject(ctx->task, "resolved_target_root", target_root);
    }

    // 2. Estraiamo la singola azione in formato testuale (Unformatted per risparmiare overhead)
    char *json_payload = cJSON_PrintUnformatted(ctx->task);
    if (!json_payload) {
        LOG_ERR("oa_ell: Fallimento nella generazione del JSON payload.");
        return 1;
    }

    // 3. Creazione del canale di comunicazione (Pipe)
    int pfd[2];
    if (pipe(pfd) == -1) {
        perror("oa_ell pipe failed");
        free(json_payload);
        return 1;
    }

    // 4. Esecuzione fork
    pid_t pid = fork();
    if (pid < 0) {
        perror("oa_ell fork failed");
        close(pfd[0]);
        close(pfd[1]);
        free(json_payload);
        return 1;
    }

    if (pid == 0) { 
        // PROCESSO FIGLIO (L'esecutore Go)
        close(pfd[1]); // Chiude il lato scrittura, il figlio deve solo ascoltare

        // Sostituisce lo STDIN standard del processo con la nostra Pipe
        dup2(pfd[0], STDIN_FILENO);
        close(pfd[0]);

        // Evoca il binario Go
        execlp("coa", "coa", "ell", (char *)NULL);
        
        // Se arriva qui, il sistema non ha trovato 'coa' nel PATH.
        perror("oa_ell: execlp('coa ell') failed");
        _exit(1); 
    }

    // PROCESSO PADRE (Il ciclo principale C)
    close(pfd[0]); // Chiude il lato lettura

    // Inietta il payload JSON nel tubo
    ssize_t to_write = strlen(json_payload);
    if (write(pfd[1], json_payload, to_write) != to_write) {
        LOG_ERR("oa_ell: Attenzione, scrittura del payload incompleta o interrotta.");
    }
    
    // Passaggio Fondamentale: Chiudendo il lato di scrittura, si invia il segnale
    // EOF (End of File) a Go, dicendogli che il JSON è finito e può iniziare a processarlo.
    close(pfd[1]); 
    free(json_payload);

    // Rimane in attesa del codice di uscita di Go
    int status;
    waitpid(pid, &status, 0);

    int exit_code = WIFEXITED(status) ? WEXITSTATUS(status) : 1;

    if (exit_code != 0) {
        LOG_ERR("ell action [%s] failed with exit code %d", task_name, exit_code);
    } else {
        LOG_INFO("ell action [%s] completed successfully.", task_name);
    }

    return exit_code;
}