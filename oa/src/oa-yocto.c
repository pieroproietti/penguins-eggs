#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <stdint.h>
#include <sys/stat.h>
#include "oa-yocto.h"

void yocto_write_passwd(FILE *f, const char *user, int uid, int gid, const char *gecos, const char *home, const char *shell) {
    if (f) fprintf(f, "%s:x:%d:%d:%s:%s:%s\n", user, uid, gid, gecos, home, shell);
}

void yocto_write_shadow(FILE *f, const char *user, const char *enc_pass) {
    // 19750 = approximate last_change days since epoch for 2024+
    if (f) fprintf(f, "%s:%s:19750:0:99999:7:::\n", user, enc_pass);
}

void yocto_write_group(FILE *f, const char *group, int gid, const char *users) {
    if (f) fprintf(f, "%s:x:%d:%s\n", group, gid, users ? users : "");
}

int yocto_sanitize_file(const char *src_path, int min_id, int max_id) {
    char tmp_path[PATH_SAFE];
    snprintf(tmp_path, sizeof(tmp_path), "%s.tmp", src_path);

    FILE *src = fopen(src_path, "r");
    FILE *dst = fopen(tmp_path, "w");
    if (!src || !dst) return -1;

    char line[PATH_SAFE];
    while (fgets(line, sizeof(line), src)) {

        char line_copy[PATH_SAFE];
        strncpy(line_copy, line, sizeof(line_copy) - 1);
        line_copy[sizeof(line_copy) - 1] = '\0';

        strtok(line_copy, ":");
        strtok(NULL, ":");
        char *id_str = strtok(NULL, ":");

        if (id_str) {
            int id = atoi(id_str);
            if (id < min_id || id > max_id) {
                fputs(line, dst);
            }
        }
    }

    fclose(src);
    fclose(dst);
    return rename(tmp_path, src_path);
}

static bool user_exists_in_file(const char *file_path, const char *name) {
    FILE *f = fopen(file_path, "r");
    if (!f) return false;

    char line[PATH_SAFE];
    while (fgets(line, sizeof(line), f)) {
        char line_copy[PATH_SAFE];
        strncpy(line_copy, line, sizeof(line_copy) - 1);
        line_copy[sizeof(line_copy) - 1] = '\0';
        char *field = strtok(line_copy, ":");
        if (field && strcmp(field, name) == 0) {
            fclose(f);
            return true;
        }
    }
    fclose(f);
    return false;
}

int yocto_sanitize_shadow(const char *shadow_path, const char *passwd_path) {
    char tmp_path[PATH_SAFE];
    snprintf(tmp_path, sizeof(tmp_path), "%s.tmp", shadow_path);

    FILE *src = fopen(shadow_path, "r");
    FILE *dst = fopen(tmp_path, "w");
    if (!src || !dst) {
        if (src) fclose(src);
        if (dst) fclose(dst);
        return -1;
    }

    char line[PATH_SAFE];
    int removed = 0, kept = 0;

    while (fgets(line, sizeof(line), src)) {
        char line_copy[PATH_SAFE];
        strncpy(line_copy, line, sizeof(line_copy) - 1);
        line_copy[sizeof(line_copy) - 1] = '\0';
        char *user = strtok(line_copy, ":");

        if (user) {
            if (user_exists_in_file(passwd_path, user)) {
                fputs(line, dst);
                kept++;
            } else {
                printf("Shadow sanitize: purging removed user '%s'", user);
                removed++;
            }
        }
    }

    fclose(src);
    fclose(dst);

    // PAM requires restrictive permissions on shadow
    chmod(tmp_path, 0640);

    printf("Sanitized shadow: kept %d, removed %d entries", kept, removed);
    return rename(tmp_path, shadow_path);
}

static bool is_path_allowed(const char *home) {
    if (home == NULL || strlen(home) < 2) {
        return false;
    }

    const char *whitelist[] = {"home", "opt", "srv", "usr", "var", NULL};
    char path_tmp[PATH_SAFE];

    strncpy(path_tmp, home, sizeof(path_tmp));
    path_tmp[sizeof(path_tmp) - 1] = '\0';

    char *fLevel = strtok(path_tmp, "/");
    if (fLevel == NULL) return false;

    for (int i = 0; whitelist[i] != NULL; i++) {
        if (strcmp(fLevel, whitelist[i]) == 0) {
            return true;
        }
    }

    return false;
}

bool yocto_is_human_user(uint32_t uid, const char *home) {
    if (uid < OE_UID_HUMAN_MIN || uid > OE_UID_HUMAN_MAX) {
        return false;
    }

    if (!is_path_allowed(home)) {
        return false;
    }

    struct stat st;
    if (stat(home, &st) != 0 || !S_ISDIR(st.st_mode)) {
        return false;
    }

    if (strstr(home, "/cache") || strstr(home, "/run") || strstr(home, "/spool")) {
        return false;
    }

    return true;
}

void yocto_write_gshadow(FILE *f, const char *group, const char *members) {
    if (f) fprintf(f, "%s:!::%s\n", group, members ? members : "");
}

int yocto_sanitize_gshadow(const char *gshadow_path, const char *group_path) {
    char tmp_path[PATH_SAFE];
    snprintf(tmp_path, sizeof(tmp_path), "%s.tmp", gshadow_path);

    FILE *src = fopen(gshadow_path, "r");
    FILE *dst = fopen(tmp_path, "w");
    if (!src || !dst) {
        if (src) fclose(src);
        if (dst) fclose(dst);
        return -1;
    }

    char line[PATH_SAFE];
    while (fgets(line, sizeof(line), src)) {
        char line_copy[PATH_SAFE];
        strncpy(line_copy, line, sizeof(line_copy) - 1);
        line_copy[sizeof(line_copy) - 1] = '\0';
        char *gname = strtok(line_copy, ":");
        if (gname && user_exists_in_file(group_path, gname)) {
            fputs(line, dst);
        }
    }

    fclose(src);
    fclose(dst);
    chmod(tmp_path, 0640);
    return rename(tmp_path, gshadow_path);
}

void yocto_write_subid(FILE *f, const char *user, long start, long count) {
    if (f) fprintf(f, "%s:%ld:%ld\n", user, start, count);
}

int yocto_sanitize_subid(const char *subid_path, const char *passwd_path) {
    char tmp_path[PATH_SAFE];
    snprintf(tmp_path, sizeof(tmp_path), "%s.tmp", subid_path);

    FILE *src = fopen(subid_path, "r");
    if (!src) return 0;

    FILE *dst = fopen(tmp_path, "w");
    if (!dst) {
        fclose(src);
        return -1;
    }

    char line[PATH_SAFE];
    while (fgets(line, sizeof(line), src)) {
        char line_copy[PATH_SAFE];
        strncpy(line_copy, line, sizeof(line_copy) - 1);
        line_copy[sizeof(line_copy) - 1] = '\0';
        char *user = strtok(line_copy, ":");
        if (user && user_exists_in_file(passwd_path, user)) {
            fputs(line, dst);
        }
    }

    fclose(src);
    fclose(dst);
    return rename(tmp_path, subid_path);
}

void yocto_add_user_to_groups(const char *group_file, const char *username, cJSON *groups_array) {
    if (!cJSON_IsArray(groups_array)) return;

    char tmp_file[PATH_SAFE];
    snprintf(tmp_file, sizeof(tmp_file), "%s.tmp", group_file);

    FILE *src = fopen(group_file, "r");
    FILE *dst = fopen(tmp_file, "w");
    if (!src || !dst) {
        if (src) fclose(src);
        if (dst) fclose(dst);
        return;
    }

    char line[PATH_SAFE];
    while (fgets(line, sizeof(line), src)) {
        line[strcspn(line, "\n")] = 0;

        char line_copy[PATH_SAFE];
        strncpy(line_copy, line, sizeof(line_copy) - 1);
        line_copy[sizeof(line_copy) - 1] = '\0';
        char *gname = strtok(line_copy, ":");

        bool match = false;
        cJSON *g;
        cJSON_ArrayForEach(g, groups_array) {
            if (cJSON_IsString(g) && strcmp(gname, g->valuestring) == 0) {
                match = true;
                break;
            }
        }

        if (match) {
            if (line[strlen(line) - 1] == ':') {
                fprintf(dst, "%s%s\n", line, username);
            } else {
                fprintf(dst, "%s,%s\n", line, username);
            }
        } else {
            fprintf(dst, "%s\n", line);
        }
    }

    fclose(src);
    fclose(dst);
    rename(tmp_file, group_file);
}
