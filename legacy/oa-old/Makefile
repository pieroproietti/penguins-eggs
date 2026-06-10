# artisan/oa/Makefile

VERSION ?= 0.0.0-dev

CC = gcc
CFLAGS = -Wall -Wextra -Iinclude -D_GNU_SOURCE -Wno-format-truncation -DOA_VERSION=\"$(VERSION)\"
LDFLAGS = -lm -lcrypt

# Struttura delle cartelle sorgente e oggetti locali
SRC_DIR = src
INC_DIR = include
OBJ_DIR = obj
TARGET  = oa

# Trova tutti i file .c ricorsivamente in src/
SOURCES = $(shell find $(SRC_DIR) -name '*.c')

# Mappa i sorgenti agli oggetti dentro la OBJ_DIR locale
OBJECTS = $(SOURCES:$(SRC_DIR)/%.c=$(OBJ_DIR)/%.o)

# Target principale
all: $(TARGET)

# Linker
$(TARGET): $(OBJECTS)
	@echo "  LD    $@"
	@$(CC) $(OBJECTS) -o $@ $(LDFLAGS)

# Compilatore
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(dir $@)
	@echo "  CC    $<"
	@$(CC) $(CFLAGS) -c $< -o $@

# Pulizia
clean:
	@echo "  Cleaning oa..."
	@rm -rf $(OBJ_DIR) $(TARGET)
	@rm -f /tmp/remaster.json /tmp/sysinstall.json

.PHONY: all clean