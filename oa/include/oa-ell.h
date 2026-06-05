#ifndef OA_ELL_H
#define OA_ELL_H

#include "oa.h"

/**
 * @brief Esegue un comando arbitrario tramite shell (/bin/sh -c)
 * Parametri JSON:
 * - "run_command": string (il comando da eseguire)
 * - "chroot": boolean (se true, esegue dentro liveroot)
 */
int oa_ell(OA_Context *ctx);

#endif
