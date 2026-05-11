#include "oa.h"
#include <sys/mount.h> 

// Prototipi
int oa_mkdir(OA_Context *ctx);
int oa_bind(OA_Context *ctx);
int oa_cp(OA_Context *ctx);
int oa_mount_generic(OA_Context *ctx);
int oa_umount(OA_Context *ctx);
int oa_shell(OA_Context *ctx);
int oa_users(OA_Context *ctx);

char *read_file(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        LOG_ERR("IO_ERROR: Impossibile aprire il piano di volo '%s' (errno: %d - %s)", 
                filename, errno, strerror(errno));
        return NULL;
    }

    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *data = malloc(len + 1);
    if (data) {
        fread(data, 1, len, f);
        data[len] = '\0';
    } else {
        LOG_ERR("MEM_ERROR: Impossibile allocare %ld bytes per il file '%s'", len, filename);
    }
    
    fclose(f);
    return data;
}

int execute_verb(cJSON *root, cJSON *task) {
    if (!task) return 1;

    cJSON *action_item = cJSON_GetObjectItemCaseSensitive(task, "action");
    if (!cJSON_IsString(action_item)) {
        char *dump = cJSON_PrintUnformatted(task);
        LOG_ERR("CRASH PARSER: Il task non ha la chiave 'action'! Dump JSON: %s", dump);
        free(dump);
        return 1;
    }

    const char *action_name = action_item->valuestring;
    OA_Context ctx = { .root = root, .task = task };

    cJSON *description = cJSON_GetObjectItemCaseSensitive(task, "description");
    if (cJSON_IsString(description)) {
        printf("%s[coa]%s %s\n", CLR_CYAN, CLR_RESET, description->valuestring);
        if (oa_log_file) {
            fprintf(oa_log_file, "[coa] %s\n", description->valuestring);
            fflush(oa_log_file);
        }
    }

    LOG_INFO(">>> Invocazione modulo interno: %s", action_name);

    int res = 1;
    if (strcmp(action_name, "oa_umount") == 0) {
        res = oa_umount(&ctx);
    } else if (strcmp(action_name, "oa_shell") == 0) {
        res = oa_shell(&ctx);
    } else if (strcmp(action_name, "shell") == 0) {
        // Gestione unificata dell'azione ignorata
        LOG_INFO("Azione 'shell' ignorata dal core C (competenza di Go).");
        res = 0; 
    } else if (strcmp(action_name, "oa_users") == 0) {
        res = oa_users(&ctx);
    } else if (strcmp(action_name, "oa_mkdir") == 0) {
        res = oa_mkdir(&ctx);
    } else if (strcmp(action_name, "oa_bind") == 0) {
        res = oa_bind(&ctx);
    } else if (strcmp(action_name, "oa_cp") == 0) {
        res = oa_cp(&ctx);
    } else if (strcmp(action_name, "oa_mount_generic") == 0) {
        res = oa_mount_generic(&ctx);
    } else {
        LOG_ERR("Comando sconosciuto: %s", action_name);
        res = 1;
    }

    if (res != 0) {
        LOG_ERR("CRASH INTERNO: Il modulo C '%s' ha restituito errore %d!", action_name, res);
    }
    
    return res;
}

void print_help(const char *prog_name) {
    printf("oa engine v%s - Il motore operativo di coa\n\n", OA_VERSION);
    printf("USO:\n");
    printf("  %s <percorso_piano.json>  Esegue il piano di volo specificato\n", prog_name);
    printf("  %s cleanup                Forza lo smontaggio di emergenza\n", prog_name);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        print_help(argv[0]);
        return 1;
    }

    if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
        print_help(argv[0]);
        return 0;
    }

    oa_init_log("/var/log/oa-tools.log");
    
    if (strcmp(argv[1], "cleanup") == 0) {
        LOG_INFO("Comando diretto ricevuto: Esecuzione cleanup...");
        umount2("/home/eggs/liveroot/dev/pts", MNT_DETACH);
        umount2("/home/eggs/liveroot/dev", MNT_DETACH);
        umount2("/home/eggs/liveroot/proc", MNT_DETACH);
        umount2("/home/eggs/liveroot/sys", MNT_DETACH);
        umount2("/home/eggs/liveroot/run", MNT_DETACH);
        umount2("/home/eggs/liveroot", MNT_DETACH);
        LOG_INFO("Smontaggio di emergenza completato.");
        oa_close_log();
        return 0;
    }

    char *json_data = read_file(argv[1]);
    if (!json_data) {
        oa_close_log();
        return 1; 
    }

    cJSON *json = cJSON_Parse(json_data);
    if (!json) {
        LOG_ERR("JSON_ERROR: Parsing fallito per '%s'.", argv[1]);
        free(json_data);
        oa_close_log();
        return 1;
    }

    cJSON *plan = cJSON_GetObjectItemCaseSensitive(json, "plan");
    int status = 0;

    if (cJSON_IsArray(plan)) {
        cJSON *task;
        cJSON_ArrayForEach(task, plan) {
            if ((status = execute_verb(json, task)) != 0) {
                LOG_ERR("Esecuzione interrotta. Task fallito.");
                break;
            }
        }
    } else {
        status = execute_verb(json, json);
    }

    cJSON_Delete(json);
    free(json_data);
    LOG_INFO("Esecuzione completata con status: %d", status);
    oa_close_log();
    return status;
}
