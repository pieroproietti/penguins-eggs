#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include "logger.h"

#ifndef CMD_MAX
#define CMD_MAX 4096
#endif

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
    (void)level;
    (void)file;
    (void)line;

    va_list args;
    va_start(args, fmt);

    char buffer[CMD_MAX];
    vsnprintf(buffer, sizeof(buffer), fmt, args);
    va_end(args);

    fprintf(stdout, "%s\n", buffer);
    fflush(stdout);

    if (oa_log_file) {
        fprintf(oa_log_file, "%s\n", buffer);
        fflush(oa_log_file);
    }
}
