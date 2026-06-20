// src/native.c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/mount.h> // Per umount2 e MNT_DETACH
#include <sys/wait.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <crypt.h>
#include <time.h>

#include "cJSON.h"
#include "logger.h"
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

// Genera un salt random per crypt() leggendo da /dev/urandom.
// Formato risultante: "$6$<16 chars random>$"
static void generate_salt(char *buf, size_t buf_size) {
    static const char salt_chars[] =
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "0123456789./";
    const int salt_len = 16;

    // Prefisso SHA-512
    snprintf(buf, buf_size, "$6$");
    size_t offset = 3;

    int fd = open("/dev/urandom", O_RDONLY);
    if (fd >= 0) {
        unsigned char rnd[16];
        if (read(fd, rnd, sizeof(rnd)) == sizeof(rnd)) {
            for (int i = 0; i < salt_len && offset + 1 < buf_size; i++) {
                buf[offset++] = salt_chars[rnd[i] % (sizeof(salt_chars) - 1)];
            }
        }
        close(fd);
    }

    // Fallback se /dev/urandom non funziona (non dovrebbe mai accadere)
    if (offset == 3) {
        srand((unsigned)getpid() ^ (unsigned)time(NULL));
        for (int i = 0; i < salt_len && offset + 1 < buf_size; i++) {
            buf[offset++] = salt_chars[rand() % (sizeof(salt_chars) - 1)];
        }
    }

    if (offset + 1 < buf_size) {
        buf[offset++] = '$';
    }
    buf[offset] = '\0';
}

static int run_exec(char *const argv[]) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        execvp(argv[0], argv);
        _exit(127);
    }
    int status;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

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
        // CORRETTO: rimosso stderr e \n
        LOG_ERR("[oa-native] Error: ‘params’ missing in users.");
        return -1;
    }

    const char *mode = get_json_string(params, "mode", "standard");
    const char *resolved_root = get_json_string(task, "live_root", "");

    if (strlen(resolved_root) == 0) {
        LOG_ERR("[oa-native] Error: ‘live_root’ is missing.");
        return -1;
    }

    char p_path[PATH_SAFE], s_path[PATH_SAFE], g_path[PATH_SAFE];
    char gs_path[PATH_SAFE], subuid_path[PATH_SAFE], subgid_path[PATH_SAFE];
    snprintf(p_path, sizeof(p_path), "%s/etc/passwd", resolved_root);
    snprintf(s_path, sizeof(s_path), "%s/etc/shadow", resolved_root);
    snprintf(g_path, sizeof(g_path), "%s/etc/group", resolved_root);
    snprintf(gs_path, sizeof(gs_path), "%s/etc/gshadow", resolved_root);
    snprintf(subuid_path, sizeof(subuid_path), "%s/etc/subuid", resolved_root);
    snprintf(subgid_path, sizeof(subgid_path), "%s/etc/subgid", resolved_root);

    LOG_INFO("👤 [oa-native] User management (Mode: %s) on root: %s", mode, resolved_root);

    if (strcmp(mode, "clone") != 0 && strcmp(mode, "crypted") != 0) {
        LOG_INFO("   -> Cleaning up host users (sanitize)...");
        yocto_sanitize_file(p_path, OE_UID_HUMAN_MIN, OE_UID_HUMAN_MAX);
        yocto_sanitize_shadow(s_path, p_path);
        yocto_sanitize_file(g_path, OE_UID_HUMAN_MIN, OE_UID_HUMAN_MAX);
        yocto_sanitize_gshadow(gs_path, g_path);
        yocto_sanitize_subid(subuid_path, p_path);
        yocto_sanitize_subid(subgid_path, p_path);
    }

    cJSON *users_array = cJSON_GetObjectItemCaseSensitive(params, "users");
    if (cJSON_IsArray(users_array)) {
        FILE *fp = fopen(p_path, "a");
        FILE *fs = fopen(s_path, "a");

        if (!fp || !fs) {
            LOG_ERR("[oa-native] Fatal error: Unable to open the databases in %s/etc/", resolved_root);
            if(fp) fclose(fp);
            if(fs) fclose(fs);
            return -1;
        }

        int user_index = 0;
        cJSON *u;
        cJSON_ArrayForEach(u, users_array) {
            const char *login = get_json_string(u, "login", "");
            const char *pass  = get_json_string(u, "password", "");
            const char *home  = get_json_string(u, "home", "/home/live");

            if (strlen(login) == 0) continue;

            int uid = OE_UID_HUMAN_MIN + user_index;
            int gid = OE_UID_HUMAN_MIN + user_index;

            LOG_INFO("   ->  Inject the user: '%s' uid=%d home='%s'", login, uid, home);

            char *final_pass = (char *)pass;
            if (strlen(pass) > 0 && pass[0] != '$') {
                char salt[32];
                generate_salt(salt, sizeof(salt));
                final_pass = crypt(pass, salt);
            }

            yocto_write_passwd(fp, login, uid, gid, "live,,,", home, "/bin/bash");
            yocto_write_shadow(fs, login, final_pass);

            FILE *fg = fopen(g_path, "a");
            if (fg) {
                fprintf(fg, "%s:x:%d:\n", login, gid);
                fclose(fg);
            } else {
                LOG_ERR("      [!] Unable to create a primary group.");
            }

            FILE *fgs = fopen(gs_path, "a");
            if (fgs) {
                yocto_write_gshadow(fgs, login, "");
                fclose(fgs);
            }

            FILE *fsub_uid = fopen(subuid_path, "a");
            if (fsub_uid) {
                long subid_start = 100000 + (long)user_index * 65536;
                yocto_write_subid(fsub_uid, login, subid_start, 65536);
                fclose(fsub_uid);
            }

            FILE *fsub_gid = fopen(subgid_path, "a");
            if (fsub_gid) {
                long subid_start = 100000 + (long)user_index * 65536;
                yocto_write_subid(fsub_gid, login, subid_start, 65536);
                fclose(fsub_gid);
            }

            cJSON *groups_obj = cJSON_GetObjectItemCaseSensitive(u, "groups");
            if (cJSON_IsArray(groups_obj)) {
                LOG_INFO("   -> Added to secondary groups...");
                yocto_add_user_to_groups(g_path, login, groups_obj);
            }

            char full_home[PATH_SAFE];
            snprintf(full_home, sizeof(full_home), "%s%s", resolved_root, home);

            if (mkdir(full_home, 0755) != 0 && errno != EEXIST) {
                LOG_WARN("      [!] Warning: mkdir failure on %s (errno: %d)", full_home, errno);
            }

            char skel_src[PATH_SAFE];
            snprintf(skel_src, sizeof(skel_src), "%s/etc/skel/.", resolved_root);

            char *cp_argv[] = {"cp", "-a", skel_src, full_home, NULL};
            run_exec(cp_argv);

            char uid_str[32];
            snprintf(uid_str, sizeof(uid_str), "%d:%d", uid, gid);

            char *chown_argv[] = {"chown", "-R", uid_str, full_home, NULL};
            if (run_exec(chown_argv) != 0) {
                LOG_ERR("      [!] Home setup error for '%s'", login);
            }

            user_index++;
        }
        fclose(fp);
        fclose(fs);
    }
    LOG_INFO("✅ [oa-native] Users successfully configured.");
    return 0;
}

int run_native_umount(cJSON *task) {
    const char *work_dir = get_json_string(task, "work_dir", "");
    if (strlen(work_dir) == 0) {
        LOG_ERR("❌ [oa-native] Error: ‘work_dir’ is missing for cleanup.");
        return 1;
    }

    char path[4096];

    // 1. Smontiamo le API di sistema in liveroot
    const char *api_mounts[] = {"dev/pts", "dev", "proc", "sys", "run", "tmp"};
    for (int i = 0; i < (int)(sizeof(api_mounts) / sizeof(api_mounts[0])); i++) {
        snprintf(path, sizeof(path), "%s/liveroot/%s", work_dir, api_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 2. Smontiamo gli overlay uniti in liveroot
    const char *ovl_mounts[] = {"usr", "var"};
    for (int i = 0; i < (int)(sizeof(ovl_mounts) / sizeof(ovl_mounts[0])); i++) {
        snprintf(path, sizeof(path), "%s/liveroot/%s", work_dir, ovl_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 3. Smontiamo i bind mount standard in liveroot
    // "home" è incluso per sicurezza: se in modalità clone/crypted è stato
    // bind-montato, va smontato qui; se non lo è, umount2 fallisce in
    // silenzio come per gli altri path, senza effetti collaterali.
    const char *bind_mounts[] = {"opt", "root", "srv", "home"};
    for (int i = 0; i < (int)(sizeof(bind_mounts) / sizeof(bind_mounts[0])); i++) {
        snprintf(path, sizeof(path), "%s/liveroot/%s", work_dir, bind_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 4. Smontiamo i lowerdir dentro .overlay
    for (int i = 0; i < (int)(sizeof(ovl_mounts) / sizeof(ovl_mounts[0])); i++) {
        snprintf(path, sizeof(path), "%s/.overlay/lowerdir/%s", work_dir, ovl_mounts[i]);
        umount2(path, MNT_DETACH);
    }

    // 5. Infine, smontiamo la liveroot stessa se necessario
    snprintf(path, sizeof(path), "%s/liveroot", work_dir);
    umount2(path, MNT_DETACH);

    LOG_INFO("✅ [oa-native] Safety unmount completed for: %s", work_dir);
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

    LOG_ERR("❌ [oa-native] Unknown native C module: %s", module);
    return -1;
}
