/*
 * src/actions/oa-ell.c
 * Remastering core: The Declarative-to-Imperative Bridge
 */

#include "oa.h"
#include <sys/wait.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

/**
 * @brief Invia un task JSON al sottocomando 'coa ell' tramite Standard Input,
 * iniettando dinamicamente il resolved_target_root per le operazioni in chroot.
 */
int oa_ell(OA_Context *ctx) {
    cJSON *name_obj = cJSON_GetObjectItemCaseSensitive(ctx->task, "name");
    const char *task_name = cJSON_IsString(name_obj) ? name_obj->valuestring : "unknown_ell_action";
    
    LOG_INFO("ell Exec: Routing task [%s] to 'coa ell'", task_name);

    // ==========================================
    // FIX: Cerca prima nel task, poi nella root!
    // ==========================================
    cJSON *path_obj = cJSON_GetObjectItemCaseSensitive(ctx->task, "LiveRoot");
    if (!path_obj) {
        path_obj = cJSON_GetObjectItemCaseSensitive(ctx->root, "LiveRoot");
    }
    
    // 2. Controllo se il task richiede chroot
    cJSON *chroot_obj = cJSON_GetObjectItemCaseSensitive(ctx->task, "chroot");
    int needs_chroot = cJSON_IsBool(chroot_obj) && cJSON_IsTrue(chroot_obj);

    if (needs_chroot) {
        if (!path_obj || !cJSON_IsString(path_obj)) {
            LOG_ERR("oa_ell: Task [%s] richiede chroot ma 'LiveRoot' non è impostato né nel task né globale!", task_name);
            return 1;
        }

        char target_root[PATH_SAFE];
        cJSON *mode_obj = cJSON_GetObjectItemCaseSensitive(ctx->root, "mode");

        // Logica difensiva per la costruzione del path
        if (cJSON_IsString(mode_obj) && strcmp(mode_obj->valuestring, "install") == 0) {
            snprintf(target_root, sizeof(target_root), "%s", path_obj->valuestring);
        } else {
            if (strstr(path_obj->valuestring, "/liveroot") != NULL) {
                snprintf(target_root, sizeof(target_root), "%s", path_obj->valuestring);
            } else {
                snprintf(target_root, sizeof(target_root), "%s/liveroot", path_obj->valuestring);
            }
        }
        
        cJSON_AddStringToObject(ctx->task, "resolved_target_root", target_root);
        LOG_INFO("oa_ell: Chroot rilevato, target_root iniettato: %s", target_root);
    }
    
    // 3. Serializzazione
    char *json_payload = cJSON_PrintUnformatted(ctx->task);
    if (!json_payload) {
        LOG_ERR("oa_ell: Fallimento nella generazione del JSON payload.");
        return 1;
    }

    // 4. Comunicazione via Pipe
    int pfd[2];
    if (pipe(pfd) == -1) {
        perror("oa_ell pipe failed");
        free(json_payload);
        return 1;
    }

    pid_t pid = fork();
    if (pid < 0) {
        perror("oa_ell fork failed");
        close(pfd[0]);
        close(pfd[1]);
        free(json_payload);
        return 1;
    }

    if (pid == 0) { // PROCESSO FIGLIO
        close(pfd[1]);
        dup2(pfd[0], STDIN_FILENO);
        close(pfd[0]);

        extern char **environ;
        execle("/usr/bin/coa", "coa", "ell", (char *)NULL, environ);
        
        perror("oa_ell: execle('/usr/bin/coa ell') failed");
        _exit(1);
    }

    // PROCESSO PADRE
    close(pfd[0]);
    ssize_t to_write = strlen(json_payload);
    if (write(pfd[1], json_payload, to_write) != to_write) {
        LOG_ERR("oa_ell: Scrittura payload incompleta.");
    }
    close(pfd[1]);
    free(json_payload);

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
