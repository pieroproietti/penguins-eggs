CC = gcc
CFLAGS = -Wall -Wextra -I./include
LDFLAGS = -lcrypt

# Qui abbiamo tolto utils.c e messo solo i 5 file reali
SRC = src/main.c src/engine.c src/native.c src/oa-yocto.c src/cJSON.c
OBJ = $(SRC:.c=.o)
TARGET = oa

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CC) $(OBJ) -o $@ $(LDFLAGS)

clean:
	rm -f src/*.o $(TARGET)
		