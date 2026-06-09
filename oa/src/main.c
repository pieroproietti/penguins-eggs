// src/main.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cJSON.h"
#include "logger.h"

extern int dispatch_task(cJSON *task);

// Lettura da STDIN
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

// Lettura da FILE
char* read_file(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) return NULL;
    
    fseek(f, 0, SEEK_END);
    long length = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *buffer = malloc(length + 1);
    if (buffer) {
        size_t read_bytes = fread(buffer, 1, length, f);
        buffer[read_bytes] = '\0';
    }
    fclose(f);
    return buffer;
}

int main(int argc, char **argv) {
    char *json_data = NULL;

    // Controllo argomenti CLI
    if (argc > 1) {
        if (strcmp(argv[1], "--version") == 0 || strcmp(argv[1], "-v") == 0) {
            printf("oa-ng (Next Generation Orchestrator) v1.0\n");
            return EXIT_SUCCESS;
        }
        
        if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            printf("Uso:\n");
            printf("  oa <plan.json>          Esegue i task da file\n");
            printf("  cat plan.json | oa      Esegue i task da STDIN\n");
            printf("  oa cleanup [percorso]   Esegue uno smontaggio d'emergenza\n");
            return EXIT_SUCCESS;
        }


        // --- LA TUA MANIGLIA DI EMERGENZA ---
        if (strcmp(argv[1], "cleanup") == 0) {
            // Se non passi parametri, usa /home/eggs di default, NON liveroot
            const char *target_dir = (argc > 2) ? argv[2] : "/home/eggs";
            printf("🚨 [oa-main] Modalità EMERGENZA: Avvio smontaggio su %s\n", target_dir);

            cJSON *task = cJSON_CreateObject();
            cJSON_AddStringToObject(task, "module", "umount");
            cJSON_AddStringToObject(task, "work_dir", target_dir); // <--- Nuova chiave!
            cJSON_AddObjectToObject(task, "params"); 

            int res = dispatch_task(task);
            cJSON_Delete(task);

            return (res == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
        }
        
        // Se l'argomento non è un comando speciale, proviamo a leggerlo come file JSON
        json_data = read_file(argv[1]);
        if (!json_data) {
            fprintf(stderr, "❌ [oa-main] Impossibile aprire il file JSON o comando sconosciuto: %s\n", argv[1]);
            return EXIT_FAILURE;
        }
    } else {
        // Nessun argomento: leggiamo dallo Standard Input
        json_data = read_stdin();
    }

    if (!json_data || strlen(json_data) == 0) {
        fprintf(stderr, "❌ [oa-main] Nessun piano JSON ricevuto in input.\n");
        if (json_data) free(json_data);
        return EXIT_FAILURE;
    }

    // ==================================
    // log solo se facciamo un plan
    // ==================================
    oa_init_log("/var/log/oa-tools.log");

    cJSON *root = cJSON_Parse(json_data);
    if (!root) {
        const char *error_ptr = cJSON_GetErrorPtr();
        fprintf(stderr, "❌ [oa-main] Errore di parsing JSON: %s\n", error_ptr ? error_ptr : "sconosciuto");
        free(json_data);
        return EXIT_FAILURE;
    }

    cJSON *plan_array = cJSON_GetObjectItemCaseSensitive(root, "plan");
    if (!cJSON_IsArray(plan_array)) {
        fprintf(stderr, "❌ [oa-main] Formato JSON non valido: array 'plan' mancante.\n");
        cJSON_Delete(root);
        free(json_data);
        return EXIT_FAILURE;
    }

    int total_tasks = cJSON_GetArraySize(plan_array);
    printf("🚀 [oa-main] Ricevuto piano con %d task. Avvio esecuzione...\n", total_tasks);

    int success_count = 0;
    int error_count = 0;

    cJSON *task = NULL;
    cJSON_ArrayForEach(task, plan_array) {
        cJSON *name_item = cJSON_GetObjectItemCaseSensitive(task, "name");
        const char *task_name = cJSON_IsString(name_item) ? name_item->valuestring : "Sconosciuto";

        printf("\n========================================\n");
        printf("▶ Esecuzione Task: %s\n", task_name);
        printf("========================================\n");

        if (dispatch_task(task) == 0) {
            success_count++;
        } else {
            fprintf(stderr, "⚠️  [oa-main] Il task '%s' ha fallito.\n", task_name);
            error_count++;
        }
    }

    cJSON_Delete(root);
    free(json_data);

    printf("\n🏁 [oa-main] Esecuzione completata. Successi: %d, Errori: %d\n", success_count, error_count);
    
    
    // ==================================
    // chiusura log 
    // ==================================
    oa_close_log();    
    return (error_count == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
