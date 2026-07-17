#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cJSON.h"
#include "logger.h"

extern int dispatch_task(cJSON *task);

// ---------------------------------------------------------
// FUNZIONE UNIVERSALE: Sgancio e Pulizia (Emergenza + Successo)
// ---------------------------------------------------------
int perform_safety_teardown(const char *target_dir) {
    LOG_INFO("☣️  [oa-main] Calling the Hazmat team (Eternit) to secure the are: %s", target_dir);

    cJSON *task = cJSON_CreateObject();
    cJSON_AddStringToObject(task, "module", "umount"); // La parola d'ordine resta sempre "umount"
    cJSON_AddStringToObject(task, "work_dir", target_dir);
    cJSON_AddObjectToObject(task, "params");

    int res = dispatch_task(task);
    cJSON_Delete(task);

    return res;
}
// ---------------------------------------------------------
// FUNZIONI ORIGINALI (Lettura I/O)
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------
int main(int argc, char **argv) {
    char *json_data = NULL;
    const char *default_work_dir = "/home/eggs"; // Cartella base di fallback

    if (argc > 1) {
        if (strcmp(argv[1], "--version") == 0 || strcmp(argv[1], "-v") == 0) {
            printf("oa-ng (Next Generation Orchestrator) v1.0\n");
            return EXIT_SUCCESS;
        }

        if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            printf("Usage:\n");
            printf("  oa <plan.json>          Runs tasks from a file\n");
            printf("  cat plan.json | oa      Runs tasks from STDIN\n");
            printf("  oa cleanup [dir]        Performs a safety umount\n");
            return EXIT_SUCCESS;
        }

        // Caso comando manuale: oa cleanup
        if (strcmp(argv[1], "cleanup") == 0) {
            const char *target_dir = (argc > 2) ? argv[2] : default_work_dir;
            printf("🚨 [oa-main] CLEANUP Mode: Run `umount` on %s\n", target_dir);
            oa_init_log("/var/log/oa-tools.log"); 
            int res = perform_safety_teardown(target_dir);
            oa_close_log();
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
    const char *current_work_dir = default_work_dir; // Traccia la directory di lavoro

    cJSON *task = NULL;
    cJSON_ArrayForEach(task, plan_array) {
        cJSON *name_item = cJSON_GetObjectItemCaseSensitive(task, "name");
        const char *task_name = cJSON_IsString(name_item) ? name_item->valuestring : "Unknown";

        // Aggiorniamo la current_work_dir se questo task la specifica
        cJSON *work_dir_item = cJSON_GetObjectItemCaseSensitive(task, "work_dir");
        if (cJSON_IsString(work_dir_item) && work_dir_item->valuestring != NULL) {
            current_work_dir = work_dir_item->valuestring;
        }

        LOG_INFO("========================================");
        LOG_INFO("▶ Task Execution: %s", task_name);
        LOG_INFO("========================================");

        if (dispatch_task(task) == 0) {
            success_count++;
        } else {
            // FRENO DI EMERGENZA!
            LOG_ERR("🚨 [oa-main] FATAL ERROR: Task '%s' failed. Aborting immediately!", task_name);
            error_count++;
            perform_safety_teardown(current_work_dir);
            break; 
        }
    }

    cJSON_Delete(root);
    free(json_data);

    // ---------------------------------------------------------
    // GRAND FINALE AND DEFINITIVE TEARDOWN
    // ---------------------------------------------------------
    if (error_count > 0) {
        LOG_ERR("❌ [oa-main] Execution ABORTED due to an error. Successes: %d, Errors: %d", success_count, error_count);
    } else {
        LOG_INFO("✨ [oa-main] ISO build completed. Handing over the area to the decontamination team...");
        perform_safety_teardown(current_work_dir);
        LOG_INFO("🏁 [oa-main] Site successfully dismantled. Successes: %d, Errors: 0", success_count);
    }

    oa_close_log();
    return (error_count == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
