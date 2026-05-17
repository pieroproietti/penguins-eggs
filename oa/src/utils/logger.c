#include "oa.h"
#include <stdarg.h>

// Puntatore globale al file di log
FILE *oa_log_file = NULL;

void oa_init_log(const char *logfile) {
    oa_log_file = fopen(logfile, "a");
    if (!oa_log_file) {
        perror("Impossibile aprire il file di log");
    }
}

void oa_close_log() {
    if (oa_log_file) {
        fclose(oa_log_file);
        oa_log_file = NULL;
    }
}

void oa_log(const char *level, const char *file, int line, const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);

    // Prepariamo il messaggio formattato in un buffer sicuro
    char buffer[CMD_MAX];
    vsnprintf(buffer, sizeof(buffer), fmt, args);
    va_end(args);

    // Estraiamo solo il nome del file (rimuove il path completo per pulizia visiva)
    const char *short_file = strrchr(file, '/');
    short_file = short_file ? short_file + 1 : file;

    // 1. STAMPA SU CONSOLE (PULITA, SENZA COLORI, PERFETTA PER LA CI)
    fprintf(stdout, "[oa] [%s] %s:%d - %s\n", 
            level, short_file, line, buffer);
    fflush(stdout); // Forza lo svuotamento immediato per la CI asincrona

    // 2. STAMPA SU FILE (IDENTICA ALLA CONSOLE, TESTO PULITO)
    if (oa_log_file) {
        fprintf(oa_log_file, "[oa] [%s] %s:%d - %s\n", 
                level, short_file, line, buffer);
        fflush(oa_log_file); // Forza la scrittura immediata su disco
    }
}
