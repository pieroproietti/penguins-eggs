#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mount.h>
#include "cJSON.h"
#include "logger.h"
#include "ethernit.h"

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

// Main dynamic unmount function
int run_ethernit_umount(cJSON *task) {
    const char *work_dir = get_json_string(task, "work_dir", "");
    if (strlen(work_dir) == 0) {
        LOG_ERR("❌ [ethernit] Error: 'work_dir' missing for decontamination.");
        return 1;
    }

    FILE *fp = fopen("/proc/mounts", "r");
    if (!fp) {
        LOG_ERR("❌ [ethernit] Unable to read /proc/mounts");
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

    LOG_INFO("☣️  [ethernit] Environmental decontamination initiated: Found %d mount points in %s", count, work_dir);
    
    // Surgical dismantling
    for (int i = 0; i < count; i++) {
        // LOG_INFO("   -> Isolating and extracting: %s", mounts[i]);
        umount2(mounts[i], MNT_DETACH);
        free(mounts[i]);
    }
    
    if (mounts) free(mounts);

    LOG_INFO("✅ [ethernit] Area secured. Decontamination completed for: %s", work_dir);
    return 0;
}
