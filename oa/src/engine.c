#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include <errno.h>
#include "cJSON.h"
#include "logger.h"

extern int run_native(const char *module, cJSON *task);

int is_native_module(const char *module) {
    if (strcmp(module, "users") == 0 ||
        strcmp(module, "umount") == 0) {
        return 1;
    }
    return 0;
}

int run_go_worker(cJSON *task) {
    char *payload = cJSON_PrintUnformatted(task);
    if (!payload) return -1;

    int pipefd[2];
    if (pipe(pipefd) == -1) {
        LOG_ERR("[oa-engine] Pipe creation error (errno: %d)", errno);
        free(payload);
        return -1;
    }

    pid_t pid = fork();
    if (pid == -1) {
        LOG_ERR("[oa-engine] Fork error (errno: %d)", errno);
        free(payload);
        return -1;
    }

    if (pid == 0) {
        dup2(pipefd[0], STDIN_FILENO);
        close(pipefd[0]);
        close(pipefd[1]);

        execlp("sh", "sh", "-c", "coa ell 2>&1 | tee -a /var/log/penguins-eggs.log", NULL);

        LOG_ERR("❌ [oa-engine] Error executing 'coa ell' via sh (errno: %d)", errno);
        exit(EXIT_FAILURE);
    } else {
        close(pipefd[0]);
        write(pipefd[1], payload, strlen(payload));
        close(pipefd[1]);

        int status;
        waitpid(pid, &status, 0);

        free(payload);

        if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
            return 0;
        } else {
            LOG_ERR("❌ [oa-engine] The Go worker returned an error.");
            return -1;
        }
    }
}

int dispatch_task(cJSON *task) {
    cJSON *mod_item = cJSON_GetObjectItemCaseSensitive(task, "module");
    if (!cJSON_IsString(mod_item)) {
        LOG_ERR("[oa-engine] Error: 'module' field missing in the task.");
        return -1;
    }

    const char *module = mod_item->valuestring;

    if (is_native_module(module)) {
        LOG_INFO("⚙️  [oa-engine] Native module execution: %s", module);
        return run_native(module, task);
    } else {
        LOG_INFO("🔀 [oa-engine] Delegate the '%s' module to the Go worker", module);
        return run_go_worker(task);
    }
}
