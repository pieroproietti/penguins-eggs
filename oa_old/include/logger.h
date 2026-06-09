#ifndef OA_LOGGER_H
#define OA_LOGGER_H

#include <stdio.h>

// Prototipi delle funzioni
void oa_init_log(const char *logfile);
void oa_close_log(void);
void oa_log(const char *level, const char *file, int line, const char *fmt, ...);

// Macro di comodità (aggiungono automaticamente file e linea!)
#define LOG_INFO(...)  oa_log("INFO",  __FILE__, __LINE__, __VA_ARGS__)
#define LOG_WARN(...)  oa_log("WARN",  __FILE__, __LINE__, __VA_ARGS__)
#define LOG_ERR(...)   oa_log("ERROR", __FILE__, __LINE__, __VA_ARGS__)

#endif // OA_LOGGER_H
