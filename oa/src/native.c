// src/native.c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/mount.h> // Per umount2 e MNT_DETACH
#include <unistd.h>
#include <errno.h>
#include <crypt.h>

#include "cJSON.h"
#include "oa-yocto.h"

#ifndef PATH_SAFE
#define PATH_SAFE 4096
#endif

// ==========================================
// 1. PROTOTIPI (Forward Declarations)
// ==========================================
int run_native_users(cJSON *task);
int run_native_umount(cJSON *task);
static const char* get_json_string(cJSON *obj, const char *key, const char *fallback);

// ==========================================
// 2. HELPER INTERNI
// ==========================================
static const char* get_json_string(cJSON *obj, const char *key, const char *fallback) {
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsString(item) && (item->valuestring != NULL)) {
        return item->valuestring;
    }
    return fallback;
}

// ==========================================
// 3. IMPLEMENTAZIONI DEI MODULI
// ==========================================

int run_native_users(cJSON *task) {
    cJSON *params = cJSON_GetObjectItemCaseSensitive(task, "params");
    if (!params) {
        fprintf(stderr, "[oa-native] Errore: 'params' mancante in users.\n");
        return -1;
    }

    const char *mode = get_json_string(params, "mode", "standard");
    const char *resolved_root = get_json_string(task, "live_root", "");
    //const char *resolved_root = get_json_string(task, "resolved_target_root", "");

    if (strlen(resolved_root) == 0) {
        fprintf(stderr, "[oa-native] Errore: 'resolved_target_root' mancante.\n");
        return -1;
    }

    char p_path[PATH_SAFE], s_path[PATH_SAFE], g_path[PATH_SAFE];
    snprintf(p_path, sizeof(p_path), "%s/etc/passwd", resolved_root);
    snprintf(s_path, sizeof(s_path), "%s/etc/shadow", resolved_root);
    snprintf(g_path, sizeof(g_path), "%s/etc/group", resolved_root);

    printf("👤 [oa-native] Gestione utenti (Mode: %s) su root: %s\n", mode, resolved_root);

    if (strcmp(mode, "clone") != 0 && strcmp(mode, "crypted") != 0) {
        printf("   -> Pulizia utenti host (sanitize)...\n");
        yocto_sanitize_file(p_path, OE_UID_HUMAN_MIN, OE_UID_HUMAN_MAX);
        yocto_sanitize_shadow(s_path, p_path);
        yocto_sanitize_file(g_path, OE_UID_HUMAN_MIN, OE_UID_HUMAN_MAX);
    }

    cJSON *users_array = cJSON_GetObjectItemCaseSensitive(params, "users");
    if (cJSON_IsArray(users_array)) {
        FILE *fp = fopen(p_path, "a");
        FILE *fs = fopen(s_path, "a");
        
        if (!fp || !fs) { 
            fprintf(stderr, "[oa-native] Errore fatale: Impossibile aprire i DB in %s/etc/\n", resolved_root);
            if(fp) fclose(fp); 
            if(fs) fclose(fs); 
            return -1;
        }

        cJSON *u;
        cJSON_ArrayForEach(u, users_array) {
            const char *login = get_json_string(u, "login", "");
            const char *pass  = get_json_string(u, "password", "");
            const char *home  = get_json_string(u, "home", "/home/live");
            
            if (strlen(login) == 0) continue;

            printf("   -> Iniezione utente: '%s' home='%s'\n", login, home);

            char *final_pass = (char *)pass;
            if (strlen(pass) > 0 && pass[0] != '$') {
                final_pass = crypt(pass, "$6$oa$");
            }

            yocto_write_passwd(fp, login, OE_UID_HUMAN_MIN, OE_UID_HUMAN_MIN, "live,,,", home, "/bin/bash");
            yocto_write_shadow(fs, login, final_pass);

            FILE *fg = fopen(g_path, "a");
            if (fg) {
                fprintf(fg, "%s:x:%d:\n", login, OE_UID_HUMAN_MIN);
                fclose(fg);
            } else {
                fprintf(stderr, "      [!] Impossibile creare gruppo primario.\n");
            }

            cJSON *groups_obj = cJSON_GetObjectItemCaseSensitive(u, "groups");
            if (cJSON_IsArray(groups_obj)) {
                printf("   -> Aggiunta a gruppi secondari...\n");
                yocto_add_user_to_groups(g_path, login, groups_obj);
            }

            char full_home[PATH_SAFE];
            snprintf(full_home, sizeof(full_home), "%s%s", resolved_root, home);
            
            if (mkdir(full_home, 0755) != 0 && errno != EEXIST) {
                fprintf(stderr, "      [!] Warning: mkdir fallita per %s (errno: %d)\n", full_home, errno);
            }

            char home_cmd[PATH_SAFE * 2];
            snprintf(home_cmd, sizeof(home_cmd), 
                     "cp -a %s/etc/skel/. %s/ 2>/dev/null || true && chown -R %d:%d %s", 
                     resolved_root, full_home, OE_UID_HUMAN_MIN, OE_UID_HUMAN_MIN, full_home);
            
            if (system(home_cmd) != 0) {
                fprintf(stderr, "      [!] Errore setup home per '%s'\n", login);
            }
        }
        fclose(fp);
        fclose(fs);
    }
    
    printf("✅ [oa-native] Utenti configurati con successo.\n");
    return 0;
}

int run_native_umount(cJSON *task) {
    // Ora leggiamo "work_dir" (es. /home/eggs) invece di "live_root"
    const char *work_dir = get_json_string(task, "work_dir", "");
    if (strlen(work_dir) == 0) {
        fprintf(stderr, "❌ [oa-native] Errore: 'work_dir' mancante per il cleanup.\n");
        return 1;
    }

    char path[4096];

    // 1. Smontiamo le API di sistema in liveroot
    const char *api_mounts[] = {"dev/pts", "dev", "proc", "sys", "run", "tmp"};
    for (int i = 0; i < 6; i++) {
        snprintf(path, sizeof(path), "%s/liveroot/%s", work_dir, api_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 2. Smontiamo gli overlay uniti in liveroot
    const char *ovl_mounts[] = {"usr", "var"};
    for (int i = 0; i < 2; i++) {
        snprintf(path, sizeof(path), "%s/liveroot/%s", work_dir, ovl_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 3. Smontiamo i bind mount standard in liveroot
    const char *bind_mounts[] = {"opt", "root", "srv"};
    for (int i = 0; i < 3; i++) {
        snprintf(path, sizeof(path), "%s/liveroot/%s", work_dir, bind_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 4. Smontiamo i lowerdir dentro .overlay
    for (int i = 0; i < 2; i++) {
        snprintf(path, sizeof(path), "%s/.overlay/lowerdir/%s", work_dir, ovl_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 5. Infine, smontiamo la liveroot stessa se necessario
    snprintf(path, sizeof(path), "%s/liveroot", work_dir);
    umount2(path, MNT_DETACH);

    printf("✅ [oa-native] Smontaggio di sicurezza completato per: %s\n", work_dir);
    return 0;
}

// ==========================================
// 4. DISPATCHER NATIVO
// ==========================================
int run_native(const char *module, cJSON *task) {
    if (strcmp(module, "users") == 0) {
        return run_native_users(task);
    }
    
    if (strcmp(module, "umount") == 0) {
        return run_native_umount(task);
    }

    fprintf(stderr, "❌ [oa-native] Modulo nativo sconosciuto in C: %s\n", module);
    return -1;
}
