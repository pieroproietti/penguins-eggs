// src/engine.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include "cJSON.h"

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
        perror("[oa-engine] Errore creazione pipe");
        free(payload);
        return -1;
    }

    pid_t pid = fork();
    if (pid == -1) {
        perror("[oa-engine] Errore fork");
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

        // Eseguiamo il binario Go (coa ell). Assicurati che il path sia corretto.
        // execlp cerca "coa" nel $PATH. Se è altrove, metti il path assoluto.
        execlp("coa", "coa", "ell", NULL);

        // Se execlp fallisce, il programma arriva qui
        perror("❌ [oa-engine] Errore esecuzione 'coa ell'");
        exit(EXIT_FAILURE);
    } else {
        // --- PROCESSO PADRE (Motore C) ---
        // Chiudiamo il lato di lettura (il padre deve solo scrivere)
        close(pipefd[0]);

        // Scriviamo l'intero JSON nella pipe
        write(pipefd[1], payload, strlen(payload));
        
        // Chiudendo il lato di scrittura, mandiamo un segnale di EOF al figlio (fondamentale per fargli capire che il JSON è finito)
        close(pipefd[1]);

        // Aspettiamo che il worker Go finisca il suo lavoro
        int status;
        waitpid(pid, &status, 0);

        free(payload);

        if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
            return 0; // Successo
        } else {
            fprintf(stderr, "❌ [oa-engine] Il worker Go ha restituito un errore.\n");
            return -1;
        }
    }
}

// Il dispatcher principale (chiamato dal tuo main.c)
int dispatch_task(cJSON *task) {
    cJSON *mod_item = cJSON_GetObjectItemCaseSensitive(task, "module");
    if (!cJSON_IsString(mod_item)) {
        fprintf(stderr, "[oa-engine] Errore: 'module' mancante nel task.\n");
        return -1;
    }
    
    const char *module = mod_item->valuestring;

    if (is_native_module(module)) {
        printf("⚙️  [oa-engine] Esecuzione nativa modulo: %s\n", module);
        return run_native(module, task);
    } else {
        printf("🔀 [oa-engine] Delega modulo '%s' al worker Go...\n", module);
        return run_go_worker(task);
    }
}
