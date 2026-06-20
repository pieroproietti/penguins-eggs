#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cJSON.h"
#include "logger.h"

extern int dispatch_task(cJSON *task);

char* read_stdin() {
    size_t capacity = 4096;
    size_t size = 0;
    char *buffer = malloc(capacity);
    if (!buffer) return NULL;

    int c;
    while ((c = fgetc(stdin)) != EOF) {
        if (size + 1 >= capacity) {
            capacity *= 2;
            char *new_buffer = realloc(buffer, capacity);
            if (!new_buffer) {
                free(buffer);
                return NULL;
            }
            buffer = new_buffer;
        }
        buffer[size++] = c;
    }
    buffer[size] = '\0';
    return buffer;
}

char* read_file(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) return NULL;

    fseek(f, 0, SEEK_END);
    long length = ftell(f);
    if (length < 0) {
        fclose(f);
        return NULL;
    }
    fseek(f, 0, SEEK_SET);

    char *buffer = malloc((size_t)length + 1);
    if (buffer) {
        size_t read_bytes = fread(buffer, 1, (size_t)length, f);
        buffer[read_bytes] = '\0';
    }
    fclose(f);
    return buffer;
}

int main(int argc, char **argv) {
    char *json_data = NULL;

    if (argc > 1) {
        if (strcmp(argv[1], "--version") == 0 || strcmp(argv[1], "-v") == 0) {
            printf("oa-ng (Next Generation Orchestrator) v1.0\n");
            return EXIT_SUCCESS;
        }

        if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            printf("Usage:\n");
            printf("  oa <plan.json>          Runs tasks from a file\n");
            printf("  cat plan.json | oa      Runs tasks from STDIN\n");
            printf("  oa cleanup              Performs an emergency umount\n");
            return EXIT_SUCCESS;
        }

        if (strcmp(argv[1], "cleanup") == 0) {
            const char *target_dir = (argc > 2) ? argv[2] : "/home/eggs";
            printf("🚨 [oa-main] EMERGENCY Mode: Run `umount` on %s\n", target_dir);

            cJSON *task = cJSON_CreateObject();
            cJSON_AddStringToObject(task, "module", "umount");
            cJSON_AddStringToObject(task, "work_dir", target_dir);
            cJSON_AddObjectToObject(task, "params");

            int res = dispatch_task(task);
            cJSON_Delete(task);

            return (res == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
        }

        json_data = read_file(argv[1]);
        if (!json_data) {
            fprintf(stderr, "❌ [oa-main] Unable to open the JSON file or unknown command: %s\n", argv[1]);
            return EXIT_FAILURE;
        }
    } else {
        json_data = read_stdin();
    }

    if (!json_data || strlen(json_data) == 0) {
        fprintf(stderr, "❌ [oa-main] No JSON plan received as input.\n");
        if (json_data) free(json_data);
        return EXIT_FAILURE;
    }

    oa_init_log("/var/log/oa-tools.log");

    cJSON *root = cJSON_Parse(json_data);
    if (!root) {
        const char *error_ptr = cJSON_GetErrorPtr();
        LOG_ERR("❌ [oa-main] JSON parsing error: %s", error_ptr ? error_ptr : "unknown");
        free(json_data);
        oa_close_log();
        return EXIT_FAILURE;
    }

    cJSON *plan_array = cJSON_GetObjectItemCaseSensitive(root, "plan");
    if (!cJSON_IsArray(plan_array)) {
        LOG_ERR("❌ [oa-main] Invalid JSON format: 'plan' array is missing.");
        cJSON_Delete(root);
        free(json_data);
        oa_close_log();
        return EXIT_FAILURE;
    }

    int total_tasks = cJSON_GetArraySize(plan_array);
    LOG_INFO("🚀 [oa-main] Received schedule with %d tasks. Starting execution.", total_tasks);

    int success_count = 0;
    int error_count = 0;

    cJSON *task = NULL;
    cJSON_ArrayForEach(task, plan_array) {
        cJSON *name_item = cJSON_GetObjectItemCaseSensitive(task, "name");
        const char *task_name = cJSON_IsString(name_item) ? name_item->valuestring : "Unknown";

        LOG_INFO("========================================");
        LOG_INFO("▶ Task Execution: %s", task_name);
        LOG_INFO("========================================");

        if (dispatch_task(task) == 0) {
            success_count++;
        } else {
            LOG_ERR("⚠️  [oa-main] The '%s' task failed.", task_name);
            error_count++;
        }
    }

    cJSON_Delete(root);
    free(json_data);

    LOG_INFO("🏁 [oa-main] Execution complete. Successes: %d, Errors: %d", success_count, error_count);

    oa_close_log();
    return (error_count == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
