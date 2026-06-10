// src/engine.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include <errno.h>     // <--- Aggiunto per leggere il codice di errore
#include "cJSON.h"
#include "logger.h"    // <--- Aggiunto l'header del log

// Dichiariamo le funzioni esterne (che vivono in native.c)
extern int run_native(const char *module, cJSON *task);

// Helper per capire se un modulo è nativo in C
int is_native_module(const char *module) {
    if (strcmp(module, "users") == 0 || 
        strcmp(module, "umount") == 0) {
        return 1; // Vero
    }
    return 0; // Falso, è roba per Go
}

// Lancia il dispatcher Go passando il JSON tramite pipe
int run_go_worker(cJSON *task) {
    char *payload = cJSON_PrintUnformatted(task);
    if (!payload) return -1;

    int pipefd[2];
    if (pipe(pipefd) == -1) {
        // Sostituito perror con LOG_ERR + errno
        LOG_ERR("[oa-engine] Errore creazione pipe (errno: %d)", errno);
        free(payload);
        return -1;
    }

    pid_t pid = fork();
    if (pid == -1) {
        // Sostituito perror con LOG_ERR + errno
        LOG_ERR("[oa-engine] Errore fork (errno: %d)", errno);
        free(payload);
        return -1;
    }

    if (pid == 0) {
        // --- PROCESSO FIGLIO (Go Worker) ---
        // Colleghiamo l'uscita in lettura della pipe allo Standard Input (STDIN)
        dup2(pipefd[0], STDIN_FILENO);
        
        // Chiudiamo i descrittori originali della pipe (non servono più)
        close(pipefd[0]);
        close(pipefd[1]);

        // Eseguiamo il binario Go avvolto nella shell per usare 'tee'.
        // '2>&1' unisce eventuali errori (stderr) allo standard output.
        // 'tee -a' stampa a video e accoda (append) al nostro log.
        execlp("sh", "sh", "-c", "coa ell 2>&1 | tee -a /var/log/oa-tools.log", NULL);

        // Se execlp fallisce, il programma arriva qui
        LOG_ERR("❌ [oa-engine] Errore esecuzione 'coa ell' tramite sh (errno: %d)", errno);
        exit(EXIT_FAILURE);
    } else {
        // --- PROCESSO PADRE (Motore C) ---
        // Chiudiamo il lato di lettura (il padre deve solo scrivere)
        close(pipefd[0]);

        // Scriviamo l'intero JSON nella pipe
        write(pipefd[1], payload, strlen(payload));
        
        // Chiudendo il lato di scrittura, mandiamo un segnale di EOF al figlio
        close(pipefd[1]);

        // Aspettiamo che il worker Go finisca il suo lavoro
        int status;
        waitpid(pid, &status, 0);

        free(payload);

        if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
            return 0; // Successo
        } else {
            // Rimosso fprintf e \n
            LOG_ERR("❌ [oa-engine] Il worker Go ha restituito un errore.");
            return -1;
        }
    }
}

// Il dispatcher principale (chiamato dal tuo main.c)
int dispatch_task(cJSON *task) {
    cJSON *mod_item = cJSON_GetObjectItemCaseSensitive(task, "module");
    if (!cJSON_IsString(mod_item)) {
        // Rimosso fprintf e \n
        LOG_ERR("[oa-engine] Errore: 'module' mancante nel task.");
        return -1;
    }
    
    const char *module = mod_item->valuestring;

    if (is_native_module(module)) {
        // Rimosso printf e \n
        LOG_INFO("⚙️  [oa-engine] Esecuzione nativa modulo: %s", module);
        return run_native(module, task);
    } else {
        // Rimosso printf e \n
        LOG_INFO("🔀 [oa-engine] Delega modulo '%s' al worker Go...", module);
        return run_go_worker(task);
    }
}
