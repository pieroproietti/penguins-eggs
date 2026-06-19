#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include "logger.h"

// Se CMD_MAX non è definito altrove, definiscilo qui o usa un numero fisso (es. 4096)
#ifndef CMD_MAX
#define CMD_MAX 4096
#endif

// Puntatore globale al file di log
FILE *oa_log_file = NULL;

void oa_init_log(const char *logfile) {
    oa_log_file = fopen(logfile, "a");
    if (!oa_log_file) {
        perror("Unable to open the log file");
    }
}

void oa_close_log() {
    if (oa_log_file) {
        fclose(oa_log_file);
        oa_log_file = NULL;
    }
}

void oa_log(const char *level, const char *file, int line, const char *fmt, ...) {
    // Silenziamo i warning del compilatore per le variabili non più usate nella stampa
    (void)level;
    (void)file;
    (void)line;

    va_list args;
    va_start(args, fmt);

    // Prepariamo il messaggio formattato in un buffer sicuro
    char buffer[CMD_MAX];
    vsnprintf(buffer, sizeof(buffer), fmt, args);
    va_end(args);

    // 1. STAMPA SU CONSOLE (SOLO IL MESSAGGIO NUDO E CRUDO)
    fprintf(stdout, "%s\n", buffer);
    fflush(stdout); // Forza lo svuotamento immediato

    // 2. STAMPA SU FILE (SOLO IL MESSAGGIO NUDO E CRUDO)
    if (oa_log_file) {
        fprintf(oa_log_file, "%s\n", buffer);
        fflush(oa_log_file); // Forza la scrittura immediata su disco
    }
}

