#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>
#include <sys/mount.h>
#include "cJSON.h"
#include "logger.h"
#include "eternit.h"

// Bottom-up sorting (longest path to shortest)
static int compare_path_length(const void *a, const void *b) {
    const char *str_a = *(const char **)a;
    const char *str_b = *(const char **)b;
    return strlen(str_b) - strlen(str_a);
}

// Safe extraction of work_dir from JSON
static const char* get_json_string(cJSON *obj, const char *key, const char *fallback) {
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsString(item) && (item->valuestring != NULL)) {
        return item->valuestring;
    }
    return fallback;
}

// Blocking umount with a short EBUSY retry budget, falling back to lazy
// MNT_DETACH only if still busy after retrying (a lazy detach can leave
// the backing store reclaiming after this returns, racing a remaster
// that immediately reuses the same work_dir).
static int umount_path(const char *path) {
    if (umount(path) == 0) return 0;
    if (errno != EBUSY) {
        LOG_WARN("⚠️  [eternit] umount('%s') failed: %s", path, strerror(errno));
        return -1;
    }

    for (int attempt = 0; attempt < 10; attempt++) {
        usleep(100000); // 100ms
        if (umount(path) == 0) return 0;
        if (errno != EBUSY) {
            LOG_WARN("⚠️  [eternit] umount('%s') failed: %s", path, strerror(errno));
            return -1;
        }
    }

    LOG_WARN("⚠️  [eternit] '%s' still busy after retries, forcing lazy detach", path);
    if (umount2(path, MNT_DETACH) != 0) {
        LOG_ERR("❌ [eternit] lazy detach of '%s' failed: %s", path, strerror(errno));
        return -1;
    }
    return 0;
}

// Main dynamic unmount function
int run_eternit_umount(cJSON *task) {
    const char *work_dir = get_json_string(task, "work_dir", "");
    if (strlen(work_dir) == 0) {
        LOG_ERR("❌ [eternit] Error: 'work_dir' missing for decontamination.");
        return 1;
    }

    FILE *fp = fopen("/proc/mounts", "r");
    if (!fp) {
        LOG_ERR("❌ [eternit] Unable to read /proc/mounts");
        return 1;
    }

    char line[4096];
    char **mounts = NULL;
    int count = 0;

    // Scan for toxic mounts
    while (fgets(line, sizeof(line), fp)) {
        char dev[1024], path[2048];
        if (sscanf(line, "%1023s %2047s", dev, path) == 2) {
            
            // Select only mounts anchored to our work_dir
            if (strncmp(path, work_dir, strlen(work_dir)) == 0) {
                mounts = realloc(mounts, sizeof(char*) * (count + 1));
                mounts[count] = strdup(path);
                count++;
            }
        }
    }
    fclose(fp);

    // Sort from deepest to shallowest
    if (count > 0) {
        qsort(mounts, count, sizeof(char*), compare_path_length);
    }

    LOG_INFO("☣️  [eternit] Environmental decontamination initiated: Found %d mount points in %s", count, work_dir);
    
    // Surgical dismantling: block until each unmount actually completes,
    // so the caller can trust work_dir is safe to reuse immediately.
    int had_failure = 0;
    for (int i = 0; i < count; i++) {
        if (umount_path(mounts[i]) != 0) had_failure = 1;
        free(mounts[i]);
    }

    if (mounts) free(mounts);

    sync();

    if (had_failure) {
        LOG_ERR("❌ [eternit] Decontamination incomplete for: %s", work_dir);
        return 1;
    }

    LOG_INFO("✅ [eternit] Area secured. Decontamination completed for: %s", work_dir);
    return 0;
}
